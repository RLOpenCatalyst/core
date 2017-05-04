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
var async = require("async");
var logsDao = require('_pr/model/dao/logsdao.js');
var instanceModel = require('_pr/model/classes/instance/instance.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var uuid = require('node-uuid');
const fileHound = require('filehound');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
var auditTrailService = require('_pr/services/auditTrailService.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var ChefClientExecution = require('_pr/model/classes/instance/chefClientExecution/chefClientExecution.js');
var Chef = require('_pr/lib/chef');
var fileIo = require('_pr/lib/utils/fileio');
var utils = require('_pr/model/classes/utils/utils.js');
var schedulerService = require('_pr/services/schedulerService.js');
var noticeService = require('_pr/services/noticeService.js');
var auditQueue = require('_pr/config/global-data.js');
var SCP = require('_pr/lib/utils/scp');
var fs = require('fs');

const errorType = 'chefExecutor';
var chefExecutor = module.exports = {};
chefExecutor.execute = function execute(botsDetails, auditTrail, userName, executionType, botHostDetails, callback) {
    if (botsDetails.params && botsDetails.params.nodeIds && botsDetails.params.nodeIds.length > 0) {
        var actionLogId = uuid.v4();
        var parallelChefExecuteList = [];
        for (var i = 0; i < botsDetails.params.nodeIds.length; i++) {
            (function (nodeId) {
                instanceModel.getInstanceById(nodeId, function (err, instances) {
                    if (err) {
                        logger.error("Issue with fetching instances By Id ", nodeId, err);
                        callback(err, null);
                        return;
                    } else if (instances.length > 0) {
                        logsDao.insertLog({
                            referenceId: [actionLogId, botsDetails._id],
                            err: false,
                            log: 'BOT execution has started for Chef BOTs ' + botsDetails.id,
                            timestamp: new Date().getTime()
                        });
                        var botAuditTrailObj = {
                            botId: botsDetails._id,
                            actionId: actionLogId
                        }
                        callback(null, botAuditTrailObj);
                        executeChefOnRemote(instances[0], botsDetails, actionLogId,auditTrail._id, userName, botHostDetails, function(err,data) {
                            if (err) {
                                logger.error("Error in Executor", err);
                                var resultTaskExecution = {
                                    "actionStatus": 'failed',
                                    "status": 'failed',
                                    "endedOn": new Date().getTime(),
                                    "actionLogId": actionLogId
                                };
                                logsDao.insertLog({
                                    referenceId: [actionLogId, botsDetails._id],
                                    err: true,
                                    log: 'BOTs execution is failed for Chef BOTs  ' + botsDetails.id + " on Remote",
                                    timestamp: new Date().getTime()
                                });
                                auditTrailService.updateAuditTrail('BOT', auditTrail._id, resultTaskExecution, function (err, data) {
                                    if (err) {
                                        logger.error("Failed to create or update bots Log: ", err);
                                    }
                                    return;
                                });
                            }else{
                                logger.debug("BOT Execution is going on:::::");
                                return;
                            }
                        })
                    } else {
                        logger.debug("No Instance Detail Available.");
                        return;
                    }
                })
            })(botsDetails.params.nodeIds[i])
        }
    } else {
        executeChefOnLocal(botsDetails, auditTrail, userName, botHostDetails, function (err, data) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            } else {
                callback(null, data);
                return;
            }
        });
    }
}

