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
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var CW = require('_pr/lib/cloudwatch.js');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var resourceMetricsModel = require('_pr/model/resource-metrics');
var async = require('async');

module.exports = aggregateAWSUsage;

function aggregateAWSUsage() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            aggregateUsageForProvidersOfOrg(...orgs);
        }
    });
}

function aggregateUsageForProvidersOfOrg(org) {
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            aggregateEC2UsageForProvider(...providers);
        }
    });
}

function aggregateEC2UsageForProvider(provider) {
    async.waterfall([
        function (next) {
            logger.debug('Usage aggregation for provider: ' + provider._id + ' started');
            getManagedAndUnmanagedInstances(provider, next);
        },
        function (provider, instances, next) {
            getEC2InstanceUsageMetrics(provider, instances, next);
        },
        function (ec2UsageMetrics, next) {
            saveResourceUsageMetrics(ec2UsageMetrics, next);
        }
    ],
    function(err, results) {
        if(err)
            logger.error(err);
        else if(results)
            logger.debug('Usage aggregation for provider: ' + provider._id + ' ended');
    });
}

function getManagedAndUnmanagedInstances(provider, next) {
    async.parallel([
            function(callback) {
                unManagedInstancesModel.getByProviderId({
                        providerId: provider._id,
                    },
                    callback);
            },
            function (callback) {
                instancesModel.getInstanceByProviderId(
                    provider._id,
                    callback);
            }
        ],
        function(err, results) {
            if(err) {
                next(err)
            } else {
                var instances = results.reduce(function(a, b) {
                    return a.concat(b);
                }, []);
                next(null, provider, instances);
            }
        }
    );
}

function getEC2InstanceUsageMetrics(provider, instances, next) {
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

    var instanceUsageMetrics = [];
    var endTime = new Date();
    var startTime = new Date(endTime.getTime() - 1000*60*60*24);
    for(var i = 0; i < instances.length; i++) {
        (function(j) {
            amazonConfig.region = instances[j].providerData.region;
            cw = new CW(amazonConfig);

            async.parallel({
                CPUUtilization: function (callback) {
                    cw.getUsageMetricsFor24Hours('CPUUtilization', instances[j].platformId,
                        startTime, endTime, callback);
                },
                NetworkOut: function (callback) {
                    cw.getUsageMetricsFor24Hours('NetworkOut', instances[j].platformId,
                        startTime, endTime, callback);
                },
                NetworkIn: function (callback) {
                    cw.getUsageMetricsFor24Hours('NetworkIn', instances[j].platformId,
                        startTime, endTime, callback);
                },
                DiskReadBytes: function (callback) {
                    cw.getUsageMetricsFor24Hours('DiskReadBytes', instances[j].platformId,
                        startTime, endTime, callback);
                },
                DiskWriteBytes: function (callback) {
                    cw.getUsageMetricsFor24Hours('DiskWriteBytes', instances[j].platformId,
                        startTime, endTime, callback);
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

                    if(instanceUsageMetrics.length == instances.length) {
                        next(null, instanceUsageMetrics);
                    }
                }
            });
        })(i);
    }
}

function saveResourceUsageMetrics (resourceMetrics, next) {
    var results = [];
    for(var i = 0; i < resourceMetrics.length; i++) {
        (function(j) {
            resourceMetricsModel.createNew(resourceMetrics[j],
                function(err, resourceMetricsObj) {
                    if(err) {
                        next(err);
                    } else {
                        results.push(resourceMetricsObj);
                    }

                    if(results.length == resourceMetrics.length) {
                        next(null, results);
                    }
                }
            );
        })(i);
    };
}