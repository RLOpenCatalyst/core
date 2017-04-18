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
var resourceService = module.exports = {};
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var aws = require('aws-sdk');
var resources = require('_pr/model/resources/resources');
var S3Resource = require('_pr/model/resources/s3-resource')
var RDSResource = require('_pr/model/resources/rds-resource')
var CW = require('_pr/lib/cloudwatch.js');
var S3 = require('_pr/lib/s3.js');
var EC2 = require('_pr/lib/ec2.js');
var RDS = require('_pr/lib/rds.js');
var Route53 = require('_pr/lib/route53.js');
var resourceCost = require('_pr/model/resource-costs');
var csv = require("fast-csv");
var fs = require('fs');
var async = require('async');
var dateUtil = require('_pr/lib/utils/dateUtil');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var instancesModel = require('_pr/model/classes/instance/instance');
var entityCosts = require('_pr/model/entity-costs');
var mongoDbClient = require('mongodb').MongoClient;

resourceService.getCostForServices = getCostForServices_deprecated;
resourceService.getEC2InstanceUsageMetrics=getEC2InstanceUsageMetrics;
resourceService.getS3BucketsMetrics=getS3BucketsMetrics;
resourceService.getBucketsInfo=getBucketsInfo;
resourceService.getResources=getResources;
resourceService.getRDSInstancesInfo=getRDSInstancesInfo;
resourceService.getRDSDBInstanceMetrics=getRDSDBInstanceMetrics;
resourceService.bulkUpdateResourceProviderTags=bulkUpdateResourceProviderTags;
resourceService.bulkUpdateUnassignedResourceTags=bulkUpdateUnassignedResourceTags;
resourceService.bulkUpdateAWSResourcesTags=bulkUpdateAWSResourcesTags;
resourceService.getEC2InstancesInfo=getEC2InstancesInfo;
resourceService.getAllResourcesForProvider =  getAllResourcesForProvider;
resourceService.updateAWSResourceCostsFromCSV = updateAWSResourceCostsFromCSV
resourceService.updateDomainNameForInstance = updateDomainNameForInstance
resourceService.aggregateResourceCostsForPeriod = aggregateResourceCostsForPeriod

// @TODO To be cached if needed. In memory data will not exceed 200MB for upto 2000 instances.
// @TODO Unique identifier of S3 and RDS resources should be available in resource without casting.
function getAllResourcesForProvider(provider, next) {
    async.parallel([
            function(callback) {
                instancesModel.getInstanceByProviderId(provider._id, callback);
            },
            function(callback) {
                //@TODO Duplicate function of  getByProviderId, to be cleaned up
                unManagedInstancesModel.getInstanceByProviderId(provider._id, callback);
            },
            function(callback) {
                unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id, callback);
            },
            function(callback) {
                resources.getResourcesByProviderId(provider._id, callback);
            }
        ],
        function(err, results) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                var resultsArray = [].concat.apply([], results);
                var resultsObject = resultsArray.reduce(function(temp, current) {
                    if('platformId' in current) {
                        temp[current.platformId] = current;
                    } else if('resourceType' in current) {
                        switch(current.resourceType) {
                            case 'RDS':
                                var tempInstance = new RDSResource(current)
                                temp[tempInstance.resourceDetails.dbInstanceIdentifier] = current;
                                break;
                            case 'S3':
                                var tempInstance = new S3Resource(current)
                                temp[tempInstance.resourceDetails.bucketName] = current;
                                break;
                            default:
                                break;
                        }
                    }
                    return temp;
                }, {})

                next(null, resultsObject);
            }
        }
    );
}

