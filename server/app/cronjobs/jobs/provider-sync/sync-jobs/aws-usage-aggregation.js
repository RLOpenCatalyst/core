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
var EC2 = require('_pr/lib/ec2.js');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var async = require('async');
var tagsModel = require('_pr/model/tags');

function aggregateAWSUsage() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            aggregateUsageForProvidersOfOrg(...orgs);
        }
    })

}

function aggregateUsageForProvidersOfOrg(org) {
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            aggregateUsageForProvider(...providers);
        }
    });
}

function aggregateUsageForProvider(provider) {
    logger.debug('Usage aggregation for provider: ' + provider._id);

    async.waterfall([
        function (next) {
            getManagedAndUnmanagedInstances(provider, next);
        },
        function(provider, instances, next) {
            logger.debug('Number of instances ' + instances.length);
        }
    ],
    function(err) {
        logger.error(err);
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

function getAWSUsageMetrics(provider, instances) {

}

module.exports = aggregateAWSUsage;