function executeChefOnLocal(botsChefDetails, auditTrail, userName, botHostDetails, callback) {
    var actionId = uuid.v4();
    var logsReferenceIds = [botsChefDetails._id, actionId];
    logsDao.insertLog({
        referenceId: logsReferenceIds,
        err: false,
        log: 'BOT execution has  started for Chef BOTs ' + botsChefDetails.id +" on Local",
        timestamp: new Date().getTime()
    });
    var botAuditTrailObj = {
        botId: botsChefDetails._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
    var reqData = {
        runlist: [],
        attributes: null,
        node: "local"
    }
    for (var i = 0; i < botsChefDetails.execution.length; i++) {
        for (var j = 0; j < botsChefDetails.execution[i].runlist.length; j++) {
            reqData.runlist.push(botsChefDetails.execution[i].runlist[j]);
        }
        reqData.attributes = botsChefDetails.params.attributes
    }
    if(reqData.attributes !== null){
        var fileName = uuid.v4() + '_' + botsChefDetails.id+'.json';
        var desPath = appConfig.tempDir + fileName;
        fileIo.writeFile(desPath, JSON.stringify(reqData.attributes), false, function (err) {
            if (err) {
                logger.error("Unable to write file");
                return;
            } else {
                reqData.attributes = desPath;
                executeChefCookBookOnLocal();
            }
        })
    }else{
        executeChefCookBookOnLocal();
    }
    function executeChefCookBookOnLocal() {
        var reqBody = {
            "data": reqData
        };
        var supertest = require("supertest");
        var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
        var server = supertest.agent();
        var executorUrl = '/bot/' + botsChefDetails.id + '/exec';
        server
            .post(executorUrl)
            .send(reqBody)
            .set({'Content-Type': 'application/json'})
            .end(function (err, res) {
                if (!err) {
                    var auditQueueDetails = {
                        userName: userName,
                        botId: botsChefDetails.id,
                        bot_id: botsChefDetails._id,
                        logRefId: logsReferenceIds,
                        auditId: actionId,
                        instanceLog: '',
                        instanceIP: '',
                        auditTrailId: auditTrail._id,
                        remoteAuditId: res.body.bot_run_id,
                        link: res.body.link,
                        status: "pending",
                        serverUrl: serverUrl,
                        env: "local",
                        retryCount:0
                    }
                    auditQueue.setAudit(auditQueueDetails);
                    return;
                } else {
                    logger.error(err);
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        referenceId: logsReferenceIds,
                        err: true,
                        log: "Error in Chef executor",
                        timestamp: timestampEnded
                    });
                    var resultTaskExecution = {
                        "actionStatus": 'failed',
                        "status": 'failed',
                        "endedOn": new Date().getTime(),
                        "actionLogId": actionId
                    };
                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                        if (err) {
                            logger.error("Failed to create or update bots Log: ", err);
                        }
                        noticeService.notice(userName, {
                            title: "Chef BOT Execution",
                            body: "Error in Chef executor"
                        }, "error", function (err, data) {
                            if (err) {
                                logger.error("Error in Notification Service, ", err);
                            }
                            if(reqData.attributes !== null) {
                                apiUtil.removeFile(desPath);
                            }
                            return;
                        })
                    });
                }
            });
    }
};