function updateAWSResourceCostsFromCSV(provider, resources, downlaodedCSVPath, updateTime, callback) {
    var awsBillIndexes = appConfig.aws.billIndexes
    var awsServices = appConfig.aws.services
    var awsZones = appConfig.aws.zones
    var lineNumber = 0

    var date = new Date()
    var billIntervalId = date.getFullYear() + '-' + (date.getMonth() + 1)

    async.waterfall([
        function(next) {
            resourceCost.remove(provider.orgId, provider._id, billIntervalId, next)
        },
        function(count, next) {
            /*var lineNumber = (count == 0)?0:count
            var startingLineNumber = (count == 0)?1:(count+2)*/

            var stream = fs.createReadStream(downlaodedCSVPath)
            csv.fromStream(stream).on('data', function(data) {
                if(data[awsBillIndexes.totalCost] == 'LineItem') {
                    var resourceCostEntry = {platformDetails: {}}

                    resourceCostEntry.organizationId = provider.orgId
                    resourceCostEntry.providerId = provider._id
                    resourceCostEntry.providerType = provider.providerType
                    resourceCostEntry.cost = data[awsBillIndexes.cost]
                    resourceCostEntry.startTime = Date.parse(data[awsBillIndexes.startDate])
                    resourceCostEntry.endTime = Date.parse(data[awsBillIndexes.endDate])
                    resourceCostEntry.lastUpdateTime = Date.parse(updateTime)
                    resourceCostEntry.interval = 3600
                    resourceCostEntry.platformDetails.serviceName = data[awsBillIndexes.prod]
                    resourceCostEntry.billIntervalId = billIntervalId
                    resourceCostEntry.billLineItemId = ++lineNumber
                    resourceCostEntry.platformDetails.billRecordId = data[awsBillIndexes.recordId]

                    resourceCostEntry.platformDetails.serviceId
                        = (data[awsBillIndexes.prod] in awsServices)?awsServices[data[awsBillIndexes.prod]]
                        :resourceCostEntry.platformDetails.serviceId = 'Other'

                    resourceCostEntry.platformDetails.zone = (data[awsBillIndexes.zone] == null)
                        ? 'Global' : data[awsBillIndexes.zone]

                    resourceCostEntry.platformDetails.region = (data[awsBillIndexes.zone] in awsZones)
                        ? awsZones[data[awsBillIndexes.zone]] : 'Global'

                    if (data[awsBillIndexes.instanceId] != null) {
                        resourceCostEntry.platformDetails.instanceId = data[awsBillIndexes.instanceId]
                    }

                    if(data[awsBillIndexes.usageType] != null) {
                        resourceCostEntry.platformDetails.usageType = data[awsBillIndexes.usageType]
                    }

                    if (data[awsBillIndexes.instanceId] in resources) {
                        var resource = resources[data[awsBillIndexes.instanceId]]

                        resourceCostEntry.resourceId = resource._id

                        if (('bgId' in resource) && (resource.bgId != null)) {
                            resourceCostEntry.businessGroupId = resource['bgId']
                        }

                        if (('projectId' in resource) && (resource.projectId != null)) {
                            resourceCostEntry.projectId = resource['projectId']
                        }

                        if (('environmentId' in resource) && (resource.environmentId != null)) {
                            resourceCostEntry.environmentId = resource['environmentId']
                        }

                        if (('masterDetails.bgId' in resource) && (resource.masterDetails.bgId != null)) {
                            console.log("BG: " + resource['bgId'])
                            resourceCostEntry.businessGroupId = resource['bgId']
                        }

                        if (('masterDetails.projectId' in resource)
                            && (resource.masterDetails.projectId != null)) {
                            resourceCostEntry.projectId = resource['projectId']
                        }

                        if (('masterDetails.environmentId' in resource)
                            && (resource.masterDetails.environmentId != null)) {
                            resourceCostEntry.environmentId = resource['environmentId']
                        }
                    }

                    resourceCostEntry.businessGroupId
                        = ('businessGroupId' in resourceCostEntry)?resourceCostEntry.businessGroupId:'Unassigned'
                    resourceCostEntry.projectId
                        = ('projectId' in resourceCostEntry)?resourceCostEntry.projectId:'Unassigned'
                    resourceCostEntry.environmentId
                        = ('environmentId' in resourceCostEntry)?resourceCostEntry.environmentId:'Unassigned'

                    resourceCost.save(resourceCostEntry, function (err, costEntry) {
                        if (err) {
                            logger.error(err)
                            return next(new Error('Database Error'))
                        }
                    })
                }
            }).on('end', function() {
                next()
            })
        }
    ], function(err) {
        if(err) {
            callback(err)
        } else {
            callback(null, resources)
        }
    })
}

function aggregateResourceCostsForPeriod(provider, resources, period, endTime, callback) {
    var catalystEntityHierarchy = appConfig.catalystEntityHierarchy
    var date = new Date()
    var billIntervalId = date.getFullYear() + '-' + (date.getMonth() + 1)

    var offset = (new Date()).getTimezoneOffset()*60000
    var startTime = dateUtil.getStartOfPeriod(period, endTime)

    var query = { 'providerId': provider._id.toString() }
    query.startTime = {$gte: Date.parse(startTime) + offset}
    query.endTime = {$lte: Date.parse(endTime) + offset}

    async.waterfall([
        function(next) {
            resourceCost.aggregate([
                {$match: query},
                {$group: {_id: "$" + catalystEntityHierarchy['resource'].key,
                    totalCost: {$sum: "$cost"}}}
            ], next)
        },
        function(resourceCosts, next) {
            async.forEach(resourceCosts, function(resourceCost, next1) {
                if(resourceCost._id in resources) {
                    resources[resourceCost._id].cost = {
                        aggregateInstanceCost: Math.round(resourceCost.totalCost * 100) / 100,
                        currency:'USD',
                        symbol: '$'
                    }
                    resources[resourceCost._id].save(next1)
                } else {
                    next1()
                }
            }, function(err) {
                if(err) {
                    next(err)
                } else {
                    next()
                }
            })
        }
    ], function(err) {
        if(err) {
            callback(err)
        } else {
            logger.info("Individual resource costs aggregation complete")
            callback()
        }
    })
}

