
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
var botsDao = require('_pr/model/bots/1.1/botsDao.js');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var fileIo = require('_pr/lib/utils/fileio');
const fileHound= require('filehound');

const errorType = 'executor';

var executor = module.exports = {};

executor.executeScriptBot = function executeScriptBot(botsDetails,callback) {
    if(botsDetails.env && botsDetails.env !== null){

    }
}


function executeScriptOnNode(script, sshOptions, logsReferenceIds, scriptParameters, instanceLog,scriptType) {
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
                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    instanceOnCompleteHandler(err, 1, logsReferenceIds[0], null, logsReferenceIds[1]);
                    return;
                }
                if (sudoFlag === true) {
                    var cmdLine = 'sudo '+scriptType+' /tmp/' + fileName;
                } else {
                    var cmdLine = scriptType +' /tmp/' + fileName;
                }
                for (var j = 0; j < scriptParameters.length; j++) {
                    var decryptedText = cryptography.decryptText(scriptParameters[j].paramVal, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    cmdLine = cmdLine + ' "' + decryptedText + '"';
                }
                sshExec.exec(cmdLine, function (err, retCode) {
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
                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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
                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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
                            instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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
                        instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        removeScriptFile(desPath);
                        return;
                    }
                }, function (stdOut) {
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
                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                }, function (stdErr) {
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
                    instanceLogModel.createOrUpdate(logsReferenceIds[1], logsReferenceIds[0], instanceLog, function (err, logData) {
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








