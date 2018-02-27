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


// This file act as a Controller which contains service related all end points.


var CMDBConfig = require('_pr/model/servicenow/servicenow.js');
var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var environmentsDao = require('_pr/model/d4dmasters/environments.js');
var uuid = require('node-uuid');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Chef = require('_pr/lib/chef.js');
var taskStatusModule = require('_pr/model/taskstatus');
var settingsService = require('_pr/services/settingsService');


module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/servicenow*', verificationFunc);
    app.all('/cmdb*', verificationFunc);

    app.get('/servicenow/:serverId/importData', function(req, res) {
        logger.info("ServiceNow Data fetch Call....");
        CMDBConfig.getCMDBServerById(req.params.serverId, function(err, data) {
            if (err) {
                logger.error("Error getCMDBServerById..", err);
                res.status(500).send(err);
                return;
            }
            logger.debug("getCMDBServerById response ok");
            var tableName = 'cmdb_ci_linux_server';
            var config = {
                username: data.servicenowusername,
                password: data.servicenowpassword,
                host: data.url
            };
            CMDBConfig.getConfigItems(tableName,config, function(err, data) {
                if (err) {
                    logger.error("Error in Getting Servicenow Config Items:", err);
                    res.status(500).send(err);
                    return;
                }
                if (!data.result) {
                    logger.error("ServiceNow CI data fetch error");
                    res.send(data);
                    return;
                }
                logger.debug("getConfigItems : data.result length..", data.result.length);
                logger.debug("Success :Getting Servicenow Config Items");
                res.send(data);
            });
        });
    });

    app.post('/servicenow/:serverId/instances/import', function(req, res) {
        logger.info("ServiceNow Data fetch.");
        var orgId = req.body.orgId;
        var bgId = req.body.bgId;
        var projectId = req.body.projectId;
        var envId = '';
        var credentials = req.body.credentials;
        var selectedNode = req.body.selectedNodeName;
        var count = 0;
        var taskStatusObj = null;
        var chef = null;
        var reqBody = req.body;
        CMDBConfig.getCMDBServerById(req.params.serverId, function(err, data) {
            if (err) {
                logger.error("Error getCMDBServerById", err);
                res.status(500).send(err);
                return;
            }
            logger.debug("getCMDBServerById is ok..");
            var config = {
                username: data.servicenowusername,
                password: data.servicenowpassword,
                host: data.url
            };
            var tableName = 'cmdb_ci_linux_server';
            var insertNodeInMongo = function(node) {
                var platformId = '';

                var nodeIp = node.ip_address;
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
                var runlist = [];
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
                        logger.debug("unable to get credetials from request ", err);
                        return;
                    }
                    configmgmtDao.getChefServerDetailsByOrgname(orgId, function(err, chefData) {
                        if (err) {
                            res.send(500);
                            return;
                        }
                        logger.debug("chefdata%s", chefData);
                        if (!chefData) {
                            res.send(404);
                            return;
                        }
                        configmgmtDao.getChefServerDetails(chefData.rowid, function(err, chefDetails) {
                            logger.debug("START getChefServerDetails");
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
                                hostedChefUrl: chefDetails.url,
                            });
                            credentialCryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
                                if (err) {
                                    logger.debug("unable to encrypt credentials == >", err);
                                    return;
                                }

                                logger.debug('nodeip ==> ', nodeIp);
                                var instance = {
                                    name: node.name,
                                    orgId: orgId,
                                    bgId: bgId,
                                    projectId: projectId,
                                    envId: node.envId,
                                    chefNodeName: node.name,
                                    runlist: runlist,
                                    platformId: platformId,
                                    instanceIP: nodeIp,
                                    instanceState: 'running',
                                    bootStrapStatus: 'success',
                                    hardware: hardwareData,
                                    credentials: encryptedCredentials,
                                    chef: {
                                        serverId: chefDetails.rowid,
                                        chefNodeName: node.name
                                    },
                                    blueprintData: {
                                        blueprintName: node.name,
                                        templateId: "chef_import",
                                        iconPath: "../private/img/templateicons/chef_import.png"
                                    }
                                }

                                instancesDao.createInstance(instance, function(err, data) {
                                    if (err) {
                                        logger.debug(err, 'occured in inserting node in mongo');
                                        return;
                                    }
                                    logsDao.insertLog({
                                        referenceId: data._id,
                                        err: false,
                                        log: "Node Imported",
                                        timestamp: new Date().getTime()
                                    });

                                    logger.debug("Bootsrtapping instance..", instance, credentials, node.classification);
                                    logger.debug("IP::", instance.instanceIP);

                                    instance.id = data._id;
                                    var timestampStarted = new Date().getTime();
                                    var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, req.session.user.cn, timestampStarted);
                                    var logsReferenceIds = [instance.id, actionLog._id];

                                    chef.bootstrapInstance({
                                        instanceIp: instance.instanceIP,
                                        runlist: instance.runlist,
                                        instanceUsername: credentials.username,
                                        instancePassword: credentials.password,
                                        nodeName: instance.name,
                                        environment: node.classification,
                                        instanceOS: instance.hardware.os,
                                        jsonAttributes: null,
                                        noSudo: true
                                    }, function(err, code) {
                                        if (code == 0) {
                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance bootstarp status. code 0", err);
                                                } else {
                                                    logger.debug("Instance bootstrap status set to success");
                                                }
                                            });
                                        }
                                    }, function(stdOutData) {

                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                        if (stdOutData.toString('ascii').indexOf("Chef Client finished") > 0) {
                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance bootstarp status. code 0", err);
                                                } else {
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: 'Instance Bootstraped Successfully',
                                                        timestamp: new Date().getTime()
                                                    });

                                                    logger.debug("Instance bootstrap status set to success");

                                                }
                                            });
                                        }

                                    }, function(stdErrData) {

                                        //retrying 4 times before giving up.
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: stdErrData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });

                                    });

                                    res.send(data);
                                    return

                                }); //end of create instance

                            }); //end of encryptCredential
                        }); //end of getChefServerDetails
                    }); //getChefServerDetailsByOrgname
                }); //end of get CredentialsFromReq

            }

            function updateTaskStatusNode(nodeName, msg, err, i) {
                count++;
                var status = {};
                status.nodeName = nodeName;
                status.message = msg;
                status.err = err;

                logger.debug('taskstatus updated');

                if (count == nodes.length) {
                    logger.debug('setting complete');
                    taskstatus.endTaskStatus(true, status);
                } else {
                    logger.debug('setting task status');
                    taskstatus.updateTaskStatus(status);
                }

            };

            function importNodes(nodeList) {
                taskStatusModule.getTaskStatus(null, function(err, obj) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    var taskstatus = obj;
                    for (var i = 0; i < nodeList.length; i++) {

                        (function(nodeName) {
                            CMDBConfig.getConfigItemByName(nodeName, tableName, config, function(err, node) {
                                if (err) {
                                    logger.error(err);
                                    updateTaskStatusNode(nodeName, "Unable to import node " + nodeName, true, count);
                                    return;
                                } else {

                                    logger.debug('creating env ==>', node.classification);
                                    logger.debug('orgId ==>', orgId);
                                    logger.debug('bgid ==>', bgId);
                                    environmentsDao.createEnv(node.classification, orgId, bgId, projectId, function(err, data) {

                                        if (err) {
                                            logger.debug(err, 'occured in creating environment in mongo');
                                            updateTaskStatusNode(node.name, "Unable to import node : " + node.name, true, count);
                                            return;
                                        }
                                        logger.debug('Env ID Received before instance create:' + data);
                                        node.envId = data;
                                        //fetching the ip of the imported node
                                        var nodeIp = 'unknown';
                                        if (node.ip_address) {
                                            nodeIp = node.ip_address;
                                        }

                                        instancesDao.getInstanceByOrgAndNodeNameOrIP(orgId, node.name, nodeIp, function(err, instances) {
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
                                            waitForPort(nodeIp, openport, function(err) {
                                                if (err) {
                                                    logger.debug(err);
                                                    updateTaskStatusNode(node.name, "Unable to ssh/winrm into node " + node.name + ". Cannot import this node.", true, count);
                                                    return;
                                                }
                                                insertNodeInMongo(node);
                                                updateTaskStatusNode(nodeName, "Node Imported : " + nodeName, false, count);
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
            var nodes = [];
            nodes.push(selectedNode);
            if (selectedNode) {
                importNodes(nodes);
            } else {
                res.send(400);
                return;
            }
        }); //end of getCMDBServerById
    }); //end of post

    app.post('/servicenow/saveconfig', function(req, res) {
        logger.debug('Starting servicenow saveconfig');
        var json = JSON.parse(JSON.stringify(req.body));
        logger.debug("req body:" + req.body);
        logger.debug("orgname:" + req.body.org);
        var rowid = uuid.v4();
        var config = {
            "configname": req.body.configname,
            "url": req.body.servicenowurl,
            "servicenowusername": req.body.username,
            "servicenowpassword": req.body.password,
            "rowid": rowid,
            "orgname": req.body.org,
            "orgname_rowid": req.body.orgname_rowid,
            "id": "90"
        };
        logger.debug("config" + config);
        CMDBConfig.saveConfig(config, function(err, data) {
            logger.debug("Saving config");
            if (err) {
                logger.error("Error saving CMDB config:", err);
                res.status(500).send("Failed to save Org.");
                return;
            }
            res.send(data);
            return;
        });
    });


    app.post('/servicenow/config/update/:id', function(req, res) {
        logger.debug('Starting servicenow update');
        var json = JSON.parse(JSON.stringify(req.body));
        logger.debug("orgname:" + req.body.org);
        var rowid = uuid.v4();
        var config = {
            "_id": req.params.id,
            "configname": req.body.configname,
            "url": req.body.servicenowurl,
            "servicenowusername": req.body.username,
            "servicenowpassword": req.body.password,
            "orgname": req.body.org
        };
        logger.debug("config" + config);
        CMDBConfig.updateConfigItemById(config, function(err, data) {
            logger.debug("Upadted config");
            if (err) {
                logger.error("Error updating CMDB config:", err);
                res.status(500).send("Failed to update CMDB config.");
                return;
            }
            res.send(data);
        });
    });


    app.get('/cmdb/list', function(req, res) {
        logger.debug("getting all the CMDB config docs from mongodb");
        var loggedUser = req.session.user.cn;
        settingsService.getOrgUserFilter(loggedUser,function(err,orgIds){
            if(err){
                logger.error("Error", err);
                res.send(err);
                return;
            }else if(orgIds.length > 0){
                CMDBConfig.getCMDBListByOrgIds(orgIds,function(err, data) {
                    if (err) {
                        logger.error(err);
                        res.send(err);
                        return;
                    }
                    logger.debug("Number of CMDB providers:", data.length);
                    res.send(data);
                });
            }else{
                CMDBConfig.getCMDBList(function(err, data) {
                    if (err) {
                        logger.error(err);
                        res.send(err);
                        return;
                    }
                    logger.debug("Number of CMDB providers:", data.length);
                    res.send(data);
                });
            }
        });
    });

    app.get('/cmdb/servers/:serverId', function(req, res) {
        logger.debug("getting servicenow server by Id");
        CMDBConfig.getCMDBServerById(req.params.serverId, function(err, data) {
            if (err) {
                logger.error("Error", err);
                res.send(err);
                return;
            }
            res.send(data);
        });

    });

    app.delete('/servicenow/removeItem/id/:id', function(req, res) {
       logger.debug("Deleting servicenow item");
       CMDBConfig.removeServerById(req.params.id, function (err, servicedata) {
        if (err) {
               logger.error("Failed to remove item (%s)", err);
               res.status(500).send(err);
               return;
        }
        res.send(servicedata);
     });
   });
}
