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

var AzureArm = require('_pr/model/azure-arm');
var errorResponses = require('./error_responses');
var AWSCloudFormation = require('_pr/lib/awsCloudFormation');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var Chef = require('_pr/lib/chef.js');
var ARM = require('_pr/lib/azure-arm.js');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var azureTemplateFunctionEvaluater = require('_pr/lib/azureTemplateFunctionEvaluater');
var logsDao = require('_pr/model/dao/logsdao.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var async = require('async');


module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/azure-arm*', sessionVerificationFunc);

    app.get('/azure-arm', function(req, res) {
        async.waterfall([
            function(next){
                apiUtil.queryFilterBy(req.query,next);
            },
            function(filterObj,next){
                AzureArm.getAzureArmList(filterObj,next);
            }
        ],function(err,azureArmList){
            if(err){
                res.status(500).send(errorResponses.db.error);
                return;
            }else if(azureArmList.length > 0){
                res.send(200, azureArmList);
            }else{
                res.send(404, {
                    message: "AzureArm is not found"
                })
            }
        });
    });

    app.post('/azure-arm/evaluateVMs', function(req, res) {

        var parameters = req.body.parameters;
        var variables = req.body.variables;
        var vms = req.body.vms;

        var evaluatedVMS = [];

        for (var i = 0; i < vms.length; i++) {
            if (vms[i].copy) { // has copy
                var count = azureTemplateFunctionEvaluater.evaluate(vms[i].copy.count, parameters, variables);
                for (var j = 1; j <= count; j++) {
                    var vm = {};
                    var vmName = azureTemplateFunctionEvaluater.evaluate(vms[i].name, parameters, variables, j);
                    vm.name = vmName;
                    var properties = vms[i].properties;
                    if (properties && properties.osProfile) {
                        vm.username = azureTemplateFunctionEvaluater.evaluate(properties.osProfile.adminUsername, parameters, variables, j);
                        vm.password = azureTemplateFunctionEvaluater.evaluate(properties.osProfile.adminPassword, parameters, variables, j)
                    }
                    evaluatedVMS.push(vm);

                }

            } else {
                var vm = {};
                var vmName = azureTemplateFunctionEvaluater.evaluate(vms[i].name, parameters, variables);
                vm.name = vmName;
                var properties = vms[i].properties;
                if (properties && properties.osProfile) {
                    vm.username = azureTemplateFunctionEvaluater.evaluate(properties.osProfile.adminUsername, parameters, variables);
                    vm.password = azureTemplateFunctionEvaluater.evaluate(properties.osProfile.adminPassword, parameters, variables)
                }
                evaluatedVMS.push(vm);
            }
        }

        res.status(200).send(evaluatedVMS);
    });

    app.get('/azure-arm/:providerId/resourceGroups', function(req, res) {
        azureProvider.getAzureCloudProviderById(req.params.providerId, function(err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ' + err);
                return;
            }
            providerdata = JSON.parse(providerdata);
            var settings = appConfig;
            var pemFile = settings.instancePemFilesDir + providerdata._id +'_' + providerdata.pemFileName;
            var keyFile = settings.instancePemFilesDir + providerdata._id +'_' + providerdata.keyFileName;
            logger.debug("pemFile path:", pemFile);
            logger.debug("keyFile path:", pemFile);
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var uniqueVal = uuid.v4().split('-')[0];
            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function(err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    return;
                }
                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function(err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        return;
                    }
                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile,
                        clientId: providerdata.clientId,
                        clientSecret: providerdata.clientSecret,
                        tenant: providerdata.tenant
                    };
                    var arm = new ARM(options);
                    arm.getResourceGroups(function(err, body) {
                        if (err) {
                            res.status(500).send(err);
                            apiUtil.removeFile(decryptedPemFile);
                            apiUtil.removeFile(decryptedKeyFile);
                            return;
                        }else {
                            apiUtil.removeFile(decryptedPemFile);
                            apiUtil.removeFile(decryptedKeyFile);
                            res.status(200).send(body);
                            return;
                        }
                    });
                });
            });
        });
    });

    app.post('/azure-arm/:providerId/resourceGroups', function(req, res) {
        azureProvider.getAzureCloudProviderById(req.params.providerId, function(err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ' + err);
                return;
            }
            providerdata = JSON.parse(providerdata);
            var settings = appConfig;
            var pemFile = settings.instancePemFilesDir + providerdata._id  +'_' + providerdata.pemFileName;
            var keyFile = settings.instancePemFilesDir + providerdata._id  +'_' + providerdata.keyFileName;
            logger.debug("pemFile path:", pemFile);
            logger.debug("keyFile path:", pemFile);
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var uniqueVal = uuid.v4().split('-')[0];
            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function(err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    return;
                }
                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function(err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        return;
                    }
                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile,
                        clientId: providerdata.clientId,
                        clientSecret: providerdata.clientSecret,
                        tenant: providerdata.tenant
                    };
                    var arm = new ARM(options);
                    arm.createResourceGroup(req.body.name, function(err, body) {
                        if (err) {
                            res.status(500).send(err);
                            apiUtil.removeFile(decryptedPemFile);
                            apiUtil.removeFile(decryptedKeyFile);
                            return;
                        }else {
                            res.status(200).send(body);
                            apiUtil.removeFile(decryptedPemFile);
                            apiUtil.removeFile(decryptedKeyFile);
                            return;
                        }
                    });
                });
            });
        });
    });

    app.get('/azure-arm/:armId', function(req, res) {
        AzureArm.getById(req.params.armId, function(err, azureArm) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (azureArm) {
                res.status(200).send(azureArm);

            } else {
                res.status(404).send({
                    message: "Not Found"
                });
            }
        });
    });


    app.get('/azure-arm/:armId/status', function(req, res) {
        AzureArm.getById(req.params.armId, function(err, azureArm) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (azureArm) {
                res.status(200).send({
                    status: azureArm.status
                });

            } else {
                res.status(404).send({
                    message: "Not Found"
                });
            }
        });
    });

    app.delete('/azure-arm/:armId', function(req, res) {
        AzureArm.getById(req.params.armId, function(err, azureArm) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (azureArm) {
                azureProvider.getAzureCloudProviderById(azureArm.cloudProviderId, function(err, providerdata) {
                    if (err) {
                        logger.error("Unable to fetch provider", err);
                        res.send(500, errorResponses.db.error);
                        return;
                    }
                    providerdata = JSON.parse(providerdata);
                    var settings = appConfig;
                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        clientId: providerdata.clientId,
                        clientSecret: providerdata.clientSecret,
                        tenant: providerdata.tenant
                    };
                    var arm = new ARM(options);
                    arm.deleteDeployedTemplate({
                        name: azureArm.deploymentName,
                        resourceGroup: azureArm.resourceGroup
                    }, function(error, body) {
                        if (error.code !== 409 || error.code !== '409') {
                            res.send(error);
                            return;
                        }else {
                            configmgmtDao.getChefServerDetails(azureArm.infraManagerId, function (err, chefDetails) {
                                if (err) {
                                    logger.debug("Failed to fetch ChefServerDetails ", err);
                                    res.send(500, errorResponses.chef.corruptChefData);
                                    return;
                                }
                                var chef = new Chef({
                                    userChefRepoLocation: chefDetails.chefRepoLocation,
                                    chefUserName: chefDetails.loginname,
                                    chefUserPemFile: chefDetails.userpemfile,
                                    chefValidationPemFile: chefDetails.validatorpemfile,
                                    hostedChefUrl: chefDetails.url,
                                });
                                instancesDao.getInstancesByARMId(azureArm.id, function (err, instances) {
                                    if (err) {
                                        res.send(500, errorResponses.db.error);
                                        return;
                                    }
                                    var instanceIds = [];
                                    for (var i = 0; i < instances.length; i++) {
                                        instanceIds.push(instances[i].id);
                                        chef.deleteNode(instances[i].chef.chefNodeName, function (err, nodeData) {
                                            if (err) {
                                                logger.debug("Failed to delete node ", err);
                                                if (err.chefStatusCode && err.chefStatusCode === 404) {
                                                    res.send(404, errorResponses.db.error);
                                                    return;
                                                } else {
                                                    res.send(500, errorResponses.db.error);
                                                    return;
                                                }
                                            }
                                            logger.debug("Successfully removed instance from db.");
                                        });
                                        var instanceLog = {
                                            actionId: "",
                                            instanceId: instances[i]._id,
                                            orgName: instances[i].orgName,
                                            bgName: instances[i].bgName,
                                            projectName: instances[i].projectName,
                                            envName: instances[i].environmentName,
                                            status: instances[i].instanceState,
                                            actionStatus: "success",
                                            platformId: instances[i].platformId,
                                            blueprintName: instances[i].blueprintData.blueprintName,
                                            data: instances[i].runlist,
                                            platform: instances[i].hardware.platform,
                                            os: instances[i].hardware.os,
                                            size: instances[i].instanceType,
                                            user: req.session.user.cn,
                                            createdOn: new Date().getTime(),
                                            startedOn: new Date().getTime(),
                                            providerType: instances[i].providerType,
                                            action: "Deleted",
                                            logs: []
                                        };
                                        var timestampStarted = new Date().getTime();
                                        var actionLog = instancesDao.insertDeleteActionLog(instances[i]._id, req.session.user.cn, timestampStarted);
                                        var logReferenceIds = [instances[i]._id];
                                        if (actionLog) {
                                            logReferenceIds.push(actionLog._id);
                                        }
                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: false,
                                            log: "Instance Deleted",
                                            timestamp: timestampStarted
                                        });
                                        instanceLog.actionId = actionLog._id;
                                        instanceLog.logs = {
                                            err: false,
                                            log: "Instance Deleted",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, instances[i]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                    }
                                    instancesDao.removeInstancebyArmId(azureArm.id, function (err, deletedData) {
                                        if (err) {
                                            logger.error("Unable to delete stack instances from db", err);
                                            res.send(500, {
                                                message: "Unable to delete stack from azure"
                                            });
                                            return;
                                        }
                                        AzureArm.removeArmAzureById(azureArm.id, function (err, deletedStack) {
                                            if (err) {
                                                logger.error("Unable to delete stack from db", err);
                                                res.send(500, {
                                                    message: "Unable to delete stack from db"
                                                });
                                                return;
                                            }
                                            var resourceObj = {
                                                stackStatus: "DELETED",
                                            }
                                            var resourceMapService = require('_pr/services/resourceMapService.js');
                                            resourceMapService.updateResourceMap(azureArm.deploymentName, resourceObj, function (err, resourceMap) {
                                                if (err) {
                                                    logger.error("Error in updating Resource Map.", err);
                                                }
                                            });
                                            if(error.code === 409 || error.code === '409'){
                                                res.send(error);
                                                return;
                                            }else{
                                                res.status(200).send({
                                                    message: "deleted",
                                                    instanceIds: instanceIds
                                                });
                                                return;
                                            }
                                        });
                                    });

                                });
                            });
                        }
                    });
                });
            } else {
                res.status(404).send({
                    message: "Azure Arm is Not Found"
                });
                return;
            }
        });

    });

    app.get('/azure-arm/:cfId/instances', function(req, res) {
        AzureArm.getById(req.params.cfId, function(err, azureArm) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (azureArm) {
                instancesDao.getInstancesByARMId(azureArm.id, function(err, instances) {
                    if (err) {
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    res.status(200).send(instances);
                });
            } else {
                res.status(404).send({
                    message: "not found"
                });
            }

        });
    });

    app.get('/azure-arm/:cfId/events', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.send(500, errorResponses.db.error);
                return;
            }

            if (cloudFormation) {
                AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                    if (err) {
                        logger.error("Unable to fetch provider", err);
                        res.send(500, errorResponses.db.error);
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
                    //var nextToken = req.query.nextToken;
                    awsCF.getAllStackEvents(cloudFormation.stackId, function(err, data) {

                        if (err) {
                            res.send(500, {
                                message: "Failed to fetch stack events from aws"
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

    app.get('/azure-arm/:cfId/resources', function(req, res) {
        CloudFormation.getById(req.params.cfId, function(err, cloudFormation) {
            if (err) {
                res.send(500, errorResponses.db.error);
                return;
            }
            if (cloudFormation) {

                AWSProvider.getAWSProviderById(cloudFormation.cloudProviderId, function(err, aProvider) {
                    if (err) {
                        logger.error("Unable to fetch provide", err);
                        res.send(500, errorResponses.db.error);
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
                    awsCF.listAllStackResources(cloudFormation.stackId, function(err, resources) {
                        if (err) {
                            logger.error("Unable to fetch provide", err);
                            res.send(500, errorResponses.db.error);
                        }
                        res.send(200, resources);

                    });
                });

            }
        });

    });



};

