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


// This file act as a Controller which contains puppet related all end points.

var Puppet = require('_pr/lib/puppet.js');
var masterUtil = require('_pr/lib/utils/masterUtil');
var errorResponses = require('./error_responses');
var appConfig = require('_pr/config');
var taskStatusModule = require('_pr/model/taskstatus');
var environmentsDao = require('_pr/model/d4dmasters/environments.js');
var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var waitForPort = require('wait-for-port');
var uuid = require('node-uuid');
var fileIo = require('_pr/lib/utils/fileio');
var credentialCryptography = require('_pr/lib/credentialcryptography');

module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/puppet/*',verificationFunc);

    app.all('/puppet/:puppetServerId/*',function(req,res,next){
        if(req.params.puppetServerId) {
            next();
        } else {
            res.status(400).send({
                message:"Invalid puppet server id"
            })
            return;
        }
    });


    app.get('/puppet/:puppetServerId', function(req, res) {

        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.status(500).send( errorResponses.db.error);
                return;
            }
            
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }
            res.send(200, puppetData);

        });
    });
    app.get('/puppet/:puppetServerId/environments', function(req, res) {

        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.status(500).send( errorResponses.db.error);
                return;
            }
            
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }

            var puppetSettings = {
                host: puppetData.hostname,
                username: puppetData.username,
            };
            if (puppetData.pemFileLocation) {
                puppetSettings.pemFileLocation = puppetData.pemFileLocation;
            } else {
                puppetSettings.password = puppetData.puppetpassword;
            }
            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
            var puppet = new Puppet(puppetSettings);
            puppet.getEnvironments(function(err, data) {
                if (err) {
                    res.status(500).send( err);
                    return;
                }
                res.send(200, data);
            });
        });

    });

    app.post('/puppet/:puppetServerId/environments', function(req, res) {
        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.status(500).send( errorResponses.db.error);
                return;
            }
           
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }

            var puppetSettings = {
                host: puppetData.hostname,
                username: puppetData.username,
            };
            if (puppetData.pemFileLocation) {
                puppetSettings.pemFileLocation = puppetData.pemFileLocation;

            } else {
                puppetSettings.password = puppetData.puppetpassword;
            }
            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
            var puppet = new Puppet(puppetSettings);
            puppet.createEnvironment(req.body.envName, function(err, data) {
                if (err) {
                    res.status(500).send( err);
                    return;
                }
                res.send(200, data);
            });
        });
    });


    app.get('/puppet/:puppetServerId/nodes', function(req, res) {
        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.status(500).send( errorResponses.db.error);
                return;
            }
           
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }

            var puppetSettings = {
                host: puppetData.hostname,
                username: puppetData.username,
            };
            if (puppetData.pemFileLocation) {
                puppetSettings.pemFileLocation = puppetData.pemFileLocation;
            } else {
                puppetSettings.password = puppetData.puppetpassword;
            }
            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
            var puppet = new Puppet(puppetSettings);
            puppet.getNodesList(function(err, data) {
                if (err) {
                    res.status(500).send( err);
                    return;
                }
                res.send(200, data);
            });
        });

    });


    app.get('/puppet/:puppetServerId/nodes/:nodeName', function(req, res) {
        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.status(500).send( errorResponses.db.error);
                return;
            }
           
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }

            var puppetSettings = {
                host: puppetData.hostname,
                username: puppetData.username,
            };
            if (puppetData.pemFileLocation) {
                puppetSettings.pemFileLocation = puppetData.pemFileLocation;
            } else {
                puppetSettings.password = puppetData.puppetpassword;
            }
            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
            var puppet = new Puppet(puppetSettings);
            puppet.getNode(req.params.nodeName, function(err, data) {
                if (err) {
                    res.status(500).send( err);
                    return;
                }
                res.send(200, data);
            });
        });

    });

    app.post('/puppet/:puppetServerId/sync/nodes', function(req, res) {

        var taskStatusObj = null;
        var puppet = null;
        var reqBody = req.body;
        var projectId = reqBody.projectId;
        var orgId = reqBody.orgId;
        var bgId = reqBody.bgId;
        var envId = reqBody.envId;
        var count = 0;

        var users = reqBody.users;
        if (!projectId) {
            res.send(400);
            return;
        }
        if (!users || !users.length) {
            res.send(400);
            return;
        }

        var insertNodeInMongo = function(node, nodeIp, nodeValues, nodeName) {
           
            var platformId = '';
            if (!node.automatic) {
                node.automatic = {};
            }


            if (node.automatic.cloud) {
                if (node.automatic.cloud.provider === 'ec2') {
                    if (node.automatic.ec2) {
                        platformId = node.automatic.ec2.instance_id;
                    }
                }
            }

            var hardwareData = {
                platform: 'unknown',
                platformVersion: 'unknown',
                architecture: 'unknown',
                memory: {
                    total: 'unknown',
                    free: 'unknown',
                },
                os: 'linux'
            };


            hardwareData.architecture = nodeValues.hardwaremodel;
            hardwareData.platform = nodeValues.operatingsystem;
            hardwareData.platformVersion = nodeValues.operatingsystemrelease;
            hardwareData.memory.total = nodeValues.memorysize;
            hardwareData.memory.free = nodeValues.memoryfree;

            if (hardwareData.platform.toLowerCase().indexOf('windows') !== -1) {
                hardwareData.os = "windows";
            }

            function getCredentialsFromReq(callback) {
                var credentials = {};

                if (reqBody.credentials && reqBody.credentials.pemFileData) {
                    credentials = reqBody.credentials;
                    credentials.pemFileLocation = appConfig.tempDir + uuid.v4();
                    fileIo.writeFile(credentials.pemFileLocation, reqBody.credentials.pemFileData, null, function(err) {
                        if (err) {
                            logger.debug('unable to create pem file ', err);
                            callback(err, null);
                            return;
                        }
                        callback(null, credentials);
                    });

                } else {

                    if (!reqBody.credentials) {
                        var tempPemFileLocation = appConfig.tempDir + uuid.v4();
                        fileIo.copyFile(appConfig.aws.pemFileLocation + appConfig.aws.pemFile, tempPemFileLocation, function() {
                            if (err) {
                                logger.debug('unable to copy pem file ', err);
                                callback(err, null);
                                return;
                            }
                            credentials = {
                                username: appConfig.aws.instanceUserName,
                                pemFileLocation: tempPemFileLocation
                            }
                            callback(null, credentials);
                        });
                    } else {
                        callback(null, reqBody.credentials);
                    }
                }
            }

            getCredentialsFromReq(function(err, credentials) {
                if (err) {
                    logger.error("unable to get credetials from request ", err);
                    updateTaskStatusNode(nodeName, "Server behaved unexpectedly. Cannot import this node : " + nodeName, true, count);
                    return;
                }
                credentialCryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
                    if (err) {
                        logger.error("unable to encrypt credentials == >", err);
                        updateTaskStatusNode(nodeName, "Server behaved unexpectedly. Cannot import this node : " + nodeName, true, count);

                        return;
                    }

                    logger.debug('nodeip ==> ', nodeIp);
                    var instance = {
                        name: nodeName,
                        orgId: orgId,
                        bgId: bgId,
                        projectId: projectId,
                        envId: node.envId,
                        instanceIP: nodeIp,
                        instanceState: 'running',
                        bootStrapStatus: 'success',
                        hardware: hardwareData,
                        credentials: encryptedCredentials,
                        users: users,
                        puppet: {
                            serverId: req.params.puppetServerId,
                            puppetNodeName: nodeName
                        },
                        blueprintData: {
                            blueprintName: node.name,
                            templateId: "chef_import",
                            iconPath: "../private/img/templateicons/chef_import.png"
                        }
                    }

                    instancesDao.createInstance(instance, function(err, data) {
                        if (err) {
                            logger.error(err, 'occured in inserting node in mongo');
                            updateTaskStatusNode(nodeName, "Server behaved unexpectedly. Cannot import this node : " + nodeName, true, count);
                            return;
                        }
                        updateTaskStatusNode(nodeName, "Node Imported : " + nodeName, false, count);
                        logsDao.insertLog({
                            referenceId: data._id,
                            err: false,
                            log: "Node Imported",
                            timestamp: new Date().getTime()
                        });

                    });

                });
            });

        }

        function updateTaskStatusNode(nodeName, msg, err, i) {
            count++;
            var status = {};
            status.nodeName = nodeName;
            status.message = msg;
            status.err = err;

            logger.debug('taskstatus updated');

            if (count == reqBody.selectedNodes.length) {
                logger.debug('setting complete');
                taskstatus.endTaskStatus(true, status);
            } else {
                logger.debug('setting task status');
                taskstatus.updateTaskStatus(status);
            }

        };

        function importNodes(nodeList,puppetData) {
            logger.debug("Importing nodes");
           
            taskStatusModule.getTaskStatus(null, function(err, obj) {
                if (err) {
                    res.send(500);
                    return;
                }
                taskstatus = obj;
                for (var i = 0; i < nodeList.length; i++) {
                    logger.debug('looping on ==> ' + nodeList[i]);

                    (function(nodeName) {
                        logger.debug('getting node data ==> ' + nodeName);
                        puppet.getNode(nodeName, function(err, node) {
                            if (err) {
                                logger.debug(err);
                                updateTaskStatusNode(nodeName, "Unable to fetch node properties. Cannot import this node : " + nodeName, true, count);
                                return;
                            } else {


                                logger.debug('creating env ==>', node.parameters.environment);
                                logger.debug('orgId ==>', orgId);
                                logger.debug('bgid ==>', bgId);
                                var envObj = {
                                    projectname: reqBody.projectName,
                                    projectname_rowid: projectId,
                                    orgname: reqBody.orgName,
                                    orgname_rowid: orgId,
                                    configname: puppetData.puppetservername,
                                    configname_rowid: puppetData.rowid,
                                    environmentname: node.parameters.environment,
                                    id: '3'
                                };
                              
                                environmentsDao.createEnv(envObj, function(err, data) {
                                    if (err) {
                                        logger.debug(err, 'occured in creating environment in mongo');
                                        updateTaskStatusNode(nodeName, "Error while creating environment in catalyst. Unable to import node : " + nodeName, true, count);
                                        return;
                                    }
                                    logger.debug('Env ID Received before instance create:' + data);
                                    node.envId = data;
                                    //fetching the ip of the imported node
                                    var nodeIp = 'unknown';
                                    var nodeValues;

                                    if (node.facts && node.facts.values) {
                                        nodeValues = node.facts.values;
                                    } else if (node.parameters) {
                                        nodeValues = node.parameters;
                                    }
                                    if (!nodeValues) {
                                        updateTaskStatusNode(nodeName, "Node Properties Corrupt. Unable to import node : " + nodeName, true, count);
                                        return;
                                    }
                                    if (nodeValues.ec2_public_ipv4) {
                                        nodeIp = nodeValues.ec2_public_ipv4;
                                    } else {
                                        nodeIp = nodeValues.ipaddress;
                                    }

                                    instancesDao.getInstanceByOrgAndNodeNameOrIP(orgId, nodeName, nodeIp, function(err, instances) {
                                        if (err) {
                                            logger.debug('Unable to fetch instance', err);
                                            updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                            return;
                                        }
                                        if (instances.length) {
                                            configmgmtDao.getOrgBgProjEnvNameFromIds(instances[0].orgId, instances[0].bgId, instances[0].projectId, instances[0].envId, function(err, names) {
                                                if (err) {
                                                    updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                                    return;
                                                }
                                                updateTaskStatusNode(node.name, "Node exist in " + names.orgName + "/" + names.bgName + "/" + names.projName + "/" + names.envName + " : " + node.name, true, count);
                                            });
                                            return;
                                        }
                                        var openport = 22;
                                        if (nodeValues.operatingsystem && nodeValues.operatingsystem.toLowerCase().indexOf('windows') !== -1) {
                                            openport = 5985;
                                        }
                                        logger.debug('checking port for node with ip : ' + nodeIp +" "+openport);
                                        waitForPort(nodeIp, openport, function(err) {
                                            if (err) {
                                                logger.debug(err);
                                                updateTaskStatusNode(node.name, "Unable to ssh/winrm into node " + node.name + ". Cannot import this node.", true, count);
                                                return;
                                            }
                                            insertNodeInMongo(node, nodeIp, nodeValues, nodeName);
                                        });

                                    });
                                });
                            }
                        });

                    })(nodeList[i]);
                }

                res.send(200, {
                    taskId: taskstatus.getTaskId()
                });
            });

        }

        masterUtil.getCongifMgmtsById(req.params.puppetServerId, function(err, puppetData) {
            if (err) {
                res.send(500);
                return;
            }
            if (!puppetData || puppetData.configType !== 'puppet') {
                res.send(404, {
                    message: "puppet server not found"
                });
                return;
            }
            var puppetSettings = {
                host: puppetData.hostname,
                username: puppetData.username,
            };
            if (puppetData.pemFileLocation) {
                puppetSettings.pemFileLocation = puppetData.pemFileLocation;
            } else {
                puppetSettings.password = puppetData.puppetpassword;
            }
            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
            puppet = new Puppet(puppetSettings);
            if (reqBody.selectedNodes.length) {
                importNodes(reqBody.selectedNodes,puppetData);
            } else {
                res.send(400);
                return;
            }

        });
    });
};