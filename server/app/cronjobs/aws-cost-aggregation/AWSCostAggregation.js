
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var resourceCost = require('_pr/model/resource-costs');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var instanceService = require('_pr/services/instanceService');
var awsService = require('_pr/services/awsService');
var S3 = require('_pr/lib/s3.js');
var AdmZip = require('adm-zip');
var fs = require('fs');
var Cryptography = require('_pr/lib/utils/cryptography');
var aws = require('aws-sdk');
var lastModified=0;
var csv = require("fast-csv");
var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
if (month < 10) {
    month = '0' + month;
};
var accountNumber = '549974527830';
var fullKey = accountNumber + "-aws-billing-detailed-line-items-with-resources-and-tags-" + year + "-" + month + ".csv.zip";
var csvFile = "./app/temp/" + accountNumber + "-aws-billing-detailed-line-items-with-resources-and-tags-" + year + "-" + month + ".csv";


var AggregateAWSCost= Object.create(CatalystCronJob);
AggregateAWSCost.interval = '*/5 * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            aggregateCostForProvidersOfOrg.apply(aggregateCostForProvidersOfOrg, orgs);
        }
    });
}

function aggregateCostForProvidersOfOrg(org) {
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            aggregateAWSCostForProvider.apply(aggregateAWSCostForProvider, providers);
        }
    });
}

