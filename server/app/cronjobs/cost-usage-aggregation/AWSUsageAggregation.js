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

var AggregateAWSUsage = Object.create(CatalystCronJob);
AggregateAWSUsage.interval = '0 * * * *';
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
            getEC2InstanceUsageMetrics(provider, instances, next);
        },
        function (ec2UsageMetrics, next) {
            saveResourceUsageMetrics(ec2UsageMetrics, next);
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
 * @param provider
 * @param instances
 * @param next
 */
function getEC2InstanceUsageMetrics(provider, instances, next) {
    var metricsUnits = appConfig.aws.cwMetricsUnits;
    var instanceUsageMetrics = [];

    if(instances.length == 0)
        next(null, instanceUsageMetrics);

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

    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 1000*60*60*24);
    for(var i = 0; i < instances.length; i++) {
        (function(j) {
            amazonConfig.region = instances[j].providerData.region;
            cw = new CW(amazonConfig);

            async.parallel({
                CPUUtilization: function (callback) {
                    cw.getUsageMetrics('CPUUtilization', metricsUnits.CPUUtilization,
                        instances[j].platformId, startTime, endTime, callback);
                },
                NetworkOut: function (callback) {
                    cw.getUsageMetrics('NetworkOut', metricsUnits.NetworkOut,
                        instances[j].platformId, startTime, endTime, callback);
                },
                NetworkIn: function (callback) {
                    cw.getUsageMetrics('NetworkIn', metricsUnits.NetworkIn,
                        instances[j].platformId, startTime, endTime, callback);
                },
                DiskReadBytes: function (callback) {
                    cw.getUsageMetrics('DiskReadBytes', metricsUnits.DiskReadBytes,
                        instances[j].platformId, startTime, endTime, callback);
                },
                DiskWriteBytes: function (callback) {
                    cw.getUsageMetrics('DiskWriteBytes', metricsUnits.DiskWriteBytes,
                        instances[j].platformId, startTime, endTime, callback);
                }
            },
            function (err, results) {
                if(err) {
                    logger.error(err)
                } else {
                    instanceUsageMetrics.push({
                        providerId: provider._id,
                        providerType: provider.providerType,
                        orgId: provider.orgId[0],
                        projectId: instances[j].projectId,
                        instanceId: instances[j]._id,
                        platform: 'AWS',
                        platformId: instances[j].platformId,
                        resourceType: 'EC2',
                        startTime: startTime,
                        endTime: endTime,
                        metrics: results
                    });
                }

                if(instanceUsageMetrics.length == instances.length)
                    next(null, instanceUsageMetrics);
            });
        })(i);
    }
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
                    instancesModel.updateInstanceUsage(formattedUsageMetrics.instanceId,
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
                    unManagedInstancesModel.updateUsage(formattedUsageMetrics.instanceId,
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