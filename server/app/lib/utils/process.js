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


var childProcess = require('child_process');
var util = require('util');
var extend = require('extend');
var logger = require('_pr/logger')(module);

var defaults = {
    cwd: null,
    maxBuffer: 2000 * 1024
};

var Process = function(appPath, argList, options) {
    var spawn = childProcess.spawn;
    var exec = childProcess.exec;
    var proc = null;
    var processRunning = false;
    var onStdOut = null;
    var onStdErr = null;
    var onClose = null;
    var onError = null;

    if (options) {
        var def = extend({}, defaults);
        options = extend(def, options);
    } else {
        options = defaults;
    }

    if (options.onError) {
        onError = options.onError;
        options.onError = null;
    }

    if (options.onStdOut) {
        onStdOut = options.onStdOut;
        options.onStdOut = null;
    }
    if (options.onStdErr) {
        onStdErr = options.onStdErr;
        options.onStdErr = null;
    }
    if (options.onClose) {
        onClose = options.onClose;
        options.onClose = null;
    }


    if (!util.isArray(argList)) {
        argList = [];
    }

    this.start = function() {
        logger.debug(appPath + " " + argList.join(' '));
        proc = exec(appPath + " " + argList.join(' '), options, function(err, stdOut, stdErr) {
            if (err) {
                logger.debug(err);
                return;
            }
        });
        
        processRunning = true;
        if (typeof onStdOut === 'function') {
            proc.stdout.on('data', function(data) {
                logger.debug('process stdout: ==> ' + data);
                onStdOut(data);
            });
        }

        if (typeof onStdErr === 'function') {
            proc.stderr.on('data', function(errData) {
                logger.debug('process stderr: ==> ' + errData);
                onStdErr(errData);
            });
        }
        if (typeof onClose === 'function') {
            proc.on('close', function(code) {
                logger.debug('process return code ==> '+code);
                processRunning = false;
                onClose(code);
            });

        }
        if (typeof onError === 'function') {
            proc.on('error', function(error) {
                processRunning = false;
                logger.debug("Error is spawning process");
                logger.debug(error);
                onError(error);
            });
        }
    }

    this.write = function(data) {
        if (proc && processRunning) {
            proc.stdin.write(data);
        } else {
            onError('Process is not running');
        }
    }

}

module.exports = Process;