function aggregateAWSCostForProvider(provider) {
    var ids=[];
    var instanceObj={};
    async.waterfall([
        function(next){
            awsService.getTotalCost(provider,next);
        },
        function(totalCost,next){
            awsService.getCostForServices(provider,next);
        },
        function (serviceCost,next){
            instanceService.getTrackedInstancesForProvider(provider, next);
        },
        function (provider, instances, next) {
            instanceObj=instances;
            instanceIdList(instances,next);
        },
        function(instanceIds,next){
            ids = instanceIds;
            downloadUpdatedCSVFile(provider,next);
        },
        function (downloadStatus,next) {
            if(downloadStatus){
                awsService.getCostForResources(date,provider,ids,csvFile,next);
            }else{
                next(null,downloadStatus)
            }
        },
        function(instanceCostMetrics, next) {
            async.parallel({
                managedCostMetrics: function(callback) {
                    updateManagedInstanceCost(instanceObj.managed,instanceCostMetrics, callback);
                },
                unManagedCostMetrics: function(callback) {
                    updateUnManagedInstanceCost(instanceObj.unmanaged,instanceCostMetrics, callback);
                },
                instanceCostMetrics: function(callback) {
                    saveInstanceResourceCost(instanceObj,instanceCostMetrics,callback);
                }
            }, function(err, results){
                if(err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        }], function(err, results) {
        if(err)
            logger.error(err);
        else if(results)
            logger.debug('AWS Cost aggregation for provider: ' + provider._id + ' ended');
    });
};

function downloadUpdatedCSVFile(provider, next) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var s3Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region:"us-east-1"
    };
    var s3 = new S3(s3Config);
    var params = {
        Bucket: provider.s3BucketName,
        Key: fullKey
    };
    async.waterfall([
            function (next) {
                s3.getObject(params, 'time', next);
            },
            function (updateTime, next) {
                var temp = String(updateTime).split(',');
                var changedTime = new Date(temp[1]).getTime();
                if (lastModified < changedTime) {
                    lastModified =changedTime;
                    s3.getObject(params, 'file', next);
                } else {
                    next(null, updateTime);
                }
            }],
        function(err,results){
            if(err){
                logger.error(err);
                next(err);
            }else{
                if(results) {
                    var zip = new AdmZip("./app/temp/rlBilling.zip");
                    zip.extractAllTo('./app/temp/', true);
                    next(null, results);
                }else{
                    next(null,false);
                }
            }
        });
};

function instanceIdList(instances,callback){
    var instanceIds=[];
    var length = instances.managed.length + instances.unmanaged.length;
    if(instances.managed.length === 0 && instances.unmanaged.length === 0){
        callback(null,instanceIds);
    }else{
        if(instances.managed.length > 0){
            for(var i = 0; i < instances.managed.length; i++){
                instanceIds.push(instances.managed[i].platformId);
            }
        }
        if(instances.unmanaged.length > 0){
            for(var i = 0; i < instances.unmanaged.length; i++){
                instanceIds.push(instances.unmanaged[i].platformId);
            }
        }
        if(instanceIds.length === length){
            callback(null,instanceIds);
        }
    }
}


function saveInstanceResourceCost(instances,instanceCostMetrics,callback){
    var awsObjectList=[];
    var length = instances.managed.length + instances.unmanaged.length;
    if(instances.managed.length === 0 && instances.unmanaged.length === 0){
        callback(null,awsObjectList);
    }else{
        var startTime = new Date(date.getTime() - 1000*60*60*24);
        if(instances.managed.length > 0){
            for(var i = 0; i < instances.managed.length; i++){
                var awsCostObject = {
                    organisationId: instances.managed[i].orgId,
                    providerId: instances.managed[i].providerId,
                    providerType: instances.managed[i].providerType,
                    projectId: instances.managed[i].projectId,
                    resourceType: 'managedInstance',
                    resourceId: instances.managed[i].platformId
                };
                var costMetrics = [];
                var costMetricsObj = {};
                var totalCost = 0.0;
                var totalUsage = 0.0;
                for (var j = 0; j < instanceCostMetrics.length; j++) {
                    if (instanceCostMetrics[j].resourceId === instances.managed[i].platformId) {
                        costMetricsObj['usageStartDate'] = instanceCostMetrics[j].usageStartDate;
                        costMetricsObj['usageEndDate'] = instanceCostMetrics[j].usageEndDate;
                        costMetricsObj['usageQuantity'] = instanceCostMetrics[j].usageQuantity;
                        costMetricsObj['description'] = instanceCostMetrics[j].description;
                        costMetricsObj['usageCost'] = instanceCostMetrics[j].usageCost;
                        totalCost += Number(instanceCostMetrics[j].usageCost);
                        totalUsage += Number(instanceCostMetrics[j].usageQuantity);
                        costMetrics.push(costMetricsObj);
                        costMetricsObj = {};
                    };
                };
                awsCostObject['costMetrics'] = costMetrics;
                awsCostObject['updatedTime'] = Date.parse(date);
                awsCostObject['startTime'] = Date.parse(startTime);
                awsCostObject['endTime'] = Date.parse(date);
                awsCostObject['aggregateResourceCost'] = totalCost;
                awsCostObject['aggregateResourceUsage'] = totalUsage;
                awsObjectList.push(awsCostObject);
                awsCostObject={};
            }
        }
        if(instances.unmanaged.length > 0){
            for(var i = 0; i < instances.unmanaged.length; i++){
                var awsCostObject = {
                    organisationId: instances.unmanaged[i].orgId,
                    providerId: instances.unmanaged[i].providerId,
                    providerType: instances.unmanaged[i].providerType,
                    projectId: instances.unmanaged[i].projectId,
                    resourceType: 'unassignedInstance',
                    resourceId: instances.unmanaged[i].platformId
                };
                var costMetrics = [];
                var costMetricsObj = {};
                var totalCost = 0.0;
                var totalUsage = 0.0;
                for (var j = 0; j < instanceCostMetrics.length; j++) {
                    if (instanceCostMetrics[j].resourceId === instances.unmanaged[i].platformId) {
                        costMetricsObj['usageStartDate'] = instanceCostMetrics[j].usageStartDate;
                        costMetricsObj['usageEndDate'] = instanceCostMetrics[j].usageEndDate;
                        costMetricsObj['usageQuantity'] = instanceCostMetrics[j].usageQuantity;
                        costMetricsObj['description'] = instanceCostMetrics[j].description;
                        costMetricsObj['usageCost'] = instanceCostMetrics[j].usageCost;
                        totalCost  += Number(instanceCostMetrics[j].usageCost);
                        totalUsage += Number(instanceCostMetrics[j].usageQuantity);
                        costMetrics.push(costMetricsObj);
                        costMetricsObj = {};
                    };
                };
                awsCostObject['costMetrics'] = costMetrics;
                awsCostObject['updatedTime'] = Date.parse(date);
                awsCostObject['startTime'] = Date.parse(startTime);
                awsCostObject['endTime'] = Date.parse(date);
                awsCostObject['aggregateResourceCost'] = totalCost;
                awsCostObject['aggregateResourceUsage'] = totalUsage;
                awsObjectList.push(awsCostObject);
                awsCostObject={};
            }
        }
        if(awsObjectList.length === length){
            var count = 0;
            for(var i = 0; i < awsObjectList.length; i++){
                resourceCost.saveResourceCost(awsObjectList[i], function (err, resourceCostData) {
                    if (err) {
                        callback(err, null);
                    } else {
                        count++;
                        if(awsObjectList.length === count) {
                            callback(null, awsObjectList);
                        }
                    }
                })
            }
        }
    }
};

function updateManagedInstanceCost(instances,instanceCostMetrics, callback) {
    var results = [];
    var instanceCostObj={};
    if(instances.length === 0) {
        callback(null, results);
    }else {
        for(var i = 0; i < instances.length; i++){
            var costMetrics = [];
            var costMetricsObj = {};
            var totalCost = 0.0;
            var totalUsage= 0.0;
            for (var j = 0; j < instanceCostMetrics.length; j++) {
                if (instanceCostMetrics[j].resourceId === instances[i].platformId) {
                    costMetricsObj['usageStartDate'] = instanceCostMetrics[j].usageStartDate;
                    costMetricsObj['usageEndDate'] = instanceCostMetrics[j].usageEndDate;
                    costMetricsObj['usageQuantity'] = instanceCostMetrics[j].usageQuantity;
                    costMetricsObj['description'] = instanceCostMetrics[j].description;
                    costMetricsObj['usageCost'] = instanceCostMetrics[j].usageCost;
                    totalCost += Number(instanceCostMetrics[j].usageCost);
                    totalUsage += Number(instanceCostMetrics[j].usageQuantity);
                    costMetrics.push(costMetricsObj);
                    costMetricsObj = {};
                };
            };
            instanceCostObj['resourceId'] = instances[i].platformId;
            instanceCostObj['costMetrics'] = costMetrics;
            instanceCostObj['totalInstanceCost'] = totalCost;
            instancesModel.updateInstanceCost(instanceCostObj, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    results.push(result);
                }
                if (results.length == instances.length) {
                    callback(null, results);
                }
            });
        };
    }
};

