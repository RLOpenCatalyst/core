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
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
var auditTrailService = require('_pr/services/auditTrailService.js');
var schedulerService = require('_pr/services/schedulerService.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var noticeService = require('_pr/services/noticeService.js');
var auditQueue = require('_pr/config/global-data.js');
var request = require('request');
var scriptService = require('_pr/services/scriptService.js');
var commonService = require('_pr/services/commonService.js');
var fileIo = require('_pr/lib/utils/fileio');
var SCP = require('_pr/lib/utils/scp');

const errorType = 'scriptExecutor';

var scriptExecutor = module.exports = {};

scriptExecutor.execute = function execute(botDetail,reqBody,auditTrail,userName,executionType,botHostDetails,schedulerCheck,callback) {
    if(schedulerCheck === true){
        reqBody = {};
        reqBody = botDetail.params;
    }
    if(reqBody && reqBody.nodeIds && reqBody.nodeIds.length > 0){
        var actionLogId = uuid.v4();
        for(var i = 0 ;i < reqBody.nodeIds.length; i++) {
            (function (nodeId) {
                instanceModel.getInstanceById(nodeId, function (err, instances) {
                    if (err) {
                        logger.error("Issue with fetching instances By Id ", nodeId, err);
                        callback(err, null);
                        return;
                    } else if (instances.length > 0) {
                        var logData = {
                            botId:botDetail._id,
                            botRefId: actionLogId,
                            err: false,
                            log: 'BOT execution has started for Script BOTs  ' + botDetail.id +" on Remote",
                            timestamp: new Date().getTime()
                        }
                        logsDao.insertLog(logData);
                        noticeService.updater(actionLogId,'log',logData);
                        var botAuditTrailObj = {
                            botId: botDetail._id,
                            actionId: actionLogId
                        }
                        callback(null, botAuditTrailObj);
                        executeScriptOnRemote(instances[0],botDetail,reqBody,actionLogId,auditTrail._id,userName,botHostDetails,schedulerCheck,function(err,data){
                            if(err){
                                logger.error("Error in Executor", err);
                                var resultTaskExecution = {
                                    "actionStatus": 'failed',
                                    "status": 'failed',
                                    "endedOn": new Date().getTime(),
                                    "actionLogId": actionLogId
                                };
                                var logData = {
                                    botId:botDetail._id,
                                    botRefId: actionLogId,
                                    err: true,
                                    log: 'BOTs execution is failed for Script BOTs  ' + botDetail.id + " on Remote",
                                    timestamp: new Date().getTime()
                                };
                                logsDao.insertLog(logData);
                                noticeService.updater(actionLogId,'log',logData);
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
                        });
                    }else{
                        logger.debug("No Instance Detail Available.");
                        return;
                    }
                })
            })(reqBody.nodeIds[i])
        }
    }else{
        executeScriptOnLocal(botDetail,reqBody,auditTrail,userName,botHostDetails,schedulerCheck,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }else{
                callback(null,data);
                return;
            }
        });
    }
}


function executeScriptOnLocal(botDetail,requestBody,auditTrail,userName,botHostDetails,schedulerCheck,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var actionId = uuid.v4();
    var replaceTextObj = {
        node:'local'
    }
    var logData = {
        botId:botDetail._id,
        botRefId: actionId,
        err: false,
        log: 'BOT execution has started for Script BOTs  ' + botDetail.id + " on Local",
        timestamp: new Date().getTime()
    };
    logsDao.insertLog(logData);
    noticeService.updater(actionId,'log',logData);
    var botAuditTrailObj = {
        botId: botDetail._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    if (requestBody && requestBody.data && schedulerCheck === true) {
        botDetail.inputFormFields.forEach(function(formField){
            if(formField.type === 'password' || formField.type === 'restricted'){
                var decryptedText = cryptography.decryptText(requestBody.data[formField.name], cryptoConfig.decryptionEncoding,
                    cryptoConfig.encryptionEncoding);
                requestBody.data[formField.name] = decryptedText;
            }
            replaceTextObj = requestBody.data;
        });
    } else if(requestBody && requestBody.data && schedulerCheck === false) {
        replaceTextObj = requestBody.data;
    } else {
        for (var j = 0; j < botsScriptDetails.input.length; j++) {
            replaceTextObj[botsScriptDetails.input[j].name] = botsScriptDetails.input[j].default;
        }
    }

    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
    var reqBody = {
        "data": replaceTextObj
    };
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
                auditId: actionId,
                instanceLog: '',
                instanceIP: '',
                auditTrailId: auditTrail._id,
                remoteAuditId: body.ref,
                link: body.link,
                status: "pending",
                serverUrl: serverUrl,
                env: "local",
                retryCount: 0
            }
            auditQueue.setAudit(auditQueueDetails);
            return;
        }
        else {
            logData.log = res.statusCode === 502 ? "BOT Engine is not responding, Please check " + serverUrl : "Error in Script executor"
            logData.timestamp = new Date().getTime();
            logData.err = true;
            logsDao.insertLog(logData);
            noticeService.updater(actionId, 'log', logData);
            var timestampEnded = new Date().getTime();
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
                    title: "Script BOT Execution",
                    body: res.statusCode === 502 ? "Bot Enginge is not running" : "Error in Script executor"
                }, "error", function (err, data) {
                    if (err) {
                        logger.error("Error in Notification Service, ", err);
                    }
                });
                return;
            })
        }
    });
};


