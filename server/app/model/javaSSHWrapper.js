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



var java = require('java');
var Tail = require('tail').Tail;
var appConfig = require('../config/app_config');
var extend = require('extend');
var uuid = require('node-uuid');
var fs = require('fs');
var logger = require('_pr/logger')(module);
var currentDirectory = __dirname;

var indexOfSlash = currentDirectory.lastIndexOf("/");
if (indexOfSlash === -1) {
    indexOfSlash = currentDirectory.lastIndexOf("\\");
}
var D4DfolderPath = currentDirectory.substring(0, indexOfSlash + 1);



logger.debug(D4DfolderPath);
java.classpath.push(D4DfolderPath + '/java/lib/jsch-0.1.51.jar');
java.classpath.push(D4DfolderPath + '/java/lib/commons-lang-2.3.jar');
java.classpath.push(D4DfolderPath + '/java/classes');
var defaults = {
    port: 22,
    tempDir: appConfig.tempDir
};



function LogFileTail(logFile, onChangeCallback) {
    var tail = new Tail(logFile);
    tail.on("line", function(data) {
        onChangeCallback(data);
    });
    tail.on("error", function(error) {
        logger.debug('ERROR: ', error);
    });

    this.stopTailing = function() {
        tail.unwatch();
    }
    this.startTailing = function() {
        tail.watch();
    }
};