function getCostForServices_deprecated(provider,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var cwConfig = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region:"us-east-1"
    };
    cw = new CW(cwConfig);
    var endDate= new Date();
    var startDate = new Date(endDate.getTime() - (1000*60*60*6));
    var startDateOne = new Date(endDate.getTime() - (1000*60*60*24));
    /*This the Dimension that is required to passed for different services*/
    var ec2Dim = [ { Name: 'ServiceName',Value: 'AmazonEC2'},{ Name: 'Currency', Value: 'USD'} ];
    var rdsDim = [ { Name: 'ServiceName',Value: 'AmazonRDS'},{ Name: 'Currency', Value: 'USD'} ];
    /*Getting the cost of EC2 & RDS for the current day*/
    async.parallel({
        ec2Cost:function(callback){
            var ec2Cost = 0;
            cw.getTotalCost(startDate,endDate,'Maximum',ec2Dim,function(err,presentEC2Cost) {
                if (err) {
                    callback(err, null);
                }
                cw.getTotalCost(startDateOne, endDate, 'Minimum', ec2Dim, function (err, yesterdayEC2Cost) {
                    if (err) {
                        callback(err, null);
                    }else if (typeof presentEC2Cost === "undefined" && typeof yesterdayEC2Cost === "undefined"){
                        callback(null,ec2Cost);
                    }else if(presentEC2Cost.Maximum && yesterdayEC2Cost.Minimum) {
                        ec2Cost = presentEC2Cost['Maximum'] - yesterdayEC2Cost['Minimum'];
                        callback(null, ec2Cost);
                    }else {
                        callback(null, ec2Cost);
                    }
                });
            });
        },
        rdsCost:function(callback){
            var rdsCost = 0;
            cw.getTotalCost(startDate,endDate,'Maximum',rdsDim,function(err,presentRDSCost) {
                if (err) {
                    callback(err, null);
                }
                cw.getTotalCost(startDateOne, endDate, 'Minimum', rdsDim, function (err, yesterdayRDSCost) {
                    if (err) {
                        callback(err, null);
                    }else if (typeof presentRDSCost === "undefined" && typeof yesterdayRDSCost === "undefined"){
                        callback(null,rdsCost);
                    }else if(presentRDSCost.Maximum && yesterdayRDSCost.Minimum) {
                        rdsCost = presentRDSCost['Maximum'] - yesterdayRDSCost['Minimum'];
                        callback(null, rdsCost);
                    }else {
                        callback(null, rdsCost);
                    }
                });
            });
        }

    },function(err,results){
        if(err){
            callback(err,null);
            return;
        }else {
            var awsResourceCostObject = {
                organisationId: provider.orgId,
                providerId: provider._id,
                providerType: provider.providerType,
                providerName: provider.providerName,
                resourceType: "serviceCost",
                resourceId: "serviceCost",
                aggregateResourceCost: results.ec2Cost + results.rdsCost,
                costMetrics: {
                    ec2Cost: results.ec2Cost,
                    rdsCost: results.rdsCost,
                    currency: 'USD',
                    symbol: "$"
                },
                updatedTime: Date.parse(endDate),
                startTime: Date.parse(endDate),
                endTime: Date.parse(startDateOne)
            };
            resourceCost.saveResourceCost(awsResourceCostObject, function (err, resourceCostData) {
                if (err) {
                    callback(err, null);
                    return;
                } else {
                    callback(null, resourceCostData);
                    return;
                }
            })
        }
    });
}

