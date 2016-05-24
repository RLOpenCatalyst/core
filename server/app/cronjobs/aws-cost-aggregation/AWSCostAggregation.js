/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var awsCostDao = require('_pr/model/aws-cost-aggregate');
var instanceService = require('_pr/services/instanceService');
var S3 = require('_pr/lib/s3.js');
var AdmZip = require('adm-zip');
var csv2json = require('csv2json');
var json = require('jsonfile');
var fs = require('fs');
var lastModified=100;

var AggregateAWSCost = Object.create(CatalystCronJob);
AggregateAWSCost.interval = '*/5 * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    var s3Config = appConfig.aws.s3;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    var accountNumber = s3Config.accountNumber;
    var fullKey = accountNumber + s3Config.keyName + year + "-" + month + ".csv.zip";
    var csvFile = "./" + accountNumber + s3Config.keyName + year + "-" + month + ".csv";
    var s3 = new S3(s3Config);
    var params = {
        Bucket: s3Config.bucketName,
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
                s3.getObject(params, 'file', next);
            } else {
                next(null, updateTime);
            }
        },
        function (status, next) {
            if (status) {
                MasterUtils.getAllActiveOrg(next);
            } else {
                next(null,status);
            }
        },
        function (orgs, next) {
            if(orgs.length > 0) {
                getProvidersList(orgs, next);
            }else{
                next(null,orgs);
            }
        },
        function(providers,next){
            if(providers.length > 0){
                getInstanceList(providers,next);
            }else{
                next(null,providers);
            }
        },
        function(instanceIdsResults,next){
                var zip = new AdmZip("./rlBilling.zip");
                zip.extractAllTo(__dirname, true);
                var newJsonFile = fs.createWriteStream('./data.json');
                fs.createReadStream(__dirname + '/' + csvFile).pipe(csv2json({})).pipe(newJsonFile);
                newJsonFile.on('finish', function () {
                    json.readFile('./data.json', function (err, awsCosts) {
                        if (err) {
                            logger.error(err);
                            return;
                        } else {
                            var length = awsCosts.length;
                            for (var i = 0; i < length; i++) {
                                if(instanceIdsResults.unassignedRunningPlatformIds.length > 0 && instanceIdsResults.unassignedRunningPlatformIds.indexOf(awsCosts[i].ResourceId) >= 0){
                                    var awsCostObject={
                                        orgId:instanceIdsResults.orgId,
                                        providerId:instanceIdsResults.providerId,
                                        providerType:instanceIdsResults.providerType,
                                        providerName:instanceIdsResults.providerName,
                                        instanceId:awsCosts[i].ResourceId,
                                        invoiceID:awsCosts[i].InvoiceID,
                                        payerAccountNumber:awsCosts[i].PayerAccountId,
                                        recordType:awsCosts[i].RecordType,
                                        productName:awsCosts[i].ProductName,
                                        usageType:awsCosts[i].UsageType,
                                        operation:awsCosts[i].Operation,
                                        region:awsCosts[i].AvailabilityZone,
                                        isReservedInstance:awsCosts[i].ReservedInstance,
                                        description:awsCosts[i].ItemDescription,
                                        usageStartDate:awsCosts[i].UsageStartDate,
                                        usageEndDate:awsCosts[i].UsageEndDate,
                                        usageQuantity:awsCosts[i].UsageQuantity,
                                        blendedRate:awsCosts[i].BlendedRate,
                                        blendedCost:awsCosts[i].BlendedCost,
                                        ResourceTags:{ Bill:awsCosts[i]['user:Bill'],Name:awsCosts[i]['user:Name']},
                                        instanceState:'running',
                                        instanceType:'unassigned',
                                    };
                                    saveAndUpdateAwsCostCsvData(awsCostObject);
                                    awsCostObject={};
                                }else if(instanceIdsResults.unassignedStoppedPlatformIds.length > 0 && instanceIdsResults.unassignedStoppedPlatformIds.indexOf(awsCosts[i].ResourceId) >= 0){
                                    var awsCostObject={
                                        orgId:instanceIdsResults.orgId,
                                        providerId:instanceIdsResults.providerId,
                                        providerType:instanceIdsResults.providerType,
                                        providerName:instanceIdsResults.providerName,
                                        instanceId:awsCosts[i].ResourceId,
                                        invoiceID:awsCosts[i].InvoiceID,
                                        payerAccountNumber:awsCosts[i].PayerAccountId,
                                        recordType:awsCosts[i].RecordType,
                                        productName:awsCosts[i].ProductName,
                                        usageType:awsCosts[i].UsageType,
                                        operation:awsCosts[i].Operation,
                                        region:awsCosts[i].AvailabilityZone,
                                        isReservedInstance:awsCosts[i].ReservedInstance,
                                        description:awsCosts[i].ItemDescription,
                                        usageStartDate:awsCosts[i].UsageStartDate,
                                        usageEndDate:awsCosts[i].UsageEndDate,
                                        usageQuantity:awsCosts[i].UsageQuantity,
                                        blendedRate:awsCosts[i].BlendedRate,
                                        blendedCost:awsCosts[i].BlendedCost,
                                        ResourceTags:{ Bill:awsCosts[i]['user:Bill'],Name:awsCosts[i]['user:Name']},
                                        instanceState:'stopped',
                                        instanceType:'unassigned',
                                    };
                                    saveAndUpdateAwsCostCsvData(awsCostObject);
                                    awsCostObject={};
                                }else if(instanceIdsResults.unassignedTerminatePlatformIds.length > 0 && instanceIdsResults.unassignedTerminatePlatformIds.indexOf(awsCosts[i].ResourceId) >= 0){
                                    var awsCostObject={
                                        orgId:instanceIdsResults.orgId,
                                        providerId:instanceIdsResults.providerId,
                                        providerType:instanceIdsResults.providerType,
                                        providerName:instanceIdsResults.providerName,
                                        instanceId:awsCosts[i].ResourceId,
                                        invoiceID:awsCosts[i].InvoiceID,
                                        payerAccountNumber:awsCosts[i].PayerAccountId,
                                        recordType:awsCosts[i].RecordType,
                                        productName:awsCosts[i].ProductName,
                                        usageType:awsCosts[i].UsageType,
                                        operation:awsCosts[i].Operation,
                                        region:awsCosts[i].AvailabilityZone,
                                        isReservedInstance:awsCosts[i].ReservedInstance,
                                        description:awsCosts[i].ItemDescription,
                                        usageStartDate:awsCosts[i].UsageStartDate,
                                        usageEndDate:awsCosts[i].UsageEndDate,
                                        usageQuantity:awsCosts[i].UsageQuantity,
                                        blendedRate:awsCosts[i].BlendedRate,
                                        blendedCost:awsCosts[i].BlendedCost,
                                        ResourceTags:{ Bill:awsCosts[i]['user:Bill'],Name:awsCosts[i]['user:Name']},
                                        instanceState:'terminate',
                                        instanceType:'unassigned',
                                    };
                                    saveAndUpdateAwsCostCsvData(awsCostObject);
                                    awsCostObject={};
                                }else if(instanceIdsResults.unassignedPendingPlatformIds.length > 0 && instanceIdsResults.unassignedPendingPlatformIds.indexOf(awsCosts[i].ResourceId) >= 0){
                                    var awsCostObject={
                                        orgId:instanceIdsResults.orgId,
                                        providerId:instanceIdsResults.providerId,
                                        providerType:instanceIdsResults.providerType,
                                        providerName:instanceIdsResults.providerName,
                                        instanceId:awsCosts[i].ResourceId,
                                        invoiceID:awsCosts[i].InvoiceID,
                                        payerAccountNumber:awsCosts[i].PayerAccountId,
                                        recordType:awsCosts[i].RecordType,
                                        productName:awsCosts[i].ProductName,
                                        usageType:awsCosts[i].UsageType,
                                        operation:awsCosts[i].Operation,
                                        region:awsCosts[i].AvailabilityZone,
                                        isReservedInstance:awsCosts[i].ReservedInstance,
                                        description:awsCosts[i].ItemDescription,
                                        usageStartDate:awsCosts[i].UsageStartDate,
                                        usageEndDate:awsCosts[i].UsageEndDate,
                                        usageQuantity:awsCosts[i].UsageQuantity,
                                        blendedRate:awsCosts[i].BlendedRate,
                                        blendedCost:awsCosts[i].BlendedCost,
                                        ResourceTags:{ Bill:awsCosts[i]['user:Bill'],Name:awsCosts[i]['user:Name']},
                                        instanceState:'pending',
                                        instanceType:'unassigned',
                                    };
                                    saveAndUpdateAwsCostCsvData(awsCostObject);
                                    awsCostObject={};
                                }
                            }
                        }
                    })
                })
            next(null,instanceIdsResults);
        }
    ], function (err, result) {
        if(err){
            logger.error(err);
            return;
        }
    })
}
function saveAndUpdateAwsCostCsvData(awsAggregateCostData){
    async.waterfall([
        function(next){
            awsCostDao.createAWSCostByCSV(awsAggregateCostData,next);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return;
        }
    })
}

