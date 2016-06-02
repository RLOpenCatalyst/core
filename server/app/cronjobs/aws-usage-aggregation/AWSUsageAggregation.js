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
var appConfig = require('_pr/config');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var CW = require('_pr/lib/cloudwatch.js');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var resourceMetricsModel = require('_pr/model/resource-metrics');
var instanceService = require('_pr/services/instanceService');
var async = require('async');
var awsService = require('_pr/services/awsService');

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
    async.waterfall([
            function (next) {
                logger.debug('EC2 usage aggregation for provider: ' + provider._id + ' started');
                instanceService.getTrackedInstancesForProvider(provider, next);
            },
            function (provider, instances, next) {
                async.parallel({
                    managed: function(callback) {
                        generateEC2UsageMetricsForProvider(provider, instances.managed, callback);
                    },
                    unmanaged: function(callback) {
                        generateEC2UsageMetricsForProvider(provider, instances.unmanaged, callback);
                    },
                    s3BucketUsageMetrics: function(callback) {
                        generateS3UsageMetricsForProvider(provider, callback);
                    }
                }, function(err, results){
                    if(err) {
                        next(err);
                    } else {
                        next(null, results);
                    }
                });
            },
            function(usageMetrics, next) {
                async.parallel({
                    managed: function(callback) {
                        updateManagedInstanceUsage(usageMetrics.managed, callback);
                    },
                    unmanaged: function(callback) {
                        updateUnmanagedInstanceUsage(usageMetrics.unmanaged, callback);
                    }
                }, function(err, results){
                    if(err) {
                        next(err);
                    } else {
                        next(null, results);
                    }
                });
            }
        ],
        function(err, results) {
            if(err)
                logger.error(err);
            else if(results)
                logger.debug('EC2 usage aggregation for provider: ' + provider._id + ' ended');
        });
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
            awsService.getEC2InstanceUsageMetrics(provider, instances, next);
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
            awsService.getBucketsInfo(provider,next);
        },
        function(bucketData,next){
            awsService.getS3BucketsMetrics(provider,bucketData.Buckets,next);
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

function formatUsageData(instanceUsageMetrics, next) {
    var metricsDisplayUnits = appConfig.aws.cwMetricsDisplayUnits;

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
}