function getEC2InstanceUsageMetrics(provider, instances, startTime, endTime, period, callback) {
    var metricsUnits = appConfig.aws.cwMetricsUnits;
    var instanceUsageMetrics = [];
    var instnacesWithMetrics = instances.length;

    if(instances.length == 0)
        callback(null, instanceUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey
        };
    }

    /*var endTime = new Date();
     var startTime = new Date(endTime.getTime() - 1000*60*60*24);*/
    for(var i = 0; i < instances.length; i++) {
        (function(j) {
            if(('providerData' in instances[j]) && (typeof instances[j].providerData !== undefined)
                && instances[j].providerData) {
                amazonConfig.region = instances[j].providerData.region;
                cw = new CW(amazonConfig);

                async.parallel({
                        CPUUtilization: function (callback) {
                            cw.getUsageMetrics('CPUUtilization', metricsUnits.CPUUtilization,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        NetworkOut: function (callback) {
                            cw.getUsageMetrics('NetworkOut', metricsUnits.NetworkOut,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        NetworkIn: function (callback) {
                            cw.getUsageMetrics('NetworkIn', metricsUnits.NetworkIn,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        DiskReadBytes: function (callback) {
                            cw.getUsageMetrics('DiskReadBytes', metricsUnits.DiskReadBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        },
                        DiskWriteBytes: function (callback) {
                            cw.getUsageMetrics('DiskWriteBytes', metricsUnits.DiskWriteBytes,'AWS/EC2',[{Name:'InstanceId',Value:instances[j].platformId}], startTime, endTime, period, callback);
                        }
                    },
                    function (err, results) {
                        if(err) {
                            logger.error(err)
                        } else {
                            /* TODO: To split up into different entries.*/
                            /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                            /* Currently modifying the start time and end time with the period.
                             * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                             * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                             * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                             * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                             */
                            var dbEndTime = startTime;
                            var dbStartTime = getStartTime(dbEndTime, period);

                            instanceUsageMetrics.push({
                                providerId: provider._id,
                                providerType: provider.providerType,
                                orgId: provider.orgId[0],
                                projectId: instances[j].projectId,
                                resourceId: instances[j]._id,
                                platform: 'AWS',
                                platformId: instances[j].platformId,
                                resourceType: 'EC2',
                                startTime: dbStartTime,
                                endTime: dbEndTime,
                                interval: period,
                                metrics: results
                            });
                        }

                        if(instanceUsageMetrics.length == instnacesWithMetrics) {
                            callback(null, instanceUsageMetrics);
                        }
                    });
            } else {
                instnacesWithMetrics -= 1;

                if(instanceUsageMetrics.length == instnacesWithMetrics)
                    callback(null, instanceUsageMetrics);
            }
        })(i);
    }
};

function getS3BucketsMetrics(provider, buckets, startTime, endTime, period, callback) {
    var bucketUsageMetrics = [];
    var bucketWithMetrics = buckets.length;
    if(bucketWithMetrics == 0)
        callback(null, bucketUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey,
            "region":"us-east-1"
        };
    }
    /*var endTime= new Date();
     var startTime = new Date(endTime.getTime() - (1000*60*60*24));*/
    for(var i = 0; i < buckets.length; i++) {
        (function(bucket) {
            cw = new CW(amazonConfig);
            async.parallel({
                    BucketSizeBytes: function (callback) {
                        cw.getUsageMetrics('BucketSizeBytes','Bytes','AWS/S3',
                            [{Name:'BucketName',Value:bucket.resourceDetails.bucketName},
                                {Name:'StorageType',Value:'StandardStorage'}],startTime, endTime, period, callback);
                    },
                    NumberOfObjects: function (callback) {
                        cw.getUsageMetrics('NumberOfObjects','Count','AWS/S3',[{Name:'BucketName',
                                Value:bucket.resourceDetails.bucketName},{Name:'StorageType',Value:'AllStorageTypes'}],
                            startTime, endTime, period, callback);
                    }
                },
                function (err, results) {
                    if(err) {
                        logger.error(err)
                    } else {
                        /* TODO: To split up into different entries.*/
                        /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                        /* Currently modifying the start time and end time with the period.
                         * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                         * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                         * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                         * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                         */
                        var dbEndTime = startTime;
                        var dbStartTime = getStartTime(dbEndTime, period);

                        bucketUsageMetrics.push({
                            providerId: provider._id,
                            providerType: provider.providerType,
                            orgId: provider.orgId[0],
                            resourceId: bucket._id,
                            platform: 'AWS',
                            platformId: bucket.resourceDetails.bucketName,
                            resourceType: 'S3',
                            startTime: dbStartTime,
                            endTime: dbEndTime,
                            interval: period,
                            metrics: results
                        });
                    }
                    if(bucketUsageMetrics.length == bucketWithMetrics) {
                        callback(null, bucketUsageMetrics);
                    }
                });
        })(buckets[i]);
    }
};

function getRDSDBInstanceMetrics(provider, dbInstances, startTime, endTime, period, callback) {
    var rdsUsageMetrics = [];
    var rdsWithMetrics = dbInstances.length;
    if(rdsWithMetrics == 0)
        callback(null, rdsUsageMetrics);

    // @TODO Create promise for creating cw client
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var amazonConfig;

    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        amazonConfig = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey,
            "region":"us-east-1"
        };
    }
    /*var endTime= new Date();
     var startTime = new Date(endTime.getTime() - (1000*60*60*24));*/
    for(var i = 0; i < dbInstances.length; i++) {
        (function(rds) {
            cw = new CW(amazonConfig);
            async.parallel({
                    CPUUtilization: function (callback) {
                        cw.getUsageMetrics('CPUUtilization','Percent','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    BinLogDiskUsage: function (callback) {
                        cw.getUsageMetrics('BinLogDiskUsage','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    CPUCreditUsage: function (callback) {
                        cw.getUsageMetrics('CPUCreditUsage','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    CPUCreditBalance: function (callback) {
                        cw.getUsageMetrics('CPUCreditBalance','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    DatabaseConnections: function (callback) {
                        cw.getUsageMetrics('DatabaseConnections','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    DiskQueueDepth: function (callback) {
                        cw.getUsageMetrics('DiskQueueDepth','Count','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    FreeableMemory: function (callback) {
                        cw.getUsageMetrics('FreeableMemory','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    FreeStorageSpace: function (callback) {
                        cw.getUsageMetrics('FreeStorageSpace','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    ReplicaLag: function (callback) {
                        cw.getUsageMetrics('ReplicaLag','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    SwapUsage: function (callback) {
                        cw.getUsageMetrics('SwapUsage','Bytes','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    ReadIOPS: function (callback) {
                        cw.getUsageMetrics('ReadIOPS','Count/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    WriteIOPS: function (callback) {
                        cw.getUsageMetrics('WriteIOPS','Count/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    ReadLatency: function (callback) {
                        cw.getUsageMetrics('ReadLatency','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    WriteLatency: function (callback) {
                        cw.getUsageMetrics('WriteLatency','Seconds','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    ReadThroughput: function (callback) {
                        cw.getUsageMetrics('ReadThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    WriteThroughput: function (callback) {
                        cw.getUsageMetrics('WriteThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    NetworkReceiveThroughput: function (callback) {
                        cw.getUsageMetrics('NetworkReceiveThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    },
                    NetworkTransmitThroughput: function (callback) {
                        cw.getUsageMetrics('NetworkTransmitThroughput','Bytes/Second','AWS/RDS',[{Name:'DBInstanceIdentifier',Value:rds.resourceDetails.dbInstanceIdentifier}],startTime, endTime, period, callback);
                    }
                },
                function (err, results) {
                    if(err) {
                        logger.error(err)
                    } else {

                        /* TODO: To split up into different entries.*/
                        /* TODO: startTime and endTime should be got from the response object, not from what we pass.*/

                        /* Currently modifying the start time and end time with the period.
                         * For Example, if the query is to get the data point from 10.00 to 11.00, period is 3600
                         * 		AWS starttime - 10.00 is inclusive and endtime 11.00 is exclusive.
                         * 		We will get a cron for the datapoint at 10.00 [which is nothing but for the period 10.00 to 11.00]
                         * 		Hence the datapoint in the db will be with starttime - 10.00 to endtime - 11.00
                         */
                        var dbEndTime = startTime;
                        var dbStartTime = getStartTime(dbEndTime, period);

                        rdsUsageMetrics.push({
                            providerId: provider._id,
                            providerType: provider.providerType,
                            orgId: provider.orgId[0],
                            resourceId: rds._id,
                            platform: 'AWS',
                            platformId: rds.resourceDetails.dbInstanceIdentifier,
                            resourceType: 'RDS',
                            startTime: dbStartTime,
                            endTime: dbEndTime,
                            interval: period,
                            metrics: results
                        });
                    }
                    if(rdsUsageMetrics.length == rdsWithMetrics) {
                        callback(null, rdsUsageMetrics);
                    }
                });
        })(dbInstances[i]);
    }
};

function getBucketsInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var s3Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region: "us-east-1"
    };
    var s3 = new S3(s3Config);
    s3.getBucketList(function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
        }else{
            var results=[];
            if(data.Buckets.length === 0){
                callback(null,results);
            }else{
                for(var i = 0; i < data.Buckets.length; i++){
                    (function(bucket) {
                        var bucketObj = {
                            masterDetails:{
                                orgId:provider.orgId[0],
                                orgName:orgName
                            },
                            providerDetails:{
                                id: provider._id,
                                type: provider.providerType,
                            },
                            resourceType:"S3",
                            category:"unassigned",
                            resourceDetails:{
                                bucketName: bucket.Name,
                                bucketCreatedOn: Date.parse(bucket.CreationDate),
                                bucketOwnerName: data.Owner.DisplayName,
                                bucketOwnerID: data.Owner.ID,
                                bucketSize:0,
                                bucketSizeUnit:'MegaBytes'
                            }
                        };
                        s3.getBucketSize(bucket.Name, function (err, bucketSize) {
                            if (err) {
                                logger.error(err);
                                callback(err, null);
                            } else {
                                bucketObj.resourceDetails.bucketSize = Math.round(bucketSize);
                                s3.getBucketTag(bucket.Name, function(err,bucketTag){
                                    if (err) {
                                        logger.error(err);
                                        callback(err, null);
                                    } else {
                                        bucketObj.tags = bucketTag;
                                        results.push(bucketObj);
                                        bucketObj={};
                                        if (results.length === data.Buckets.length) {
                                            callback(null, results);
                                        }
                                    }
                                })
                            }
                        })
                    })(data.Buckets[i]);
                }
            }
        }
    })
};

function getEC2InstancesInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var ec2Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey
    };
    var regionCount = 0;
    var regions = appConfig.aws.regions;
    var awsInstanceList=[];
    for (var i = 0; i < regions.length; i++) {
        (function (region) {
            ec2Config.region = region.region;
            var ec2 = new EC2(ec2Config);
            ec2.describeInstances(null, function(err, awsRes) {
                if (err) {
                    logger.error("Unable to fetch instances from aws", err);
                    return;
                }
                var reservations = awsRes.Reservations;
                if(reservations.length >0) {
                    regionCount++;
                    for (var j = 0; j < reservations.length; j++) {
                        if (reservations[j].Instances && reservations[j].Instances.length) {
                            var awsInstances = reservations[j].Instances;
                            for (var k = 0; k < awsInstances.length; k++) {
                                (function (instance) {
                                    var tags = instance.Tags;
                                    var tagInfo = {};
                                    for (var l = 0; l < tags.length; l++) {
                                        var jsonData = tags[l];
                                        tagInfo[jsonData.Key] = jsonData.Value;
                                    }
                                    var instanceObj = {
                                        orgId: provider.orgId[0],
                                        orgName:orgName,
                                        providerId: provider._id,
                                        providerType: 'aws',
                                        providerData: region,
                                        platformId: instance.InstanceId,
                                        ip: instance.PublicIpAddress || null,
                                        hostName:instance.PrivateDnsName,
                                        os: (instance.Platform && instance.Platform === 'windows') ? 'windows' : 'linux',
                                        state: instance.State.Name,
                                        subnetId: instance.SubnetId,
                                        vpcId: instance.VpcId,
                                        privateIpAddress: instance.PrivateIpAddress,
                                        tags:tagInfo,
                                        environmentTag:tagInfo.Environment,
                                        projectTag:tagInfo.Owner
                                    }
                                    awsInstanceList.push(instanceObj);
                                    instanceObj = {};
                                })(awsInstances[k]);
                            }
                        }
                    }
                }else{
                    regionCount++;
                }
                if (regionCount === regions.length) {
                    callback(null, awsInstanceList);
                }
            });
        })(regions[i]);
    }
};

function getRDSInstancesInfo(provider,orgName,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
    var rdsConfig = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region: "us-west-1"
    };
    var rds = new RDS(rdsConfig);
    rds.getRDSDBInstances(function(err,dbInstances){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            var results=[];
            if(dbInstances.length === 0){
                callback(null,results);
                return;
            }else{
                var sysDate=new Date();
                for(var i = 0; i < dbInstances.length; i++){
                    (function(dbInstance) {
                        var rdsDbInstanceObj = {
                            masterDetails:{
                                orgId:provider.orgId[0],
                                orgName:orgName
                            },
                            providerDetails:{
                                id: provider._id,
                                type: provider.providerType
                            },
                            resourceType:"RDS",
                            category:"unassigned",
                            isDeleted:false,
                            resourceDetails: {
                                dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
                                dbName: dbInstance.DBName,
                                dbInstanceClass: dbInstance.DBInstanceClass,
                                dbEngine: dbInstance.Engine,
                                dbInstanceStatus: dbInstance.DBInstanceStatus,
                                dbMasterUserName: dbInstance.MasterUsername,
                                dbEndpoint: dbInstance.Endpoint,
                                dbAllocatedStorage: dbInstance.AllocatedStorage,
                                dbInstanceCreatedOn: dbInstance.InstanceCreateTime ? Date.parse(dbInstance.InstanceCreateTime) : Date.parse(sysDate),
                                preferredBackupWindow: dbInstance.PreferredBackupWindow,
                                backupRetentionPeriod: dbInstance.BackupRetentionPeriod,
                                vpcSecurityGroups: dbInstance.VpcSecurityGroups,
                                dbParameterGroups: dbInstance.DBParameterGroups,
                                preferredMaintenanceWindow: dbInstance.PreferredMaintenanceWindow,
                                region: dbInstance.AvailabilityZone,
                                dbSubnetGroup: dbInstance.DBSubnetGroup,
                                latestRestorableTime: dbInstance.LatestRestorableTime ? Date.parse(dbInstance.LatestRestorableTime) : Date.parse(sysDate),
                                multiAZ: dbInstance.MultiAZ,
                                engineVersion: dbInstance.EngineVersion,
                                autoMinorVersionUpgrade: dbInstance.AutoMinorVersionUpgrade,
                                licenseModel: dbInstance.LicenseModel,
                                optionGroupMemberships: dbInstance.OptionGroupMemberships,
                                publiclyAccessible: dbInstance.PubliclyAccessible,
                                storageType: dbInstance.StorageType,
                                storageEncrypted: dbInstance.StorageEncrypted,
                                dbiResourceId: dbInstance.DbiResourceId,
                                accountNumber: appConfig.aws.s3AccountNumber,
                                caCertificateIdentifier: dbInstance.CACertificateIdentifier
                            }
                        };
                        var params ={
                            ResourceName:'arn:aws:rds:us-west-1:'+appConfig.aws.s3AccountNumber+':db:'+dbInstance.DBInstanceIdentifier
                        };
                        rds.getRDSDBInstanceTag(params,function(err,rdsTags){
                            if(err){
                                logger.error(err);
                            }
                            rdsDbInstanceObj.tags = rdsTags;
                            results.push(rdsDbInstanceObj);
                            rdsDbInstanceObj={};
                            if(dbInstances.length === results.length){
                                callback(null,results);
                            }
                        })

                    })(dbInstances[i]);
                }
            }
        }
    })
};

function getResources(query, next) {
    async.parallel([
            function (callback) {
                resources.getResourcesWithPagination(query, callback);
            }
        ],
        function(err, results) {
            if(err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                next(null, results);
            }
        }
    );
}

function bulkUpdateResourceProviderTags(provider, bulkResources, callback){
    var providerTypes = appConfig.providerTypes;
    if (bulkResources.length > 10) {
        var err = new Error("Invalid request");
        err.status = 400;
        return callback(err);
    } else {
        var unassignedResources = [];
        for (var i = 0; i < bulkResources.length; i++) {
            (function(j) {
                resources.getResourceById(bulkResources[j].id, function(err, unassignedResource) {
                    if (err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (unassignedResource.length === 0) {
                        var err = new Error('Resource not found');
                        err.status = 404;
                        return callback(err);
                    } else if (unassignedResource) {
                        logger.debug('Update tags for resource ', unassignedResource._id);
                        for (tagName in bulkResources[j].tags) {
                            unassignedResource.tags[tagName] = bulkResources[j].tags[tagName];
                        }
                        unassignedResources.push(unassignedResource);
                    }

                    if (j == bulkResources.length - 1) {
                        switch (provider.providerType) {
                            case providerTypes.AWS:
                                logger.debug('Update aws resource tags ', unassignedResources.length);
                                bulkUpdateAWSResourcesTags(provider, unassignedResources, callback);
                                break;
                            default:
                                var err = new Error('Invalid request');
                                err.status = 400;
                                return callback(err);
                                break;
                        }
                    }
                })
            })(i);
        }
    }
}

function bulkUpdateUnassignedResourceTags(bulkResources, callback){
    for (var i = 0; i < bulkResources.length; i++) {
        (function(j) {
            var params = {
                '_id': bulkResources[j].id
            }
            var fields = {
                'tags': bulkResources[j].tags,
                'projectTag' : bulkResources[j].tags['Owner'],
                'environmentTag' :  bulkResources[j].tags['Environment']
            }
            resources.updateResourceTag(params, fields,
                function(err, resourceUpdated) {
                    if (err) {
                        logger.error(err);
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (j == bulkResources.length - 1) {
                        return callback(null, bulkResources);
                    }
                }
            );
        })(i);
    }
};

function bulkUpdateAWSResourcesTags(provider, resources, callback) {
    if(resources.length > 0) {
        if(resources[0].resourceType === 'S3') {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var s3Config = {
                access_key: decryptedAccessKey,
                secret_key: decryptedSecretKey,
                region: "us-east-1"
            };
            var s3 = new S3(s3Config);
            for (var i = 0; i < resources.length; i++) {
                (function (j) {
                    logger.debug('Updating tags for resource ', resources[j]._id);
                    s3.addBucketTag(resources[j].resourceDetails.bucketName, resources[j].tags,
                        function (err, data) {
                            if (err) {
                                logger.error(err);
                                if(err.code === 'AccessDenied'){
                                    var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                                    err.status = 500;
                                    return callback(err);
                                }else {
                                    var err = new Error('Internal server error');
                                    err.status = 500;
                                    return callback(err);
                                }
                            } else if (j == resources.length - 1) {
                                return callback(null, resources);
                            }
                        });
                })(i);
            }
        }else if(resources[0].resourceType === 'RDS') {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var s3Config = {
                access_key: decryptedAccessKey,
                secret_key: decryptedSecretKey,
                region: "us-west-1"
            };
            var rds = new RDS(s3Config);
            for (var i = 0; i < resources.length; i++) {
                (function (j) {
                    logger.debug('Updating tags for resource ', resources[j]._id);
                    rds.addRDSDBInstanceTag(resources[j].resourceDetails.dbInstanceIdentifier, resources[j].tags,
                        function (err, data) {
                            if (err) {
                                logger.error(err);
                                if(err.code === 'AccessDenied'){
                                    var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                                    err.status = 500;
                                    return callback(err);
                                }else {
                                    var err = new Error('Internal server error');
                                    err.status = 500;
                                    return callback(err);
                                }
                            } else if (j == resources.length - 1) {
                                return callback(null, resources);
                            }
                        });
                })(i);
            }
        }else{
            return callback(null, resources);
        }
    }else{
        return callback(null, resources);
    }
}

function getStartTime(endTime, period){
    var startTime = new Date(endTime);
    var subtractedDateInMilliSeconds = startTime.getTime() - (period*1000);
    var subtractedDate = new Date(subtractedDateInMilliSeconds);
    return dateUtil.getDateInUTC(subtractedDate);
}

function updateDomainNameForInstance(domainName,publicIP,instanceId,awsSettings,callback){
    var route53 = new Route53(awsSettings);
    async.waterfall([
        function(next){
            route53.listHostedZones({},next);
        },
        function(hostedZones,next){
            if(hostedZones.HostedZones.length > 0){
                var count = 0,resourceCount = 0;
                var params = {};
                var paramList = [];
                for(var i = 0; i < hostedZones.HostedZones.length; i++) {
                    (function (hostedZone) {
                        count++;
                        route53.listResourceRecordSets({HostedZoneId:hostedZone.Id}, function(err,resourceData) {
                            if(err){
                                next(err,null);
                            }else {
                                for(var j = 0;j < resourceData.ResourceRecordSets.length;j++) {
                                    (function (resourceRecord) {
                                        resourceCount++;
                                        if(resourceRecord.ResourceRecords.length  === 1 && resourceRecord.ResourceRecords[0].Value === publicIP){
                                            params = {
                                                ChangeBatch: {
                                                    Changes: [
                                                        {
                                                            Action: 'UPSERT',
                                                            ResourceRecordSet: {
                                                                Name: domainName+'.rlcatalyst.com.',
                                                                "Type": "CNAME",
                                                                "TTL": 30,
                                                                ResourceRecords: [
                                                                    {
                                                                        "Value": resourceRecord.Name
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                },
                                                HostedZoneId: hostedZone.Id
                                            }
                                            paramList.push(params);
                                        }else{
                                            for(var k = 0; k < resourceRecord.ResourceRecords.length; k++ ){
                                                if(resourceRecord.ResourceRecords[k].Value === publicIP){
                                                    params = {
                                                        ChangeBatch: {
                                                            Changes: [
                                                                {
                                                                    Action: 'UPSERT',
                                                                    ResourceRecordSet: {
                                                                        Name: domainName+'.rlcatalyst.com.',
                                                                        "Type": "CNAME",
                                                                        "TTL": 30,
                                                                        ResourceRecords: [
                                                                            {
                                                                                "Value": resourceRecord.Name
                                                                            }
                                                                        ]
                                                                    }
                                                                }
                                                            ]
                                                        },
                                                        HostedZoneId: hostedZone.Id
                                                    }
                                                    paramList.push(params);
                                                }
                                            }
                                        }
                                    })(resourceData.ResourceRecordSets[j]);
                                }
                                if(count === hostedZones.HostedZones.length && resourceCount === resourceData.ResourceRecordSets.length){
                                    next(null,paramList);
                                }
                            }
                        });
                    })(hostedZones.HostedZones[i]);
                }
            }else{
                next(null,[]);
            }
        },
        function(paramList,next){
            if(paramList.length > 0){
                var count = 0;
                for(var i = 0; i < paramList.length;i++){
                    (function(params){
                        route53.changeResourceRecordSets(params,function(err,data){
                            count++;
                            if(err){
                                next(err,null);
                            }
                            if(count === paramList.length){
                                next(null,paramList);
                            }
                        });
                    })(paramList[i]);

                }
            }else{
                next(null,paramList);
            }
        },
        function(hostedParamList,next){
            if(hostedParamList.length > 0){
                instancesModel.updatedRoute53HostedZoneParam(instanceId,hostedParamList,next);
            }else{
                next(null,hostedParamList);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })
}