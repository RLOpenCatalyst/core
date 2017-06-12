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
var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var credentialCryptography = require('_pr/lib/credentialcryptography')
var fileIo = require('_pr/lib/utils/fileio');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Chef = require('_pr/lib/chef');
var taskTypeSchema = require('./taskTypeSchema');
var ChefClientExecution = require('_pr/model/classes/instance/chefClientExecution/chefClientExecution.js');
var utils = require('_pr/model/classes/utils/utils.js');
var Blueprints = require('_pr/model/blueprint');
var AppData = require('_pr/model/app-deploy/app-data');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var Docker = require('_pr/model/docker.js');
var uuid = require('node-uuid');
var chefTaskSchema = taskTypeSchema.extend({
    _id: false,
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
chefTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, appData, blueprintIds, envId, onExecute, onComplete) {
    logger.debug("chef appData: ", JSON.stringify(appData));
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
        var attr = self.attributes;
        if (self.botParams && self.botParams.cookbookAttributes) {
            attr = self.botParams.cookbookAttributes;
        }
        for (var i = 0; i < attr.length; i++) {
            objectArray.push(attr[i].jsonObj);
        }

        var instanceIds = this.nodeIds;

        function getInstances(role, instanceIds, tagServer, callback) {
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

                        instancesDao.searchByChefServerNodeNamesAndEnvId(chefDetails.rowid, nodeNames, self.envId, function(err, instances) {
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
                                        message: "Nodes with role " + role + " not found"
                                    }, null);
                                }
                                return;
                            }
                            callback(null, instances);
                        });

                    });
                });

            } else  if ((typeof tagServer === 'string' && tagServer === 'undefined') || typeof tagServer === 'undefined') {
                if (!(instanceIds && instanceIds.length)) {
                    if (typeof onExecute === 'function') {
                        onExecute({
                            message: "Empty Node List"
                        }, null);
                    }
                    return;
                }
                instancesDao.getInstances(instanceIds, function (err, instances) {
                    if (err) {
                        logger.error(err);
                        if (typeof onExecute === 'function') {
                            onExecute(err, null);
                        }
                        return;
                    }
                    callback(null, instances);
                });

            } else if(tagServer){
                logger.debug('in tagServer', tagServer);
                instancesDao.getInstancesByTagServer(tagServer, function (err, instances) {
                    if (err) {
                        logger.error(err);
                        if (typeof onExecute === 'function') {
                            onExecute(err, null);
                        }
                        return;
                    }
                    callback(null, instances);
                });
            }else{
                instancesDao.getInstances(instanceIds, function (err, instances) {
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
        getInstances(self.role, instanceIds, self.botTagServer, function(err, instances) {
            logger.debug("instance length ==>",instances.length);
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
                    var instanceLog = {
                        actionId: actionLog._id,
                        instanceId: instance._id,
                        orgName: instance.orgName,
                        bgName: instance.bgName,
                        projectName: instance.projectName,
                        envName: instance.environmentName,
                        status: instance.instanceState,
                        actionStatus: "pending",
                        platformId: instance.platformId,
                        blueprintName: instance.blueprintData.blueprintName,
                        data: instance.runlist,
                        platform: instance.hardware.platform,
                        os: instance.hardware.os,
                        size: instance.instanceType,
                        user: userName,
                        createdOn: new Date().getTime(),
                        startedOn: new Date().getTime(),
                        providerType: instance.providerType,
                        action: "Chef-Task-Run"
                    };
                    if (appData) {
                        if (appData.promote) {
                            instanceLog.action = "App Promote";
                        } else {
                            if (appData.upgrade) {
                                instanceLog.action = "App Upgrade";
                            } else {
                                instanceLog.action = "App Deploy";
                            }
                        }
                    }
                    if (!instance.instanceIP) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            instanceId:instance._id,
                            instanceRefId:actionLog._id,
                            err: true,
                            log: "Instance IP is not defined. Chef Client run failed",
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });

                        instanceOnCompleteHandler({
                            message: "Instance IP is not defined. Chef Client run failed"
                        }, 1, instance._id, null, actionLog._id);
                        return;
                    }
                    // While passing extra attribute to chef cookbook "rlcatalyst" is used as attribute.
                    if (appData) {
                        if (appData.nexus && appData.nexus.nodeIds && appData.nexus.nodeIds.length) {
                            logger.debug("Inside nexus....");
                            objectArray.push({
                                "rlcatalyst": {
                                    "nexusUrl": appData.nexus.repoURL
                                }
                            });
                            objectArray.push({
                                "rlcatalyst": {
                                    "version": appData.version
                                }
                            });
                        }
                        if (appData.docker && appData.docker.nodeIds && appData.docker.nodeIds.length) {
                            logger.debug("Inside docker....");
                            var containerValue = uuid.v4();
                            if (appData.docker.containerName) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "containerId": appData.docker.containerName
                                    }
                                });
                            } else {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "containerId": containerValue
                                    }
                                });
                            }
                            if (appData.docker.containerPort) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "containerPort": appData.docker.containerPort
                                    }
                                });
                            }
                            if (appData.docker.image) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerImage": appData.docker.image
                                    }
                                });
                            }

                            if (appData.docker.hostPort) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "hostPort": appData.docker.hostPort
                                    }
                                });
                            }
                            if (appData.docker.dockerUser) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerUser": appData.docker.dockerUser
                                    }
                                });
                            }
                            if (appData.docker.dockerPassword) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerPassword": appData.docker.dockerPassword
                                    }
                                });
                            }
                            if (appData.docker.dockerEmailId) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "dockerEmailId": appData.docker.dockerEmailId
                                    }
                                });
                            }
                            if (appData.docker.imageTag) {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "imageTag": appData.docker.imageTag
                                    }
                                });
                            }
                        }

                        if (appData.upgrade) {
                            objectArray.push({
                                "rlcatalyst": {
                                    "upgrade": appData.upgrade
                                }
                            });
                        }
                        objectArray.push({
                            "rlcatalyst": {
                                "applicationNodeIP": instance.instanceIP
                            }
                        });
                        var nodeIds = [];
                        var appVersion = "";
                        var appName = "";
                        var nexus = {};
                        var docker = {};
                        if (appData.nexus) {
                            nexus['rowId'] = appData.nexus.rowId;
                            nexus['repoURL'] = appData.nexus.repoURL;
                            nexus['nodeIds'] = appData.nexus.nodeIds;
                            nexus['artifactId'] = appData.nexus.artifactId;
                            nexus['repository'] = appData.nexus.repository;
                            nexus['groupId'] = appData.nexus.groupId;
                            nexus['rowId'] = appData.nexus.rowId;
                            nexus['taskId'] = appData.taskId;
                            appName = appData.appName;
                            appVersion = appData.version;
                        }
                        if (appData.docker) {
                            containerIdOrName = "";
                            if (appData.docker.containerName) {
                                containerIdOrName = appData.docker.containerName;
                            } else {
                                containerIdOrName = containerValue;
                            }
                            docker['rowId'] = appData.docker.rowId;
                            docker['image'] = appData.docker.image;
                            docker['containerName'] = containerIdOrName;
                            docker['containerPort'] = appData.docker.containerPort;
                            docker['dockerUser'] = appData.docker.dockerUser;
                            docker['dockerPassword'] = appData.docker.dockerPassword;
                            docker['dockerEmailId'] = appData.docker.dockerEmailId;
                            docker['imageTag'] = appData.docker.imageTag;
                            docker['nodeIds'] = appData.docker.nodeIds;
                            docker['hostPort'] = appData.docker.hostPort;
                            docker['rowId'] = appData.docker.rowId;
                            docker['taskId'] = appData.taskId;
                            appName = appData.appName;
                            appVersion = appData.docker.imageTag;
                        }
                        nodeIds.push(instance.instanceIP);
                        masterUtil.getEnvironmentName(instance.envId, function(err, envName) {
                            var appDataObj = {
                                "projectId": instance.projectId,
                                "envName": envName,
                                "appName": appName,
                                "version": appVersion,
                                "nexus": nexus,
                                "docker": docker
                            };
                            AppData.createNewOrUpdate(appDataObj, function(err, data) {
                                if (err) {
                                    logger.debug("Failed to create or update app-data: ", err);
                                }
                                if (data) {
                                    logger.debug("Created or Updated app-data successfully: ", data);
                                }
                            });
                        });

                        //logger.debug("AppDeploy attributes: ", JSON.stringify(objectArray));
                        var attributeObj = utils.mergeObjects(objectArray);
                        configmgmtDao.getChefServerDetails(instance.chef.serverId, function(err, chefDetails) {
                            if (err) {
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: true,
                                    log: "Chef Data Corrupted. Chef Client run failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                return;
                            }
                            if (!chefDetails) {
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
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
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.actionStatus = "failed";
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
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
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
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
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    logsDao.insertLog({
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: false,
                                        log: "Executing Task",
                                        timestamp: new Date().getTime()
                                    });
                                    chef.runChefClient(chefClientOptions, function(err, retCode) {
                                        if (decryptedCredentials.pemFileLocation) {
                                            fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
                                                if (err) {
                                                    //logger.error("Unable to delete temp pem file =>", err);
                                                } else {
                                                    logger.debug("temp pem file deleted");
                                                }
                                            });
                                        }
                                        if (err) {
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: true,
                                                log: 'Unable to run chef-client',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceOnCompleteHandler(err, 1, instance._id, chefClientExecution.id, actionLog._id);
                                            return;
                                        }
                                        if (retCode == 0) {
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "success";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: false,
                                                log: 'Task execution success',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                            instanceOnCompleteHandler(null, 0, instance._id, chefClientExecution.id, actionLog._id);
                                            // Update Instance with docker status.
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
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Host Unreachable',
                                                    timestamp: new Date().getTime()
                                                });
                                            } else if (retCode === -5001) {
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Invalid credentials',
                                                    timestamp: new Date().getTime()
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
                                                    //logger.debug('Docker Check Returned:' + retCode);
                                                    if (retCode == '0') {
                                                        instancesDao.updateInstanceDockerStatus(instance._id, "success", '', function(data) {
                                                            logger.debug('Instance Docker Status set to Success');
                                                        });

                                                    }
                                                });

                                            } else {
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Unknown error occured. ret code = ' + retCode,
                                                    timestamp: new Date().getTime()
                                                });
                                            }
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: true,
                                                log: 'Error in running chef-client',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                        }
                                    }, function(stdOutData) {
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                    }, function(stdOutErr) {
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
                                            err: true,
                                            log: stdOutErr.toString('ascii'),
                                            timestamp: new Date().getTime()
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
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: true,
                                    log: "Chef Data Corrupted. Chef Client run failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                return;
                            }
                            if (!chefDetails) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: true,
                                    log: "Chef Data Corrupted. Chef Client run failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
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
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: true,
                                        log: "Unable to decrypt pem file. Chef run failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.actionStatus = "failed";
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                    return;
                                }

                                ChefClientExecution.createNew({
                                    instanceId: instance._id

                                }, function(err, chefClientExecution) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
                                            err: true,
                                            log: "Unable to generate chef run execution id. Chef run failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
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
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: false,
                                        log: "Executing Task",
                                        timestamp: new Date().getTime()
                                    });
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
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
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: true,
                                                log: 'Task Execution has failed',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            instanceOnCompleteHandler(err, 1, instance._id, chefClientExecution.id, actionLog._id);
                                            return;
                                        }
                                        if (retCode == 0) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: false,
                                                log: 'Task execution success',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "success";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            instanceOnCompleteHandler(null, 0, instance._id, chefClientExecution.id, actionLog._id);
                                        } else {
                                            instanceOnCompleteHandler(null, retCode, instance._id, chefClientExecution.id, actionLog._id);
                                            if (retCode === -5000) {
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Host Unreachable',
                                                    timestamp: new Date().getTime()
                                                });
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                            } else if (retCode === -5001) {
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Invalid credentials',
                                                    timestamp: new Date().getTime()
                                                });
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                            } else {
                                                logsDao.insertLog({
                                                    instanceId:instance._id,
                                                    instanceRefId:actionLog._id,
                                                    err: true,
                                                    log: 'Unknown error occured. ret code = ' + retCode,
                                                    timestamp: new Date().getTime()
                                                });
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                            }
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                instanceId:instance._id,
                                                instanceRefId:actionLog._id,
                                                err: true,
                                                log: 'Task Execution has failed',
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                        }
                                    }, function(stdOutData) {
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                    }, function(stdOutErr) {
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
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