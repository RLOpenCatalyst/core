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


// This file contains Chef Server related all business logic.

var Process = require("./utils/process");
var childProcess = require('child_process');
var exec = childProcess.exec;
var fileIo = require('./utils/fileio');
var chefApi = require('chef');
var appConfig = require('_pr/config');
var chefDefaults = appConfig.chef;
var logger = require('_pr/logger')(module);
var getDefaultCookbook = require('./defaultTaskCookbook');
var currentDirectory = __dirname;
var fs = require('fs');
var d4dModelNew = require('../model/d4dmasters/d4dmastersmodelnew.js');
var SSHExec = require('./utils/sshexec');

var app_config;


function fixTemplateRunlist(runlist) {
    var tempRunlist = [];
    for (var i = 0; i < runlist.length; i++) {
        var indexOfTemplateMarker = runlist[i].indexOf(':-:');
        if (indexOfTemplateMarker !== -1) {
            if (runlist[i].length - 1 > 0) {
                var runlistSubString = runlist[i].substring(indexOfTemplateMarker + 3, runlist[i].length - 1);
                var templateRunlist = runlistSubString.split('*!*');
                if (templateRunlist.length) {
                    tempRunlist = tempRunlist.concat(templateRunlist);
                }
            }

        } else {
            tempRunlist.push(runlist[i]);
        }

    }
    return tempRunlist;
}

