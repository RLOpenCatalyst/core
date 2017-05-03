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


var fileIo = require('./../lib/utils/fileio');
var SSH = require('./../lib/utils/sshexec');
var instancesDao = require('_pr/model/classes/instance/instance');
var credentialCrpto = require('./../lib/credentialcryptography.js');
var logger = require('_pr/logger')(module);

var Docker = function() {
    var that = this;
    this.runDockerCommands = function(cmd, instanceid, callback, callbackOnStdOut, callbackOnStdErr) {
        instancesDao.getInstanceById(instanceid, function(err, data) {
            if (err) {
                callback(err,null);
                return;
            }
            if (data.length) {
                logger.debug('reached docker cmd');
                var instanceoptions = data[0];
                credentialCrpto.decryptCredential(instanceoptions.credentials, function(err, decrptedCredentials) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    var options = {
                        host: instanceoptions.instanceIP,
                        port: '22',
                        username: decrptedCredentials.username, //'ec2-user',
                        privateKey: decrptedCredentials.pemFileLocation, //'/development/catalyst/D4DFE/D4D/config/catalyst.pem'
                        password: decrptedCredentials.password
                    };

                    var sshParamObj = {
                        host: options.host,
                        port: options.port,
                        username: options.username
                    };
                    if (options.privateKey) {
                        sshParamObj.privateKey = options.privateKey;
                        if (options.passphrase) {
                            sshParamObj.passphrase = options.passphrase;
                        }
                    } else {
                        sshParamObj.password = options.password;
                    }
                    var sshConnection = new SSH(sshParamObj);
                    sshConnection.exec(cmd, function(err, code) {
                        if (decrptedCredentials.pemFileLocation) {
                            fileIo.removeFile(decrptedCredentials.pemFileLocation, function() {
                                logger.debug('temp file deleted');
                            });

                        }
                        callback(err, code);
                    }, callbackOnStdOut, callbackOnStdErr);

                });

            }
        });
    }

    this.checkDockerStatus = function(instanceid, callback, callbackOnStdOut, callbackOnStdErr) {
        logger.debug(instanceid);
        var cmd = "sudo docker ps";

        instancesDao.getInstanceById(instanceid, function(err, data) {
            if (err) {
                res.send(500);
                return;
            }
            if (data.length) {
                logger.debug('reached docker cmd');
                var instanceoptions = data[0];
                credentialCrpto.decryptCredential(instanceoptions.credentials, function(err, decrptedCredentials) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    var options = {
                        host: instanceoptions.instanceIP,
                        port: '22',
                        username: decrptedCredentials.username, //'ec2-user',
                        privateKey: decrptedCredentials.pemFileLocation, //'/development/catalyst/D4DFE/D4D/config/catalyst.pem'
                        password: decrptedCredentials.password
                    };

                    var sshParamObj = {
                        host: options.host,
                        port: options.port,
                        username: options.username
                    };
                    if (options.privateKey) {
                        sshParamObj.privateKey = options.privateKey;
                        if (options.passphrase) {
                            sshParamObj.passphrase = options.passphrase;
                        }
                    } else {
                        sshParamObj.password = options.password;
                    }
                    var sshConnection = new SSH(sshParamObj);
                    sshConnection.exec(cmd, function(err, code) {
                        if (decrptedCredentials.pemFileLocation) {
                            fileIo.removeFile(decrptedCredentials.pemFileLocation, function() {
                                logger.debug('temp file deleted');
                            });

                        }

                        callback(err, code);

                    }, callbackOnStdOut, callbackOnStdErr);

                });

            }
        });
    }
}

module.exports = Docker;
