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
var exec = require('exec');
const fileHound= require('filehound');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
var auditTrailService = require('_pr/services/auditTrailService.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var SSHExec = require('_pr/lib/utils/sshexec');
var SCP = require('_pr/lib/utils/scp');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

const errorType = 'scriptExecutor';

var pythonHost =  process.env.FORMAT_HOST || 'localhost';
var pythonPort =  process.env.FORMAT_PORT || '2689';
var scriptExecutor = module.exports = {};

scriptExecutor.execute = function execute(botsDetails,auditTrail,userName,executionType,callback) {
    if(botsDetails.env && botsDetails.env !== null){
        executeOnEnv(botsDetails,auditTrail,botsDetails.env,userName,executionType,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }else{
                callback(null,data);
                return;
            }
        });
    }else{
        executeOnNode(botsDetails,auditTrail,executionType,function(err,data){
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


function executeOnNode(botsScriptDetails,auditTrail,executionType,callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var actionId = uuid.v4();
    var logsReferenceIds = [botsScriptDetails._id, actionId];
    var replaceTextObj = {};
    logsDao.insertLog({
        referenceId: logsReferenceIds,
        err: false,
        log: 'BOTs execution started for script ' + botsScriptDetails.id,
        timestamp: new Date().getTime()
    });
    var botAuditTrailObj = {
        botId: botsScriptDetails._id,
        actionId: actionId
    }
    callback(null, botAuditTrailObj);
    if(botsScriptDetails.params && botsScriptDetails.params.length > 0) {
        for (var j = 0; j < botsScriptDetails.params.length; j++) {
            var decryptedText = cryptography.decryptText(botsScriptDetails.params[j], cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            Object.keys(botsScriptDetails.inputFormFields[j]).forEach(function(key){
                if(botsScriptDetails.inputFormFields[j][key] === null) {
                    replaceTextObj[key] = decryptedText;
                }
            });
        }
    }else{
        for (var j = 0; j < botsScriptDetails.inputFormFields.length; j++) {
            Object.keys(botsScriptDetails.inputFormFields[j]).forEach(function (key) {
                if (botsScriptDetails.inputFormFields[j][key] === null) {
                    replaceTextObj[key] = botsScriptDetails.inputFormFields[j].default;
                }
            });
        }
    }
    var supertest = require("supertest");
    var server = supertest.agent("http://" + pythonHost + ':' + pythonPort);
    var reqBody = {
        "data": replaceTextObj,
        "executionType": executionType
    };
    console.log(reqBody);
    console.log(botsScriptDetails.id);
    var executorUrl = '/bot/' + botsScriptDetails.id + '/exec';
    server
        .post(executorUrl)
        .send(reqBody)
        .set({'Content-Type': 'application/json'})
        .end(function (err, resObj) {
            if (err) {
                logger.error(err);
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
                auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                    if (err) {
                        logger.error("Failed to create or update bots Log: ", err);
                    }
                    return;
                });
            } else {
                console.log("link>>>>",resObj.link);
                server
                    .get(resObj.link)
                    .end(function (err, res) {
                        if(err) {
                            logger.error(err);
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
                                return;
                            });
                        }else {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: res.status.text,
                                timestamp: timestampEnded
                            });
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: 'BOTs execution success for  ' + botsScriptDetails.id,
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
                                return;
                            });
                        }
                    });
            }
        })
};