function executeScriptOnRemote(instance,botDetail,requestBody,actionLogId,auditTrailId,userName,botHostDetails,schedulerCheck,callback) {
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
        action: "BOTs Script-Execution"
    };
    if (!instance.instanceIP) {
        var timestampEnded = new Date().getTime();
        var logData ={
            instanceId:instance._id,
            instanceRefId:actionLog._id,
            botId:botDetail._id,
            botRefId: actionLogId,
            err: true,
            log: "Instance IP is not defined. Chef Client run failed",
            timestamp: timestampEnded
        };
        logsDao.insertLog(logData);
        noticeService.updater(actionLogId,'log',logData);
        instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
        instanceLog.endedOn = new Date().getTime();
        instanceLog.actionStatus = "failed";
        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
            if (err) {
                logger.error("Failed to create or update instanceLog: ", err);
            }
        });
        callback({errCode:400,errMsg:"Instance IP is not defined. Chef Client run failed"}, null);
        return;
    }
    if(botDetail.source === 'GitHub') {
        instance.credentials['source'] = 'executor';
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
                "pemFileLocation": decryptedCredentials.pemFileLocation
            }
            envObj.hostname = instance.instanceIP;
            envObj.authReference = "Pem_Based_Authentication";
        } else if (decryptedCredentials.fileData) {
            sshOptions.privateKey = decryptedCredentials.fileData;
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
        var replaceTextObj = {
            node:instance.instanceIP
        };
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        if (requestBody && requestBody.data && schedulerCheck === true) {
            botDetail.inputFormFields.forEach(function (formField) {
                if (formField.type === 'password' || formField.type === 'restricted') {
                    var decryptedText = cryptography.decryptText(requestBody.data[formField.name], cryptoConfig.decryptionEncoding,
                        cryptoConfig.encryptionEncoding);
                    requestBody.data[formField.name] = decryptedText;
                }
                replaceTextObj = requestBody.data;
            });
        } else if (requestBody && requestBody.data && schedulerCheck === false) {
            replaceTextObj = requestBody.data;
        } else {
            for (var j = 0; j < botDetails.input.length; j++) {
                replaceTextObj[botDetails.input[j].name] = botDetails.input[j].default;
            }
        }
        var reqBody = {
            "data": replaceTextObj,
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
                callback(null, null);
                return;
            } else {
                logger.error(err);
                var timestampEnded = new Date().getTime();
                var logData = {
                    instanceId: instance._id,
                    instanceRefId: actionLog._id,
                    botId: botDetail._id,
                    botRefId: actionLogId,
                    err: true,
                    log: res.statusCode === 502 ? "BOT Engine is not responding, Please check " + serverUrl : "Error in Script executor",
                    timestamp: timestampEnded
                };
                logsDao.insertLog(logData);
                noticeService.updater(actionLogId, 'log', logData);
                instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                instanceLog.endedOn = new Date().getTime();
                instanceLog.actionStatus = "failed";
                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });
                callback(err, null);
                noticeService.notice(userName,
                    {
                        title: "Script BOT Execution",
                        body: res.statusCode === 502 ? "Bot Enginge is not running" : "Error in Script executor"
                    }, "error", function (err, data) {
                        if (err) {
                            logger.error("Error in Notification Service, ", err);
                        }
                    });
                return;
            }
        })
    });
}















