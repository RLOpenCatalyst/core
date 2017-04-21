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
const fileHound= require('filehound');
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


const errorType = 'chefExecutor';

//var pythonHost =  process.env.FORMAT_HOST || 'localhost';
//var pythonPort =  process.env.FORMAT_PORT || '2687';
var chefExecutor = module.exports = {};

chefExecutor.execute = function execute(botsDetails,auditTrail,userName,executionType,botHostDetails,callback) {
    if(botsDetails.params && botsDetails.params.nodeIds && botsDetails.params.nodeIds.length > 0){
        var actionLogId = uuid.v4();
        var parallelChefExecuteList =[];
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
                            log: 'BOTs execution is started for Chef BOTs ' + botsDetails.id,
                            timestamp: new Date().getTime()
                        });
                        parallelChefExecuteList.push(function(callback){executeChefOnRemote(instances[0],botsDetails,actionLogId,userName,botHostDetails,callback);});
                        if(parallelChefExecuteList.length === botsDetails.params.nodeIds.length){
                            var botAuditTrailObj = {
                                botId: botsDetails._id,
                                actionId: actionLogId
                            }
                            callback(null, botAuditTrailObj);
                            async.parallel(parallelChefExecuteList, function (err, results) {
                                if (err) {
                                    logger.error("Error in Executor",err);
                                    var resultTaskExecution = {
                                        "actionStatus": 'failed',
                                        "status": 'failed',
                                        "endedOn": new Date().getTime(),
                                        "actionLogId": actionLogId
                                    };
                                    logsDao.insertLog({
                                        referenceId: [actionLogId,botsDetails._id],
                                        err: true,
                                        log: 'BOTs execution is failed for Script BOTs  ' + botsDetails.id +" on Remote",
                                        timestamp: new Date().getTime()
                                    });
                                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                        if (err) {
                                            logger.error("Failed to create or update bots Log: ", err);
                                        }
                                        return;
                                    });
                                }else {
                                    logger.debug(botsDetails.id+" BOTs Execution is Done")
                                    var resultTaskExecution = {
                                        "actionStatus": 'success',
                                        "status": 'success',
                                        "endedOn": new Date().getTime(),
                                        "actionLogId": actionLogId
                                    };
                                    logsDao.insertLog({
                                        referenceId: [actionLogId,botsDetails._id],
                                        err: false,
                                        log: 'BOTs execution is success for Script BOTs  ' + botsDetails.id +" on Remote",
                                        timestamp: new Date().getTime()
                                    });
                                    auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                        if (err) {
                                            logger.error("Failed to create or update bots Log: ", err);
                                        }
                                        return;
                                    });
                                }
                            })
                        }
                    }else{
                        logger.debug("No Instance Detail Available.");
                        return;
                    }
                })
            })(botsDetails.params.nodeIds[i])
        }
    }else{
        executeChefOnLocal(botsDetails,auditTrail,userName,botHostDetails,function(err,data){
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

function executeChefOnLocal(botsChefDetails,auditTrail,userName,botHostDetails,callback) {
    var actionId = uuid.v4();
    var logsReferenceIds = [botsChefDetails._id, actionId];
    logsDao.insertLog({
        referenceId: logsReferenceIds,
        err: false,
        log: 'BOTs execution is  started for Chef BOTs ' + botsChefDetails.id +" on Local",
        timestamp: new Date().getTime()
    });
    var botAuditTrailObj = {
        botId: botsChefDetails._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
    var reqData = {
        runlist :[],
        attributes:null,
        node:"local"
    }
    for(var i = 0; i < botsChefDetails.execution.length; i++){
        for(var j = 0; j < botsChefDetails.execution[i].runlist.length;j++){
            reqData.runlist.push(botsChefDetails.execution[i].runlist[j]);
        }
        reqData.attributes = botsChefDetails.execution[i].attributes
    }
    var reqBody = {
        "data": reqData
    };
    var supertest = require("supertest");
    var server = supertest.agent("http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort);
    var executorUrl = '/bot/' + botsChefDetails.id + '/exec';
    server
        .post(executorUrl)
        .send(reqBody)
        .set({'Content-Type': 'application/json'})
        .end(function (err, res) {
            if (!err) {
                var every = require('every-moment');
                var wait = require('wait-one-moment');
                var runningStatus="pending";
                var timer = every(5, 'seconds', function () {
                    schedulerService.getExecutorAuditTrailDetails(serverUrl + res.body.link, function (err, result) {
                        if (err) {
                            runningStatus="failed";
                            logger.error("In Error for Fetching Executor Audit Trails ", err);
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: true,
                                log: "Error in Fetching Audit Trails",
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
                                    body: "Error in Fetching Audit Trails"
                                }, "error", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                timer.stop();
                                return;
                            });
                        } else if (result.state === 'terminated') {
                            runningStatus="success";
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: result.status.text,
                                timestamp: timestampEnded
                            });
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: botsChefDetails.id+' BOTs execution is success on Local',
                                timestamp: timestampEnded
                            });

                            var resultTaskExecution = {
                                "actionStatus": 'success',
                                "status": 'success',
                                "endedOn": new Date().getTime(),
                                "actionLogId": actionId
                            };
                            auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                if (err) {
                                    logger.error("Failed to create or update bots Log: ", err);
                                }
                                logger.debug(botsChefDetails.id+" BOTs Execution is Done");
                                var botService = require('_pr/services/botsService');
                                botService.updateSavedTimePerBots(botsChefDetails._id, 'BOTsNew', function (err, data) {
                                    if (err) {
                                        logger.error("Failed to update bots saved Time: ", err);
                                    }
                                });
                                timer.stop();
                                noticeService.notice(userName, {
                                    title: "Chef BOT Execution",
                                    body: result.status.text
                                }, "success", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                return;
                            });
                        } else {
                            logger.debug(botsChefDetails.id+" BOTs Execution is going on Local.");
                        }
                    })
                });
                wait(botsChefDetails.manualExecutionTime * 60, 'seconds', function() {
                    if(runningStatus === 'pending') {
                        logger.debug('Stop the Audit Trail clock!');
                        timer.stop();
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: true,
                            log: "Error in fetching Audit Trails(Timer is Completed)",
                            timestamp: timestampEnded
                        });
                        var resultTaskExecution = {
                            "actionStatus": 'failed',
                            "status": 'failed',
                            "endedOn": new Date().getTime(),
                            "actionLogId": actionId
                        };
                        timer.stop();
                        auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                            if (err) {
                                logger.error("Failed to create or update bots Log: ", err);
                            }
                            noticeService.notice(userName, {
                                title: "Chef BOT Execution",
                                body: "Error in fetching Audit Trails(Timer is Completed)"
                            }, "error", function (err, data) {
                                if (err) {
                                    logger.error("Error in Notification Service, ", err);
                                }
                            });
                            return;
                        })
                    }else{
                        logger.debug("Timer is stopped for Audit Trails.");
                        timer.stop();
                    }
                });
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
                    }, "error",function(err,data){
                        if(err){
                            logger.error("Error in Notification Service, ",err);
                        }
                    });
                    return;
                })
            }
        });
};


