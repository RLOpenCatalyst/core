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


var instancesDao = require('_pr/model/classes/instance/instance.js');
var shellClient = require('_pr/lib/utils/sshshell');
var logger = require('_pr/logger')(module);
var logsDao = require('_pr/model/dao/logsdao.js');

var crontab = require('node-crontab');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var VmwareCloud = require('_pr/lib/vmware.js');

var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var EC2 = require('_pr/lib/ec2.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');


module.exports.setRoutes = function(socketIo) {

    var sshShell = socketIo.of('/sshShell');

    var socketList = [];

    sshShell.on('connection', function(socket) {
        socketList.push[socket];
        //logger.debug('socket ==>',socket);
        socket.on('open', function(instanceData) {

            instancesDao.getInstanceById(instanceData.id, function(err, instances) {
                logger.debug(instanceData.id);
                if (err) {
                    logger.error(err);
                    socket.emit('conErr', {
                        message: "Invalid instance Id"
                    });
                    return;
                }
                if (!instances.length) {
                    socket.emit('conErr', {
                        message: "Invalid instance Id"
                    });
                    return;
                }
                var instance = instances[0]
                    // create ssh session with the instance
                var timestampStarted = new Date().getTime();

                var actionLog = instancesDao.insertSSHActionLog(instance._id, instanceData.username, instanceData.sessionUser, timestampStarted);

                var logReferenceIds = [instance._id];

                logReferenceIds.push(actionLog._id);
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: false,
                    log: "Initiating SSH Shell Connection",
                    timestamp: timestampStarted
                });
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
                    user: instanceData.sessionUser,
                    createdOn: new Date().getTime(),
                    startedOn: new Date().getTime(),
                    providerType: instance.providerType,
                    action: "SSH",
                    logs: []
                };

                shellClient.open({
                    host: instance.instanceIP,
                    port: 22,
                    username: instanceData.username,
                    password: instanceData.password,
                    pemFileData: instanceData.pemFileData
                }, function(err, shell) {
                    var timestampEnded = new Date().getTime();
                    if (err) {
                        socket.shellInstance = null;
                        logger.debug("error ==>", err);
                        if (err.errCode === -5000) {
                            socket.emit('conErr', {
                                message: "Host Unreachable",
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "Host Unreachable",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "Host Unreachable",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else if (err.errCode === -5001) {
                            socket.emit('conErr', {
                                message: "The username or password/pemfile you entered is incorrect",
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "The username or password/pemfile you entered is incorrect",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "The username or password/pemfile you entered is incorrect",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else {
                            socket.emit('conErr', {
                                message: "Unable to connect to instance, error code = " + err.errCode,
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "Unable to connect to instance, error code = " + err.errCode + ".",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "Unable to connect to instance, error code = " + err.errCode + ".",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        }
                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        return;
                    }
                    socket.shellInstance = shell;

                    shell.on('data', function(data) {
                        socket.emit('out', {
                            res: data
                        });
                    });
                    shell.on('close', function() {
                        socket.shellInstance = null;
                        socket.emit('close');
                    });
                    shell.on('end', function() {
                        socket.shellInstance = null;
                        socket.emit('close');
                    });

                    shell.on('error', function(err) {
                        socket.shellInstance = null;
                        if (err.errCode === -5000) {
                            socket.emit('conErr', {
                                message: "Host Unreachable",
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "Host Unreachable",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "Host Unreachable",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else if (err.errCode === -5001) {
                            socket.emit('conErr', {
                                message: "The username or password/pemfile you entered is incorrect",
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "The username or password/pemfile you entered is incorrect",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "The username or password/pemfile you entered is incorrect",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else {
                            socket.emit('conErr', {
                                message: "Something went wrong, error code = " + err.errCode,
                                actionLogId: actionLog._id
                            });
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: "Something went wrong, error code = " + err.errCode + ".",
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: "Something went wrong, error code = " + err.errCode + ".",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        }
                    });

                    if (instanceData.dockerContainerId) {
                        shell.write('sudo docker exec -it ' + instanceData.dockerContainerId + ' /bin/bash \r');
                        socket.emit('opened', {
                            actionLogId: actionLog._id
                        });

                    } else {
                        socket.emit('opened', {
                            actionLogId: actionLog._id
                        });
                    }

                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: false,
                        log: "SSH Shell initiated",
                        timestamp: timestampEnded
                    });
                    instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                    instanceLog.endedOn = new Date().getTime();
                    instanceLog.actionStatus = "success";
                    instanceLog.logs = {
                        err: false,
                        log: "SSH Shell initiated",
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                });
            });
        });

        socket.on('cmd', function(data) {

            if (socket.shellInstance) {

                socket.shellInstance.write(data);
            }
        });

        socket.on('close', function() {
            if (socket.shellInstance) {
                socket.shellInstance.close();
                socket.shellInstance = null;
            }
        });

        socket.on('disconnect', function() {
            if (socket.shellInstance) {
                socket.shellInstance.close();
                socket.shellInstance = null;
            }
        });

    });



};
