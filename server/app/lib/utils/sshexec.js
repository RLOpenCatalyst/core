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


var fileIo = require('./fileio');
var extend = require('extend');
var sshConnection = require('ssh2').Client;
var logger = require('_pr/logger')(module);

var HOST_UNREACHABLE = -5000;
var INVALID_CREDENTIALS = -5001;
var JSCH_EXCEPTION = -5002;
var UNKOWN_EXCEPTION = -5003;
var PEM_FILE_READ_ERROR = -5004;
var CONNECTION_NOT_INITIALIZED = -5005;


module.exports = function(opts) {
    var options = extend({}, opts);
    var sshTry = 0;
    //var con;
    var isConnected = false;

    function connect(connectionParamsObj, callback) {
        var con = new sshConnection();
        connectionParamsObj.readyTimeout = 40000; //timeout increased to support azure based vms
        try {
            con.connect(connectionParamsObj);
        } catch (connectErr) {
            con = null;
            logger.debug(connectErr);
            // a hack to make a sycnronous call asynchronous 
            process.nextTick(function() {
                if (connectErr.message === 'Cannot parse privateKey: Unsupported key format') {
                    logger.debug('Error msg:' + connectErr.message);
                    callback(connectErr, INVALID_CREDENTIALS, null);
                } else {
                    callback(connectErr, UNKOWN_EXCEPTION, null);
                }
            });
            return;
        }

        con.on('ready', function() {
            isConnected = true;
            callback(null, null, con);
        });

        con.on('error', function(err) {
            isConnected = false;
            con = null;
            logger.debug("ERROR EVENT FIRED", err);

            if (err.level === 'client-authentication') {
                logger.debug('Error msg:' + err);
                callback(err, INVALID_CREDENTIALS, null);
            } else if (err.level === 'client-timeout') {
                callback(err, HOST_UNREACHABLE, null);
            } else {
                callback(err, UNKOWN_EXCEPTION, null);
            }
            logger.debug('ssh error');
        });

        con.on('close', function(hadError) {
            isConnected = false;
            con = null;
            logger.debug('ssh close ', hadError);
        });

        con.on('end', function() {
            isConnected = false;
            con = null;
            logger.debug('ssh end');
        });

        con.on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
            logger.debug('Connection :: keyboard-interactive');
            finish([options.password]);
        });

    }

    function initializeConnection(callback) {
        logger.debug("In SSH Initilize");
        var connectionParamsObj = {
            host: options.host,
            port: options.port,
            username: options.username
        };
        if (options.privateKey) {
            if (options.passphrase) {
                connectionParamsObj.passphrase = options.passphrase;
            }
            if(options.pemFileData){
                connectionParamsObj.privateKey = options.pemFileData;
                connect(connectionParamsObj, callback);
            }else {
                fileIo.readFile(options.privateKey, function (err, key) {
                    if (err) {
                        callback(err, PEM_FILE_READ_ERROR);
                        return;
                    }
                    connectionParamsObj.privateKey = key;
                    connect(connectionParamsObj, callback);
                });
            }
        } else {
            logger.debug("SSh password...");
            if (options.interactiveKeyboard) {
                connectionParamsObj.tryKeyboard = true;
                connect(connectionParamsObj, callback);
            } else {
                connectionParamsObj.password = options.password;
                connect(connectionParamsObj, callback);
            }
        }
    }


    this.exec = function(cmd, onComplete, onStdOut, onStdErr) {
        logger.debug("sshTry:", sshTry);
        sshTry++;
        var self = this;
        var execRetCode = null;
        var execSignal = null;
        logger.debug('in exec: ' + cmd);
        initializeConnection(function(err, initErrorCode, con) {
            if (err) {
                if (initErrorCode === -5001 && sshTry === 1) {
                    options.interactiveKeyboard = true;
                    con = null;
                    isConnected = false;
                    logger.debug('firing again');
                    self.exec(cmd, onComplete, onStdOut, onStdErr);
                } else {
                    onComplete(null, initErrorCode);
                }
                return;
            }
            if (con) {
                logger.debug('executing cmd: ' + cmd);
                con.exec('' + cmd, {
                    pty: true
                }, function(err, stream) {
                    if (err) {
                        onComplete(err, -1);
                        return;
                    }
                    stream.on('exit', function(code, signal) {
                        logger.debug('SSH STREAM EXIT: ' + code + '  ==== ', signal);
                        execRetCode = code;
                        execSignal = signal;

                    });
                    stream.on('close', function(code, signal) {
                        logger.debug('SSH STREAM CLOSE');
                        if (con) {
                            con.end();
                        }
                        if (execRetCode !== null) {
                            onComplete(null, execRetCode);
                        } else {
                            if (typeof code !== 'undefined' && typeof code === 'number') {
                                execRetCode = code;
                                execSignal = signal;
                            } else {
                                execRetCode = UNKOWN_EXCEPTION;
                                execSignal = null;
                            }
                            onComplete(null, execRetCode);
                        }
                    });

                    if (typeof onStdOut === 'function') {
                        stream.on('data', function(data) {
                            onStdOut(data);
                        })
                    }

                    if (typeof onStdErr === 'function') {
                        stream.stderr.on('data', function(data) {
                            onStdErr(data);
                        });
                    }
                });
            } else {
                logger.debug('con is null');
                onComplete(null, CONNECTION_NOT_INITIALIZED);
            }

        });
    }
}
