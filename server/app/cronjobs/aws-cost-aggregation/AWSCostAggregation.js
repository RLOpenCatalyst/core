
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var resourceCost = require('_pr/model/resource-costs');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var instanceService = require('_pr/services/instanceService');
var resourceService = require('_pr/services/resourceService');
var S3 = require('_pr/lib/s3.js');
var resources = require('_pr/model/resources/resources');
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
var accountNumber = appConfig.aws.s3AccountNumber;
var fullKey = accountNumber + appConfig.aws.s3CSVFileName + year + "-" + month + ".csv.zip";
var csvFile = appConfig.aws.s3BucketDownloadFileLocation + accountNumber
    + appConfig.aws.s3CSVFileName + year + "-" + month + ".csv";


var AggregateAWSCost= Object.create(CatalystCronJob);
AggregateAWSCost.interval = '0 */1 * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        }else if(orgs.length > 0){
            for(var i = 0; i < orgs.length; i++){
                (function(org){
                    AWSProvider.getAWSProvidersByOrgId(org.rowid, function(err, providers) {
                        if(err) {
                            logger.error(err);
                            return;
                        } else if(providers.length > 0){
                            var count = 0;
                            for(var j = 0; j < providers.length; j++){
                                (function(provider){
                                    if(provider.s3BucketName !== ''){
                                        count++;
                                        aggregateAWSCostForProvider(provider)
                                    }else{
                                        logger.info("S3 Bucket Name is not present in "
                                            +provider.providerName+" for Cost Aggregation ");
                                        count++;
                                    }
                                })(providers[j]);
                            }
                            if(count ===providers.length){
                                return;
                            }

                        }else{
                            logger.info("Please configure Provider in Organization "
                                +org.orgname+" for AWS Cost Aggregation");
                            return;
                        }
                    });

                })(orgs[i]);
            }

        }else{
            logger.info("Please configure Organization for Aws Cost Aggregation");
            return;
        }
    });
}

function aggregateAWSCostForProvider(provider) {
    logger.info('AWS ServiceWise/InstanceWise/RegionWise/MonthlyTotal/Today/Yesterday/' +
        'TagWise Cost aggregation for provider: ' + provider._id + ' started');
    var instanceObj = {};
    var resourceObj = {};
    async.waterfall([
            function (next) {
                resourceService.getTotalCost(provider, next);
            },
            function (totalCost, next) {
                resourceService.getCostForServices(provider, next);
            },
            function (serviceCost, next) {
                downloadUpdatedCSVFile(provider, next);
            },
            function (downloadStatus, next) {
                async.waterfall([
                    function(next){
                        instanceService.getTrackedInstancesForProvider(provider, next);
                    },
                    function (provider, instances, next) {
                        instanceObj = instances;
                        async.parallel({
                            instanceIds: function (callback) {
                                instanceIdList(instances, callback);
                            },
                            bucketNames: function (callback) {
                                bucketNameList(provider, callback);
                            },
                            rdsDBNames: function (callback) {
                                rdsDBNameList(provider, callback);
                            },
                            bucketResource: function (callback) {
                                resources.getResourcesByProviderResourceType(provider._id, 'S3', callback);
                            },
                            rdsResource: function (callback) {
                                resources.getResourcesByProviderResourceType(provider._id, 'RDS', callback);
                            }
                        }, function (err, results) {
                            if (err) {
                                next(err);
                            } else {
                                next(null, results);
                            }
                        });
                    },
                    function (resources, next) {
                        resourceObj = resources;
                        resourceService.getCostForResources(lastModified, provider,
                            resources.bucketNames, resources.instanceIds, resources.rdsDBNames, csvFile, next);
                    },
                    function (costMetrics, next) {
                        async.parallel({
                            managedCostMetrics: function (callback) {
                                updateManagedInstanceCost(instanceObj.managed,
                                    costMetrics.instanceCostMetrics, callback);
                            },
                            unManagedCostMetrics: function (callback) {
                                updateUnManagedInstanceCost(instanceObj.unmanaged,
                                    costMetrics.instanceCostMetrics, callback);
                            },
                            unassignedCostMetrics: function(callback) {
                                updateUnassignedInstanceCost(instanceObj.unassigned,
                                    costMetrics.instanceCostMetrics, callback);
                            },
                            instanceCostMetrics: function (callback) {
                                saveInstanceResourceCost(instanceObj,
                                    costMetrics.instanceCostMetrics, callback);
                            },
                            bucketCostMetrics: function (callback) {
                                updateResourceCost(resourceObj.bucketResource,
                                    costMetrics.bucketCostMetrics, callback);
                            },
                            rdsDBInstancesMetrics: function (callback) {
                                updateResourceCost(resourceObj.rdsResource,
                                    costMetrics.dbInstanceCostMetrics, callback);
                            }
                        }, function (err, results) {
                            if (err) {
                                next(err);
                            } else {
                                next(null, results);
                            }
                        });
                    }
                ],function(err,results){
                    if (err) {
                        next(err);
                    } else {
                        next(null, downloadStatus);
                    }
                });
            }],
        function (err, results) {
            if (err) {
                logger.error(err);
            } else {
                if (results === false) {
                    logger.info("File updated time is same as DB updated time");
                    logger.info('AWS ServiceWise/InstanceWise/RegionWise/MonthlyTotal/Today/' +
                        'Yesterday/TagWise Cost aggregation for provider: ' + provider._id + ' ended');
                    return;
                } else {
                    logger.info('AWS ServiceWise/InstanceWise/RegionWise/MonthlyTotal/Today/' +
                        'Yesterday/TagWise Cost aggregation for provider: ' + provider._id + ' ended');
                    return;
                }
            }
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
            function(next){
                resourceCost.getResourceCostUpdatedTime(next);
            },
            function (dbUpdatedTime,next) {
                lastModified =dbUpdatedTime;
                s3.getObject(params, 'time', next);
            },
            function (csvFileUpdatedTime, next) {
                var temp = String(csvFileUpdatedTime).split(',');
                var changedTime = new Date(temp[1]).getTime();
                if (lastModified < changedTime) {
                    lastModified =changedTime;
                    s3.getObject(params, 'file', next);
                } else {
                    next(null, false);
                }
            }],
        function(err,results){
            if(err){
                logger.error(err);
                next(err);
            }else{
                if(results === true) {
                    var path=appConfig.aws.s3BucketDownloadFileLocation;
                    var fileName=appConfig.aws.s3BucketFileName;
                    var zip = new AdmZip(path+fileName);
                    zip.extractAllTo(path, true);
                    next(null, results);
                }else{
                    next(null,false);
                }
            }
        });
};