function JavaSSH(javaSSHInstance, options) {

    /**
     * @param: runlist, chef runlist
     */
    this.execChefClient = function(runlist, overrideRunlist, jsonAttributes, lockFile, onComplete, onStdOut, onStdErr) {
        var stdOutLogFile = options.tempDir + uuid.v4();
        var stdErrLogFile = options.tempDir + uuid.v4();
        var tailStdOut = null;
        var tailStdErr = null;
        fs.open(stdOutLogFile, 'w', function(err, fd1) {
            if (err) {
                if (typeof onComplete === 'function') {
                    onComplete(err, null);
                }
                return;
            }
            fs.close(fd1);
            fs.open(stdErrLogFile, 'w', function(err, fd2) {
                if (err) {
                    if (typeof onComplete === 'function') {
                        onComplete(err, null);
                    }
                    return;
                }
                fs.close(fd2);
                if (typeof onStdOut === 'function') {
                    tailStdOut = new LogFileTail(stdOutLogFile, onStdOut);
                    tailStdOut.startTailing();
                }
                if (typeof onStdErr === 'function') {
                    tailStdErr = new LogFileTail(stdErrLogFile, onStdErr);
                    tailStdErr.startTailing();
                }

                java.callMethod(javaSSHInstance, 'execChefClient', runlist, overrideRunlist, jsonAttributes, lockFile, stdOutLogFile, stdErrLogFile, function(err, retCode) {
                    // deleting log files
                    if (tailStdOut) {
                        tailStdOut.stopTailing();
                        fs.unlink(stdOutLogFile);
                    }
                    if (tailStdErr) {
                        tailStdErr.stopTailing();
                        fs.unlink(stdErrLogFile);
                    }
                    if (err) {
                        logger.debug("error in runnnig method");
                        logger.debug(err);
                        if (typeof onComplete === 'function') {
                            onComplete(err, null);
                        }
                        return;
                    }
                    if (typeof onComplete === 'function') {
                        onComplete(err, retCode);
                    }
                });
            });

        });

    };

    //included for kana
    this.executeListOfCmds = function(opts, onComplete, onStdOut, onStdErr) {
        //opts = opts.toString();
        var stdOutLogFile = options.tempDir + uuid.v4();
        var stdErrLogFile = options.tempDir + uuid.v4();
        var tailStdOut = null;
        var tailStdErr = null;
        fs.open(stdOutLogFile, 'w', function(err, fd1) {
            if (err) {
                if (typeof onComplete === 'function') {
                    onComplete(err, null);
                }
                return;
            }
            fs.close(fd1);
            fs.open(stdErrLogFile, 'w', function(err, fd2) {
                if (err) {
                    if (typeof onComplete === 'function') {
                        onComplete(err, null);
                    }
                    return;
                }
                fs.close(fd2);
                if (typeof onStdOut === 'function') {
                    tailStdOut = new LogFileTail(stdOutLogFile, onStdOut);
                    tailStdOut.startTailing();
                }
                if (typeof onStdErr === 'function') {
                    tailStdErr = new LogFileTail(stdErrLogFile, onStdErr);
                    tailStdErr.startTailing();
                }
                var newopts = java.newArray('java.lang.String', opts);
                java.callMethod(javaSSHInstance, 'executeListOfCmds', newopts, stdOutLogFile, stdErrLogFile, function(err, retCode) {
                    // deleting log files
                    if (tailStdOut) {
                        tailStdOut.stopTailing();
                        fs.unlink(stdOutLogFile);
                    }
                    if (tailStdErr) {
                        tailStdErr.stopTailing();
                        fs.unlink(stdErrLogFile);
                    }
                    if (err) {
                        logger.debug("error in runnnig method");
                        logger.debug(err);
                        if (typeof onComplete === 'function') {
                            onComplete(err, null);
                        }
                        return;
                    }
                    if (typeof onComplete === 'function') {
                        onComplete(err, retCode);
                    }
                });
            });

        });

    };

    this.runServiceCmd = function(serviceName, servicAction, onComplete, onStdOut, onStdErr) {
        var stdOutLogFile = options.tempDir + uuid.v4();
        var stdErrLogFile = options.tempDir + uuid.v4();
        var tailStdOut = null;
        var tailStdErr = null;
        fs.open(stdOutLogFile, 'w', function(err, fd1) {
            if (err) {
                if (typeof onComplete === 'function') {
                    onComplete(err, null);
                }
                return;
            }
            fs.close(fd1);
            fs.open(stdErrLogFile, 'w', function(err, fd2) {
                if (err) {
                    if (typeof onComplete === 'function') {
                        onComplete(err, null);
                    }
                    return;
                }
                fs.close(fd2);
                if (typeof onStdOut === 'function') {
                    tailStdOut = new LogFileTail(stdOutLogFile, onStdOut);
                    tailStdOut.startTailing();
                }
                if (typeof onStdErr === 'function') {
                    tailStdErr = new LogFileTail(stdErrLogFile, onStdErr);
                    tailStdErr.startTailing();
                }

                java.callMethod(javaSSHInstance, 'execServiceCmd', serviceName, servicAction, stdOutLogFile, stdErrLogFile, function(err, retCode) {
                    // deleting log files
                    if (tailStdOut) {
                        tailStdOut.stopTailing();
                        fs.unlink(stdOutLogFile);
                    }
                    if (tailStdErr) {
                        tailStdErr.stopTailing();
                        fs.unlink(stdErrLogFile);
                    }
                    if (err) {
                        logger.debug("error in runnnig method");

                        logger.debug(err);
                        if (typeof onComplete === 'function') {
                            onComplete(err, null);
                        }
                        return;
                    }
                    if (typeof onComplete === 'function') {
                        onComplete(err, retCode);
                    }
                });
            });

        });
    };
}


module.exports.getNewInstance = function(options, callback) {
    var def = extend({}, defaults);
    options = extend(def, options);
    if (options.password) {
        options.pemFilePath = null;
    } else {
        options.password = null;
    }
    logger.debug('Initializing class');
    java.newInstance('com.relevancelab.catalyst.security.ssh.SSHExec', options.host, options.port, options.username, options.password, options.pemFilePath, function(err, javaSSHInstance) {

        if (err) {
            logger.debug(err);
            callback(err, null);
            return;
        }
        var javaSSH = new JavaSSH(javaSSHInstance, options);
        callback(null, javaSSH);
    });

}
