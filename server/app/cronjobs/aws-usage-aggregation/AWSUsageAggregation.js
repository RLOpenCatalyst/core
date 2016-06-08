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
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var resourceMetricsModel = require('_pr/model/resource-metrics');
var instanceService = require('_pr/services/instanceService');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var resources = require('_pr/model/resources/resources');

var AggregateAWSUsage = Object.create(CatalystCronJob);
AggregateAWSUsage.interval = '*/5 * * * *';
AggregateAWSUsage.execute = aggregateAWSUsage;

module.exports = AggregateAWSUsage;

/**
 *
 */
function aggregateAWSUsage() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            aggregateUsageForProvidersOfOrg.apply(aggregateUsageForProvidersOfOrg, orgs);
        }
    });
}

/**
 *
 * @param org
 */
function aggregateUsageForProvidersOfOrg(org) {
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            aggregateEC2UsageForProvider.apply(aggregateEC2UsageForProvider, providers);
        }
    });
}

/**
 *
 * @param provider
 */
function aggregateEC2UsageForProvider(provider) {
    if(provider._id) {
        async.waterfall([
                function (next) {
                    logger.debug('AWS Service usage aggregation for provider: ' + provider._id + ' started');
                    instanceService.getTrackedInstancesForProvider(provider, next);
                },
                function (provider, instances, next) {
                    async.parallel({
                        managed: function (callback) {
                            generateEC2UsageMetricsForProvider(provider, instances.managed, callback);
                        },
                        unmanaged: function (callback) {
                            generateEC2UsageMetricsForProvider(provider, instances.unmanaged, callback);
                        },
                        s3BucketUsageMetrics: function (callback) {
                            generateS3UsageMetricsForProvider(provider, callback);
                        },
                        rdsUsageMetrics: function (callback) {
                            generateRDSUsageMetricsForProvider(provider, callback);
                        }
                    }, function (err, results) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, results);
                        }
                    });
                },
                function (usageMetrics, next) {
                    async.parallel({
                        managed: function (callback) {
                            updateManagedInstanceUsage(usageMetrics.managed, callback);
                        },
                        unmanaged: function (callback) {
                            updateUnmanagedInstanceUsage(usageMetrics.unmanaged, callback);
                        },
                        s3BucketUsageMetrics: function (callback) {
                            updateResourceUsage(usageMetrics.s3BucketUsageMetrics, callback);
                        },
                        rdsUsageMetrics: function (callback) {
                            updateResourceUsage(usageMetrics.rdsUsageMetrics, callback);
                        }
                    }, function (err, results) {
                        if (err) {
                            next(err);
                        } else {
                            next(null, results);
                        }
                    });
                }
            ],
            function (err, results) {
                if (err)
                    logger.error(err);
                else if (results)
                    logger.debug('AWS Service usage aggregation for provider: ' + provider._id + ' ended');
            });
    }else{
        logger.debug("Please configure Provider for Resources Usage");
    }
}

/**
 *
 * @param provider
 * @param instances
 * @param callback
 */
function generateEC2UsageMetricsForProvider(provider, instances, callback) {
    async.waterfall([
        function (next) {
            resourceService.getEC2InstanceUsageMetrics(provider, instances, next);
        },
        function (ec2UsageMetrics, next) {
            saveResourceUsageMetrics(ec2UsageMetrics, next);
        }
    ], function (err, results) {
        if (err) {
            callback(err);
        } else {
            callback(null, results);
        }
    });
}

function generateS3UsageMetricsForProvider(provider, callback) {
    async.waterfall([
        function(next){
            resources.getResourcesByProviderResourceType(provider._id,'S3',next);
        },
        function(bucketData,next){
            resourceService.getS3BucketsMetrics(provider,bucketData,next);
        },
        function(bucketMetrics,next){
            saveResourceUsageMetrics(bucketMetrics,next);
        }
    ], function(err, results) {
        if(err) {
            callback(err);
        } else {
            callback(null, results);
        }
    });
}

function generateRDSUsageMetricsForProvider(provider, callback) {
    async.waterfall([
        function(next){
            resources.getResourcesByProviderResourceType(provider._id,'RDS',next);
        },
        function(dbInstances,next){
            resourceService.getRDSDBInstanceMetrics(provider,dbInstances,next);
        },
        function(rdsUsageMetrics,next){
            saveResourceUsageMetrics(rdsUsageMetrics,next);
        }
    ], function(err, results) {
        if(err) {
            callback(err);
        } else {
            callback(null, results);
        }
    });
}

/**
 *
 * @param resourceMetrics
 * @param next
 */
function saveResourceUsageMetrics (resourceMetrics, next) {
    var results = [];

    if(resourceMetrics.length == 0)
        return next(null, results);

    for(var i = 0; i < resourceMetrics.length; i++) {
        (function(j) {
            resourceMetricsModel.createNew(resourceMetrics[j],
                function(err, resourceMetricsObj) {
                    if(err)
                        next(err);
                    else
                        results.push(resourceMetricsObj);

                    if(results.length == resourceMetrics.length)
                        next(null, results);
                }
            );
        })(i);
    };
}

/**
 *
 * @param instanceUsageMetrics
 * @param next
 */
