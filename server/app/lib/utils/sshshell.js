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
var sshConnection = require('ssh2').Client;
var EventEmitter = require('events').EventEmitter;
var util = require("util");
var extend = require('extend');
var logger = require('_pr/logger')(module);

var HOST_UNREACHABLE = -5000;
var INVALID_CREDENTIALS = -5001;
var JSCH_EXCEPTION = -5002;
var UNKOWN_EXCEPTION = -5003;
var PEM_FILE_READ_ERROR = -5004;
var STREAM_ERROR = -5005;

var EVENTS = {
    ERROR: 'error',
    CLOSE: 'close',
    END: 'end',
    READY: 'ready',
    DATA: 'data',
};


function getErrorObj(err, errCode) {
    return {
        err: err,
        errCode: errCode
    }
};

function getConnectionParams(options, callback) {
    var connectionParamsObj = {
        host: options.host,
        port: options.port,
        username: options.username

    };
    if (options.passphrase) {
        connectionParamsObj.passphrase = options.passphrase;
    }
    if (options.privateKey) {

        fileIo.readFile(options.privateKey, function(err, key) {
            if (err) {
                callback(getErrorObj(err, PEM_FILE_READ_ERROR), null);
                return;
            }
            connectionParamsObj.privateKey = key;
            callback(null, connectionParamsObj);
        });
    } else {
        if (options.pemFileData) {
            connectionParamsObj.privateKey = options.pemFileData;
        } else {
            if (options.interactiveKeyboard) {
                connectionParamsObj.interactiveKeyboardPassword = options.password;
                connectionParamsObj.tryKeyboard = true;
            } else {
                connectionParamsObj.password = options.password;
            }
        }
        process.nextTick(function() {
            callback(null, connectionParamsObj);
        });
    }
}

function SSHShell(connectionParamsObj) {
    EventEmitter.call(this);
    var self = this;
    var connection = null;
    connection = new sshConnection();
    var sshStream = null;
    connection.on('ready', function() {
        connection.shell(function(err, stream) {
            if (err) {
                self.emit(EVENTS.ERROR, getErrorObj(err, STREAM_ERROR));
                return;
            }
            sshStream = stream;
            stream.on('close', function() {
                if (connection) {
                    connection.end();
                }
            }).on('data', function(data) {
                self.emit(EVENTS.DATA, data.toString('utf8'));
            }).stderr.on('data', function(data) {
                self.emit(EVENTS.DATA, data);
            });
            self.emit(EVENTS.READY);
        });
    });
    connection.on('error', function(err) {
        var errObj = null;
        if (err.level === 'client-authentication') {
            errObj = getErrorObj(err, INVALID_CREDENTIALS);
        } else if (err.level === 'client-timeout') {

            errObj = getErrorObj(err, HOST_UNREACHABLE);
        } else {
            errObj = getErrorObj(err, UNKOWN_EXCEPTION);
        }
        self.emit(EVENTS.ERROR, errObj);
    });

    connection.on('close', function(hadError) {

        sshStream = null;
        connection = null;
        self.emit(EVENTS.CLOSE);
    });

    connection.on('end', function() {

        sshStream = null;
        connection = null;
        self.emit(EVENTS.END);
    });

    if (connectionParamsObj.interactiveKeyboardPassword) {
        connection.on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
            logger.debug('Connection :: keyboard-interactive');
            finish([connectionParamsObj.interactiveKeyboardPassword]);
        });

    }

    try {
        logger.debug("connectErr: ",JSON.stringify(connectionParamsObj));
        connection.connect(connectionParamsObj);
    } catch (connectErr) {
        logger.debug("connectErr-----: ",JSON.stringify(connectErr));
        var errObj = null;
        if (connectErr.message === 'Cannot parse privateKey: Unsupported key format') {
            errObj = getErrorObj(connectErr, INVALID_CREDENTIALS);
        } else {
            errObj = getErrorObj(connectErr, UNKOWN_EXCEPTION);
        }
        process.nextTick(function() {
            self.emit(EVENTS.ERROR, errObj);
        });

    }
    this.write = function(data) {
        if (sshStream) {
            sshStream.write(data);
        }
    };
    this.close = function() {

        if (connection) {
            connection.end();
        }
    };
}

util.inherits(SSHShell, EventEmitter);

function initiateNewShell(sshTry, options, callback) {
    sshTry++;
    getConnectionParams(options, function(err, connectionParamsObj) {
        if (err) {
            callback(err, null);
            return;
        }
        var shell = new SSHShell(connectionParamsObj);
        var callbackFired = false;
        shell.on(EVENTS.ERROR, function(errObj) {
            if (!callbackFired) {
                if (errObj.errCode === -5001 && sshTry === 1) {
                    // trying with keyboard interactive
                    shell.close();
                    options.interactiveKeyboard = true;
                    initiateNewShell(sshTry++, options, callback);
                } else {
                    callback(errObj, null);
                    callbackFired = true;
                }
            } else {
                shell.emit(EVENTS.ERROR, errObj);
                shell.close();
            }
        });

        shell.on(EVENTS.READY, function() {
            if (!callbackFired) {
                callback(null, shell);
                callbackFired = true;
            }
        });
    });
}


module.exports.open = function(opts, callback) {
    var options = extend({},opts);
    initiateNewShell(0, options, callback);
};