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
var instancesDao = require('_pr/model/classes/instance/instance.js');
var scriptService = require('_pr/services/scriptService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var credentialCryptography = require('_pr/lib/credentialcryptography')
var Chef = require('_pr/lib/chef');
var taskTypeSchema = require('_pr/model/classes/tasks/taskTypeSchema');
var SSHExec = require('_pr/lib/utils/sshexec');
var SCP = require('_pr/lib/utils/scp');
var appConfig = require('_pr/config');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var Cryptography = require('_pr/lib/utils/cryptography');

var scriptTaskSchema = taskTypeSchema.extend({
    _id: false,
    nodeIds: [String],
    scriptTypeName: String,
    isSudo: {
        type: Boolean,
        required: false,
        default: false
    },
    scriptDetails: [{
        scriptId: {
            type: String,
            required: true
        },
        scriptParameters: [{
            paramVal:{
                type: String,
                required: false
            },
            paramDesc:{
                type: String,
                required: false
            },
            paramType:{
                type: String,
                required: false
            }
        }]
    }]
});

scriptTaskSchema.methods.getNodes = function() {
    return this.nodeIds;
};

scriptTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    var self = this;
    var instanceIds = this.nodeIds;
    var sudoFlag = this.isSudo;
    var scriptDetails = this.scriptDetails;
    var instanceResultList = [];
    function getInstances(instanceIds, tagServer, callback) {
        if ((typeof tagServer === 'string' && tagServer === 'undefined') || typeof tagServer === 'undefined') {
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
        } else {
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
        }
    }
    getInstances(instanceIds, self.botTagServer, function (err, instances) {
        if (err) {
            logger.error(err);
            return;
        }
        for (var i = 0; i < instances.length; i++) {
            (function (instance) {
                var timestampStarted = new Date().getTime();
                var actionLog = instancesDao.insertOrchestrationActionLog(instance._id, null, userName, timestampStarted);
                instance.tempActionLogId = actionLog._id;
                var logsReferenceIds = [instance._id, actionLog._id];
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
                    action: "Script-Execution",
                    logs: []
                };
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

                    instanceOnCompleteHandler({
                        message: "Instance IP is not defined. Chef Client run failed"
                    }, 1, instance._id, null, actionLog._id);
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
                    for (var j = 0; j < scriptDetails.length; j++) {
                        (function (script) {
                            scriptService.getScriptById(script.scriptId, function (err, scripts) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                } else if (!scripts.file) {
                                    logger.debug("There is no script belong to instance : " + instance.instanceIP);
                                    return;
                                } else {
                                    if (scripts.type === 'Bash') {
                                        logsDao.insertLog({
                                            instanceId:instance._id,
                                            instanceRefId:actionLog._id,
                                            err: false,
                                            log: "Task Execution has started",
                                            timestamp: timestampEnded
                                        });
                                        var params = script.scriptParameters;
                                        executeScriptOnNode(scripts, sshOptions, instance._id,actionLog._id, params, instanceLog,'bash');
                                    } else if (scripts.type === 'Python') {
                                        var params = script.scriptParameters;
                                        executeScriptOnNode(scripts, sshOptions,instance._id, actionLog._id, params, instanceLog,'python');
                                    } else {
                                        return;
                                    }
                                }
                            })
                        })(scriptDetails[j]);
                    }
                });
            })(instances[i]);
        }
        if (typeof onExecute === 'function') {
            onExecute(null, {
                instances: instances,
            });
        }
    })

    function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
        var overallStatus = 0;
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
        if (instanceResultList.length === scriptDetails.length) {
            logger.debug('Type of onComplete: ' + typeof onComplete);
            if (typeof onComplete === 'function') {
                onComplete(null, overallStatus, {
                    instances: instanceResultList
                });
            }
        }
    }

    function executeScriptOnNode(script, sshOptions, instanceId,actionId, scriptParameters, instanceLog,scriptType) {
        var fileName = uuid.v4() + '_' + script.fileName
        var desPath = appConfig.scriptDir + fileName;
        var sshExec = new SSHExec(sshOptions);
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        fileIo.writeFile(desPath, script.file, false, function (err) {
            if (err) {
                logger.error("Unable to write file");
                return;
            } else {
                var scp = new SCP(sshOptions);
                scp.upload(desPath, '/tmp', function (err) {
                    if (err) {
                        logger.error(err);
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            instanceId:instanceId,
                            instanceRefId:actionId,
                            err: true,
                            log: "Unable to upload script file " + script.name,
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(instanceId, actionId, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLog.logs = {
                            err: false,
                            log: "Unable to upload script file " + script.name,
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        instanceOnCompleteHandler(err, 1, instanceId, null, actionId);
                        return;
                    }
                    var cmd = '';
                    if (sudoFlag === true && sshOptions.password) {
                        cmd = 'echo '+sshOptions.password+' | sudo -S ' + scriptType + ' /tmp/' + fileName;
                    } else if(sudoFlag === true){
                        cmd = 'sudo ' + scriptType + ' /tmp/' + fileName;
                    } else {
                        cmd = scriptType +' /tmp/' + fileName;
                    }
                    for (var j = 0; j < scriptParameters.length; j++) {
                        var decryptedText = cryptography.decryptText(scriptParameters[j].paramVal, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        cmd = cmd + ' "' + decryptedText + '"';
                    }
                    sshExec.exec(cmd, function (err, retCode) {
                        if (err) {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                instanceId:instanceId,
                                instanceRefId:actionId,
                                err: true,
                                log: 'Unable to run script ' + script.name,
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionId, false, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: false,
                                log: 'Unable to run script ' + script.name,
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            instanceOnCompleteHandler(err, 1, instanceId, null, actionId);
                            removeScriptFile(desPath);
                            return;
                        }
                        if (retCode == 0) {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                instanceId:instanceId,
                                instanceRefId:actionId,
                                err: false,
                                log: 'Task execution success for script ' + script.name,
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionId, true, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "success";
                            instanceLog.logs = {
                                err: false,
                                log: 'Task execution success for script ' + script.name,
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            instanceOnCompleteHandler(null, 0, instanceId, null, actionId);
                            removeScriptFile(desPath);
                            return;
                        } else {
                            instanceOnCompleteHandler(null, retCode, instanceId, null, actionId);
                            if (retCode === -5000) {
                                logsDao.insertLog({
                                    instanceId:instanceId,
                                    instanceRefId:actionId,
                                    err: true,
                                    log: 'Host Unreachable',
                                    timestamp: new Date().getTime()
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Host Unreachable',
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                removeScriptFile(desPath);
                                return;
                            } else if (retCode === -5001) {
                                logsDao.insertLog({
                                    instanceId:instanceId,
                                    instanceRefId:actionId,
                                    err: true,
                                    log: 'Invalid credentials',
                                    timestamp: new Date().getTime()
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Invalid credentials',
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                removeScriptFile(desPath);
                                return;
                            } else {
                                logsDao.insertLog({
                                    instanceId:instanceId,
                                    instanceRefId:actionId,
                                    err: true,
                                    log: 'Unknown error occured. ret code = ' + retCode,
                                    timestamp: new Date().getTime()
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Unknown error occured. ret code = ' + retCode,
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                removeScriptFile(desPath);
                                return;
                            }
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                instanceId:instanceId,
                                instanceRefId:actionId,
                                err: true,
                                log: 'Error in running script ' + script.name,
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionId, false, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: false,
                                log: 'Error in running script ' + script.name,
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            removeScriptFile(desPath);
                            return;
                        }
                    }, function (stdOut) {
                        console.log(stdOut.toString('ascii'));
                        logsDao.insertLog({
                            instanceId:instanceId,
                            instanceRefId:actionId,
                            err: false,
                            log: stdOut.toString('ascii'),
                            timestamp: new Date().getTime()
                        });
                        instanceLog.logs = {
                            err: false,
                            log: stdOut.toString('ascii'),
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                    }, function (stdErr) {
                        console.log(stdErr.toString('ascii'));
                        logsDao.insertLog({
                            instanceId:instanceId,
                            instanceRefId:actionId,
                            err: true,
                            log: stdErr.toString('ascii'),
                            timestamp: new Date().getTime()
                        });
                        instanceLog.logs = {
                            err: false,
                            log: stdErr.toString('ascii'),
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionId, instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                    });
                })
            }
            ;
        });
    };
}


function removeScriptFile(filePath) {
    fileIo.removeFile(filePath, function(err, result) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.debug("Successfully Remove file");
            return
        }
    })
}

var ScriptTask = mongoose.model('scriptTask', scriptTaskSchema);
module.exports = ScriptTask;