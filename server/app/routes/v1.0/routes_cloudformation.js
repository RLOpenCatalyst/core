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


// This file act as a Controller which contains CFN related all end points.


var CloudFormation = require('_pr/model/cloud-formation');
var errorResponses = require('./error_responses');
var AWSCloudFormation = require('_pr/lib/awsCloudFormation');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var Chef = require('_pr/lib/chef.js');
var containerDao = require('_pr/model/container');
var logsDao = require('_pr/model/dao/logsdao.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var async = require('async');


module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/cloudformation*', sessionVerificationFunc);

    app.get('/cloudformation', function(req, res) {
        async.waterfall([
            function(next){
                apiUtil.queryFilterBy(req.query,next);
            },
            function(filterObj,next){
                CloudFormation.getCloudFormationList(filterObj,next);
            }
        ],function(err,cloudFormationList){
            if(err){
                res.status(500).send(errorResponses.db.error);
                return;
            }else if(cloudFormationList.length > 0){
                res.send(200, cloudFormationList);
            }else{
                res.send(404, {
                    message: "CFT not found"
                })
            }
        });
    });

    app.get('/cloudformation/:cfId', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {
                res.send(200, cloudFormation);

            } else {
                res.send(404, {
                    message: "CFT not found"
                })
            }
        });
    });

    app.get('/cloudformation/:cfId/status', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {
                res.send(200, {
                    status: cloudFormation.status
                });

            } else {
                res.send(404, {
                    message: "CFT not found"
                })
            }
        });
    });

    app.delete('/cloudformation/:cfId', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {
                AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                    if (err) {
                        logger.error("Unable to fetch provide", err);
                        res.status(500).send(errorResponses.db.error);
                    }

                    var awsSettings;
                    if (aProvider.isDefault) {
                        awsSettings = {
                            "isDefault": true,
                            "region": cloudFormation.region
                        };
                    } else {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm,
                            cryptoConfig.password);

                        var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                        awsSettings = {
                            "access_key": decryptedAccessKey,
                            "secret_key": decryptedSecretKey,
                            "region": cloudFormation.region
                        };
                    }

                    var awsCF = new AWSCloudFormation(awsSettings);
                    awsCF.deleteStack(cloudFormation.stackId, function(err, deletedStack) {
                        if (err) {
                            logger.error("Unable to delete stack from aws", err);
                            res.status(500).send({
                                // message: "Unable to delete stack from aws " + "ERROR: " + err.message
                                message: err.message
                            });
                            return;
                        }
                        configmgmtDao.getChefServerDetails(cloudFormation.infraManagerId, function(err, chefDetails) {
                            if (err) {
                                logger.debug("Failed to fetch ChefServerDetails ", err);
                                res.status(500).send(errorResponses.chef.corruptChefData);
                                return;
                            }
                            var chef = new Chef({
                                userChefRepoLocation: chefDetails.chefRepoLocation,
                                chefUserName: chefDetails.loginname,
                                chefUserPemFile: chefDetails.userpemfile,
                                chefValidationPemFile: chefDetails.validatorpemfile,
                                hostedChefUrl: chefDetails.url,
                            });
                            instancesDao.getInstancesByCloudformationId(cloudFormation.id, function(err, instances) {
                                if (err) {
                                    res.status(500).send(errorResponses.db.error);
                                    return;
                                }
                                var instanceIds = [];
                                if(instances.length > 0) {
                                    for (var i = 0; i < instances.length; i++) {
                                        (function(instance) {
                                            instanceIds.push(instance.id);
                                            chef.deleteNode(instance.chef.chefNodeName, function (err, nodeData) {
                                                if (err) {
                                                    logger.debug("Failed to delete node ", err);
                                                    return;
                                                }
                                                logger.debug("Successfully removed instance from chef Server.");
                                            });
                                            containerDao.deleteContainerByInstanceId(instance.id, function (err, container) {
                                                if (err) {
                                                    logger.error("Container deletion Failed >> ", err);
                                                    return;
                                                }
                                            });
                                            var instanceLog = {
                                                actionId: "",
                                                instanceId: instance._id,
                                                orgName: instance.orgName,
                                                bgName: instance.bgName,
                                                projectName: instance.projectName,
                                                envName: instance.environmentName,
                                                status: 'shutting-down',
                                                actionStatus: "pending",
                                                platformId: instance.platformId,
                                                blueprintName: instance.blueprintData.blueprintName,
                                                data: instance.runlist,
                                                platform: instance.hardware.platform,
                                                os: instance.hardware.os,
                                                size: instance.instanceType,
                                                user: req.session.user.cn,
                                                createdOn: new Date().getTime(),
                                                startedOn: new Date().getTime(),
                                                providerType: instance.providerType,
                                                action: "Shutting-Down",
                                                logs: []
                                            };
                                            var timestampStarted = new Date().getTime();
                                            var actionLog = instancesDao.insertDeleteActionLog(instance._id, req.session.user.cn, timestampStarted);
                                            var logReferenceIds = [instance._id];
                                            if (actionLog) {
                                                logReferenceIds.push(actionLog._id);
                                            }
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: false,
                                                log: "Instance Shutting-Down",
                                                timestamp: timestampStarted
                                            });
                                            instanceLog.actionId = actionLog._id;
                                            instanceLog.logs = {
                                                err: false,
                                                log: "Instance Shutting-Down",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            instancesDao.updateInstanceStatus(instance._id, instanceLog, function(err, instanceData) {
                                                if (err) {
                                                    logger.error("Failed to update instance: ", err);
                                                }
                                            });
                                        })(instances[i]);
                                    }
                                }
                                CloudFormation.removeCloudFormationById(cloudFormation.id, function(err, softDeletedStack) {
                                    if (err) {
                                        logger.error("Unable to delete stack from db", err);
                                        res.status(500).send({
                                            message: "Unable to delete stack from db"
                                        });
                                        return;
                                    }
                                    var resourceObj = {
                                        stackStatus:"DELETED"
                                    }
                                    var resourceMapService = require('_pr/services/resourceMapService.js');
                                    resourceMapService.updateResourceMap(cloudFormation.stackName,resourceObj,function(err,resourceMap){
                                        if(err){
                                            logger.error("Error in updating Resource Map.",err);
                                        }
                                    });
                                    res.send(200, {
                                        message: "deleted",
                                        instanceIds: instanceIds
                                    });
                                });
                            });
                        });
                    });
                });
            } else {
                res.send(404, {
                    message: "Not Found"
                })
            }
        });
    });

    app.get('/cloudformation/:cfId/instances', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {
                instancesDao.getInstancesByCloudformationId(cloudFormation.id, function(err, instances) {
                    if (err) {
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    res.send(200, instances);
                });
            } else {
                res.send(404, {
                    message: "stack not found"
                });
            }

        });
    });

    app.get('/cloudformation/:cfId/events', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {
                AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                    if (err) {
                        logger.error("Unable to fetch provider", err);
                        res.status(500).send(errorResponses.db.error);
                    }

                    var awsSettings;
                    if (aProvider.isDefault) {
                        awsSettings = {
                            "isDefault": true,
                            "region": cloudFormation.region
                        };
                    } else {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm,
                            cryptoConfig.password);

                        var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                        awsSettings = {
                            "access_key": decryptedAccessKey,
                            "secret_key": decryptedSecretKey,
                            "region": cloudFormation.region
                        };
                    }

                    var awsCF = new AWSCloudFormation(awsSettings);
                    awsCF.getAllStackEvents(cloudFormation.stackId, function(err, data) {
                        if (err) {
                            res.status(500).send({
                                // message: "Failed to fetch stack events from aws ERROR: " + err.message
                                message: err.message
                            });
                            return;
                        }
                        res.send(200, data);
                    });
                });
            } else {
                res.send(404, {
                    message: "stack not found"
                });
            }

        });
    });

    app.get('/cloudformation/:cfId/resources', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (cloudFormation) {

                AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                    if (err) {
                        logger.error("Unable to fetch provide", err);
                        res.status(500).send(errorResponses.db.error);
                    }

                    var awsSettings;
                    if (aProvider.isDefault) {
                        awsSettings = {
                            "isDefault": true,
                            "region": cloudFormation.region
                        };
                    } else {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm,
                            cryptoConfig.password);

                        var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                        awsSettings = {
                            "access_key": decryptedAccessKey,
                            "secret_key": decryptedSecretKey,
                            "region": cloudFormation.region
                        };
                    }

                    var awsSettings = {
                        "access_key": decryptedKeys[0],
                        "secret_key": decryptedKeys[1],
                        "region": cloudFormation.region,
                    };
                    var awsCF = new AWSCloudFormation(awsSettings);
                    awsCF.listAllStackResources(cloudFormation.stackId, function(err, resources) {
                        if (err) {
                            logger.error("Unable to fetch provide", err);
                            message: err.message
                        }
                        res.send(200, resources);

                    });
                });

            }
        });

    });
};