function  executeOnEnv(botsScriptDetails,auditTrail,nodeIds,userName,executionType,callback){
    var actionLogId = uuid.v4();
    var count = 0;
    for(var i = 0 ;i < nodeIds.length; i++) {
        (function (nodeId) {
            instanceModel.getInstanceById(nodeId, function (err, instances) {
                if (err) {
                    logger.error("Issue with fetching instances By Id ", nodeId, err);
                    callback(err, null);
                    return;
                } else if (instances.length > 0) {
                    var instance = instances[0]
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
                        count++;
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
                        if (count === instances.length) {
                            var resultTaskExecution = {
                                "actionStatus": 'failed',
                                "status": 'failed',
                                "endedOn": new Date().getTime(),
                                "actionLogId": actionLogId
                            };
                            auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                if (err) {
                                    logger.error("Failed to create or update bots Log: ", err);
                                }
                                return;
                            });
                        }
                        return;
                    }
                    credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                        var sshOptions = {
                            username: decryptedCredentials.username,
                            host: instance.instanceIP,
                            port: 22
                        }
                        if (decryptedCredentials.pemFileLocation) {
                            sshOptions.privateKey = decryptedCredentials.pemFileLocation;
                        } else {
                            sshOptions.password = decryptedCredentials.password;
                        }
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                        var gitHubDirPath = appConfig.gitHubDir + botsScriptDetails.gitHubRepoName;
                        var scp = new SCP(sshOptions);
                        count++;
                        var replaceTextObj = {};
                        sshOptions.os = instance.hardware.os;
                        for (var j = 0; j < botsScriptDetails.execution.length; j++) {
                            (function (scriptObj) {
                                fileHound.create()
                                    .paths(gitHubDirPath)
                                    .match(scriptObj.start)
                                    .ext('sh')
                                    .find().then(function (files) {
                                    scp.upload(files[0], '/tmp', function (err) {
                                        if (err) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: "Unable to upload script file " + scriptObj.start,
                                                timestamp: timestampEnded
                                            });
                                            instanceModel.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLog.logs = {
                                                err: false,
                                                log: "Unable to upload script file " + script.name,
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            if (count === nodeIds.length) {
                                                var resultTaskExecution = {
                                                    "actionStatus": 'failed',
                                                    "status": 'failed',
                                                    "endedOn": new Date().getTime(),
                                                    "actionLogId": actionLogId
                                                };
                                                auditTrailService.updateAuditTrail('BOTsNew', auditTrail._id, resultTaskExecution, function (err, data) {
                                                    if (err) {
                                                        logger.error("Failed to create or update bots Log: ", err);
                                                    }
                                                    return;
                                                });
                                            }
                                            return;
                                        }
                                        if(botsScriptDetails.params && botsScriptDetails.params.length > 0) {
                                            for (var k = 0; k < botsScriptDetails.params.length; k++) {
                                                var decryptedText = cryptography.decryptText(botsScriptDetails.params[k], cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                                                Object.keys(botsScriptDetails.inputFormFields[k]).forEach(function(key){
                                                    if(botsScriptDetails.inputFormFields[k][key] === null) {
                                                        replaceTextObj[key] = decryptedText;
                                                    }
                                                });
                                            }
                                        }else{
                                            for (var k = 0; k < botsScriptDetails.inputFormFields.length; k++) {
                                                Object.keys(botsScriptDetails.inputFormFields[k]).forEach(function (key) {
                                                    if (botsScriptDetails.inputFormFields[k][key] === null) {
                                                        replaceTextObj[key] = botsScriptDetails.inputFormFields[k].default;
                                                    }
                                                });
                                            }
                                        }
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: false,
                                            log: 'BOTs execution started for script ' + scriptObj.start,
                                            timestamp: new Date().getTime()
                                        });
                                        var botAuditTrailObj = {
                                            botId: botsScriptDetails._id,
                                            actionId: actionLogId
                                        }
                                        callback(null, botAuditTrailObj);
                                        var supertest = require("supertest");
                                        var server = supertest.agent("http://"+pythonHost+':'+pythonPort);
                                        var reqBody = {
                                            "scriptDetails": {
                                                "params":replaceTextObj,
                                                "execution":scriptObj,
                                                "type":'script',
                                                "scriptFile":files[0],
                                                "executionType":executionType
                                            },
                                            "env": sshOptions
                                        };
                                        var executorUrl = '/bot/'+botsScriptDetails.id+'/exec';
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
                                                        log: "Error in Script executor: ",
                                                        timestamp: timestampEnded
                                                    });
                                                    if(count === nodeIds.length) {
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
                                                            return;
                                                        });
                                                    }
                                                }else{
                                                    var timestampEnded = new Date().getTime();
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: res,
                                                        timestamp: timestampEnded
                                                    });
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: 'BOTs execution success for  ' + botsScriptDetails.id,
                                                        timestamp: timestampEnded
                                                    });
                                                    if(count === nodeIds.length) {
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
                                                            return;
                                                        });
                                                    }
                                                }
                                            })
                                    })

                                })
                            })(botsScriptDetails.execution[j])
                        }
                    });
                }
            })
        })(nodeIds[i])
    }
}











