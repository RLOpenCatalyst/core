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
var appConfig = require('_pr/config');
var auditTrailService = require('_pr/services/auditTrailService.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var fileIo = require('_pr/lib/utils/fileio');
var utils = require('_pr/model/classes/utils/utils.js');
var schedulerService = require('_pr/services/schedulerService.js');
var noticeService = require('_pr/services/noticeService.js');
var auditQueue = require('_pr/config/global-data.js');
var SCP = require('_pr/lib/utils/scp');
var request = require('request');

const errorType = 'chefExecutor';
var chefExecutor = module.exports = {};
chefExecutor.execute = function execute(botDetail,reqBody, auditTrail, userName, executionType, botHostDetails,schedulerCheck, callback) {
    if(schedulerCheck === true){
        reqBody = {};
        reqBody = botDetail.params;
    }
    if (reqBody && reqBody.nodeIds && reqBody.nodeIds.length > 0) {
        var actionLogId = uuid.v4();
        for (var i = 0; i < reqBody.nodeIds.length; i++) {
            (function (nodeId) {
                instanceModel.getInstanceById(nodeId, function (err, instances) {
                    if (err) {
                        logger.error("Issue with fetching instances By Id ", nodeId, err);
                        callback(err, null);
                        return;
                    } else if (instances.length > 0) {
                        logsDao.insertLog({
                            botId:botDetail._id,
                            botRefId: actionLogId,
                            err: false,
                            log: 'BOT execution has started for Chef BOTs ' + botDetail.id + " on Remote",
                            timestamp: new Date().getTime()
                        });
                        var botAuditTrailObj = {
                            botId: botDetail._id,
                            actionId: actionLogId
                        }
                        callback(null, botAuditTrailObj);
                        executeChefOnRemote(instances[0], botDetail,reqBody, actionLogId,auditTrail._id, userName, botHostDetails,schedulerCheck, function(err,data) {
                            if (err) {
                                logger.error("Error in Executor", err);
                                var resultTaskExecution = {
                                    "actionStatus": 'failed',
                                    "status": 'failed',
                                    "endedOn": new Date().getTime(),
                                    "actionLogId": actionLogId
                                };
                                logsDao.insertLog({
                                    botId:botDetail._id,
                                    botRefId: actionLogId,
                                    err: true,
                                    log: 'BOTs execution is failed for Chef BOTs  ' + botDetail.id + " on Remote",
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
            })(reqBody.nodeIds[i])
        }
    } else {
        executeChefOnLocal(botDetail,reqBody, auditTrail, userName, botHostDetails,schedulerCheck, function (err, data) {
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

function executeChefOnLocal(botDetail,reqBody, auditTrail, userName, botHostDetails,schedulerCheck, callback) {
    var actionId = uuid.v4();
    var logsReferenceIds = [botDetail._id, actionId];
    logsDao.insertLog({
        botId: botDetail._id,
        botRefId: actionId,
        err: false,
        log: 'BOT execution has  started for Chef BOTs ' + botDetail.id + " on Local",
        timestamp: new Date().getTime()
    });
    var botAuditTrailObj = {
        botId: botDetail._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    var reqData = {
        runlist: [],
        attributes: null,
        node: "local"
    }
    botDetail.execution.forEach(function (exec) {
        exec.runlist.forEach(function (cookBook) {
            reqData.runlist.push(cookBook);
        });
        if (exec.attributes !== null && reqBody.data
            && (reqBody.data !== null || JSON.stringify(reqBody.data) !== '{}')) {
            var pattern = /([a-zA-Z_])\w+/g;
            Object.keys(exec.attributes).forEach(function (key1) {
                Object.keys(exec.attributes[key1]).forEach(function (key2) {
                    var val = (exec.attributes[key1][key2]).match(pattern);
                    reqData.attributes[key1][key2] = reqBody.data[val]
                })
            })
        }
    })
    if (reqData.attributes !== null) {
        var fileName = uuid.v4() + '_' + botDetail.id + '.json';
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
    } else {
        executeChefCookBookOnLocal();
    }
    function executeChefCookBookOnLocal() {
        var reqBodyObj = {
            "data": reqData
        };
        var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
        var executorUrl = '/bot/' + botsChefDetails.id + '/exec';
        var options = {
            url: serverUrl + executorUrl,
            headers: {
                'Content-Type': 'application/json',
                'charset': 'utf-8'
            },
            json: true,
            body: reqBodyObj
        };
        request.post(options, function (err, res, body) {
            if (res.statusCode === 200) {
                var auditQueueDetails = {
                    userName: userName,
                    botId: botDetail.id,
                    bot_id: botDetail._id,
                    logRefId: logsReferenceIds,
                    auditId: actionId,
                    instanceLog: '',
                    instanceIP: '',
                    auditTrailId: auditTrail._id,
                    remoteAuditId: res.body.ref,
                    link: res.body.link,
                    status: "pending",
                    serverUrl: serverUrl,
                    env: "local",
                    retryCount: 0
                }
                auditQueue.setAudit(auditQueueDetails);
                if (reqData.attributes !== null) {
                    apiUtil.removeFile(desPath);
                }
                return;
            } else {
                logger.error(err);
                var timestampEnded = new Date().getTime();
                logsDao.insertLog({
                    botId: botDetail._id,
                    botRefId: actionId,
                    err: true,
                    log: "Error in BOT Engine executor:",
                    timestamp: new Date().getTime(),
                })
                var resultTaskExecution = {
                    "actionStatus": 'failed',
                    "status": 'failed',
                    "endedOn": new Date().getTime(),
                    "actionLogId": actionId
                };
                auditTrailService.updateAuditTrail('BOT', auditTrail._id, resultTaskExecution, function (err, data) {
                    if (err) {
                        logger.error("Failed to create or update bots Log: ", err);
                    }
                    noticeService.notice(userName, {
                        title: "Chef BOT Execution",
                        body: "Error in BOT Engine executor:"
                    }, "error", function (err, data) {
                        if (err) {
                            logger.error("Error in Notification Service, ", err);
                        }
                        if (reqData.attributes !== null) {
                            apiUtil.removeFile(desPath);
                        }
                        return;
                    });
                });
            }
        })
    }
}


function executeChefOnRemote(instance, botDetail,reqBody,actionLogId, auditTrailId, userName, botHostDetails,schedulerCheck, callback) {
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
            instanceId: instance._id,
            instanceRefId: actionLog._id,
            botId: botDetail._id,
            botRefId: actionLogId,
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
                "fileData": decryptedCredentials.fileData
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
        var reqData = {
            runlist: [],
            attributes: null,
            node: instance.instanceIP
        };
        botDetail.execution.forEach(function (exec) {
            exec.runlist.forEach(function (cookBook) {
                reqData.runlist.push(cookBook);
            });
            if (exec.attributes !== null && reqBody.data
                && (reqBody.data !== null || JSON.stringify(reqBody.data) !== '{}')) {
                var pattern = /([a-zA-Z_])\w+/g;
                Object.keys(exec.attributes).forEach(function (key1) {
                    Object.keys(exec.attributes[key1]).forEach(function (key2) {
                        var val = (exec.attributes[key1][key2]).match(pattern);
                        reqData.attributes[key1][key2] = reqBody.data[val]
                    })
                })
            }
        })
        if (reqData.attributes !== null) {
            var fileName = uuid.v4() + '_' + botDetail.id + '.json';
            var desPath = appConfig.tempDir + fileName;
            fileIo.writeFile(desPath, JSON.stringify(reqData.attributes), false, function (err) {
                if (err) {
                    logger.error("Unable to write file");
                    callback(err, null);
                    return;
                } else {
                    var scp = new SCP(sshOptions);
                    scp.upload(desPath, '/tmp', function (err) {
                        if (err) {
                            logger.error(err);
                        } else {
                            reqData.attributes = '/tmp/' + fileName;
                            executeChefCookBookOnRemote(desPath);
                        }
                    })
                }
            })
        } else {
            executeChefCookBookOnRemote(desPath);
        }
        function executeChefCookBookOnRemote(desPath) {
            var reqBody = {
                "data": reqData,
                "os": instance.hardware.os,
                "authentication": authenticationObj,
                "environment": envObj
            };
            var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
            var executorUrl = '/bot/' + botDetail.id + '/exec';
            var options = {
                url: serverUrl + executorUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'charset': 'utf-8'
                },
                json: true,
                body: reqBody
            };
            request.post(options, function (err, res, body) {
                if (res.statusCode === 200) {
                    var auditQueueDetails = {
                        userName: userName,
                        botId: botDetail.id,
                        bot_id: botDetail._id,
                        logRefId: logsReferenceIds,
                        auditId: actionLogId,
                        instanceLog: instanceLog,
                        instanceIP: instance.instanceIP,
                        auditTrailId: auditTrailId,
                        remoteAuditId: res.body.ref,
                        link: res.body.link,
                        status: "pending",
                        serverUrl: serverUrl,
                        env: "remote",
                        retryCount: 0
                    }
                    auditQueue.setAudit(auditQueueDetails);
                    if (reqData.attributes !== null) {
                        apiUtil.removeFile(desPath);
                    }
                    return;
                } else {
                    logger.error(err);
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        instanceId: instance._id,
                        instanceRefId: actionLog._id,
                        botId: botDetail._id,
                        botRefId: actionLogId,
                        err: true,
                        log: "Error in BOT Engine executor: ",
                        timestamp: timestampEnded
                    });
                    instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                    instanceLog.endedOn = new Date().getTime();
                    instanceLog.actionStatus = "failed";
                    instanceLog.logs = {
                        err: false,
                        log: "Error in BOT Engine executor:",
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    noticeService.notice(userName, {
                        title: "Chef BOT Execution",
                        body: "Error in BOT Engine executor:"
                    }, "error", function (err, data) {
                        if (err) {
                            logger.error("Error in Notification Service, ", err);
                        }
                    });
                    callback(err, null);
                    if (reqData.attributes !== null) {
                        apiUtil.removeFile(desPath);
                    }
                    return;
                }
            })
        }
    })
}