function instanceIdList(instances,callback){
    var instanceIds=[];
    var length = instances.managed.length + instances.unmanaged.length + instances.unassigned.length;
    if(instances.managed.length === 0 && instances.unmanaged.length === 0 && instances.unassigned.length === 0){
        callback(null,instanceIds);
    }else{
        if(instances.managed.length > 0){
            for(var i = 0; i < instances.managed.length; i++){
                instanceIds.push(instances.managed[i].platformId);
            }
        }
        if(instances.unmanaged.length > 0){
            for(var j = 0; j < instances.unmanaged.length; j++){
                instanceIds.push(instances.unmanaged[j].platformId);
            }
        }
        if(instances.unassigned.length > 0){
            for(var k = 0; k < instances.unassigned.length; k++){
                instanceIds.push(instances.unassigned[k].platformId);
            }
        }
        if(instanceIds.length === length){
            callback(null,instanceIds);
        }
    }
};

function bucketNameList(provider,callback){
    var bucketNames=[];
    resources.getResourcesByProviderResourceType(provider._id,'S3',function(err,buckets){
        if(err){
            logger.error(err);
            callback(err,null);
        }else{
            var length = buckets.length;
            for(var i = 0; i < length; i++){
                bucketNames.push(buckets[i].resourceDetails.bucketName);
            }
            if(bucketNames.length === length){
                callback(null,bucketNames);
            }
        }
    });
};
function rdsDBNameList(provider,callback){
    var dbNames=[];
    resources.getResourcesByProviderResourceType(provider._id,'RDS',function(err,dbInstances){
        if(err){
            logger.error(err);
            callback(err,null);
        }else{
            var length = dbInstances.length;
            for(var i = 0; i < length; i++){
                dbNames.push(dbInstances[i].resourceDetails.dbName);
            }
            if(dbNames.length === length){
                callback(null,dbNames);
            }
        }
    });
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
                var totalCost = 0.0;
                for (var j = 0; j < instanceCostMetrics.length; j++) {
                    if (instanceCostMetrics[j].resourceId === instances.managed[i].platformId) {
                        totalCost += Number(instanceCostMetrics[j].usageCost);
                    };
                };
                awsCostObject['updatedTime'] = Date.parse(date);
                awsCostObject['startTime'] = Date.parse(startTime);
                awsCostObject['endTime'] = Date.parse(date);
                awsCostObject['aggregateResourceCost'] = totalCost;
                awsCostObject['costMetrics'] = {
                    aggregateInstanceCost:totalCost,
                    currency:'USD',
                    symbol:"$"
                };
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
                var totalCost = 0.0;
                for (var j = 0; j < instanceCostMetrics.length; j++) {
                    if (instanceCostMetrics[j].resourceId === instances.unmanaged[i].platformId) {
                        totalCost  += Number(instanceCostMetrics[j].usageCost);
                    };
                };
                awsCostObject['updatedTime'] = Date.parse(date);
                awsCostObject['startTime'] = Date.parse(startTime);
                awsCostObject['endTime'] = Date.parse(date);
                awsCostObject['aggregateResourceCost'] = totalCost;
                awsCostObject['costMetrics'] = {
                    aggregateInstanceCost:totalCost,
                    currency:'USD',
                    symbol:"$"
                };
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

// @TODO Resource abstraction to be redefined to include all instances, to reduce code duplication

function updateManagedInstanceCost(instances,instanceCostMetrics, callback) {
    var results = [];
    var instanceCostObj={};
    if(instances.length === 0) {
        callback(null, results);
    }else {
        for(var i = 0; i < instances.length; i++){
            var totalCost = 0.0;
            for (var j = 0; j < instanceCostMetrics.length; j++) {
                if (instanceCostMetrics[j].resourceId === instances[i].platformId) {
                    totalCost += Number(instanceCostMetrics[j].usageCost);
                };
            };
            instanceCostObj['resourceId'] = instances[i].platformId;
            instanceCostObj['cost'] = {
                aggregateInstanceCost:totalCost,
                currency:'USD',
                symbol:"$"
            };
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
            var totalCost = 0.0;
            for (var j = 0; j < instanceCostMetrics.length; j++) {
                if (instanceCostMetrics[j].resourceId === instances[i].platformId) {
                    totalCost += Number(instanceCostMetrics[j].usageCost);
                };
            };
            instanceCostObj['resourceId'] = instances[i].platformId;
            instanceCostObj['cost'] = {
                aggregateInstanceCost:totalCost,
                currency:'USD',
                symbol:"$"
            };
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

function updateUnassignedInstanceCost(instances,instanceCostMetrics, callback) {
    var results = [];
    var instanceCostObj = {};
    if (instances.length === 0) {
        callback(null, results);
    } else {
        for (var i = 0; i < instances.length; i++) {
            var totalCost = 0.0;
            for (var j = 0; j < instanceCostMetrics.length; j++) {
                if (instanceCostMetrics[j].resourceId === instances[i].platformId) {
                    totalCost += Number(instanceCostMetrics[j].usageCost);
                };
            };
            instanceCostObj['resourceId'] = instances[i].platformId;
            instanceCostObj['cost'] = {
                aggregateInstanceCost:totalCost,
                currency:'USD',
                symbol:"$"
            };
            unassignedInstancesModel.updateInstanceCost(instanceCostObj, function (err, result) {
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

function updateResourceCost(resourceData,resourceCostMetrics,callback){
    var results = [];
    var bucketCostObj = {};
    if (resourceData.length === 0) {
        callback(null, results);
    } else {
        for (var i = 0; i < resourceData.length; i++) {
            var totalCost = 0.0;
            for (var j = 0; j < resourceCostMetrics.length; j++) {
                if(resourceData[i].resourceType === 'S3'
                    && resourceCostMetrics[j].resourceId === resourceData[i].resourceDetails.bucketName) {
                    totalCost += Number(resourceCostMetrics[j].usageCost);
                }else if (resourceData[i].resourceType === 'RDS'
                    || resourceCostMetrics[j].resourceId === resourceData[i].resourceDetails.dbName) {
                    totalCost += Number(resourceCostMetrics[j].usageCost);
                };
            };
            bucketCostObj['resourceId'] = resourceData[i]._id;
            bucketCostObj['cost'] = {
                aggregateResourceCost:totalCost,
                currency:'USD',
                symbol:"$"
            };
            resources.updateResourceCost(bucketCostObj.resourceId,bucketCostObj.cost, function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    results.push(result);
                }
                if (results.length == resourceData.length) {
                    callback(null, results);
                }
            });
        };
    };
};