function executeChefOnRemote(instance,botDetails,actionLogId,userName,botHostDetails,callback) {
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
                "file": decryptedCredentials.pemFileLocation
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
        var server = supertest.agent("http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort);
        var reqData = {
            runlist :[],
            attributes:null,
            node:instance.instanceIP
        }
        for(var i = 0; i < botDetails.execution.length; i++){
            for(var j = 0; j < botDetails.execution[i].runlist.length;j++){
                reqData.runlist.push(botDetails.execution[i].runlist[j]);
            }
            reqData.attributes = botDetails.execution[i].attributes
        }
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
                    }, "error",function(err,data){
                        if(err){
                            logger.error("Error in Notification Service, ",err);
                        }
                    });
                    callback(err, null);
                    return;
                } else {
                    var every = require('every-moment');
                    var wait = require('wait-one-moment');
                    var serverUrl = "http://" + botHostDetails.hostIP + ':' + botHostDetails.hostPort;
                    var runningStatus = "pending";
                    var timer = every(10, 'seconds', function () {
                        schedulerService.getExecutorAuditTrailDetails(serverUrl + res.body.link, function (err, result) {
                            if (err) {
                                runningStatus="failed";
                                logger.error("In Error for Fetching Executor Audit Trails ", err);
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: "Error in Fetching Audit Trails",
                                    timestamp: timestampEnded
                                });
                                instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Error in Fetching Audit Trails",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                timer.stop();
                                noticeService.notice(userName, {
                                    title: "Chef BOT Execution",
                                    body: "Error in Fetching Audit Trails"
                                }, "error", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                callback(err, null);
                                return;
                            } else if (result.state === 'terminated') {
                                runningStatus="success";
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: result.status.text,
                                    timestamp: timestampEnded
                                });
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log:  botDetails.id+' BOTs execution success on Node '+instance.instanceIP,
                                    timestamp: timestampEnded
                                });
                                instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "success";
                                instanceLog.logs = {
                                    err: false,
                                    log:  botDetails.id+' BOTs execution success on Node '+instance.instanceIP,
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                timer.stop();
                                var botService = require('_pr/services/botsService');
                                botService.updateSavedTimePerBots(botDetails._id, 'BOTsNew', function (err, data) {
                                    if (err) {
                                        logger.error("Failed to update bots saved Time: ", err);
                                    }
                                });
                                noticeService.notice(userName, {
                                    title: "Chef BOT Execution",
                                    body: result.status.text
                                }, "success", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                callback(null, result);
                                return;
                            } else {
                                logger.debug(botDetails.id+" BOTs Execution is going on  Node "+instance.instanceIP);
                            }
                        })
                    });
                    wait(botDetails.manualExecutionTime * 60, 'seconds', function() {
                        if(runningStatus === 'pending') {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: true,
                                log: "Error in fetching Audit Trails(Timer is Completed)",
                                timestamp: timestampEnded
                            });
                            timer.stop();
                            callback(null, res.body);
                            return;
                        }else{
                            logger.debug("Timer is stopped for Audit Trails.");
                            callback(null, res.body);
                            timer.stop();
                            return;
                        }
                    });
                }
            })
    });
}












