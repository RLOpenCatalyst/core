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
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var intanceDao = require('../instance/instance');
var instancesDao = require('../instance/instance');
var logsDao = require('../../dao/logsdao.js');
var credentialCryptography = require('../../../lib/credentialcryptography')
var fileIo = require('../../../lib/utils/fileio');
var configmgmtDao = require('../../d4dmasters/configmgmt.js');

var Chef = require('../../../lib/chef');

var taskTypeSchema = require('./taskTypeSchema');

var ChefClientExecution = require('../instance/chefClientExecution/chefClientExecution.js');
var utils = require('../utils/utils.js');
var Blueprints = require('_pr/model/blueprint');
var AppData = require('_pr/model/app-deploy/app-data');
var masterUtil = require('../../../lib/utils/masterUtil.js');

var Docker = require('_pr/model/docker.js');

var chefTaskSchema = taskTypeSchema.extend({
    nodeIds: [String],
    runlist: [String],
    attributes: [{
        name: String,
        jsonObj: {}
    }],
    role: String
});

//Instance Methods :- getNodes
chefTaskSchema.methods.getNodes = function() {
    return this.nodeIds;

};

// Instance Method :- run task
chefTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    var self = this;

    logger.debug("self: ", JSON.stringify(self));
    if (blueprintIds[0] != "" && blueprintIds.length) {
        var count = 0;
        var onCompleteResult = [];
        var overallStatus = 0;
        var launchedBluprintIds = [];
        var failedBluprintIds = [];

        function blueprintOnCompleteHandler(err, status, blueprintId, output) {
            count++;
            var result = {
                blueprintId: blueprintId,
                result: output,
                status: 'success'
            };
            if (status) {
                result.status = 'failed';
                overallStatus = 1;
                failedBluprintIds.push(blueprintId);
            } else {
                launchedBluprintIds.push(blueprintId);
            }
            onCompleteResult.push(result);

            if (count === blueprintIds.length) {
                if (typeof onExecute === 'function') {
                    var msg;
                    if (!launchedBluprintIds.length) {
                        msg = "Unable to launch blueprints";
                    } else if (launchedBluprintIds.length === blueprintIds.length) {
                        msg = "Your Selected Blueprint is being Launched,You can monitor logs from the Launched Instances.";
                    } else {
                        msg = "You can monitor logs from the Launched Instances.";
                    }

                    logger.debug('onComplete result ==>', onCompleteResult);


                    onExecute(null, {
                        blueprintMessage: msg,
                        onCompleteResult: onCompleteResult
                    });
                }

                if (typeof onComplete === 'function') {
                    process.nextTick(function() {
                        logger.debug("onComplete fired for blueprint: ", overallStatus + "  " + onCompleteResult);
                        onComplete(null, overallStatus, {
                            blueprintResults: onCompleteResult
                        });
                    });
                }
            }
        }
        Blueprints.getByIds(blueprintIds, function(err, blueprints) {
            if (err) {
                logger.error("Failed to get blueprints", err);
                onExecute({
                    message: "Failed to get blueprints"
                });
                return;
            }
            if (!blueprints.length) {
                onExecute({
                    message: "Blueprints not found"
                });
                return;
            }
            for (var i = 0; i < blueprints.length; i++) {
                (function(blueprint) {
                    blueprint.extraRunlist = self.runlist;
                    logger.debug("envId=== ", envId);
                    blueprint.launch({
                        envId: envId,
                        ver: null,
                        stackName: null,
                        sessionUser: userName
                    }, function(err, launchData) {
                        var status = 0;
                        if (err) {
                            logger.error('blueprint launch error. blueprint id ==>', blueprint.id, err);
                            status = 1;
                        }

                        logger.debug('launchData ==>', launchData);

                        if (launchData.id && launchData.id.length) {
                            var actionLogFetchCount = 0;
                            var launchResult = [];
                            for (j = 0; j < launchData.id.length; j++) {
                                (function(instanceId) {
                                    logger.debug('action logs instanceId-->', instanceId);
                                    process.nextTick(function() {
                                        instancesDao.getAllActionLogs(instanceId, function(err, actionLogs) {
                                            actionLogFetchCount++;
                                            if (err) {
                                                logger.error("Failed to fetch ActionLogs: ", err);
                                                return;
                                            }

                                            logger.debug('action logs -->', JSON.stringify(actionLogs));

                                            if (actionLogs && actionLogs.length) {

                                                launchResult.push({
                                                    instanceId: instanceId,
                                                    actionLogId: actionLogs[0].id
                                                });
                                            }
                                            if (actionLogFetchCount === launchData.id.length) {
                                                logger.debug('firing launch result  ==> ', launchResult);
                                                blueprintOnCompleteHandler(err, status, blueprint.id, launchResult);
                                            }
                                        });
                                    });
                                })(launchData.id[j]);
                            }
                        }

                    });
                })(blueprints[i]);
            }

        });

        return;

    } else {
        //merging attributes Objects
        var attributeObj = {};
        var objectArray = [];
        for (var i = 0; i < self.attributes.length; i++) {
            objectArray.push(self.attributes[i].jsonObj);
        }

        var instanceIds = this.nodeIds;


        function getInstances(role, instanceIds, callback) {
            if (role) {
                configmgmtDao.getChefServerDetailsByOrgname(self.orgId, function(err, chefDetails) {
                    if (err) {
                        if (typeof onExecute === 'function') {
                            onExecute(err, null);
                        }
                        return;;
                    }
                    logger.debug("chefdata", chefDetails);

                    if (!chefDetails) {
                        if (typeof onExecute === 'function') {
                            onExecute(err, null);
                        }
                        return;;
                    }

                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });

                    chef.search('node', 'role:' + role, function(err, result) {
                        if (err) {
                            if (typeof onExecute === 'function') {
                                onExecute(err, null);
                            }
                            return;;
                        }


                        var chefNodes = result.rows;
                        var nodeNames = [];
                        for (var i = 0; i < chefNodes.length; i++) {
                            nodeNames.push(chefNodes[i].name);
                        }

                        logger.debug('chef server -->', chefDetails);

                        instancesDao.searchByChefServerAndNodeNames(chefDetails.rowid, nodeNames, function(err, instances) {
                            if (err) {
                                logger.error(err);
                                if (typeof onExecute === 'function') {
                                    onExecute(err, null);
                                }
                                return;
                            }
                            logger.debug('instances ==>', instances.length);
                            if (!(instances && instances.length)) {
                                if (typeof onExecute === 'function') {
                                    onExecute({
                                        message: "Empty Node List"
                                    }, null);
                                }
                                return;
                            }
                            callback(null, instances);
                        });

                    });
                });

            } else {

                if (!(instanceIds && instanceIds.length)) {
                    if (typeof onExecute === 'function') {
                        onExecute({
                            message: "Empty Node List"
                        }, null);
                    }
                    return;
                }
                instancesDao.getInstances(instanceIds, function(err, instances) {
                    if (err) {
                        logger.error(err);
                        if (typeof onExecute === 'function') {
                            onExecute(err, null);
                        }
                        return;
                    }
                    callback(null, instances);
                });
            }

        }
        logger.debug('role ==>', self.role);
        getInstances(self.role, instanceIds, function(err, instances) {
            if (err) {
                logger.error(err);
                if (typeof onExecute === 'function') {
                    onExecute(err, null);
                }
                return;
            }


            var count = 0;
            var overallStatus = 0;
            var instanceResultList = [];
            var executionIds = [];

            function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
                logger.debug('Instance onComplete fired', count, instances.length);
                count++;
                var result = {
                    instanceId: instanceId,
                    status: 'success'
                }
                if (actionId) {
                    result.actionId = actionId;
                }
                if (executionId) {
                    result.executionId = executionId;
                }
                if (err) {
                    result.status = 'failed';
                    overallStatus = 1;
                } else {
                    if (status === 0) {
                        result.status = 'success';
                    } else {
                        result.status = 'failed';
                        overallStatus = 1;
                    }
                }
                instanceResultList.push(result);
                if (!(count < instances.length)) {
                    logger.debug('Type of onComplete: ' + typeof onComplete);
                    if (typeof onComplete === 'function') {
                        onComplete(null, overallStatus, {
                            instancesResults: instanceResultList
                        });
                    }
                }
            }
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    var timestampStarted = new Date().getTime();

                    var actionLog = instancesDao.insertOrchestrationActionLog(instance._id, self.runlist, userName, timestampStarted);
                    instance.tempActionLogId = actionLog._id;


                    var logsReferenceIds = [instance._id, actionLog._id];
                    if (!instance.instanceIP) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: true,
                            log: "Instance IP is not defined. Chef Client run failed",
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceOnCompleteHandler({
                            message: "Instance IP is not defined. Chef Client run failed"
                        }, 1, instance._id, null, actionLog._id);
                        return;
                    }

                    // While passing extra attribute to chef cookbook "rlcatalyst" is used as attribute.
                    if (nexusData) {
                        masterUtil.getEnvironmentName(instance.envId, function(envName) {
                            objectArray.push({
                                "rlcatalyst": {
                                    "nexusUrl": nexusData.nexusUrl
                                }
                            });
                            objectArray.push({
                                "rlcatalyst": {
                                    "version": nexusData.version
                                }
                            });
                            if (nexusData.containerId) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "containerId": nexusData.containerId
                                    }
                                });
                            }
                            if (nexusData.containerPort) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "containerPort": nexusData.containerPort
                                    }
                                });
                            }
                            if (nexusData.dockerImage) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerImage": nexusData.dockerImage
                                    }
                                });
                            }

                            if (nexusData.hostPort) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "hostPort": nexusData.hostPort
                                    }
                                });
                            }
                            if (nexusData.dockerUser) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerUser": nexusData.dockerUser
                                    }
                                });
                            }
                            if (nexusData.dockerPassword) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerPassword": nexusData.dockerPassword
                                    }
                                });
                            }
                            if (nexusData.dockerEmailId) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerEmailId": nexusData.dockerEmailId
                                    }
                                });
                            }
                            if (nexusData.imageTag) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "imageTag": nexusData.imageTag
                                    }
                                });
                            }

                            if (nexusData.upgrade) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "upgrade": nexusData.upgrade
                                    }
                                });
                            }
                            objectArray.push({
                                "rlcatalyst": {
                                    "applicationNodeIP": instance.instanceIP
                                }
                            });
                            var nodeIp = [];
                            var actualDocker = [];
                            var appVersion = "";
                            var appName = "";
                            if (nexusData.version) {
                                appVersion = nexusData.version;
                            } else {
                                appVersion = nexusData.imageTag;
                            }

                            if (nexusData.nexusUrl) {
                                var lastIndex = nexusData.nexusUrl.split("/").length - 1;
                                appName = nexusData.nexusUrl.split("/")[lastIndex].split("-")[0];
                            } else {
                                if (nexusData.image && nexusData.image.indexOf("/") != -1) {
                                    appName = nexusData.image.split("/")[1];
                                } else {
                                    appName = nexusData.image;
                                }
                            }

                            nodeIp.push(instance.instanceIP);
                            var nexus = {
                                "repoURL": nexusData.nexusUrl,
                                "nodeIps": nodeIp
                            };

                            var docker = {
                                "image": nexusData.image,
                                "containerId": nexusData.containerId,
                                "containerPort": nexusData.containerPort,
                                "hostPort": nexusData.hostPort,
                                "dockerUser": nexusData.dockerUser,
                                "dockerPassword": nexusData.dockerPassword,
                                "dockerEmailId": nexusData.dockerEmailId,
                                "imageTag": nexusData.imageTag,
                                "nodeIp": instance.instanceIP
                            };
                            actualDocker.push(docker);

                            var appData = {
                                "projectId": instance.projectId,
                                "envId": envName,
                                "appName": appName,
                                "version": appVersion,
                                "nexus": nexus,
                                "docker": actualDocker
                            };
                            AppData.createNewOrUpdate(appData, function(err, data) {
                                if (err) {
                                    logger.debug("Failed to create or update app-data: ", err);
                                }
                                if (data) {
                                    logger.debug("Created or Updated app-data successfully: ", data);
                                }
                            });


                            logger.debug("AppDeploy attributes: ", JSON.stringify(objectArray));
                            var attributeObj = utils.mergeObjects(objectArray);
                            configmgmtDao.getChefServerDetails(instance.chef.serverId, function(err, chefDetails) {
                                if (err) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Chef Data Corrupted. Chef Client run failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                    instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                    return;
                                }
                                if (!chefDetails) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Chef Data Corrupted. Chef Client run failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                    instanceOnCompleteHandler({
                                        message: "Chef Data Corrupted. Chef Client run failed"
                                    }, 1, instance._id, null, actionLog._id);
                                    return;
                                }
                                //decrypting pem file
                                credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: "Unable to decrypt pem file. Chef run failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                        instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                        return;
                                    }

                                    ChefClientExecution.createNew({
                                        instanceId: instance._id

                                    }, function(err, chefClientExecution) {
                                        if (err) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: "Unable to generate chef run execution id. Chef run failed",
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                            return;
                                        }

                                        var executionIdJsonAttributeObj = {
                                            catalyst_attribute_handler: {
                                                catalystCallbackUrl: baseUrl + '/chefClientExecution/' + chefClientExecution.id
                                            }
                                        };

                                        var jsonAttributeObj = utils.mergeObjects([executionIdJsonAttributeObj, attributeObj]);
                                        var jsonAttributesString = JSON.stringify(jsonAttributeObj);

                                        var chef = new Chef({
                                            userChefRepoLocation: chefDetails.chefRepoLocation,
                                            chefUserName: chefDetails.loginname,
                                            chefUserPemFile: chefDetails.userpemfile,
                                            chefValidationPemFile: chefDetails.validatorpemfile,
                                            hostedChefUrl: chefDetails.url,
                                        });

                                        var chefClientOptions = {
                                            privateKey: decryptedCredentials.pemFileLocation,
                                            username: decryptedCredentials.username,
                                            host: instance.instanceIP,
                                            instanceOS: instance.hardware.os,
                                            port: 22,
                                            runlist: self.runlist, // runing service runlist
                                            jsonAttributes: jsonAttributesString,
                                            overrideRunlist: true,
                                            parallel: true
                                        }
                                        if (decryptedCredentials.pemFileLocation) {
                                            chefClientOptions.privateKey = decryptedCredentials.pemFileLocation;
                                        } else {
                                            chefClientOptions.password = decryptedCredentials.password;
                                        }
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: false,
                                            log: "Executing Task",
                                            timestamp: new Date().getTime()
                                        });
                                        chef.runChefClient(chefClientOptions, function(err, retCode) {
                                            if (decryptedCredentials.pemFileLocation) {
                                                fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
                                                    if (err) {
                                                        logger.error("Unable to delete temp pem file =>", err);
                                                    } else {
                                                        logger.debug("temp pem file deleted");
                                                    }
                                                });
                                            }
                                            if (err) {
                                                var timestampEnded = new Date().getTime();
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: 'Unable to run chef-client',
                                                    timestamp: timestampEnded
                                                });
                                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                                instanceOnCompleteHandler(err, 1, instance._id, chefClientExecution.id, actionLog._id);
                                                return;
                                            }
                                            if (retCode == 0) {
                                                var timestampEnded = new Date().getTime();
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: false,
                                                    log: 'Task execution success',
                                                    timestamp: timestampEnded
                                                });
                                                instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                                instanceOnCompleteHandler(null, 0, instance._id, chefClientExecution.id, actionLog._id);


                                                var _docker = new Docker();
                                                _docker.checkDockerStatus(instance._id, function(err, retCode) {
                                                    if (err) {
                                                        logger.error("Failed _docker.checkDockerStatus", err);
                                                        return;
                                                        //res.end('200');

                                                    }
                                                    logger.debug('Docker Check Returned:' + retCode);
                                                    if (retCode == '0') {
                                                        instancesDao.updateInstanceDockerStatus(instance._id, "success", '', function(data) {
                                                            logger.debug('Instance Docker Status set to Success');
                                                        });

                                                    }
                                                });



                                            } else {
                                                instanceOnCompleteHandler(null, retCode, instance._id, chefClientExecution.id, actionLog._id);
                                                if (retCode === -5000) {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: 'Host Unreachable',
                                                        timestamp: new Date().getTime()
                                                    });
                                                } else if (retCode === -5001) {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: 'Invalid credentials',
                                                        timestamp: new Date().getTime()
                                                    });
                                                } else {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: 'Unknown error occured. ret code = ' + retCode,
                                                        timestamp: new Date().getTime()
                                                    });
                                                }
                                                var timestampEnded = new Date().getTime();
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: 'Error in running chef-client',
                                                    timestamp: timestampEnded
                                                });
                                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            }
                                        }, function(stdOutData) {
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: false,
                                                log: stdOutData.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            });
                                        }, function(stdOutErr) {
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: stdOutErr.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            });
                                        });
                                    });
                                });

                            });
                        });

                    } else {
                        logger.debug("AppDeploy attributes: ", JSON.stringify(objectArray));
                        var attributeObj = utils.mergeObjects(objectArray);
                        configmgmtDao.getChefServerDetails(instance.chef.serverId, function(err, chefDetails) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: "Chef Data Corrupted. Chef Client run failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                return;
                            }
                            if (!chefDetails) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: "Chef Data Corrupted. Chef Client run failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceOnCompleteHandler({
                                    message: "Chef Data Corrupted. Chef Client run failed"
                                }, 1, instance._id, null, actionLog._id);
                                return;
                            }
                            //decrypting pem file
                            credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
                                if (err) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Unable to decrypt pem file. Chef run failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                    instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                    return;
                                }

                                ChefClientExecution.createNew({
                                    instanceId: instance._id

                                }, function(err, chefClientExecution) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: "Unable to generate chef run execution id. Chef run failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                        instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                        return;
                                    }

                                    var executionIdJsonAttributeObj = {
                                        catalyst_attribute_handler: {
                                            catalystCallbackUrl: baseUrl + '/chefClientExecution/' + chefClientExecution.id
                                        }
                                    };

                                    var jsonAttributeObj = utils.mergeObjects([executionIdJsonAttributeObj, attributeObj]);
                                    var jsonAttributesString = JSON.stringify(jsonAttributeObj);

                                    var chef = new Chef({
                                        userChefRepoLocation: chefDetails.chefRepoLocation,
                                        chefUserName: chefDetails.loginname,
                                        chefUserPemFile: chefDetails.userpemfile,
                                        chefValidationPemFile: chefDetails.validatorpemfile,
                                        hostedChefUrl: chefDetails.url,
                                    });

                                    var chefClientOptions = {
                                        privateKey: decryptedCredentials.pemFileLocation,
                                        username: decryptedCredentials.username,
                                        host: instance.instanceIP,
                                        instanceOS: instance.hardware.os,
                                        port: 22,
                                        runlist: self.runlist, // runing service runlist
                                        jsonAttributes: jsonAttributesString,
                                        overrideRunlist: true,
                                        parallel: true
                                    }
                                    if (decryptedCredentials.pemFileLocation) {
                                        chefClientOptions.privateKey = decryptedCredentials.pemFileLocation;
                                    } else {
                                        chefClientOptions.password = decryptedCredentials.password;
                                    }
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: false,
                                        log: "Executing Task",
                                        timestamp: new Date().getTime()
                                    });
                                    chef.runChefClient(chefClientOptions, function(err, retCode) {
                                        if (decryptedCredentials.pemFileLocation) {
                                            fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
                                                if (err) {
                                                    logger.error("Unable to delete temp pem file =>", err);
                                                } else {
                                                    logger.debug("temp pem file deleted");
                                                }
                                            });
                                        }
                                        if (err) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: 'Unable to run chef-client',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceOnCompleteHandler(err, 1, instance._id, chefClientExecution.id, actionLog._id);
                                            return;
                                        }
                                        if (retCode == 0) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: false,
                                                log: 'Task execution success',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                            instanceOnCompleteHandler(null, 0, instance._id, chefClientExecution.id, actionLog._id);
                                        } else {
                                            instanceOnCompleteHandler(null, retCode, instance._id, chefClientExecution.id, actionLog._id);
                                            if (retCode === -5000) {
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: 'Host Unreachable',
                                                    timestamp: new Date().getTime()
                                                });
                                            } else if (retCode === -5001) {
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: 'Invalid credentials',
                                                    timestamp: new Date().getTime()
                                                });
                                            } else {
                                                logsDao.insertLog({
                                                    referenceId: logsReferenceIds,
                                                    err: true,
                                                    log: 'Unknown error occured. ret code = ' + retCode,
                                                    timestamp: new Date().getTime()
                                                });
                                            }
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: 'Error in running chef-client',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                        }
                                    }, function(stdOutData) {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                    }, function(stdOutErr) {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: stdOutErr.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                    });
                                });
                            });

                        });
                    }

                })(instances[i]);
            }

            if (typeof onExecute === 'function') {
                onExecute(null, {
                    instances: instances,
                });
            }
        });
    }
};

var ChefTask = mongoose.model('chefTask', chefTaskSchema);

module.exports = ChefTask;