var Chef = function(settings) {
    var chefClient = null;
    var that = this;
    var bootstrapattemptcount = 0;

    function initializeChefClient(callback) {
        if (!chefClient) {
            fileIo.readFile(settings.chefUserPemFile, function(err, key) {
                if (err) {
                    callback(err, null);
                    return;
                }
                chefClient = chefApi.createClient(settings.chefUserName, key, settings.hostedChefUrl);
                callback(null, chefClient);
            });
        } else {
            callback(null, chefClient);
        }
    }

    this.getNodesList = function(callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }
            chefClient.get('/nodes', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status", chefRes.statusCode);
                if (chefRes.statusCode !== 200 && chefRes.statusCode !== 201) {
                    callback(true, null);
                    return;
                }

                var nodeNames = Object.keys(chefResBody);
                callback(null, nodeNames);
            });
        });
    }

    this.getEnvironmentsList = function(callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }
            chefClient.get('/environments', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return logger.debug(err);
                }
                logger.debug("chef status", chefRes.statusCode);
                if (chefRes.statusCode !== 200 && chefRes.statusCode !== 201) {
                    callback(true, null);
                    return;
                }
                var nodeNames = Object.keys(chefResBody);
                callback(null, nodeNames);
            });
        });
    }

    this.getNode = function(nodeName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/nodes/' + nodeName, function(err, chefRes, chefResBody) {
                if (err) {
                    return callback(err, null);
                }else if (chefRes.statusCode === 200) {
                    return  callback(null, chefResBody);
                }else {
                    return callback(null,{
                        err: "not found",
                        chefStatusCode: chefRes.statusCode
                    });

                }
            });
        });
    };

    this.deleteNode = function(nodeName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.delete('/nodes/' + nodeName, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else if (chefRes.statusCode === 404) {
                    callback({
                        err: "not found",
                        chefStatusCode: chefRes.statusCode
                    }, null);
                } else {
                    callback({
                        err: "error",
                        chefStatusCode: chefRes.statusCode
                    }, null);
                }
            });
        });
    };

    this.getNodesDetailsForEachEnvironment = function(callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/nodes', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return logger.debug(err);
                }

                var environmentList = {};
                var nodeNames = Object.keys(chefResBody);
                var count = 0;
                if (nodeNames.length) {
                    for (var i = 0; i < nodeNames.length; i++) {
                        chefClient.get('/nodes/' + nodeNames[i], function(err, chefRes, chefResBody) {
                            count++;
                            if (err) {
                                logger.debug("Error getting details of node");
                                return logger.debug(err);
                            }
                            if (!environmentList[chefResBody.chef_environment]) {
                                environmentList[chefResBody.chef_environment] = {};
                                environmentList[chefResBody.chef_environment].nodes = [];
                            }
                            environmentList[chefResBody.chef_environment].nodes.push(chefResBody);

                            if (count === nodeNames.length) {
                                callback(null, environmentList);
                            }

                        });
                    }
                } else {
                    callback(null, environmentList);
                }

            });
        });

    };

    this.getCookbooksList = function(callback) {

        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/cookbooks', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);
                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else {
                    callback(true, null);
                }

            });

        });
    };

    //Included a query to get receipes for cookbook - for service masters - Vinod
    this.getReceipesForCookbook = function(cookbookName, callback) {

        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug('REceipe query:', cookbookName);
            chefClient.get('/cookbooks/' + cookbookName + '/_latest', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);
                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody.recipes);
                } else {
                    callback(true, null);
                }

            });

        });
    };

    this.getCookbook = function(cookbookName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/cookbooks/' + cookbookName + '/_latest', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else {
                    callback(true, null);
                }

            });

        });
    }

    this.getRolesList = function(callback) {

        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/roles', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);
                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else {
                    callback(true, null);
                }

            });

        });

    };

    this.createEnvironment = function(envName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.post('/environments', {
                "name": envName,
                "json_class": "Chef::Environment",
                "description": "",
                "chef_type": "environment"
            }, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status create==> ", chefRes.statusCode);
                if (chefRes.statusCode === 201) {
                    callback(null, envName);
                } else if (chefRes.statusCode === 409) {
                    callback(null, chefRes.statusCode);
                } else {
                    callback(true, null);
                }

            });

        });

    }

    this.getEnvironment = function(envName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/environments/' + envName, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ==> ", chefRes.statusCode);
                if (chefRes.statusCode === 404) {
                    callback(null, null);
                } else if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else {
                    callback(true, null);
                }


            });

        });

    };

    this.updateNode = function(nodeName, updateData, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug('nodeName == >', nodeName);
            chefClient.put('/nodes/' + nodeName, updateData, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ==> ", chefRes.statusCode);
                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                } else {
                    callback(true, null);
                }
            });
        });
    };
    var bootstrapDelay = 0;
    this.bootstrapInstance = function(params, callback, callbackOnStdOut, callbackOnStdErr) {
        logger.debug('Chef Repo Location : ', settings.userChefRepoLocation)
        var options = {
            cwd: settings.userChefRepoLocation + '/.chef',
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                callback(null, code);
            }
        };
        if (typeof callbackOnStdOut === 'function') {

            options.onStdOut = function(data) {
                logger.debug('Process out :', data.toString('ascii'));
                callbackOnStdOut(data);
            }
        }

        if (typeof callbackOnStdErr === 'function') {

            options.onStdErr = function(data) {
                /*if ( bootstrapattemptcount < 4) {
                    //retrying bootstrap .... needed for windows
                    if (data.toString().indexOf('No response received from remote node after') >= 0 || data.toString().indexOf('ConnectTimeoutError:') >= 0) {
                        callbackOnStdOut(data.toString() + '.Retrying. Attempt ' + (bootstrapattemptcount + 1) + '/4 ...');
                        that.bootstrapInstance(params, callback, callbackOnStdOut, callbackOnStdErr);
                        bootstrapattemptcount++;
                    } else {
                        logger.debug('Hit an error :' + data);
                        callbackOnStdErr(data);
                    }
                } else {
                    logger.debug('Hit an error :' + data);
                    callbackOnStdErr(data);
                }
                return;*/
                callbackOnStdErr(data);
            }
        }
        if ((!(params.runlist) || !params.runlist.length)) {
            params.runlist = [];

        }

        //fixing template runlist
        params.runlist = fixTemplateRunlist(params.runlist);

        var argList = ['bootstrap'];

        if (params.instanceOS == 'windows') {

            argList.push('windows');
            argList.push('winrm');
        }
        argList.push(params.instanceIp);

        var runlist = chefDefaults.defaultChefCookbooks.concat(params.runlist);
        if (params.instanceOS == 'windows') {
            if (chefDefaults.defaultChefCookbooksWindows) {
                runlist = chefDefaults.defaultChefCookbooksWindows.concat(runlist);
            }
        } else {
            if (chefDefaults.defaultChefCookbooksLinux) {
                runlist = chefDefaults.defaultChefCookbooksLinux.concat(runlist);
            }
        }

        var credentialArg;
        if (params.pemFilePath && (params.instanceOS != 'windows')) {
            argList.push('-i');
            argList.push(params.pemFilePath);
            //    credentialArg = '-i' + params.pemFilePath;

        } else {
            if (params.instanceOS != 'windows' && !params.noSudo) {
                argList.push('--use-sudo-password');
            }
            argList.push('-P');
            if (params.instanceOS == 'windows' && !params.instancePassword) {} else {
                argList.push('\"' + params.instancePassword + '\"');
            }
        }

        if (params.instanceOS == 'windows') {
            argList.push('-p');
            argList.push('5985');
        } else {
            if (!params.noSudo) {
                argList.push('--sudo');
            }
        }

        if (runlist.length) {
            argList.push('-r');
            argList.push(runlist.join());
        }
        logger.debug('Environment : ', params.environment);
        argList = argList.concat(['-x', params.instanceUsername, '-N', params.nodeName, '-E', params.environment]);

        if (chefDefaults.ohaiHints && chefDefaults.ohaiHints.length) {
            for (var i = 0; i < chefDefaults.ohaiHints.length; i++) {
                if (params.instanceOS && params.instanceOS != 'windows') {
                    argList.push('--hint');
                    argList.push(chefDefaults.ohaiHints[i]);
                }

            }
        }
        var cmdCreateEnv = 'knife environment create ' + params.environment + ' -d catalystcreated';

        var procEnv = exec(cmdCreateEnv, options, function(err, stdOut, stdErr) {
            if (err) {
                logger.debug('Failed in procEnv', err);
                return;
            }
        });
        logger.debug('knife client delete ' + params.nodeName + ' -y && knife node delete ' + params.nodeName + ' -y');
        var cmdRemoveChefNode = 'knife client delete ' + params.nodeName + ' -y && knife node delete ' + params.nodeName + ' -y';
        var procNodeDelete = exec(cmdRemoveChefNode, options, function(err, stdOut, stdErr) {
            if (err) {
                logger.debug('Failed in procNodeDelete chef.js', err);
                return;
            }
        });


        procEnv.on('close', function(code) {
            logger.debug('procEnv closed: ');
        });


        if (params.jsonAttributes) {
            argList.push('-j');
            var jsonAttributesString = JSON.stringify(params.jsonAttributes);
            jsonAttributesString = jsonAttributesString.split('"').join('\\\"');
            jsonAttributesString = '"' + jsonAttributesString + '"';
            argList.push(jsonAttributesString);
        }
        procNodeDelete.on('close', function(code) {
            logger.debug('procNodeDelete closed');
            logger.debug('knife command ==> ', 'knife ' + argList.join(' '));
            var proc = new Process('knife', argList, options);
            proc.start();
        });
    };

    this.cleanChefonClient = function(options, callback, callbackOnStdOut, callbackOnStdErr) {

        if (options.instanceOS != 'windows') {
            logger.debug('cleaning chef from remote host');
            var cmds = ["rm -rf /etc/chef/", "rm -rf /var/chef/"];
            var cmdString = cmds.join(' && sudo');

            var sudoCmd = 'sudo ';
            if (options.password) {
                sudoCmd = 'echo \"' + options.password + '\" | sudo -S ';
            }
            cmdString = sudoCmd + cmdString;
            logger.debug(cmdString);
            var sshExec = new SSHExec(options);
            sshExec.exec(cmdString, callback, callbackOnStdOut, callbackOnStdErr);

        } else {

            var processOptions = {
                cwd: settings.userChefRepoLocation,
                onError: function(err) {
                    callback(err, null);
                },
                onClose: function(code) {
                    callback(null, code);
                }
            };
            if (typeof callbackOnStdOut === 'function') {
                processOptions.onStdOut = function(data) {
                    callbackOnStdOut(data);
                }
            }

            if (typeof callbackOnStdErr === 'function') {
                processOptions.onStdErr = function(data) {
                    callbackOnStdErr(data);
                }
            }
            logger.debug('host name ==>', options.host);
            callback(null, "1");

        }

    };

    this.cleanClient = function(options, callback, callbackOnStdOut, callbackOnStdErr) {
        this.cleanChefonClient(options, callback, callbackOnStdOut, callbackOnStdErr);
    };

    this.runChefClient = function(options, callback, callbackOnStdOut, callbackOnStdErr) {
        var runlist = options.runlist;
        var overrideRunlist = false;
        if (options.overrideRunlist) {
            overrideRunlist = true;
        }
        if (!runlist) {
            runlist = [];
        }

        // fix for template runlist
        runlist = fixTemplateRunlist(runlist);
        runlist = chefDefaults.defaultChefClientRunCookbooks.concat(runlist);

        if (options.instanceOS != 'windows') {

            var lockFile = false;
            if (options.parallel) {
                lockFile = true;
            }
            // using ssh2
            var cmd = '';
            cmd = "chef-client";
            if (runlist.length) {
                if (overrideRunlist) {
                    cmd += " -o";
                } else {
                    cmd += " -r";
                }
                cmd += " " + runlist.join();
            }
            var timestamp = new Date().getTime();
            if (lockFile) {
                cmd += " --lockfile /var/tmp/catalyst_lockFile_" + timestamp;
            }
            if (options.jsonAttributes) {
                var jsonFileName = "chefRunjsonAttributes_" + timestamp + ".json";
                var jsonAttributesString = options.jsonAttributes; // JSON.stringify(options.jsonAttributes);
                jsonAttributesString = jsonAttributesString.split('"').join('\\\"');
                var cmdWithJsonAttribute = '';
                cmdWithJsonAttribute += 'echo "' + jsonAttributesString + '" > ' + jsonFileName + ' && sudo ' + cmd + ' -j ' + jsonFileName;
                cmd = cmdWithJsonAttribute;
            }
            var sudoCmd = "sudo";
            if (options.password) {
                sudoCmd = 'echo \"' + options.password + '\" | sudo -S';
            }

            logger.debug("chef client cmd ==> " + cmd);
            cmd = sudoCmd + " " + cmd;


            var sshExec = new SSHExec(options);
            logger.debug('***********************', options);
            sshExec.exec(cmd, callback, callbackOnStdOut, callbackOnStdErr);

        } else {

            var processOptions = {
                cwd: settings.userChefRepoLocation,
                onError: function(err) {
                    callback(err, null);
                },
                onClose: function(code) {
                    callback(null, code);
                }
            };
            if (typeof callbackOnStdOut === 'function') {
                processOptions.onStdOut = function(data) {
                    callbackOnStdOut(data);
                }
            }

            if (typeof callbackOnStdErr === 'function') {
                processOptions.onStdErr = function(data) {
                    callbackOnStdErr(data);
                }
            }

            if (options.jsonAttributes) {
                var jsonFileName = "chefRunjsonAttributes_" + new Date().getTime() + ".json";
                var jsonAttributesString = options.jsonAttributes; // JSON.stringify(options.jsonAttributes);
                jsonAttributesString = jsonAttributesString.split('"').join('\\\"');
                var proc = new Process('knife', ['winrm', options.host, '"echo ' + jsonAttributesString + ' > c:/' + jsonFileName + ' && chef-client -o ' + runlist.join() + ' --json-attributes c:/' + jsonFileName + ' "', '-m', '-P\"' + options.password + '\"', '-x' + options.username], processOptions);
                proc.start();
            } else {
                logger.debug('host name ==>', options.host);
                if (!options.password) {}
                var proc = new Process('knife', ['winrm', options.host, ' "chef-client -o ' + runlist.join() + '"', '-m', '-P\"' + options.password + '\"', '-x' + options.username], processOptions);
                proc.start();
            }
        }

    };
    this.runClient = function(options, callback, callbackOnStdOut, callbackOnStdErr) {
        this.runChefClient(options, callback, callbackOnStdOut, callbackOnStdErr);
    };
    this.runKnifeWinrmCmd = function(cmd, options, callback, callbackOnStdOut, callbackOnStdErr) {
        var processOptions = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                callback(null, code);
            }
        };
        if (typeof callbackOnStdOut === 'function') {
            processOptions.onStdOut = function(data) {
                callbackOnStdOut(data);
            }
        }

        if (typeof callbackOnStdErr === 'function') {
            processOptions.onStdErr = function(data) {
                callbackOnStdErr(data);
            }
        }
        if (!options.password) {}
        var proc = new Process('knife', ['winrm', options.host, "\'" + cmd + "\'", '-m', '-P\"', options.password + '\"', '-x', options.username], processOptions);
        proc.start();
    };


    this.updateNodeEnvironment = function(nodeName, newEnvironment, callback) {
        logger.debug('Chef Repo Location : ', settings.userChefRepoLocation)
        var options = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }

            }
        };
        var proc = new Process('knife', ['node', 'environment_set', nodeName, newEnvironment], options);
        proc.start();


    };

    this.downloadCookbook = function(cookbookName, cookbookDir, callback) {
        var options = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "cmd return code is " + code,
                        retCode: code
                    }, false);
                }

            }
        };
        var argList = ['download', 'cookbooks/' + cookbookName];
        argList.push('--force');
        var proc = new Process('knife', argList, options);
        proc.start();
    };


    this.downloadRole = function(roleName, roleDir, callback) {
        var options = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "cmd return code is " + code,
                        retCode: code
                    }, false);
                }

            }
        };
        var indexOfJson = roleName.indexOf('.json');
        if (indexOfJson === -1) {
            roleName = roleName + '.json';
        }
        var argList = ['download', 'roles/' + roleName];
        argList.push('--force');
        var proc = new Process('knife', argList, options);
        proc.start();
    };

    this.syncCookbooks = function(callback) {
        var self = this;

        var options = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "cmd return code is " + code,
                        retCode: code
                    }, false);
                }

            },
            onStdOut: function(stdOut) {
                logger.debug('stdout ==>' + stdOut.toString());
            },
            onStdErr: function(stdErr) {
                logger.debug('stdErr ==>' + stdErr.toString());
            }
        };
        var argList = ['download', 'cookbooks'];
        argList.push('--force');
        var proc = new Process('knife', argList, options);
        proc.start();
    };

    this.syncRoles = function(callback) {
        var self = this;

        var options = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "cmd return code is " + code,
                        retCode: code
                    }, false);
                }

            },
            onStdOut: function(stdOut) {
                logger.debug('stdout ==>' + stdOut.toString());
            },
            onStdErr: function(stdErr) {
                logger.debug('stdErr ==>' + stdErr.toString());
            }
        };
        var argList = ['download', 'roles'];
        argList.push('--force');
        var proc = new Process('knife', argList, options);
        proc.start();
    };

    this.createCookbook = function(cookbookName, cookbookDir, callback) {
        var createCookbookOption = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }
            },
            onStdOut: function(outData) {
                logger.debug(outData);
            }
        };
        var argList = ['cookbook', 'create', cookbookName];
        if (cookbookDir) {
            argList.push('-o');
            argList.push(cookbookDir);
        }
        logger.debug('cookbookDir ==> ' + argList);
        var procCreateCookbook = new Process('knife', argList, createCookbookOption);
        procCreateCookbook.start();
    };

    this.uploadCookbook = function(cookbookName, callback) {
        var errOutput = '';
        var uploadCookbookOption = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "Cmd exited with code : " + code,
                        retCode: code,
                        stdErrMsg: errOutput
                    }, false);
                }

            },
            onStdOut: function(outData) {
                logger.debug('out ==> ' + outData.toString());
            },
            onStdErr: function(outData) {
                errOutput = errOutput + outData.toString();
                logger.debug("err ==> " + outData.toString());
            }
        };
        var procUploadCookbook = new Process('knife', ['cookbook', 'upload', cookbookName, '--force'], uploadCookbookOption);
        procUploadCookbook.start();
    };

    this.uploadRole = function(roleName, callback) {
        var errOutput = '';
        var uploadRoleOption = {
            cwd: settings.userChefRepoLocation,
            onError: function(err) {
                callback(err, null);
            },
            onClose: function(code) {
                logger.debug(code);
                if (code === 0) {
                    callback(null, true);
                } else {
                    callback({
                        message: "Cmd exited with code : " + code,
                        retCode: code,
                        stdErrMsg: errOutput
                    }, false);
                }

            },
            onStdOut: function(outData) {
                logger.debug('out ==> ' + outData.toString());
            },
            onStdErr: function(outData) {
                errOutput = errOutput + outData.toString();
                logger.debug("err ==> " + outData.toString());
            }
        };
        var procUploadRole = new Process('knife', ['upload', 'roles/' + roleName, '--force'], uploadRoleOption);
        procUploadRole.start();
    };

    this.createAndUploadCookbook = function(cookbookName, dependencies, callback) {
        var self = this;
        this.createCookbook(cookbookName, function(err, status) {
            if (err) {
                callback(err, null);
                return;
            }
            if (dependencies && dependencies.length) {
                var dependecyDataToAppend = '';
                for (var i = 0; i < dependencies.length; i++) {
                    dependecyDataToAppend = dependecyDataToAppend + "\ndepends '" + dependencies[i] + "'";
                    logger.debug(dependecyDataToAppend);
                }
                logger.debug(dependencies);
                logger.debug(dependecyDataToAppend);
                fileIo.appendToFile(settings.userChefRepoLocation + '/cookbooks/' + cookbookName + '/metadata.rb', dependecyDataToAppend, function(err) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    self.uploadCookbook(cookbookName, function(err) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        callback(null, null);
                    });
                });
            } else {
                self.uploadCookbook(cookbookName, function(err) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    callback(null, null);
                });
            }
        });
    };

    this.getCookbookAttributes = function(cookbooksList, callback) {

        var self = this;
        var cookbooksListNew = [];
        var count = 0;
        var attributesList = [];

        function getCookbook(cookbookName) {
            self.getCookbook(cookbookName, function(err, cookbookData) {
                count++;
                if (err) {
                    callback(err, null);
                    return;
                }
                var attributeObj = {
                    cookbookName: cookbookName,
                    attributes: cookbookData.metadata.attributes
                };
                attributesList.push(attributeObj);
                if (count < cookbooksList.length) {
                    getCookbook(cookbooksList[count]);
                } else {
                    callback(null, attributesList);
                }
            });
        }

        getCookbook(cookbooksList[count]);
    };

    this.createDataBag = function(dataBagName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.post('/data', {
                "name": dataBagName
            }, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status create==> ", chefRes.statusCode);
                if (chefRes.statusCode === 201) {
                    callback(null, chefResBody);
                    return;
                } else if (chefRes.statusCode === 409) {
                    callback(null, chefRes.statusCode);
                    return;
                } else if (chefRes.statusCode === 400) {
                    callback(null, chefRes.statusCode);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });

    }

    this.deleteDataBag = function(dataBagName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                logger.debug("error: " + err);
                callback(err, null);
                return;
            }
            chefClient.delete('/data/' + dataBagName, function(err, chefRes, chefResBody) {
                if (err) {
                    logger.debug("error: " + err);
                    callback(err, null);
                    return;
                }
                logger.debug("chef status create==> ", chefRes.statusCode);
                if (chefRes.statusCode === 200) {
                    callback(null, chefRes.statusCode);
                    return;
                } else if (chefRes.statusCode === 404) {
                    callback(null, chefRes.statusCode);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });

    }

    this.getDataBags = function(callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/data', function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });
    }

    this.createDataBagItem = function(req, dataBagItem, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            var dataBagName = req.params.dataBagName;
            var isEncrypt = req.body.isEncrypt;
            var options = {
                cwd: settings.userChefRepoLocation + '/.chef',
                onError: function(err) {
                    callback(err, null);
                },
                onClose: function(code) {
                    callback(null, code);
                }
            };
            if (isEncrypt === "true") {
                d4dModelNew.d4dModelMastersConfigManagement.find({
                    rowid: req.params.serverId
                }, function(err, cmgmt) {
                    if (err) {
                        logger.debug("Error to find cmgmt from mongo.");
                    }
                    logger.debug("Config mgmt: ", JSON.stringify(cmgmt));
                    if (cmgmt[0]) {
                        var readKeyFileLocation = settings.userChefRepoLocation + '/.chef/' + cmgmt[0].encryption_filename;
                        var targetDir = currentDirectory + "/../catdata/catalyst/temp/dbItem.json";
                        fs.readFile(readKeyFileLocation, function(err, existFile) {
                            if (err) {
                                logger.debug("There is no file exist.");
                                callback(null, 403);
                                return;
                            }
                            fs.writeFile(targetDir, JSON.stringify(dataBagItem), function(err) {
                                if (err) {
                                    logger.debug("File creation failed : ", err);
                                    callback(err, null);
                                    return;
                                }
                                logger.debug("File Created....on ", targetDir);
                                var keyFileLocation = settings.userChefRepoLocation + '.chef/' + cmgmt[0].encryption_filename;
                                logger.debug("key file location: ", keyFileLocation);
                                var createDBItem = 'knife data bag from file ' + dataBagName + " " + targetDir + ' --secret-file ' + keyFileLocation;
                                var procDBItem = exec(createDBItem, options, function(err, stdOut, stdErr) {
                                    if (err) {
                                        logger.debug('Failed in procDBItem', err);
                                        callback(err, null);
                                        return;
                                    }
                                    fs.unlink(targetDir);
                                    logger.debug("File deleted successfully..");
                                    callback(null, dataBagItem);
                                    return;
                                });
                            });
                        });

                    } else {
                        logger.debug("No config management found.");
                        callback(null, null);
                        return;
                    }
                });

            } else {
                chefClient.post('/data/' + dataBagName, dataBagItem, function(err, chefRes, chefResBody) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    logger.debug("chef status create==> ", chefRes.statusCode);
                    if (chefRes.statusCode === 201) {
                        callback(null, chefResBody);
                        return;
                    } else if (chefRes.statusCode === 409) {
                        callback(null, chefRes.statusCode);
                        return;
                    } else {
                        callback(true, null);
                        return;
                    }

                });
            }

        });

    }

    this.updateDataBagItem = function(req, dataBagItem, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            var dataBagName = req.params.dataBagName;
            var isEncrypt = req.body.isEncrypt;
            var itemId = req.params.itemId;
            var options = {
                cwd: settings.userChefRepoLocation + '/.chef',
                onError: function(err) {
                    callback(err, null);
                },
                onClose: function(code) {
                    callback(null, code);
                }
            };
            if (isEncrypt === "true") {
                d4dModelNew.d4dModelMastersConfigManagement.find({
                    rowid: req.params.serverId
                }, function(err, cmgmt) {
                    if (err) {
                        logger.debug("Error to find cmgmt from mongo.");
                    }
                    logger.debug("Config mgmt: ", JSON.stringify(cmgmt));
                    if (cmgmt[0]) {
                        var readKeyFileLocation = settings.userChefRepoLocation + '/.chef/' + cmgmt[0].encryption_filename;
                        var targetDir = currentDirectory + "/../catdata/catalyst/temp/dbItem.json";
                        fs.readFile(readKeyFileLocation, function(err, existFile) {
                            if (err) {
                                logger.debug("There is no key file exist.");
                                callback(null, 403);
                                return;
                            }
                            fs.writeFile(targetDir, JSON.stringify(dataBagItem), function(err) {
                                if (err) {
                                    logger.debug("File creation failed : ", err);
                                    callback(err, null);
                                    return;
                                }
                                logger.debug("File Created....");
                                var createDBItem = 'knife data bag from file ' + dataBagName + " " + targetDir + ' --secret ' + readKeyFileLocation;
                                var procDBItem = exec(createDBItem, options, function(err, stdOut, stdErr) {
                                    if (err) {
                                        logger.debug('Failed in procDBItem', err);
                                        callback(err, null);
                                        return;
                                    }
                                    fs.unlink(targetDir);
                                    logger.debug("File deleted successfully..");
                                    callback(null, dataBagItem);
                                    return;
                                });
                            });
                        });

                    } else {
                        logger.debug("No config management found.");
                        callback(null, null);
                        return;
                    }
                });
            } else {
                chefClient.put('/data/' + dataBagName + '/' + itemId, dataBagItem, function(err, chefRes, chefResBody) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    logger.debug("chef status create==> ", chefRes.statusCode);
                    if (chefRes.statusCode === 200) {
                        callback(null, chefResBody);
                        return;
                    } else {
                        callback(true, null);
                        return;
                    }

                });
            }

        });

    }

    this.deleteDataBagItem = function(dataBagName, itemName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.delete('/data/' + dataBagName + '/' + itemName, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefRes.statusCode);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });
    }

    this.getDataBagItems = function(dataBagName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/data/' + dataBagName, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });
    }

    this.getDataBagItemById = function(dataBagName, itemId, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.get('/data/' + dataBagName + '/' + itemId, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                    return;
                }
                if (chefRes.statusCode === 404) {
                    callback(null, "{}");
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });
        });
    }

    this.deleteEnvironment = function(envName, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            chefClient.delete('/environments/' + envName, function(err, chefRes, chefResBody) {
                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefRes.statusCode);
                    return;
                } else {
                    callback(true, null);
                    return;
                }

            });

        });
    };

    this.search = function(index, query, callback) {
        initializeChefClient(function(err, chefClient) {
            if (err) {
                callback(err, null);
                return;
            }
            var url = '/search/' + index + '?q=' + query;
            logger.debug(url);;
            chefClient.get(url, function(err, chefRes, chefResBody) {

                if (err) {
                    callback(err, null);
                    return;
                }
                logger.debug("chef status ", chefRes.statusCode);

                if (chefRes.statusCode === 200) {
                    callback(null, chefResBody);
                    return;
                } else {
                    logger.debug(chefRes.statusCode, chefResBody);
                    callback(true, null);
                    return;
                }

            });

        });
    }

}

module.exports = Chef;