function executeChefOnRemote(instance, botDetails, actionLogId, auditTrailId, userName, botHostDetails, callback) {
    var timestampStarted = new Date().getTime();
    var actionLog = instanceModel.insertOrchestrationActionLog(instance._id, null, userName, timestampStarted);
    instance.tempActionLogId = actionLog._id;
    var logsReferenceIds = [instance._id, actionLog._id, actionLogId];
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
        action: "BOTs Chef-Execution",
        logs: []
    };
    if (!instance.instanceIP) {
        var timestampEnded = new Date().getTime();
        logsDao.insertLog({
            referenceId: logsReferenceIds,
            err: true,
            log: "Instance IP is not defined. Chef Client run failed",
            timestamp: timestampEnded
        });
        instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
        instanceLog.endedOn = new Date().getTime();
        instanceLog.actionStatus = "failed";
        instanceLog.logs = {
            err: true,
            log: "Instance IP is not defined. Chef Client run failed",
            timestamp: new Date().getTime()
        };
        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
            if (err) {
                logger.error("Failed to create or update instanceLog: ", err);
            }
        });
        callback(err, null);
        return;
    }
    credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
        var authenticationObj = {}, envObj = {};
        var sshOptions = {
            username: decryptedCredentials.username,
            host: instance.instanceIP,
            port: 22
        }
        if (decryptedCredentials.pemFileLocation) {
            sshOptions.privateKey = decryptedCredentials.pemFileLocation;
            authenticationObj.id = "Pem_Based_Authentication";
            authenticationObj.authType = "pem";
            authenticationObj.auth = {
                "username": decryptedCredentials.username,
                "fileData": fs.readFileSync(decryptedCredentials.pemFileLocation,'Base64')
            }
            envObj.hostname = instance.instanceIP;
            envObj.authReference = "Pem_Based_Authentication";
        } else {
            sshOptions.password = decryptedCredentials.password;
            authenticationObj.id = "Password_Based_Authentication";
            authenticationObj.authType = "password";
            authenticationObj.auth = {
                "username": decryptedCredentials.username,
                "password": decryptedCredentials.password
            }
            envObj.hostname = instance.instanceIP;
            envObj.authReference = "Password_Based_Authentication";
        }
        var supertest = require("supertest");
        var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
        var server = supertest.agent(serverUrl);
        var reqData = {
            runlist: [],
            attributes: null,
            node: instance.instanceIP
        }
        for (var i = 0; i < botDetails.execution.length; i++) {
            for (var j = 0; j < botDetails.execution[i].runlist.length; j++) {
                reqData.runlist.push(botDetails.execution[i].runlist[j]);
            }
            reqData.attributes = botDetails.params.attributes
        }
        if(reqData.attributes !== null){
            var fileName = uuid.v4() + '_' + botDetails.id+'.json';
            var desPath = appConfig.tempDir + fileName;
            fileIo.writeFile(desPath, JSON.stringify(reqData.attributes), false, function (err) {
                if (err) {
                    logger.error("Unable to write file");
                    return;
                } else {
                    var scp = new SCP(sshOptions);
                    scp.upload(desPath, '/tmp', function (err) {
                        if(err) {
                            logger.error(err);
                        }else{
                            reqData.attributes = '/tmp/'+fileName;
                            executeChefCookBookOnRemote(desPath);
                        }
                    })
                }
            })
        }else{
            executeChefCookBookOnRemote(desPath);
        }
        function executeChefCookBookOnRemote(desPath) {
            var reqBody = {
                "data": reqData,
                "os": instance.hardware.os,
                "authentication": authenticationObj,
                "environment": envObj
            };
            var executorUrl = '/bot/' + botDetails.id + '/exec';
            server
                .post(executorUrl)
                .send(reqBody)
                .set({'Content-Type': 'application/json'})
                .end(function (err, res) {
                    if (err) {
                        logger.error(err);
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: true,
                            log: "Error in Chef executor: ",
                            timestamp: timestampEnded
                        });
                        instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLog.logs = {
                            err: false,
                            log: "Unable to upload Chef file " + botDetails.id,
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        noticeService.notice(userName, {
                            title: "Chef BOT Execution",
                            body: "Error in Chef executor"
                        }, "error", function (err, data) {
                            if (err) {
                                logger.error("Error in Notification Service, ", err);
                            }
                        });
                        callback(err, null);
                        if(reqData.attributes !== null) {
                            apiUtil.removeFile(desPath);
                        }
                        return;
                    } else {
                        var auditQueueDetails = {
                            userName: userName,
                            botId: botDetails.id,
                            bot_id: botDetails._id,
                            logRefId: logsReferenceIds,
                            auditId: actionLogId,
                            instanceLog: instanceLog,
                            instanceIP: instance.instanceIP,
                            auditTrailId: auditTrailId,
                            remoteAuditId: res.body.bot_run_id,
                            link: res.body.link,
                            status: "pending",
                            serverUrl: serverUrl,
                            env: "remote",
                            retryCount:0
                        }
                        auditQueue.setAudit(auditQueueDetails);
                        if(reqData.attributes !== null) {
                            apiUtil.removeFile(desPath);
                        }
                        return;
                    }
                })
        }
    });
}












