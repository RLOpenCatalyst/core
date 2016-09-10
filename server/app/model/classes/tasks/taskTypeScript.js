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

var scriptTaskSchema = taskTypeSchema.extend({
    nodeIds: [String],
    scriptTypeName: String,
    scriptDetails: [{
        scriptId: {
            type: String,
            requred: true
        },
        scriptParameters: [String]
    }],
    executionOrder: String
});

scriptTaskSchema.methods.getNodes = function() {
    return this.nodeIds;
};

scriptTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    logger.debug("===================== this.executionOrder========= ", JSON.stringify(this));
    var self = this;
    if (this.executionOrder === "SERIAL") {
        // SERIAL EXECUTION
        serialExecution(self, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete);
    } else {
        // PARALLEL EXECUTION
        var instanceIds = this.nodeIds;
        var scriptDetails = this.scriptDetails;
        if (!(instanceIds && instanceIds.length)) {
            if (typeof onExecute === 'function') {
                onExecute({
                    message: "Empty Instance List"
                }, null);
            }
            return;
        }
        instancesDao.getInstances(instanceIds, function(err, instances) {
            if (err) {
                logger.error(err);
                return;
            }
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
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
                            referenceId: logsReferenceIds,
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
                        instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });

                        instanceOnCompleteHandler({ message: "Instance IP is not defined. Chef Client run failed" }, 1, instance._id, null, actionLog._id);
                        return;
                    }
                    credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
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
                            (function(script) {
                                scriptService.getScriptById(script.scriptId, function(err, scripts) {
                                    if (err) {
                                        logger.error(err);
                                        return;
                                    } else if (!scripts.file) {
                                        logger.debug("There is no script belong to instance : " + instance.instanceIP);
                                        return;
                                    } else {
                                        if (scripts.type === 'Bash') {
                                            executeBashScript(scripts, sshOptions, logsReferenceIds, script.scriptParameters, instanceLog);
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
        });

        function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
            var overallStatus = 0;
            var instanceResultList = [];
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

        function executeBashScript(script, sshOptions, logsReferenceIds, scriptParameters, instanceLog) {
            var fileName = uuid.v4() + '_' + script.fileName
            var desPath = appConfig.scriptDir + fileName;
            var sshExec = new SSHExec(sshOptions);
            fileIo.writeFile(desPath, script.file, false, function(err) {
                if (err) {
                    logger.error("Unable to write file");
                    return;
                } else {
                    var scp = new SCP(sshOptions);
                    scp.upload(desPath, '/tmp', function(err) {
                        if (err) {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: true,
                                log: "Unable to upload script file " + script.name,
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: false,
                                log: "Unable to upload script file " + script.name,
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            instanceOnCompleteHandler(err, 1, logsReferenceIds[0], null, logsReferenceIds[1]);
                            return;
                        }
                        var cmdLine = 'bash /tmp/' + fileName;
                        if (scriptParameters.length > 0) {
                            for (var j = 0; j < scriptParameters.length; j++) {
                                cmdLine = cmdLine + ' "' + scriptParameters[j] + '"';
                            }
                        }
                        sshExec.exec(cmdLine, function(err, retCode) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: 'Unable to run script ' + script.name,
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Unable to run script ' + script.name,
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                instanceOnCompleteHandler(err, 1, logsReferenceIds[0], null, logsReferenceIds[1]);
                                removeScriptFile(desPath);
                                return;
                            }
                            if (retCode == 0) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: 'Task execution success for script ' + script.name,
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], true, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "success";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Task execution success for script ' + script.name,
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                instanceOnCompleteHandler(null, 0, logsReferenceIds[0], null, logsReferenceIds[1]);
                                removeScriptFile(desPath);
                                return;
                            } else {
                                instanceOnCompleteHandler(null, retCode, logsReferenceIds[0], null, logsReferenceIds[1]);
                                if (retCode === -5000) {
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
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
                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    removeScriptFile(desPath);
                                    return;
                                } else if (retCode === -5001) {
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
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
                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    removeScriptFile(desPath);
                                    return;
                                } else {
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
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
                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    removeScriptFile(desPath);
                                    return;
                                }
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: 'Error in running script ' + script.name,
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: 'Error in running script ' + script.name,
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                removeScriptFile(desPath);
                                return;
                            }
                        }, function(stdOut) {
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: stdOut.toString('ascii'),
                                timestamp: new Date().getTime()
                            });
                            instanceLog.logs = {
                                err: false,
                                log: stdOut.toString('ascii'),
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        }, function(stdErr) {
                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: true,
                                log: stdErr.toString('ascii'),
                                timestamp: new Date().getTime()
                            });
                            instanceLog.logs = {
                                err: false,
                                log: stdErr.toString('ascii'),
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        });
                    })
                };
            });
        };
    }
};

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

