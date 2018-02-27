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


var SSHExec = require('./utils/sshexec');
var https = require('https');
var fs = require('fs');
var Buffer = require('buffer');
var logger = require('_pr/logger')(module);
var util = require('util');
var YAML = require('js-yaml');
var SCP = require('_pr/lib/utils/scp');
var Process = require("_pr/lib/utils/process");
var Cryptography = require('_pr/lib/utils/cryptography');
var config = require('_pr/config');


var Puppet = function(settings) {

    var puppetConfig = null;
    var sshOptions = {
        username: settings.username,
        host: settings.host,
        port: 22,
    }
    if (settings.pemFileLocation) {
        sshOptions.privateKey = settings.pemFileLocation;
    } else {
        var cryptoConfig = config.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        sshOptions.password = cryptography.decryptText(settings.password, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        settings.password = sshOptions.password;
        logger.debug(settings.password);
    }

    function runSSHCmd(sshOptions, cmds, onComplete, onStdOut, onStdErr) {
        var sshExec = new SSHExec(sshOptions);
        var cmdString = '';
        if (util.isArray(cmds)) {
            for (var i = 0; i < cmds.length - 1; i++) {
                cmdString = cmdString + 'sudo ' + cmds[i] + ' && ';
            }
            cmdString = cmdString + 'sudo ' + cmds[cmds.length - 1];
        } else {
            cmdString = 'sudo ' + cmds;
        }
        sshExec.exec(cmdString, onComplete, onStdOut, onStdErr);
    }

    function runSSHCmdOnMaster(cmds, onComplete, onStdOut, onStdErr) {
        runSSHCmd(sshOptions, cmds, onComplete, onStdOut, onStdErr);
    }

    function runSSHCmdOnAgent(sshOptions, cmds, onComplete, onStdOut, onStdErr) {
        runSSHCmd(sshOptions, cmds, onComplete, onStdOut, onStdErr);
    }

    function getPuppetConfig(callback) {
        var stdOutStr = '';
        var stdErrStr = '';
        var puppetConfig = {};
        var line = '';
        runSSHCmdOnMaster('puppet config print --section master', function(err, retCode) {
            if (err) {
                callback(err, null);
                return;
            }
            if (retCode !== 0) {
                message = "cmd run failed with ret code : " + retCode
                callback({
                    message: message,
                    retCode: retCode
                }, null);
                return;
            }
            callback(null, puppetConfig);
        }, function(stdOut) {
            stdOutStr = stdOut.toString('utf8');
            //reading string line by line
            for (var i = 0; i < stdOutStr.length; i++) {
                if (stdOutStr[i] === '\n' || stdOutStr[i] === '\r') {
                    if (line) {
                        var lineParts = line.split('=');
                        if (lineParts.length === 2) {
                            puppetConfig[lineParts[0].trim()] = lineParts[1].trim();
                        }
                        line = '';
                    }

                } else {
                    line = line + stdOutStr[i];
                }
            }

        }, function(stdErr) {
            stdErrStr = stdErrStr + stdErr.toString('utf8');
        });
    }

    function changePuppetServerPemFilePerm(callback) {

        if (sshOptions.privateKey) {
            fs.chmod(sshOptions.privateKey, 0600, function(err) {
                if (err) {
                    logger.debug(err);
                    callback(err);
                    return;
                }
                callback(null);
            });

        } else {
            process.nextTick(function() {
                callback(null);
            });
        }

    };


    this.bootstrapInstance = function(node, callback, callbackStdOut, callbackStdErr) {
        if (typeof callbackStdOut !== 'function') {
            callbackStdOut = function() {

            }
        }
        if (typeof callbackStdErr !== 'function') {
            callbackStdErr = function() {

            }
        }
        var self = this;
        // getting hostname of puppet master
        changePuppetServerPemFilePerm(function(err) {
            if (err) {
                callback({
                    message: "Unable to change permission of pem file of puppet-master.",
                    err: err
                }, null);
                return;
            }

            self.createEnvironment(node.environment, function(err, envRes) {
                if (err) {

                    callback({
                        message: err.message || "Unable to create environment on puppet-master.",
                        err: err
                    }, null);
                    return;
                }

                var hostNamePuppetMaster = '';
                runSSHCmdOnMaster('hostname -f', function(err, retCode) {
                    if (err) {
                        callback({
                            message: "Unable to get hostname of puppet-master. Unable to ssh into puppet master",
                            err: err
                        }, null);
                        return;
                    }
                    if (retCode !== 0) {
                        message = "Unable to get hostname of puppet-master. Cmd failed with ret code : " + retCode
                        callback({
                            message: message,
                            retCode: retCode
                        }, null);
                        return;
                    }
                    hostNamePuppetMaster = hostNamePuppetMaster.replace(/[\t\n\r\b\0\v\f\'\"\\]/g, '');
                    hostNamePuppetMaster = hostNamePuppetMaster.trim();


                    // getting hostname of client
                    var hostnamePuppetAgent = '';
                    var sshOptions = {
                        username: node.username,
                        host: node.host,
                        port: 22,
                    }
                    if (node.pemFileLocation) {
                        sshOptions.privateKey = node.pemFileLocation;
                    } else {
                        sshOptions.password = node.password;
                    }

                    runSSHCmdOnAgent(sshOptions, 'hostname -f', function(err, retCode) {
                        if (err) {
                            callback({
                                message: "Unable to get hostname of node. Unable to ssh into puppet node",
                                err: err
                            }, null);

                            return;
                        }
                        if (retCode !== 0) {
                            message = "Unable to get hostname of node. Cmd failed with ret code : " + retCode
                            callback({
                                message: message,
                                retCode: retCode
                            }, null);
                            return;
                        }
                        hostnamePuppetAgent = hostnamePuppetAgent.replace(/[\t\n\r\b\0\v\f\'\"\\]/g, '');
                        hostnamePuppetAgent = hostnamePuppetAgent.trim();

                        //deleting node from puppet agent if exist
                        self.deleteNode(hostnamePuppetAgent, function(err) {

                            // copying cookbook on client machine
                            var jsonAttributes = {
                                "puppet_configure": {
                                    "cache_dir": "/var/chef/cache",
                                    "client": {
                                        "user": node.username,
                                        "ipaddress": node.host,
                                        "fqdn": hostnamePuppetAgent,
                                        "environment": node.environment
                                    },
                                    "puppet_master": {
                                        "user": settings.username,
                                        "ipaddress": settings.host,
                                        "fqdn": hostNamePuppetMaster,
                                    }
                                }
                            }
                            if (node.pemFileLocation) {
                                jsonAttributes["puppet_configure"]['client']["pem_file"] = node.pemFileLocation;
                                jsonAttributes["puppet_configure"]['client']["ssh_pass_method"] = false;
                            } else {
                                jsonAttributes["puppet_configure"]['client']["pswd"] = node.password;
                                jsonAttributes["puppet_configure"]['client']["ssh_pass_method"] = true;
                            }

                            if (settings.pemFileLocation) {
                                jsonAttributes["puppet_configure"]['puppet_master']["pem_file"] = settings.pemFileLocation;
                                jsonAttributes["puppet_configure"]['puppet_master']["ssh_pass_method"] = false;
                            } else {
                                jsonAttributes["puppet_configure"]['puppet_master']["pswd"] = settings.password;
                                jsonAttributes["puppet_configure"]['puppet_master']["ssh_pass_method"] = true;
                            }


                            var scp = new SCP(sshOptions);
                            scp.upload(__dirname + '/../puppet-cookbook/cookbooks.tar', '/tmp', function(err) {
                                if (err) {
                                    logger.debug(err);
                                    callback({
                                        message: "Unable to upload cookbooks onto the node",
                                        err: err
                                    }, null);
                                    return;
                                }
                                var jsonAttributeFile = '/tmp/puppet_jsonAttributes_' + new Date().getTime() + '.json';
                                fs.writeFile(jsonAttributeFile, JSON.stringify(jsonAttributes), function(err) {
                                    if (err) {
                                        callback(err, null);
                                        return;
                                    }
                                    scp.upload(jsonAttributeFile, '/tmp/chef-solo.json', function(err) {
                                        if (err) {
                                            callback({
                                                message: "Unable to upload attribute json file on to the node",
                                                err: err
                                            }, null);
                                            return;
                                        }
                                        // extracting cookbook on clinet machine
                                        runSSHCmdOnAgent(sshOptions, 'tar -xf /tmp/cookbooks.tar -C /tmp/', function(err, retCode) {
                                            if (err) {
                                                callback({
                                                    message: "Unable to upload extract cookbooks.tar on the node",
                                                    err: err
                                                }, null);
                                                return;
                                            }
                                            if (retCode !== 0) {
                                                message = "Unable to upload extract cookbooks.tar on the node. cmd failed with ret code : " + retCode
                                                callback({
                                                    message: message,
                                                    retCode: retCode
                                                }, null);
                                                return;
                                            }
                                            // creating chef-solo.rb file
                                            var proc = new Process('echo "cookbook_path            [\'' + __dirname + '/../puppet-cookbook/' + '\']" > /etc/chef/solo.rb', [], {
                                                onError: function(err) {
                                                    callback({
                                                        message: "Unable to create solo.rb file on catalyst machine",
                                                        err: err
                                                    }, null);
                                                },
                                                onClose: function(code) {
                                                    if (code !== 0) {
                                                        message: "Unable to create solo.rb file on catalyst machine. Cmd failed with ret code : " + code,
                                                        callback({
                                                            message: message,
                                                            retCode: code
                                                        }, null);
                                                        return;
                                                    }
                                                    // running chef-solo
                                                    var argList = [];
                                                    argList.push('-o');
                                                    argList.push('recipe[puppet_configure::client_bootstrap]');

                                                    argList.push('-j');
                                                    argList.push(jsonAttributeFile);

                                                    var proc = new Process('chef-solo ' + argList.join(' '), [], {
                                                        onError: function(err) {
                                                            callback(err, null);
                                                        },
                                                        onClose: function(code) {
                                                            callback(null, code, {
                                                                puppetNodeName: hostnamePuppetAgent
                                                            });
                                                        },
                                                        onStdErr: function(stdErr) {
                                                            callbackStdErr(stdErr);
                                                            console.error(stdErr.toString());
                                                        },
                                                        onStdOut: function(stdOut) {
                                                            callbackStdOut(stdOut);
                                                            logger.debug(stdOut.toString());
                                                        }
                                                    });
                                                    proc.start();

                                                }
                                            });
                                            proc.start();
                                        });
                                    });
                                });

                            });
                        });

                    }, function(stdOut) {
                        hostnamePuppetAgent = hostnamePuppetAgent + stdOut.toString('utf8');
                    })

                }, function(stdOut) {
                    hostNamePuppetMaster = hostNamePuppetMaster + stdOut.toString('utf8');
                }, function(stdErr) {

                });
            });
        });

    };

    this.getMasterHostName = function(callback) {
        var hostNamePuppetMaster = '';
        runSSHCmdOnMaster('hostname -f', function(err, retCode) {
            console.log(err);
            if (err) {
                callback({
                    message: "Unable to get hostname of puppet-master. Unable to ssh into puppet master",
                    err: err
                }, null);
                return;
            }
            if (retCode !== 0) {
                message = "Unable to get hostname of puppet-master. Cmd failed with ret code : " + retCode
                callback({
                    message: message,
                    retCode: retCode
                }, null);
                return;
            }
            hostNamePuppetMaster = hostNamePuppetMaster.replace(/[\t\n\r\b\0\v\f\'\"\\]/g, '');
            hostNamePuppetMaster = hostNamePuppetMaster.trim();
            callback(null, hostNamePuppetMaster);
        }, function(stdOut) {
            hostNamePuppetMaster = hostNamePuppetMaster + stdOut.toString('utf8');
        }, function(stdErr) {

        });



    };

    this.getEnvironments = function(callback) {

        var stdOutStr = '';
        var stdErrStr = '';
        getPuppetConfig(function(err, puppetConfig) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug('envPath  == >' + puppetConfig.environmentpath);
            runSSHCmdOnMaster('ls ' + puppetConfig.environmentpath, function(err, retCode) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (retCode !== 0) {
                    message = "cmd run failed with ret code : " + retCode
                    callback({
                        message: message,
                        retCode: retCode
                    }, null);
                } else {
                    logger.debug(stdOutStr)
                    stdOutStr = stdOutStr.replace(/[\t\n\r\b\0\v\f\'\"\\]/g, '  ');
                    stdOutStr = stdOutStr.split('  ');
                    var environments = [];
                    for (var i = 0; i < stdOutStr.length; i++) {
                        stdOutStr[i] = stdOutStr[i].trim();
                        if (stdOutStr[i]) {
                            environments.push(stdOutStr[i]);
                        }
                    }
                    callback(null, environments);
                }
            }, function(stdOut) {
                stdOutStr = stdOutStr + stdOut.toString('utf8');

            }, function(stdErr) {
                stdErrStr = stdErrStr + stdOut.toString('utf8');
            });

        });


    };

    this.createEnvironment = function(envName, callback) {
        if (!envName) {
            process.nextTick(function() {
                callback({
                    message: "Invalid environment name",
                    retCode: -1
                })
            });
            return;
        }
        getPuppetConfig(function(err, puppetConfig) {
            if (err) {
                callback(err, null);
                return;
            }
            if (!puppetConfig.environmentpath) {
                callback({
                    "message": "Invalid puppet server configuration"
                }, null);
                return;
            }
            var stdOutStr = '';
            var stdErrStr = '';
            runSSHCmdOnMaster(['mkdir -p ' + puppetConfig.environmentpath + '/' + envName + '/manifests', 'mkdir -p ' + puppetConfig.environmentpath + '/' + envName + '/modules'], function(err, retCode) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (retCode !== 0) {
                    message = "cmd run failed with ret code : " + retCode
                    callback({
                        message: message,
                        retCode: retCode
                    }, null);
                } else {
                    callback(null, {
                        environment: envName
                    });
                }
            });
        });

    };

    this.getNodesList = function(callback) {
        var stdOutStr = '';
        var stdErrStr = '';
        this.getMasterHostName(function(err, masterHostname) {
            if (err) {
                callback(err, null);
                return;
            }
            runSSHCmdOnMaster('puppet cert list --all', function(err, retCode) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (retCode !== 0) {
                    message = "cmd run failed with ret code : " + retCode
                    callback({
                        message: message,
                        retCode: retCode
                    }, null);
                } else {
                    logger.debug(stdOutStr)
                    var regEx = /\+\s*\"(.*?)\"/g;
                    var matches;
                    var nodes = [];
                    while (matches = regEx.exec(stdOutStr)) {
                        if (matches.length == 2 && matches[1] !== masterHostname) {
                            nodes.push(matches[1]);
                        }

                    }
                    callback(null, nodes);
                }
            }, function(stdOut) {
                stdOutStr = stdOutStr + stdOut.toString('utf8');

            }, function(stdErr) {
                stdErrStr = stdErrStr + stdOut.toString('utf8');
            });
        });
    };

    this.getNode = function(nodeName, callback) {
        getPuppetConfig(function(err, puppetConfig) {
            if (err) {
                callback(err, null);
                return;
            }
            var stdOutStr = '';
            var stdErrStr = '';
            runSSHCmdOnMaster('cat ' + puppetConfig.yamldir + '/node/' + nodeName + '.yaml', function(err, retCode) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (retCode !== 0) {
                    message = "cmd run failed with ret code : " + retCode
                    callback({
                        message: message,
                        retCode: retCode
                    }, null);
                    return;
                }
                stdOutStr = stdOutStr.replace("!ruby/object:Puppet::Node", '');
              
                var node = YAML.load(stdOutStr);
                callback(null, node);

            }, function(stdOut) {
                stdOutStr = stdOutStr + stdOut.toString('utf8');

            }, function(stdErr) {
                stdErrStr = stdErrStr + stdOut.toString('utf8');
            });
        });
    };

    this.deleteNode = function(nodeName, callback) {
        runSSHCmdOnMaster('puppet cert clean ' + nodeName, function(err, retCode) {
            if (err) {
                callback(err, null);
                return;
            }
            if (retCode !== 0) {
                message = "cmd run failed with ret code : " + retCode
                callback({
                    message: message,
                    retCode: retCode
                }, null);
                return;
            }
            callback(null, true);
        });
    };

    this.getPuppetConfig = function(callback) {
        getPuppetConfig(callback);
    };

    this.runClient = function(options, callback, onStdOut, onStdErr) {
        logger.debug('running client');
        var sshOptions = {
            username: options.username,
            host: options.host,
            port: 22,
        }
        if (options.pemFileLocation) {
            sshOptions.privateKey = options.pemFileLocation;
        } else {
            sshOptions.password = options.password;
        }
        logger.debug(sshOptions);

        runSSHCmdOnAgent(sshOptions, 'puppet agent -t', function(err, retCode) {
            if (err) {
                callback({
                    message: "Unable to run puppet client on the node",
                    err: err
                }, null);
                return;
            }
            callback(null, retCode);
        }, function(stdOut) {
            if (typeof onStdOut === 'function') {
                onStdOut(stdOut);
            }
        }, function(stdErr) {
            if (typeof onStdErr === 'function') {
                onStdErr(stdErr);
            }

        });
    };

    this.cleanClient = function(options, callback, onStdOut, onStdErr) {
        logger.debug('cleaning client');
        var sshOptions = {
            username: options.username,
            host: options.host,
            port: 22,
        }
        if (options.pemFileLocation) {
            sshOptions.privateKey = options.pemFileLocation;
        } else {
            sshOptions.password = options.password;
        }
        logger.debug(sshOptions);

        runSSHCmdOnAgent(sshOptions, ['rm -rf /etc/puppet', 'rm -rf /var/lib/puppet', 'rm -rf $HOME/.puppet', 'service puppet stop'], function(err, retCode) {
            if (err) {
                callback({
                    message: "Unable to run puppet client on the node",
                    err: err
                }, null);
                return;
            }
            callback(null, retCode);
        }, function(stdOut) {
            if (typeof onStdOut === 'function') {
                onStdOut(stdOut);
            }
        }, function(stdErr) {
            if (typeof onStdErr === 'function') {
                onStdErr(stdOut);
            }
        });
    };

};

module.exports = Puppet;
