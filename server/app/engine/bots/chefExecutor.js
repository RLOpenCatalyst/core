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

const errorType = 'chefExecutor';

var pythonHost =  process.env.FORMAT_HOST || 'localhost';
var pythonPort =  process.env.FORMAT_PORT || '2687';
var chefExecutor = module.exports = {};

chefExecutor.execute = function execute(botsDetails,auditTrail,userName,executionType,callback) {
    var actionId = uuid.v4();
    var logsReferenceIds = [botsDetails._id, actionId];
    var botLogFile = appConfig.botLogDir + actionId;
    var fileName = 'botExecution.log';
    var winston = require('winston');
    var path = require('path');
    var mkdirp = require('mkdirp');
    var log_folder = path.normalize(botLogFile);
    mkdirp.sync(log_folder);
    var botLogger = new winston.Logger({
        transports: [
            new winston.transports.DailyRotateFile({
                level: 'debug',
                datePattern: '',
                filename: fileName,
                dirname:log_folder,
                handleExceptions: true,
                json: true,
                maxsize: 5242880,
                maxFiles: 5,
                colorize: true,
                timestamp:false,
                name:'bot-execution-log'
            }),
            new winston.transports.Console({
                level: 'debug',
                handleExceptions: true,
                json: false,
                colorize: true,
                name:'bot-console'
            })
        ],
        exitOnError: false
    });
    var replaceTextObj = {};
    for(var i = 0; i < botsDetails.nodeIds.length; i++){
        (function(instanceId){
            instanceModel.getInstanceById(instanceId,function(err,instances){
                if(err){
                    logger.error("Error in Fetching Instance. ",err);
                }
                var instance = instances[0];
                var timestampStarted = new Date().getTime();
                var actionLog = instanceModel.insertOrchestrationActionLog(instance._id, botsDetails.params.runList, userName, timestampStarted);
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
                    action: "Chef-Task-Run",
                    logs: []
                };
                var logsReferenceIds = [instance._id, actionLog._id];
                if (!instance.instanceIP) {
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        referenceId: logsReferenceIds,
                        err: true,
                        log: "Instance IP is not defined. Chef Client run failed",
                        timestamp: timestampEnded
                    });
                    botLogger.error("Instance IP is not defined. Chef Client run failed");
                    instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                    instanceLog.endedOn = new Date().getTime();
                    instanceLog.actionStatus = "failed";
                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                }
                configmgmtDao.getChefServerDetails(instance.chef.serverId, function(err, chefDetails) {
                    if (err) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: true,
                            log: "Chef Data Corrupted. Chef Client run failed",
                            timestamp: timestampEnded
                        });
                        botLogger.error("Chef Data Corrupted. Chef Client run failed");
                        instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                    }
                    if (!chefDetails) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: true,
                            log: "Chef Data Corrupted. Chef Client run failed",
                            timestamp: timestampEnded
                        });
                        botLogger.error("Chef Data Corrupted. Chef Client run failed");
                        instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                    }
                    credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
                        if (err) {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: true,
                                log: "Unable to decrypt pem file. Chef run failed",
                                timestamp: timestampEnded
                            });
                            botLogger.error("Unable to decrypt pem file. Chef run failed");
                            instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
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
                                botLogger.error("Unable to generate chef run execution id. Chef run failed");
                                instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                            }

                            var executionIdJsonAttributeObj = {
                                catalyst_attribute_handler: {
                                    catalystCallbackUrl: baseUrl + '/chefClientExecution/' + chefClientExecution.id
                                }
                            };
                            var attr = botsDetails.params.cookbookAttributes;
                            var objectArray = [];
                            for (var j = 0; j < attr.length; j++) {
                                objectArray.push(attr[j].jsonObj);
                            }
                            var attributeObj = utils.mergeObjects(objectArray);
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
                                runlist: botsDetails.params.runList,
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
                            botLogger.debug("Executing Task");
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
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: 'Unable to run chef-client',
                                        timestamp: timestampEnded
                                    });
                                    botLogger.error("Unable to run chef-client");
                                    instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.actionStatus = "failed";
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                }
                                if (retCode == 0) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: false,
                                        log: 'Task execution success',
                                        timestamp: timestampEnded
                                    });
                                    botLogger.debug("Task execution success");
                                    instanceModel.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.actionStatus = "success";
                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                } else {
                                    if (retCode === -5000) {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: 'Host Unreachable',
                                            timestamp: new Date().getTime()
                                        });
                                        botLogger.error("Host Unreachable");
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                    } else if (retCode === -5001) {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: 'Invalid credentials',
                                            timestamp: new Date().getTime()
                                        });
                                        botLogger.error('Invalid credentials');
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                    } else {
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: 'Unknown error occured. ret code = ' + retCode,
                                            timestamp: new Date().getTime()
                                        });
                                        botLogger.error('Unknown error occured. ret code = ' + retCode);
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
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: 'Error in running chef-client',
                                        timestamp: timestampEnded
                                    });
                                    botLogger.error('Error in running chef-client');
                                    instanceModel.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
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
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: stdOutData.toString('ascii'),
                                    timestamp: new Date().getTime()
                                });
                                botLogger.debug(stdOutData.toString('ascii'));
                            }, function(stdOutErr) {
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: stdOutErr.toString('ascii'),
                                    timestamp: new Date().getTime()
                                });
                                botLogger.error(stdOutErr.toString('ascii'));
                            });
                        });
                    });

                });
            })

        })(botsDetails.nodeIds[i]);
    }
};












