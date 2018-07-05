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
var fileIo = require('_pr/lib/utils/fileio');
var auditQueue = require('_pr/config/global-data.js');
var fs = require('fs');
var request = require('request');

const errorType = 'scriptExecutor';

var scriptExecutor = module.exports = {};

scriptExecutor.execute = function execute(botsDetails,auditTrail,userName,executionType,botHostDetails,callback) {
    if(botsDetails.params && botsDetails.params.nodeIds && botsDetails.params.nodeIds.length > 0){
        var actionLogId = uuid.v4();
        for(var i = 0 ;i < botsDetails.params.nodeIds.length; i++) {
            (function (nodeId) {
                instanceModel.getInstanceById(nodeId, function (err, instances) {
                    if (err) {
                        logger.error("Issue with fetching instances By Id ", nodeId, err);
                        callback(err, null);
                        return;
                    } else if (instances.length > 0) {
                        logsDao.insertLog({
                            referenceId: [actionLogId,botsDetails._id],
                            err: false,
                            log: 'BOT execution has started for Script BOTs  ' + botsDetails.id +" on Remote",
                            timestamp: new Date().getTime()
                        });
                        var botAuditTrailObj = {
                            botId: botsDetails._id,
                            actionId: actionLogId
                        }
                        callback(null, botAuditTrailObj);
                        executeScriptOnRemote(instances[0],botsDetails,actionLogId,auditTrail._id,userName,botHostDetails,function(err,data){
                            if(err){
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
                                    log: 'BOTs execution is failed for Script BOTs  ' + botsDetails.id + " on Remote",
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
                        });
                    }else{
                        logger.debug("No Instance Detail Available.");
                        return;
                    }
                })
            })(botsDetails.params.nodeIds[i])
        }
    }else{
        executeScriptOnLocal(botsDetails,auditTrail,userName,botHostDetails,function(err,data){
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


function executeScriptOnLocal(botsScriptDetails,auditTrail,userName,botHostDetails,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var actionId = uuid.v4();
    var logsReferenceIds = [botsScriptDetails._id, actionId];
    var replaceTextObj = {
        node:'local'
    };
    logsDao.insertLog({
        referenceId: logsReferenceIds,
        err: false,
        log: 'BOT execution has started for Script BOTs  ' + botsScriptDetails.id + " on Local",
        timestamp: new Date().getTime()
    });
    var botAuditTrailObj = {
        botId: botsScriptDetails._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    if (botsScriptDetails.params && botsScriptDetails.params.data) {
        //condition introduced based on encryption botservice -> encryptedParam
        if(botsScriptDetails.params.category){
            if(botsScriptDetails.params.category === 'script'){
                Object.keys(botsScriptDetails.params.data).forEach(function (key) {
                    var decryptedText = cryptography.decryptText(botsScriptDetails.params.data[key], cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    replaceTextObj[key] = decryptedText;
                });
            }
        }


    } else {
        for (var j = 0; j < botsScriptDetails.input.length; j++) {
            replaceTextObj[botsScriptDetails.input[j].name] = botsScriptDetails.input[j].default;
        }
    }
    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
    var reqBody = {
        "data": replaceTextObj
    };
    var executorUrl = '/bot/' + botsScriptDetails.id + '/exec';
    var options = {
        url: serverUrl+executorUrl,
        headers: {
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        },
        json: true,
        body: reqBody
    };
    request.post(options, function (err, res, body) {
        if (err) {
            logger.error(err);
            var timestampEnded = new Date().getTime();
            logsDao.insertLog({
                referenceId: logsReferenceIds,
                err: true,
                log: "BOT Engine is not responding, Please check "+serverUrl,
                timestamp: timestampEnded
            });
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
                    body: "Bot Enginge is not running"
                }, "error",function(err,data){
                    if(err){
                        logger.error("Error in Notification Service, ",err);
                    }
                });
                return;
            })
        }else{
            if (res.statusCode === 200){
                var auditQueueDetails = {
                    userName:userName,
                    botId:botsScriptDetails.id,
                    bot_id:botsScriptDetails._id,
                    logRefId:logsReferenceIds,
                    auditId:actionId,
                    instanceLog:'',
                    instanceIP:'',
                    auditTrailId:auditTrail._id,
                    remoteAuditId:body.ref,
                    link:body.link,
                    status:"pending",
                    serverUrl:serverUrl,
                    env:"local",
                    retryCount:0
                }
                auditQueue.setAudit(auditQueueDetails);
                return;
            }
            else {
                var timestampEnded = new Date().getTime();
                logsDao.insertLog({
                    referenceId: logsReferenceIds,
                    err: true,
                    log: "Error in Script executor",
                    timestamp: timestampEnded
                });
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
                        body: "Error in Script executor"
                    }, "error",function(err,data){
                        if(err){
                            logger.error("Error in Notification Service, ",err);
                        }
                    });
                    return;
                })
            }
        }
    });
   
};