function serialExecution(self, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    var instanceIds = self.nodeIds;
    var scriptDetails = self.scriptDetails;
    if (!(instanceIds && instanceIds.length)) {
        if (typeof onExecute === 'function') {
            onExecute({
                message: "Empty Instance List"
            }, null);
        }
        return;
    }

    function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
        var overallStatus = 0;
        var instanceResultList = [];
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
    var instanceList = [];

    function ecuteTask(id, callback) {
        var obj = {};
        logger.debug("Executing script on: ", id + "    " + new Date().getTime());
        instancesDao.getInstanceById(id, function(err, instances) {
            if (err) {
                logger.error(err);
                if (typeof onExecute === 'function') {
                    onExecute(err, null);
                }
                return;
            }
            var instance = instances[0];
            instanceList.push(instance);
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
                    referenceId: logsReferenceIds,
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
                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });

                obj.instanceId = instance._id;
                obj.actionLogId = actionLog._id;
                obj.chefClientExecutionId = null;
                obj.message = "Instance IP is not defined. Chef Client run failed";
                obj.status = 1;
                return callback(obj, null);

                //instanceOnCompleteHandler({ message: "Instance IP is not defined. Chef Client run failed" }, 1, instance._id, null, actionLog._id);
                //return;
            }
            credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
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
                    (function(script) {
                        scriptService.getScriptById(script.scriptId, function(err, scripts) {
                            if (err) {
                                logger.error(err);
                                return;
                            } else if (!scripts.file) {
                                logger.debug("There is no script belong to instance : " + instance.instanceIP);
                                return;
                            } else {
                                if (scripts.type === 'Bash') {
                                    // script, sshOptions, logsReferenceIds, scriptParameters, instanceLog
                                    //executeBashScript(scripts, sshOptions, logsReferenceIds, script.scriptParameters, instanceLog);
                                    // Execute Bash Script
                                    var script = scripts;
                                    var scriptParameters = script.scriptParameters;
                                    var fileName = uuid.v4() + '_' + script.fileName
                                    var desPath = appConfig.scriptDir + fileName;
                                    var sshExec = new SSHExec(sshOptions);
                                    fileIo.writeFile(desPath, script.file, false, function(err) {
                                        if (err) {
                                            logger.error("Unable to write file");
                                            return;
                                        } else {
                                            var scp = new SCP(sshOptions);
                                            scp.upload(desPath, '/tmp', function(err) {
                                                if (err) {
                                                    var timestampEnded = new Date().getTime();
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: "Unable to upload script file " + script.name,
                                                        timestamp: timestampEnded
                                                    });
                                                    instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                                    instanceLog.endedOn = new Date().getTime();
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: false,
                                                        log: "Unable to upload script file " + script.name,
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });

                                                    obj.message = "Unable to upload script file";
                                                    obj.status = 1;
                                                    obj.instanceId = logsReferenceIds[0];
                                                    obj.chefClientExecutionId = null;
                                                    obj.actionLogId = logsReferenceIds[1];
                                                    return callback(obj, null);

                                                    //instanceOnCompleteHandler(err, 1, logsReferenceIds[0], null, logsReferenceIds[1]);
                                                    //return;
                                                }
                                                var cmdLine = 'bash /tmp/' + fileName;
                                                if (scriptParameters && scriptParameters.length) {
                                                    if (scriptParameters.length > 0) {
                                                        for (var j = 0; j < scriptParameters.length; j++) {
                                                            cmdLine = cmdLine + ' "' + scriptParameters[j] + '"';
                                                        }
                                                    }
                                                }

                                                sshExec.exec(cmdLine, function(err, retCode) {
                                                    if (err) {
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: true,
                                                            log: 'Unable to run script ' + script.name,
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "failed";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: 'Unable to run script ' + script.name,
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        //instanceOnCompleteHandler(err, 1, logsReferenceIds[0], null, logsReferenceIds[1]);
                                                        removeScriptFile(desPath);
                                                        obj.message = "Unable to run script";
                                                        obj.status = 1;
                                                        obj.instanceId = logsReferenceIds[0];
                                                        obj.chefClientExecutionId = null;
                                                        obj.actionLogId = logsReferenceIds[1];
                                                        return callback(obj, null);
                                                        //return;
                                                    }
                                                    if (retCode == 0) {
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: false,
                                                            log: 'Task execution success for script ' + script.name,
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], true, timestampEnded);
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "success";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: 'Task execution success for script ' + script.name,
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        logger.debug("Task execution success for script");
                                                        //instanceOnCompleteHandler(null, 0, logsReferenceIds[0], null, logsReferenceIds[1]);
                                                        removeScriptFile(desPath);
                                                        obj.message = "Task execution success for script";
                                                        obj.status = 0;
                                                        obj.instanceId = logsReferenceIds[0];
                                                        obj.chefClientExecutionId = null;
                                                        obj.actionLogId = logsReferenceIds[1];
                                                        return callback(null, obj);
                                                        //return;
                                                    } else {
                                                        //instanceOnCompleteHandler(null, retCode, logsReferenceIds[0], null, logsReferenceIds[1]);
                                                        if (retCode === -5000) {
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
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
                                                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            removeScriptFile(desPath);
                                                            obj.message = "Host Unreachable";
                                                            obj.status = 1;
                                                            obj.instanceId = logsReferenceIds[0];
                                                            obj.chefClientExecutionId = null;
                                                            obj.actionLogId = logsReferenceIds[1];
                                                            return callback(obj, null);
                                                            //return;
                                                        } else if (retCode === -5001) {
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
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
                                                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            removeScriptFile(desPath);
                                                            obj.message = "Invalid credentials";
                                                            obj.status = 1;
                                                            obj.instanceId = logsReferenceIds[0];
                                                            obj.chefClientExecutionId = null;
                                                            obj.actionLogId = logsReferenceIds[1];
                                                            return callback(obj, null);
                                                        } else {
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
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
                                                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            removeScriptFile(desPath);
                                                            return;
                                                        }
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: true,
                                                            log: 'Error in running script ' + script.name,
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(logsReferenceIds[0], logsReferenceIds[1], false, timestampEnded);
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "failed";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: 'Error in running script ' + script.name,
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        removeScriptFile(desPath);
                                                        obj.message = "Error in running script";
                                                        obj.status = 1;
                                                        obj.instanceId = logsReferenceIds[0];
                                                        obj.chefClientExecutionId = null;
                                                        obj.actionLogId = logsReferenceIds[1];
                                                        return callback(obj, null);
                                                    }
                                                }, function(stdOut) {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: stdOut.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.logs = {
                                                        err: false,
                                                        log: stdOut.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                }, function(stdErr) {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: stdErr.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.logs = {
                                                        err: false,
                                                        log: stdErr.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function(err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                });
                                            })
                                        };
                                    });
                                } else {
                                    return;
                                }
                            }
                        })
                    })(scriptDetails[j]);
                }
            });
            /*if (flag) {
                if (typeof onExecute === 'function') {
                    onExecute(null, {
                        instances: [instance]
                    });
                    return;
                }
            }*/
        });
    };

    var count1 = 0;

    function taskComplete(err, obj) {
        count1++;
        if (err) {
            if (typeof onExecute === 'function') {
                onExecute(null, {
                    instances: instanceList
                });
            }
            instanceOnCompleteHandler(err.message, 1, err.instanceId, err.chefClientExecutionId, err.actionLogId);
            logger.debug("Encountered with Error: ", err);
            return;
        }
        if (count1 < instanceIds.length) {
            logger.debug("execute with task: ");
            ecuteTask(instanceIds[count1], taskComplete);
        } else {
            logger.debug("Task success");
            if (typeof onExecute === 'function') {
                onExecute(null, {
                    instances: instanceList
                });
            }
            instanceOnCompleteHandler(null, 0, obj.instanceId, obj.chefClientExecutionId, obj.actionLogId);
        }
    }
    ecuteTask(instanceIds[count1], taskComplete);
};

var ScriptTask = mongoose.model('scriptTask', scriptTaskSchema);
module.exports = ScriptTask;