function getProvidersList(orgs,next){
    var count=0;
    var providers=[];
    for(var i = 0; i < orgs.length; i++){
        AWSProvider.getAWSProvidersByOrgId(orgs[i]._id, function(err,provider){
            if(err){
                logger.error(err);
                return;
            }else {
                count++;
                providers.push(provider[0]);
                if(orgs.length === count){
                    next(null,providers);
                }
            }
        });
    }
}

function getInstanceList(providers,next){
    var count=0;
    var instanceIds=[];
    var managedRunningInstanceIds=[];
    var managedStoppedInstanceIds=[];
    var managedTerminateInstanceIds=[];
    var managedPendingInstanceIds=[];
    var unManagedRunningInstanceIds=[];
    var unManagedStoppedInstanceIds=[];
    var unManagedTerminateInstanceIds=[];
    var unManagedPendingInstanceIds=[];
    var unassignedRunningInstanceIds=[];
    var unassignedStoppedInstanceIds=[];
    var unassignedTerminateInstanceIds=[];
    var unassignedPendingInstanceIds=[];
    for(var i = 0; i < providers.length; i++) {
        instanceService.getTrackedInstancesForProvider(providers[i], function (err,provider, instances) {
            if (err) {
                if (err) {
                    logger.error(err);
                    return;
                }
            } else {
                count++;
                if (instances.managed.length === 0 && instances.unmanaged.length === 0 && instances.unassigned.length === 0) {
                    next(null, instanceIds);
                } else {
                    if (instances.managed.length > 0) {
                        for (var j = 0; j < instances.managed.length; j++) {
                            instanceIds.push(instances.managed[j].platformId);
                            if(instances.managed[j].state === 'running'){
                                managedRunningInstanceIds.push(instances.managed[j].platformId);
                            }else if(instances.managed[j].state === 'stopped'){
                                managedStoppedInstanceIds.push(instances.managed[j].platformId);
                            }else if(instances.managed[j].state === 'terminate'){
                                managedTerminateInstanceIds.push(instances.managed[j].platformId);
                            }else if(instances.managed[j].state === 'pending'){
                                managedPendingInstanceIds.push(instances.managed[j].platformId);
                            }
                        }
                    }
                    if (instances.unmanaged.length > 0) {
                        for (var j = 0; j < instances.unmanaged.length; j++) {
                            instanceIds.push(instances.unmanaged[j].platformId);
                            if(instances.unmanaged[j].state === 'running'){
                                unManagedRunningInstanceIds.push(instances.unmanaged[j].platformId);
                            }else if(instances.unmanaged[j].state === 'stopped'){
                                unManagedStoppedInstanceIds.push(instances.unmanaged[j].platformId);
                            }else if(instances.unmanaged[j].state === 'terminate'){
                                unManagedTerminateInstanceIds.push(instances.unmanaged[j].platformId);
                            }else if(instances.unmanaged[j].state === 'pending'){
                                unManagedPendingInstanceIds.push(instances.unmanaged[j].platformId);
                            }
                        }
                    }
                    if (instances.unassigned.length > 0) {
                        for (var j = 0; j < instances.unassigned.length; j++) {
                            instanceIds.push(instances.unassigned[j].platformId);
                            if(instances.unassigned[j].state === 'running'){
                                unassignedRunningInstanceIds.push(instances.unassigned[j].platformId);
                            }else if(instances.unassigned[j].state === 'stopped'){
                                unassignedStoppedInstanceIds.push(instances.unassigned[j].platformId);
                            }else if(instances.unassigned[j].state === 'terminate'){
                                unassignedTerminateInstanceIds.push(instances.unassigned[j].platformId);
                            }else if(instances.unassigned[j].state === 'pending'){
                                unassignedPendingInstanceIds.push(instances.unassigned[j].platformId);
                            }
                        }
                    }
                    if(providers.length === count){
                        var results={
                            orgId:provider.orgId,
                            providerId:provider._id,
                            providerType:provider.providerType,
                            providerName:provider.providerName,
                            platformIds:instanceIds,
                            managedRunningPlatformIds:managedRunningInstanceIds,
                            managedStoppedPlatformIds:managedStoppedInstanceIds,
                            managedTerminatePlatformIds:managedTerminateInstanceIds,
                            managedPendingPlatformIds:managedPendingInstanceIds,
                            unManagedRunningPlatformIds:unManagedRunningInstanceIds,
                            unManagedStoppedPlatformIds:unManagedStoppedInstanceIds,
                            unManagedTerminatePlatformIds:unManagedTerminateInstanceIds,
                            unManagedPendingPlatformIds:unManagedPendingInstanceIds,
                            unassignedRunningPlatformIds:unassignedRunningInstanceIds,
                            unassignedStoppedPlatformIds:unassignedStoppedInstanceIds,
                            unassignedTerminatePlatformIds:unassignedTerminateInstanceIds,
                            unassignedPendingPlatformIds:unassignedPendingInstanceIds,
                        };
                        next(null, results);
                    }
                }
            }
        });
    }
}














