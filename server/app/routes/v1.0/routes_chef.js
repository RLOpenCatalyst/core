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


// This file act as a Controller which contains chef server related all end points.


var Chef = require('_pr/lib/chef');
var instancesDao = require('_pr/model/classes/instance/instance');
var environmentsDao = require('_pr/model/d4dmasters/environments.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var chefDao = require('_pr/model/dao/chefDao.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var fileIo = require('_pr/lib/utils/fileio');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var taskStatusModule = require('_pr/model/taskstatus');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var errorResponses = require('./error_responses');
var waitForPort = require('wait-for-port');
var logger = require('_pr/logger')(module);
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var Docker = require('_pr/model/docker.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var SSHExec = require('_pr/lib/utils/sshexec');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var monitorsModel = require('_pr/model/monitors/monitors.js');


module.exports.setRoutes = function (app, verificationFunc) {

    app.all('/chef/*', verificationFunc);

    app.get('/chef/servers/:serverId/nodes', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                logger.debug(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!chefDetails) {
                res.send(404, errorResponses.chef.corruptChefData);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getNodesList(function (err, nodeList) {
                if (err) {
                    res.status(500).send(errorResponses.chef.connectionError);
                    return;
                } else {
                    instancesDao.getInstancesFilterByChefServerIdAndNodeNames(req.params.serverId, nodeList, function (err, instances) {
                        if (err) {
                            res.status(500).send(errorResponses.chef.connectionError);
                            return;
                        }
                        if (instances && instances.length) {
                            for (var i = 0; i < instances.length; i++) {
                                var index = nodeList.indexOf(instances[i].chef.chefNodeName);
                                if (index !== -1) {
                                }
                            }
                            res.send(nodeList);
                        } else {
                            res.send(nodeList);
                        }

                    });
                }
            });

        });
    });


    app.get('/chef/justtesting/:mastername/:fieldname/:comparedfieldname/:comparedfieldvalue', function (req, res) {
        logger.debug('test', req.params.mastername, ' ' + req.params.fieldname, ' ' + req.params.comparedfieldname);
        configmgmtDao.getListFilteredNew(req.params.mastername, req.params.fieldname, req.params.comparedfieldname, req.params.comparedfieldvalue, function (err, outd) {
            if (!err)
                res.send(outd);
            else
                res.send(err);
        });
    });
    app.get('/chef/servers/:serverId/environments', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                logger.debug(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!chefDetails) {
                res.send(404, errorResponses.chef.corruptChefData);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getEnvironmentsList(function (err, environmentsList) {
                if (err) {
                    res.status(500).send(errorResponses.chef.connectionError);
                    return;
                } else {
                    res.send(environmentsList);
                }
            });

        });
    });

    app.get('/chef/servers/:serverId/nodes/:nodeName', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                logger.debug(err);
                res.send(500);
                return;
            }
            if (!chefDetails) {
                logger.debug("Chef details not found");
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getNode(req.params.nodeName, function (err, nodeData) {
                if (err) {
                    logger.debug(err)
                    res.send(500);
                    return;
                } else {
                    res.send(nodeData);
                }
            });

        });
    });


    app.post('/chef/servers/:serverId/sync/nodes', function (req, res) {
        var taskStatusObj = null;
        var chef = null;
        var reqBody = req.body;
        var projectId = reqBody.projectId;
        var orgId = reqBody.orgId;
        var bgId = reqBody.bgId;
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
        var insertNodeInMongo = function (node, chefDetail, callback) {
            var platformId = '';
            if (!node.automatic) {
                node.automatic = {};
            }
            var nodeIp = 'unknown';
            if (node.automatic.ipaddress) {
                nodeIp = node.automatic.ipaddress;
            }
            if (node.automatic.cloud) {
                if (node.automatic.cloud.public_ipv4 && node.automatic.cloud.public_ipv4 !== 'null') {
                    nodeIp = node.automatic.cloud.public_ipv4;
                }
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
            if (node.automatic.os) {
                hardwareData.os = node.automatic.os;
            }
            if (node.automatic.kernel && node.automatic.kernel.machine) {
                hardwareData.architecture = node.automatic.kernel.machine;
            }
            if (node.automatic.platform) {
                hardwareData.platform = node.automatic.platform;
            }
            if (node.automatic.platform_version) {
                hardwareData.platformVersion = node.automatic.platform_version;
            }
            if (node.automatic.memory) {
                hardwareData.memory.total = node.automatic.memory.total;
                hardwareData.memory.free = node.automatic.memory.free;
            }
            var runlist = node.run_list;
            if (!runlist) {
                runlist = [];
            }
            if (hardwareData.platform === 'windows') {
                hardwareData.os = "windows";
            }
            function getCredentialsFromReq(callback) {
                var credentials = {};
                if (reqBody.credentials && reqBody.credentials.pemFileData) {
                    credentials = reqBody.credentials;
                    credentials.pemFileLocation = appConfig.tempDir + uuid.v4();
                    fileIo.writeFile(credentials.pemFileLocation, reqBody.credentials.pemFileData, null, function (err) {
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
                        fileIo.copyFile(appConfig.aws.pemFileLocation + appConfig.aws.pemFile, tempPemFileLocation, function () {
                            if (err) {
                                logger.debug('unable to copy pem file ', err);
                                callback(err, null);
                                return;
                            }
                            credentials = {
                                username: appConfig.aws.instanceUserName,
                                pemFileLocation: tempPemFileLocation
                            };
                            callback(null, credentials);
                        });
                    } else {
                        callback(null, reqBody.credentials);
                    }
                }
            }
            getCredentialsFromReq(function (err, credentials) {
                if (err) {
                    logger.debug("unable to get credetials from request ", err);
                    callback(err, null);
                    return;
                }
                credentialCryptography.encryptCredential(credentials, function (err, encryptedCredentials) {
                    if (err) {
                        logger.debug("unable to encrypt credentials == >", err);
                        callback(err, null);
                        return;
                    }
                    configmgmtDao.getEnvNameFromEnvId(node.envId, function (err, envName) {
                        if (err) {
                            callback({
                                message: "Failed to get env name from env id"
                            }, null);
                            return;
                        }
                        ;
                        if (!envName) {
                            callback({
                                "message": "Unable to find environment name from environment id"
                            });
                            return;
                        }
                        ;
                        var nodeDetails = {
                            nodeIp: nodeIp,
                            nodeOs: hardwareData.os,
                            nodeName: node.name,
                            nodeEnv: envName
                        }
                        checkNodeCredentials(credentials, nodeDetails, function (err, credentialStatus) {
                            if (err) {
                                logger.debug("Invalid Credentials  ", err);
                                callback(err, null);
                                return;
                            } else if (credentialStatus) {
                                monitorsModel.getById(reqBody.monitorId, function (err, monitor) {
                                    var instance = {
                                        name: node.name,
                                        orgId: orgId,
                                        bgId: bgId,
                                        projectId: projectId,
                                        envId: node.envId,
                                        orgName: reqBody.orgName,
                                        bgName: reqBody.bgName,
                                        projectName: reqBody.projectName,
                                        environmentName: envName,
                                        chefNodeName: node.name,
                                        runlist: runlist,
                                        platformId: platformId,
                                        instanceIP: nodeIp,
                                        instanceState: 'running',
                                        bootStrapStatus: 'success',
                                        hardware: hardwareData,
                                        tagServer: reqBody.tagServer,
                                        monitor: monitor,
                                        credentials: encryptedCredentials,
                                        users: users,
                                        chef: {
                                            serverId: req.params.serverId,
                                            chefNodeName: node.name
                                        },
                                        blueprintData: {
                                            blueprintName: node.name,
                                            templateId: "chef_import",
                                            iconPath: "../private/img/templateicons/chef_import.png"
                                        }
                                    };
                                    instancesDao.createInstance(instance, function (err, data) {
                                        if (err) {
                                            logger.debug(err, 'occured in inserting node in mongo');
                                            callback(err, null);
                                            return;
                                        }
                                        instance.id = data._id;
                                        instance._id = data._id;

                                        //install sensu client if monitoring server configured
                                        if (instance.monitor && instance.monitor.parameters.transportProtocol === 'rabbitmq') {
                                            credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                                                if (err) {
                                                    logger.error("Unable to decrypt pem file. client run failed: ", err);
                                                } else {
                                                    var sensuCookBooks = MasterUtils.getSensuCookbooks();
                                                    var runlist = sensuCookBooks;
                                                    var jsonAttributes = {};
                                                    jsonAttributes['sensu-client'] = MasterUtils.getSensuCookbookAttributes(instance.monitor, instance.id);

                                                    runOptions = {
                                                        username: decryptedCredentials.username,
                                                        host: instance.instanceIP,
                                                        instanceOS: instance.hardware.os,
                                                        port: 22,
                                                        runlist: runlist,
                                                        overrideRunlist: false,
                                                        jsonAttributes: JSON.stringify(jsonAttributes)
                                                    };
                                                    if (decryptedCredentials.pemFileLocation) {
                                                        runOptions.privateKey = decryptedCredentials.pemFileLocation;
                                                    } else {
                                                        runOptions.password = decryptedCredentials.password;
                                                    }
                                                    chef.runClient(runOptions, function (err, retCode) {
                                                        logger.debug("knife ret code", retCode);
                                                    });
                                                }
                                            });
                                        }




                                        var timestampStarted = new Date().getTime();
                                        var actionLog = instancesDao.insertBootstrapActionLogForChef(instance.id, [], req.session.user.cn, timestampStarted);
                                        var logsReferenceIds = [instance.id, actionLog._id];
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: false,
                                            log: "Node Imported",
                                            timestamp: timestampStarted
                                        });
                                        var instanceLog = {
                                            actionId: actionLog._id,
                                            instanceId: instance.id,
                                            orgName: reqBody.orgName,
                                            bgName: reqBody.bgName,
                                            projectName: reqBody.projectName,
                                            envName: envName,
                                            status: "running",
                                            bootStrap: "success",
                                            actionStatus: "success",
                                            platformId: platformId,
                                            blueprintName: node.name,
                                            data: runlist,
                                            platform: hardwareData.platform,
                                            os: hardwareData.os,
                                            size: "",
                                            user: req.session.user.cn,
                                            startedOn: new Date().getTime(),
                                            createdOn: new Date().getTime(),
                                            providerType: "",
                                            action: "Imported From ChefServer",
                                            logs: [{
                                                    err: false,
                                                    log: "Node Imported",
                                                    timestamp: new Date().getTime()
                                                }]
                                        };

                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        var _docker = new Docker();
                                        _docker.checkDockerStatus(data._id, function (err, retCode) {
                                            if (err) {
                                                logger.error("Failed _docker.checkDockerStatus", err);
                                                return;
                                            }
                                            logger.debug('Docker Check Returned:' + retCode);
                                            if (retCode == '0') {
                                                instancesDao.updateInstanceDockerStatus(data._id, "success", '', function (data) {
                                                    logger.debug('Instance Docker Status set to Success');
                                                });
                                            }
                                        });
                                        callback(null, data);
                                    });
                                });
                            } else {
                                callback({message: "Invalid Credentials"}, null);
                            }
                        })
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
        }
        ;
        function importNodes(nodeList, chefDetail) {
            taskStatusModule.getTaskStatus(null, function (err, obj) {
                if (err) {
                    res.send(500);
                    return;
                }
                taskstatus = obj;
                for (var i = 0; i < nodeList.length; i++) {

                    (function (nodeName) {
                        chef.getNode(nodeName, function (err, node) {
                            if (err) {
                                logger.debug(err);
                                updateTaskStatusNode(nodeName, "Unable to import node " + nodeName, true, count);
                                return;
                            } else {
                                var envObj = {
                                    projectname: reqBody.projectName,
                                    projectname_rowid: projectId,
                                    orgname: reqBody.orgName,
                                    orgname_rowid: orgId,
                                    configname: chefDetail.configname,
                                    configname_rowid: chefDetail.rowid,
                                    environmentname: node.chef_environment,
                                    id: '3'
                                };
                                environmentsDao.createEnv(envObj, function (err, data) {
                                    if (err) {
                                        logger.debug(err, 'occured in creating environment in mongo');
                                        updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                        return;
                                    }
                                    logger.debug('Env ID Received before instance create:' + data);
                                    node.envId = data;
                                    //fetching the ip of the imported node
                                    var nodeIp = 'unknown';
                                    if (node.automatic.ipaddress) {
                                        nodeIp = node.automatic.ipaddress;
                                    }

                                    if (node.automatic.cloud && node.automatic.cloud.public_ipv4 && node.automatic.cloud.public_ipv4 !== 'null') {
                                        nodeIp = node.automatic.cloud.public_ipv4;
                                    }

                                    instancesDao.getInstanceByOrgAndNodeNameOrIP(orgId, node.name, nodeIp, function (err, instances) {
                                        if (err) {
                                            logger.debug('Unable to fetch instance', err);
                                            updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                            return;
                                        }
                                        if (instances.length) {
                                            configmgmtDao.getOrgBgProjEnvNameFromIds(instances[0].orgId, instances[0].bgId, instances[0].projectId, instances[0].envId, function (err, names) {
                                                if (err) {
                                                    updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                                    return;
                                                }
                                                updateTaskStatusNode(node.name, "Node exist in " + names.orgName + "/" + names.bgName + "/" + names.projName + "/" + names.envName + " : " + node.name, true, count);
                                            });
                                            return;
                                        }

                                        var openport = 22;
                                        if (node.automatic.platform === 'windows') {
                                            openport = 5985;
                                        }
                                        logger.debug('checking port for node with ip : ' + nodeIp);
                                        waitForPort(nodeIp, openport, function (err) {
                                            if (err) {
                                                logger.debug(err);
                                                updateTaskStatusNode(node.name, "Unable to ssh/winrm into node " + node.name + ". Cannot import this node.", true, count);
                                                return;
                                            }
                                            insertNodeInMongo(node, chefDetail, function (err, nodeData) {
                                                if (err) {
                                                    if (err.message) {
                                                        updateTaskStatusNode(nodeName, "The username or password/pemfile you entered is incorrect.", true, count);
                                                        return;
                                                    } else {
                                                        updateTaskStatusNode(nodeName, "Unknown error occured while importing " + node.name + ". Cannot import this node.", true, count);
                                                        return;
                                                    }
                                                }
                                                updateTaskStatusNode(nodeName, "Node Imported : " + nodeName, false, count);
                                            });

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
        MasterUtils.getCongifMgmtsById(req.params.serverId, function (err, chefDetails) {

            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url
            });
            if (reqBody.selectedNodes.length) {
//                res.sendStatus(400);

                importNodes(reqBody.selectedNodes, chefDetails);

            } else {
                res.send(400);
                return;
            }

        });

        function checkNodeCredentials(credentials, nodeDetail, callback) {
            if (nodeDetail.nodeOs !== 'windows') {
                var sshOptions = {
                    username: credentials.username,
                    host: nodeDetail.nodeIp,
                    port: 22,
                };
                if (credentials.pemFileLocation) {
                    sshOptions.privateKey = credentials.pemFileLocation;
                    sshOptions.pemFileData = credentials.pemFileData;
                } else {
                    sshOptions.password = credentials.password;
                }
                var sshExec = new SSHExec(sshOptions);

                sshExec.exec('echo Welcome', function (err, retCode) {
                    if (err) {
                        callback(err, null);
                        return;
                    } else if (retCode === 0) {
                        callback(null, true);
                    } else {
                        callback(null, false);
                    }
                }, function (stdOut) {
                    logger.debug(stdOut.toString('ascii'));
                }, function (stdErr) {
                    logger.error(stdErr.toString('ascii'));
                });
            } else {
                callback(null, true);
            }
        }
    });

    app.post('/chef/environments/create/:serverId', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.createEnvironment(req.body.envName, function (err, envName) {
                if (err) {
                    res.status(500).send("Error to create Env on chef.");
                    return;
                } else if (envName === 409) {
                    logger.debug("Got 409");
                    res.send(409, "Environment Already Exist.");
                    return;
                } else {
                    logger.debug("envName: ", envName);
                    res.send(envName);
                    return;
                }
            });
        });
    });

    app.get('/chef/servers/:serverId/cookbooks', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });

            chef.getCookbooksList(function (err, cookbooks) {
                logger.debug(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send(cookbooks);
                    return;
                }
            });


        });

    });

    app.get('/chef/servers/:serverId/cookbooks/:cookbookName', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getCookbook(req.params.cookbookName, function (err, cookbooks) {
                logger.debug(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send(cookbooks);
                    return;
                }
            });
        });
    });

    app.get('/chef/servers/:serverId/cookbooks/:cookbookName/download', function (req, res) {

        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });

            chef.downloadCookbook(req.params.cookbookName, function (err, cookbooks) {
                logger.debug(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send(cookbooks);
                    return;
                }
            });


        });

    });

    app.post('/chef/servers/:serverId/attributes', function (req, res) {

        if (!((req.body.cookbooks && req.body.cookbooks.length) || (req.body.roles && req.body.roles.length))) {
            res.status(400).send({
                message: "Invalid cookbooks or roles"
            });
            return;
        }

        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            if (req.body.cookbooks && req.body.cookbooks.length) {
                chef.getCookbookAttributes(req.body.cookbooks, function (err, attributesList) {
                    if (err) {
                        res.send(500);
                        return;
                    } else {
                        res.send(attributesList);
                        return;
                    }
                });
            } else {
                // get roles attributes
                res.send([]);
                return;
            }



        });

    });

    app.get('/chef/servers/:serverId/receipeforcookbooks/:cookbookName', function (req, res) {

        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });

            chef.getReceipesForCookbook(req.params.cookbookName, function (err, cookbooks) {
                logger.debug(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send(cookbooks);
                    return;
                }
            });


        });

    });


    app.get('/chef/servers/:serverId', function (req, res) {
        logger.debug(req.params.serverId);
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            logger.debug("chefLog -->", chefDetails);
            if (chefDetails) {
                res.send({
                    serverId: chefDetails.rowid,
                    orgname: chefDetails.orgname,
                    orgname_new: chefDetails.orgname_new,
                    orgname_rowid: chefDetails.orgname_rowid
                });
            } else {
                res.send(404);
                return;
            }

        });

    });


    app.post('/chef/servers/:serverId/nodes/:nodeName/updateEnv', function (req, res) {
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                logger.debug(err);
                res.status(500).send(errorResponses.chef.corruptChefData);
                return;
            }
            if (!chefDetails) {
                res.status(500).send(errorResponses.chef.corruptChefData);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.updateNodeEnvironment(req.params.nodeName, req.body.envName, function (err, success) {
                if (err) {
                    res.send(500);
                    return;
                } else if (success) {
                    chefDao.updateChefNodeEnv(req.params.nodeName, req.body.envName, function (err, data) {
                        if (err) {
                            res.send(500);
                            return;
                        } else {
                            res.send(200);
                            return;
                        }
                    })
                } else {
                    res.send(500);
                    return;
                }
            });
        });
    });

    app.get('/chef/servers/:serverId/cookbooks/:cookbookName/metadata', function (req, res) {

        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getCookbook(req.params.cookbookName, function (err, cookbooks) {
                logger.debug(err);
                if (err) {
                    res.send(500);
                    return;
                } else {
                    res.send(cookbooks.metadata);
                    return;
                }
            });


        });

    });


    // Create new Data Bag.
    app.post("/chef/servers/:serverId/databag/create", function (req, res) {
        logger.debug("Enter /chef/../databag/create");
        var loggedInUser = req.session.user;
        masterUtil.hasPermission("databag", "create", loggedInUser, function (err, isPermitted) {
            logger.debug("Got permission to create DataBag: ", isPermitted);
            if (isPermitted) {
                configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404);
                        return;
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });
                    chef.createDataBag(req.body.name, function (err, dataBag) {
                        if (err) {
                            logger.debug("Exit /chef/../databag/create");
                            res.status(500).send("Failed to create Data Bag on Chef.");
                            return;
                        } else if (dataBag === 409) {
                            logger.debug("Exit /chef/../databag/create");
                            res.status(500).send("Data Bag already exist on Chef.");
                            return;
                        } else if (dataBag === 400) {
                            logger.debug("Exit /chef/../databag/create");
                            res.status(400).send("Name can only contain lowercase letters, numbers, hyphens, and underscores.");
                            return;
                        }
                        logger.debug("Exit /chef/../databag/create");
                        res.send(dataBag);
                        return;
                    });
                });
            } else {
                res.send(403, {
                    "message": "You do't have permission to create DataBag."
                });
                return;
            }
        });
    });

    // List all Data Bags.
    app.get("/chef/servers/:serverId/databag/list", function (req, res) {
        logger.debug("Enter /chef/../databag/list");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getDataBags(function (err, dataBags) {
                if (err) {
                    logger.debug("Exit /chef/../databag/list");
                    res.status(500).send("Failed to get Data Bag from Chef.");
                    return;
                }
                logger.debug("Exit /chef/../databag/list");
                res.send(dataBags);
                return;
            });
        });
    });

    // Delete a particular Data Bag.
    app.delete("/chef/servers/:serverId/databag/:dataBagName/delete", function (req, res) {
        logger.debug("Enter /chef/../databag/../delete");
        var loggedInUser = req.session.user;
        masterUtil.hasPermission("databag", "delete", loggedInUser, function (err, isPermitted) {
            if (isPermitted) {
                logger.debug("Got permission to remove DataBag: ", isPermitted);
                configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404);
                        return;
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });
                    chef.deleteDataBag(req.params.dataBagName, function (err, statusCode) {
                        if (err) {
                            logger.debug("Exit /chef/../databag/../delete");
                            res.status(500).send("Failed to delete Data Bag on Chef.");
                            return;
                        } else if (statusCode === 404) {
                            logger.debug("Exit /chef/../databag/../delete");
                            res.status(500).send("No Data Bag found on Chef.");
                            return;
                        }
                        logger.debug("Exit /chef/../databag/../delete");
                        res.send(statusCode);
                        return;
                    });
                });
            } else {
                res.send(403, {
                    "message": "You don't have permission to Delete DataBag."
                });
                return;
            }
        });
    });


    // Create new Data Bag Item.
    app.post("/chef/servers/:serverId/databag/:dataBagName/item/create", function (req, res) {
        logger.debug("Enter /chef/../databag/../item/create");
        var loggedInUser = req.session.user;
        masterUtil.hasPermission("databag", "create", loggedInUser, function (err, isPermitted) {
            if (isPermitted) {
                logger.debug("Got permission to create DataBagItem: ", isPermitted);
                configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
                    if (err) {
                        res.status(500).send("Error to get chef detail.");
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404, "No chef detail found.");
                        return;
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });
                    logger.debug("Id check: ", JSON.stringify(req.body));
                    if (typeof req.body.id === 'undefined' || req.body.id.length === 0) {
                        res.status(400).send("Id can't be empty.");
                        return;
                    }
                    var dataBagItem;
                    if (typeof req.body.dataBagItem === 'undefined') {
                        dataBagItem = {
                            "id": req.body.id
                        };
                    } else {
                        dataBagItem = req.body.dataBagItem;
                        dataBagItem.id = req.body.id;
                    }
                    try {
                        logger.debug("Incoming data bag item: ", JSON.stringify(dataBagItem));
                        dataBagItem = JSON.parse(JSON.stringify(dataBagItem));
                    } catch (e) {
                        logger.debug("error: ", e);
                        res.status(500).send("Invalid Json for Data Bag item.");
                        return;
                    }
                    chef.createDataBagItem(req, dataBagItem, function (err, dataBagItem) {
                        if (err) {
                            logger.debug("Exit /chef/../databag/../item/create");
                            res.status(500).send("Failed to create Data Bag Item on Chef.");
                            return;
                        }
                        if (dataBagItem === 409) {
                            logger.debug("Exit /chef/../databag/../item/create");
                            res.status(500).send("Data Bag Item already exist on Chef.");
                            return;
                        }
                        if (dataBagItem === 403) {
                            logger.debug("Exit /chef/../databag/../item/create");
                            res.send(403, "Encryption Key is not available,Please upload.");
                            return;
                        }
                        logger.debug("Exit /chef/../databag/../item/create");
                        res.send(dataBagItem);
                        return;
                    });
                });
            } else {
                res.send(403, {
                    "message": "You don't have permission to create DataBagItem."
                });
                return;
            }
        });
    });


    // List all Data Bag Items for a Data Bag.
    app.get("/chef/servers/:serverId/databag/:dataBagName/item/list", function (req, res) {
        logger.debug("Enter /chef/../databag/item/list");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getDataBagItems(req.params.dataBagName, function (err, dataBagItems) {
                if (err) {
                    logger.debug("Exit /chef/../databag/item/list");
                    res.status(500).send("Failed to get Data Bag from Chef.");
                    return;
                }
                logger.debug("Exit /chef/../databag/item/list");
                logger.debug(JSON.stringify(dataBagItems));
                if (Object.keys(dataBagItems).length > 0) {
                    var responseObj = JSON.stringify(Object.keys(dataBagItems));
                    logger.debug("response " + responseObj);
                    res.send(JSON.parse(responseObj));
                    return;
                } else {
                    res.send(dataBagItems);
                    return;
                }
            });
        });
    });


    // Update a Data Bag Item.
    app.post("/chef/servers/:serverId/databag/:dataBagName/item/:itemId/update", function (req, res) {
        logger.debug("Enter /chef/../databag/../item/update");
        var loggedInUser = req.session.user;
        masterUtil.hasPermission("databag", "modify", loggedInUser, function (err, isPermitted) {
            if (isPermitted) {
                logger.debug("Got permission to update DataBagItem: ", isPermitted);
                configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404);
                        return;
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });
                    var dataBagItem;
                    if (typeof req.body.dataBagItem === 'undefined') {
                        dataBagItem = {
                            "id": req.params.itemId
                        };
                    } else {
                        dataBagItem = req.body.dataBagItem;
                        dataBagItem.id = req.params.itemId;
                    }
                    try {
                        logger.debug("Incoming data bag item: ", JSON.stringify(dataBagItem));
                        dataBagItem = JSON.parse(JSON.stringify(dataBagItem));
                    } catch (e) {
                        logger.debug("error: ", e);
                        res.status(500).send("Invalid Json for Data Bag item.");
                        return;
                    }
                    chef.updateDataBagItem(req, dataBagItem, function (err, dataBagItem) {
                        if (err) {
                            logger.debug("Exit /chef/../databag/../item/update");
                            res.status(500).send("Failed to update Data Bag Item on Chef.");
                            return;
                        }
                        if (dataBagItem === 403) {
                            logger.debug("Exit /chef/../databag/../item/update");
                            res.send(403, "Encryption Key is not available,Please upload.");
                            return;
                        }
                        logger.debug("Exit /chef/../databag/../item/update");
                        res.send(dataBagItem);
                        return;
                    });
                });
            } else {
                res.send(403, {
                    "message": "You don't have permission to Update DataBagItem."
                });
                return;
            }
        });
    });

    // Delete a Data Bag Item from a Data Bag.
    app.delete("/chef/servers/:serverId/databag/:dataBagName/item/:itemName/delete", function (req, res) {
        logger.debug("Enter /chef/../databag/../item/delete");
        var loggedInUser = req.session.user;
        masterUtil.hasPermission("databag", "delete", loggedInUser, function (err, isPermitted) {
            if (isPermitted) {
                logger.debug("Got permission to remove DataBagItem: ", isPermitted);
                configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404);
                        return;
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url,
                    });
                    chef.deleteDataBagItem(req.params.dataBagName, req.params.itemName, function (err, dataBagItem) {
                        if (err) {
                            logger.debug("Exit /chef/../databag/../item/delete");
                            res.status(500).send("Failed to delete Data Bag Item on Chef.");
                            return;
                        }
                        logger.debug("Exit /chef/../databag/../item/delete");
                        res.send(dataBagItem);
                        return;
                    });
                });
            } else {
                res.send(403, {
                    "message": "You don't have permission to delete DataBagItem."
                });
                return;
            }
        });
    });

    // Find a Data Bag Item by Id from a Data Bag.
    app.get("/chef/servers/:serverId/databag/:dataBagName/item/:itemId/find", function (req, res) {
        logger.debug("Enter /chef/../databag/../item/find");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.getDataBagItemById(req.params.dataBagName, req.params.itemId, function (err, dataBagItem) {
                if (err) {
                    logger.debug("Exit /chef/../databag/../item/find");
                    res.status(500).send("Failed to find Data Bag Item on Chef.");
                    return;
                }
                logger.debug("Exit /chef/../databag/../item/find");
                res.send(dataBagItem);
                return;
            });
        });
    });

    // Delete env from chef.
    app.delete("/chef/servers/:serverId/environments/:envName", function (req, res) {
        logger.debug("Enter /chef/../environments");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.deleteEnvironment(req.params.envName, function (err, env) {
                if (err) {
                    logger.debug("Exit /chef/../environments ", err);
                    res.status(500).send("Failed to delete environments on Chef.");
                    return;
                }
                logger.debug("Exit /chef/../environments");
                res.send(env);
                return;
            });
        });
    });

    app.delete("/chef/servers/:serverId/environments/:envName", function (req, res) {
        logger.debug("Enter /chef/../environments");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.deleteEnvironment(req.params.envName, function (err, env) {
                if (err) {
                    logger.debug("Exit /chef/../environments ", err);
                    res.status(500).send("Failed to delete environments on Chef.");
                    return;
                }
                logger.debug("Exit /chef/../environments");
                res.send(env);
                return;
            });
        });
    });

    app.get("/chef/servers/:serverId/search/:index", function (req, res) {
        logger.debug("Enter /chef/../environments");
        configmgmtDao.getChefServerDetails(req.params.serverId, function (err, chefDetails) {
            if (err) {
                res.send(500);
                return;
            }
            if (!chefDetails) {
                res.send(404);
                return;
            }
            var chef = new Chef({
                userChefRepoLocation: chefDetails.chefRepoLocation,
                chefUserName: chefDetails.loginname,
                chefUserPemFile: chefDetails.userpemfile,
                chefValidationPemFile: chefDetails.validatorpemfile,
                hostedChefUrl: chefDetails.url,
            });
            chef.search(req.params.index, req.query.searchQuery, function (err, env) {
                if (err) {
                    res.status(500).send("Failed to to seacrh on chef.");
                    return;
                }
                logger.debug("Exit /chef/../environments");
                res.send(env);
                return;
            });
        });
    });

    app.get("/chef/nodeList", function (req, res) {
        var reqObj = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.changeRequestForJqueryPagination(req.query, next);
                    },
                    function (reqData, next) {
                        reqObj = reqData;
                        apiUtil.paginationRequest(reqData, 'chefNodes', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['searchColumns'] = ['chefNodeIp', 'chefNodeName', "chefNodePlatform"];
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        chefDao.getNodesByServerId(queryObj, next);
                    },
                    function (nodes, next) {
                        apiUtil.changeResponseForJqueryPagination(nodes, reqObj, next);
                    },
                ], function (err, results) {
            if (err) {
                res.send(err);
            } else {
                res.send(results);
            }
        });
    });
};