function updateUnManagedInstanceCost(instances,instanceCostMetrics, callback) {
    var results = [];
    var instanceCostObj = {};
    if (instances.length === 0) {
        callback(null, results);
    } else {
        for (var i = 0; i < instances.length; i++) {
            var costMetrics = [];
            var costMetricsObj = {};
            var totalCost = 0.0;
            var totalUsage= 0.0;
            for (var j = 0; j < instanceCostMetrics.length; j++) {
                if (instanceCostMetrics[j].resourceId === instances[i].platformId) {
                    costMetricsObj['usageStartDate'] = instanceCostMetrics[j].usageStartDate;
                    costMetricsObj['usageEndDate'] = instanceCostMetrics[j].usageEndDate;
                    costMetricsObj['usageQuantity'] = instanceCostMetrics[j].usageQuantity;
                    costMetricsObj['description'] = instanceCostMetrics[j].description;
                    costMetricsObj['usageCost'] = instanceCostMetrics[j].usageCost;
                    totalCost += Number(instanceCostMetrics[j].usageCost);
                    totalUsage+= Number(instanceCostMetrics[j].usageQuantity);
                    costMetrics.push(costMetricsObj);
                    costMetricsObj = {};
                };
            };
            instanceCostObj['resourceId'] = instances[i].platformId;
            instanceCostObj['costMetrics'] = costMetrics;
            instanceCostObj['totalInstanceCost'] = totalCost;
            instanceCostObj['totalInstanceUsage'] = totalUsage;
            unManagedInstancesModel.updateInstanceCost(instanceCostObj, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    results.push(result);
                }
                if (results.length == instances.length) {
                    callback(null, results);
                }
            });
        };
    };
};