function executeScriptOnRemote(instance,botDetails,actionLogId,auditTrailId,userName,botHostDetails,callback) {
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
        action: "BOTs Script-Execution",
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
        callback({errCode:400,errMsg:"Instance IP is not defined. Chef Client run failed"}, null);
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
        var replaceTextObj = {
            node:instance.instanceIP
        };
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        if (botDetails.params.data) {
            Object.keys(botDetails.params.data).forEach(function (key) {
                var decryptedText = cryptography.decryptText(botDetails.params.data[key], cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                replaceTextObj[key] = decryptedText;
            });
        } else {
            for (var j = 0; j < botDetails.input.length; j++) {
                replaceTextObj[botDetails.input[j].name] = botDetails.input[j].default;
            }
        }
        
        var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
        
        var reqBody = {
            "data": replaceTextObj,
            "os": instance.hardware.os,
            "authentication": authenticationObj,
            "environment": envObj,
            "catalyst-node-reference": instance._id
        };
        var executorUrl = '/bot/' + botDetails.id + '/exec';
        var options = {
            url: serverUrl+executorUrl,
            headers: {
                'Content-Type': 'application/json',
                'charset': 'utf-8'
            },
            json: true,
            body: reqBody
        };
        request.post(options, function (err, res, body) {
            if (err) {
                logger.error(err);
                var timestampEnded = new Date().getTime();
                logsDao.insertLog({
                    referenceId: logsReferenceIds,
                    err: true,
                    log: "BOT Engine is not responding, Please check "+serverUrl,
                    timestamp: timestampEnded
                });
                instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                instanceLog.endedOn = new Date().getTime();
                instanceLog.actionStatus = "failed";
                instanceLog.logs = {
                    err: false,
                    log: "Unable to upload script file " + botDetails.id,
                    timestamp: new Date().getTime()
                };
                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });
                callback(err, null);
                if (decryptedCredentials.pemFileLocation){
                    apiUtil.removeFile(decryptedCredentials.pemFileLocation);
                }
                noticeService.notice(userName,
                    {
                        title: "Script BOT Execution",
                        body: "Bot Enginge is not running"
                    }, "error",function(err,data){
                        if(err){
                            logger.error("Error in Notification Service, ",err);
                        }
                    });
                return;
            } else {
                if(res.statusCode === 200){
                    var auditQueueDetails = {
                        userName:userName,
                        botId:botDetails.id,
                        bot_id:botDetails._id,
                        logRefId:logsReferenceIds,
                        auditId:actionLogId,
                        instanceLog:instanceLog,
                        instanceIP:instance.instanceIP,
                        auditTrailId:auditTrailId,
                        remoteAuditId:res.body.ref,
                        link:res.body.link,
                        status:"pending",
                        serverUrl:serverUrl,
                        env:"remote",
                        retryCount:0
                    }
                    auditQueue.setAudit(auditQueueDetails);
                    callback(null,null);
                    return;
                }
                else{
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        referenceId: logsReferenceIds,
                        err: true,
                        log: "Error in Script executor",
                        timestamp: timestampEnded
                    });
                    instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                    instanceLog.endedOn = new Date().getTime();
                    instanceLog.actionStatus = "failed";
                    instanceLog.logs = {
                        err: false,
                        log: "Unable to upload script file " + botDetails.id,
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    callback(err, null);
                    if (decryptedCredentials.pemFileLocation){
                        apiUtil.removeFile(decryptedCredentials.pemFileLocation);
                    }
                    noticeService.notice(userName,
                        {
                            title: "Script BOT Execution",
                            body: "Error in Script executor"
                        }, "error",function(err,data){
                            if(err){
                                logger.error("Error in Notification Service, ",err);
                            }
                        });
                    return;
                }
            }
        })
    });
}