function updateManagedInstanceUsage(instanceUsageMetrics, next) {
    var results = [];
    if(instanceUsageMetrics.length == 0)
        return next(null, results);

    // @TODO get rid of nesting
    for(var i = 0; i < instanceUsageMetrics.length; i++) {
        (function (j) {
            formatUsageData(instanceUsageMetrics[j], function(err, formattedUsageMetrics) {
                if (err) {
                    next(err);
                } else {
                    instancesModel.updateInstanceUsage(formattedUsageMetrics.resourceId,
                        formattedUsageMetrics.metrics, function (err, result) {
                            if (err)
                                next(err);
                            else
                                results.push(result);

                            if (results.length == instanceUsageMetrics.length)
                                next(null, results);
                        }
                    );
                }
            });
        })(i);
    };
}

/**
 *
 * @param instanceUsageMetrics
 * @param next
 */
function updateUnmanagedInstanceUsage(instanceUsageMetrics, next) {
    var results = [];
    if(instanceUsageMetrics.length == 0)
        return next(null, results);
    // @TODO get rid of nesting
    for(var i = 0; i < instanceUsageMetrics.length; i++) {
        (function (j) {
            formatUsageData(instanceUsageMetrics[j], function(err, formattedUsageMetrics) {
                if(err) {
                    next(err);
                } else {
                    unManagedInstancesModel.updateUsage(formattedUsageMetrics.resourceId,
                        formattedUsageMetrics.metrics, function(err, result) {
                            if(err)
                                next(err);
                            else
                                results.push(result);

                            if(results.length == instanceUsageMetrics.length)
                                next(null, results);
                        }
                    );
                }
            });
        })(i);
    };
}


function updateResourceUsage(resourcesUsageMetrics,next){
    var results = [];
    if(resourcesUsageMetrics.length == 0)
        return next(null, results);
    // @TODO get rid of nesting
    for(var i = 0; i < resourcesUsageMetrics.length; i++) {
        (function (j) {
            formatUsageData(resourcesUsageMetrics[j], function(err, formattedUsageMetrics) {
                if(err) {
                    next(err);
                } else {
                    resources.updateResourceUsage(formattedUsageMetrics.resourceId,
                        formattedUsageMetrics.metrics, function(err, result) {
                            if(err)
                                next(err);
                            else
                                results.push(result);
                            if(results.length == resourcesUsageMetrics.length)
                                next(null, results);
                        }
                    );
                }
            });
        })(i);
    };
};


function formatUsageData(instanceUsageMetrics, next) {
    var metricsDisplayUnits = appConfig.aws.cwMetricsDisplayUnits;
    if(instanceUsageMetrics.resourceType === 'EC2') {
        instanceUsageMetrics.metrics.CPUUtilization.unit = metricsDisplayUnits.CPUUtilization;
        instanceUsageMetrics.metrics.DiskReadBytes.unit = metricsDisplayUnits.DiskReadBytes;
        instanceUsageMetrics.metrics.DiskWriteBytes.unit = metricsDisplayUnits.DiskWriteBytes;
        instanceUsageMetrics.metrics.NetworkIn.unit = metricsDisplayUnits.NetworkIn;
        instanceUsageMetrics.metrics.NetworkOut.unit = metricsDisplayUnits.NetworkOut;

        instanceUsageMetrics.metrics.CPUUtilization.average
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.average);
        instanceUsageMetrics.metrics.CPUUtilization.minimum
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.minimum);
        instanceUsageMetrics.metrics.CPUUtilization.maximum
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.maximum);

        next(null, instanceUsageMetrics);
    }else if(instanceUsageMetrics.resourceType === 'S3') {
        instanceUsageMetrics.metrics.BucketSizeBytes.unit = 'Bytes';
        instanceUsageMetrics.metrics.NumberOfObjects.unit = 'Count';
        next(null, instanceUsageMetrics);
    }else if(instanceUsageMetrics.resourceType === 'RDS') {
        instanceUsageMetrics.metrics.CPUUtilization.unit = 'Percent';
        instanceUsageMetrics.metrics.BinLogDiskUsage.unit = 'Bytes';
        instanceUsageMetrics.metrics.CPUCreditUsage.unit = 'Count';
        instanceUsageMetrics.metrics.CPUCreditBalance.unit = 'Count';
        instanceUsageMetrics.metrics.DatabaseConnections.unit = 'Count';
        instanceUsageMetrics.metrics.DiskQueueDepth.unit = 'Count';
        instanceUsageMetrics.metrics.FreeableMemory.unit = 'Bytes';
        instanceUsageMetrics.metrics.FreeStorageSpace.unit = 'Bytes';
        instanceUsageMetrics.metrics.ReplicaLag.unit = 'Seconds';
        instanceUsageMetrics.metrics.SwapUsage.unit = 'Bytes';
        instanceUsageMetrics.metrics.ReadIOPS.unit = 'Count/Second';
        instanceUsageMetrics.metrics.WriteIOPS.unit = 'Count/Second';
        instanceUsageMetrics.metrics.ReadLatency.unit = 'Seconds';
        instanceUsageMetrics.metrics.WriteLatency.unit = 'Seconds';
        instanceUsageMetrics.metrics.ReadThroughput.unit = 'Bytes/Second';
        instanceUsageMetrics.metrics.WriteThroughput.unit = 'Bytes/Second';
        instanceUsageMetrics.metrics.NetworkReceiveThroughput.unit = 'Bytes/Second';
        instanceUsageMetrics.metrics.NetworkTransmitThroughput.unit = 'Bytes/Second';

        instanceUsageMetrics.metrics.CPUUtilization.average
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.average);
        instanceUsageMetrics.metrics.CPUUtilization.minimum
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.minimum);
        instanceUsageMetrics.metrics.CPUUtilization.maximum
            = Math.round(instanceUsageMetrics.metrics.CPUUtilization.maximum);
        next(null, instanceUsageMetrics);
    }
}