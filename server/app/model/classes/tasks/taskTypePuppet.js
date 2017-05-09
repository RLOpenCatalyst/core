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
var ObjectId = require('mongoose').Types.ObjectId;
var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var credentialCryptography = require('_pr/lib/credentialcryptography')
var fileIo = require('_pr/lib/utils/fileio');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Puppet = require('_pr/lib/puppet');
var taskTypeSchema = require('./taskTypeSchema');
var utils = require('_pr/model/classes/utils/utils.js');
var masterUtil = require('_pr/lib/utils/masterUtil');
var puppetTaskSchema = taskTypeSchema.extend({
    _id:false,
    nodeIds: [String],
});

//Instance Methods :- getNodes
puppetTaskSchema.methods.getNodes = function() {
    return this.nodeIds;

};

// Instance Method :- run task
puppetTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData,blueprintIds, onExecute, onComplete) {
    var self = this;


    var instanceIds = this.nodeIds;
    if (!(instanceIds && instanceIds.length)) {
        if (typeof onExecute === 'function') {
            onExecute({
                message: "Empty Node List"
            }, null);
        }
        return;
    }
    instancesDao.getInstances(instanceIds, function(err, instances) {
        if (err) {
            logger.error(err);
            if (typeof onExecute === 'function') {
                onExecute(err, null);
            }
            return;
        }
        var count = 0;
        var overallStatus = 0;
        var instanceResultList = [];
        var executionIds = [];

        function instanceOnCompleteHandler(err, status, instanceId, executionId, actionId) {
            logger.debug('Instance onComplete fired', count, instances.length);
            count++;
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
            if (!(count < instances.length)) {
                logger.debug('Type of onComplete: ' + typeof onComplete);
                if (typeof onComplete === 'function') {
                    onComplete(null, overallStatus, {
                        instancesResults: instanceResultList
                    });
                }
            }
        }
        for (var i = 0; i < instances.length; i++) {
            (function(instance) {
                var timestampStarted = new Date().getTime();
                var actionLog = instancesDao.insertOrchestrationActionLog(instance._id, null, userName, timestampStarted);
                instance.tempActionLogId = actionLog._id;
                if (!instance.instanceIP) {
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        instanceId:instance._id,
                        instanceRefId:actionLog._id,
                        err: true,
                        log: "Instance IP is not defined. Puppet Client run failed",
                        timestamp: timestampEnded
                    });
                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                    instanceOnCompleteHandler({
                        message: "Instance IP is not defined. Puppet Client run failed"
                    }, 1, instance._id, null, actionLog._id);
                    return;
                }
                if (!instance.puppet.serverId) {
                    var timestampEnded = new Date().getTime();
                    logsDao.insertLog({
                        instanceId:instance._id,
                        instanceRefId:actionLog._id,
                        err: true,
                        log: "puppet server id is not defined. Puppet Client run failed",
                        timestamp: timestampEnded
                    });
                    instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                    instanceOnCompleteHandler({
                        message: "puppet server id is not defined. Puppet Client run failed"
                    }, 1, instance._id, null, actionLog._id);
                    return;
                }
                masterUtil.getCongifMgmtsById(instance.puppet.serverId, function(err, infraManagerDetails) {

                    if (err) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            instanceId:instance._id,
                            instanceRefId:actionLog._id,
                            err: true,
                            log: "Puppet Data Corrupted. Puppet Client run failed",
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                        return;
                    }
                    if (!infraManagerDetails) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            instanceId:instance._id,
                            instanceRefId:actionLog._id,
                            err: true,
                            log: "Puppet Data Corrupted. Puppet Client run failed",
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                        instanceOnCompleteHandler({
                            message: "Puppet Data Corrupted. Puppet Client run failed"
                        }, 1, instance._id, null, actionLog._id);
                        return;
                    }
                    //decrypting pem file
                    credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
                        if (err) {
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                instanceId:instance._id,
                                instanceRefId:actionLog._id,
                                err: true,
                                log: "Unable to decrypt pem file. Chef run failed",
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                            instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                            return;
                        }

                        var puppetSettings = {
                            host: infraManagerDetails.hostname,
                            username: infraManagerDetails.username,
                        };
                        if (infraManagerDetails.pemFileLocation) {
                            puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
                        } else {
                            puppetSettings.password = infraManagerDetails.puppetpassword;
                        }
                        logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
                        var runOptions = {
                            username: decryptedCredentials.username,
                            host: instance.instanceIP,
                            port: 22,
                        }

                        if (decryptedCredentials.pemFileLocation) {
                            runOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
                        } else {
                            runOptions.password = decryptedCredentials.password;
                        }

                        var infraManager = new Puppet(puppetSettings);


                        logsDao.insertLog({
                            instanceId:instance._id,
                            instanceRefId:actionLog._id,
                            err: false,
                            log: "Executing Task",
                            timestamp: new Date().getTime()
                        });
                        infraManager.runClient(runOptions, function(err, retCode) {
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
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: true,
                                    log: 'Unable to run puppet-agent',
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                                instanceOnCompleteHandler(err, 1, instance._id, null, actionLog._id);
                                return;
                            }
                            if (retCode == 0) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: false,
                                    log: 'Task execution success',
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, true, timestampEnded);
                                instanceOnCompleteHandler(null, 0, instance._id, null, actionLog._id);
                            } else {
                                instanceOnCompleteHandler(null, retCode, instance._id, null, actionLog._id);
                                if (retCode === -5000) {
                                    logsDao.insertLog({
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: true,
                                        log: 'Host Unreachable',
                                        timestamp: new Date().getTime()
                                    });
                                } else if (retCode === -5001) {
                                    logsDao.insertLog({
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: true,
                                        log: 'Invalid credentials',
                                        timestamp: new Date().getTime()
                                    });
                                } else {
                                    logsDao.insertLog({
                                        instanceId:instance._id,
                                        instanceRefId:actionLog._id,
                                        err: true,
                                        log: 'Unknown error occured. ret code = ' + retCode,
                                        timestamp: new Date().getTime()
                                    });
                                }
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    instanceId:instance._id,
                                    instanceRefId:actionLog._id,
                                    err: true,
                                    log: 'Error in running puppet-agent',
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance._id, actionLog._id, false, timestampEnded);
                            }
                        }, function(stdOutData) {
                            logsDao.insertLog({
                                instanceId:instance._id,
                                instanceRefId:actionLog._id,
                                err: false,
                                log: stdOutData.toString('ascii'),
                                timestamp: new Date().getTime()
                            });
                        }, function(stdOutErr) {
                            logsDao.insertLog({
                                instanceId:instance._id,
                                instanceRefId:actionLog._id,
                                err: true,
                                log: stdOutErr.toString('ascii'),
                                timestamp: new Date().getTime()
                            });
                        });
                    });

                });


            })(instances[i]);
        }

        if (typeof onExecute === 'function') {
            onExecute(null, {
                instances: instances,
            });
        }
    });
};

var PuppetTask = mongoose.model('puppetTask', puppetTaskSchema);

module.exports = PuppetTask;