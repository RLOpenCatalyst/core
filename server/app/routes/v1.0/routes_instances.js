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

// This file act as a Controller which contains Instance related all end points.

var blueprintsDao = require('_pr/model/dao/blueprints');
var instancesDao = require('_pr/model/classes/instance/instance');
var EC2 = require('_pr/lib/ec2.js');
var Chef = require('_pr/lib/chef.js');
var taskstatusDao = require('_pr/model/taskstatus');
var logsDao = require('_pr/model/dao/logsdao.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var Docker = require('_pr/model/docker.js');
var SSH = require('_pr/lib/utils/sshexec');
var appConfig = require('_pr/config');
var usersDao = require('_pr/model/users.js');
var credentialCryptography = require('_pr/lib/credentialcryptography')
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var errorResponses = require('./error_responses');
var logger = require('_pr/logger')(module);
var waitForPort = require('wait-for-port');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var VMware = require('_pr/lib/vmware');
var vmwareCloudProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var AzureCloud = require('_pr/lib/azure');
var ChefClientExecution = require('_pr/model/classes/instance/chefClientExecution/chefClientExecution.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var Task = require('_pr/model/classes/tasks/tasks.js');
var utils = require('_pr/model/classes/utils/utils.js');
var SCPClient = require('_pr/lib/utils/scp');
var shellEscape = require('shell-escape');
var Puppet = require('_pr/lib/puppet.js');
var masterUtil = require('_pr/lib/utils/masterUtil');
var containerService = require('_pr/services/containerService');
var fs = require('fs');
var containerDao = require('_pr/model/container');
var providerService = require('_pr/services/providerService.js');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var GCP = require('_pr/lib/gcp.js');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var containerLogModel = require('_pr/model/log-trail/containerLog.js');
var instanceService = require('_pr/services/instanceService');
var schedulerService = require('_pr/services/schedulerService');
var chefDao = require('_pr/model/dao/chefDao.js');

module.exports.setRoutes = function (app, sessionVerificationFunc) {

    app.get('/instances/:instanceId', function (req, res) {
        instancesDao.getInstanceById(req.params.instanceId, function (err, data) {
            if (err) {
                res.send(500);
                return;
            }
            if (data.length) {
                res.send(data[0]);
                return;
            } else {
                res.send(404);
                return;
            }
        });
    });

    app.get('/instances/:platformId/list', function (req, res) {
        logger.debug("Enter get() for /instances/%s", req.params.platformId);
        instancesDao.getInstanceByPlatformId(req.params.platformId, function (err, data) {
            if (err) {
                logger.error("Instance fetch Failed >> ", err);
                res.send(500);
                return;
            }

            if (data.length) {
                res.send(data[0]);
                return;
            } else {
                logger.error("No such Instance for >> %s", req.params.platformId);
                res.send(404);
                return;
            }
            logger.debug("Exit get() for /instances/%s", req.params.platformId);
        });
    });

    app.get('/instances/providers/:providerId/list', function (req, res) {
        logger.debug("Enter get() for /instances/%s", req.params.providerId);
        instancesDao.getInstanceByProviderId(req.params.providerId, function (err, data) {
            if (err) {
                logger.error("Instance fetch Failed >> ", err);
                res.send(500);
                return;
            }

            if (data.length) {
                res.send(data);
            } else {
                logger.error("No such Instance for >> %s", req.params.providerId);
                res.send(404);
            }
            logger.debug("Exit get() for /instances/%s", req.params.providerId);
        });
    });

    app.post('/instances/:platformId/remediation', function (req, res) {
        logger.debug("Enter get() for /instances/%s/redemption", req.params.platformId);
        instancesDao.getInstanceByPlatformId(req.params.platformId, function (err, instances) {
            if (err) {
                logger.error("Failed to fetch ActionLogs: ", err);
                res.status(500).send({
                    message: "DB error"
                });
                return;
            }
            if (!instances.length) {
                res.send(404, {
                    message: "Instance not found"
                });
                return;
            }
            var instance = instances[0];
            credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                if (err) {
                    res.status(500).send({
                        message: "error occured while decrypting credentials"
                    });
                    return;
                }
                var sshParamObj = {
                    host: instance.instanceIP,
                    port: 22,
                    username: instance.credentials.username,
                };
                var sudoCmd;
                if (decryptedCredentials.pemFileLocation) {
                    sshParamObj.privateKey = decryptedCredentials.pemFileLocation;
                } else {
                    sshParamObj.password = decryptedCredentials.password;
                }
                // service: any service running on machine (apache2,mysql)
                // action: start/stop

                var serviceCmd = "service " + req.body.service + " " + req.body.action;
                var sudoCmd = "sudo";
                if (sshParamObj.password) {
                    sudoCmd = 'echo \"' + sshParamObj.password + '\" | sudo -S';
                }
                serviceCmd = sudoCmd + " " + serviceCmd;


                var sshConnection = new SSH(sshParamObj);

                sshConnection.exec(serviceCmd, function (err, ret) {
                    if (decryptedCredentials.pemFileLocation) {
                        fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                            if (err) {
                                logger.error("Unable to delete temp pem file =>", err);
                            } else {
                                logger.error("temp pem file deleted =>", err);
                            }
                        });
                    }
                    if (err) {
                        res.status(500).send({
                            message: "Unable to run service cmd on instance"
                        });
                        return;
                    }
                    if (ret === 0) {
                        res.send(200, {
                            message: "cmd ran successfully"
                        });
                    } else {
                        res.status(500).send({
                            message: "cmd failed. code : " + ret
                        });
                    }

                }, function (stdout) {
                    logger.debug(stdout.toString());
                }, function (stderr) {
                    logger.debug(stderr.toString());
                });

            });
        });
    });

    app.all('/instances*', sessionVerificationFunc);


    /*app.get('/instances', function(req, res) {
     logger.debug("Enter get() for /instances");
     instancesDao.getInstances(null, function(err, data) {
     if (err) {
     logger.debug(err);
     res.send(500);
     return;
     }
     logger.debug("Successfully sent data ", data);
     res.send(data);
     logger.debug("Exit get() for /instances");
     });
     });*/

    // Instance list for tagging server
    app.get('/instances/list', function (req, res, next) {
        var reqData = {};
        async.waterfall(
            [
                function (next) {
                    apiUtil.paginationRequest(req.query, 'instances', next);
                },
                function (paginationReq, next) {
                    reqData = paginationReq;
                    instancesDao.getInstanceList(paginationReq, next);
                },
                function (instances, next) {
                    apiUtil.paginationResponse(instances, reqData, next);
                }
            ],
            function (err, results) {
                if (err)
                    next(err);
                else
                    return res.status(200).send(results);
            });
    });

    app.get('/instances', getInstanceList);

    function getInstanceList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [

                function (next) {
                    apiUtil.paginationRequest(req.query, 'instances', next);
                },
                function (paginationReq, next) {
                    instanceService.parseInstanceMonitorQuery(paginationReq, next);
                },
                function (paginationReq, next) {
                    reqData = paginationReq;
                    instancesDao.getInstanceList(paginationReq, next);
                },
                function (instances, next) {
                    apiUtil.paginationResponse(instances, reqData, next);
                }

            ],
            function (err, results) {
                if (err)
                    next(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/instances/rdp/:vmname/:port', function (req, res) {
        res.setHeader('Content-disposition', 'attachment; filename=' + req.params.vmname + '.rdp');
        res.setHeader('Content-type', 'rdp');
        var rdptext = "full address:s:" + req.params.vmname + ":" + req.params.port + "\n\r";
        rdptext += "prompt for credentials:i:1"
        res.write(rdptext);
        res.end();
    });

    app.post('/instances', function (req, res) {
        logger.debug("Enter post() for /instances");
        if (req.body.instanceIds && req.body.instanceIds.length) {
            instancesDao.getInstances(req.body.instanceIds, function (err, data) {
                if (err) {
                    logger.error("Instance creation Failed >> ", err);
                    res.send(500);
                    return;
                }
                res.send(data);
                logger.debug("Exit post() for /instances");
            });
        } else {
            res.status(400).send({
                message: "invalid instance Ids"
            });
        }
    });

    app.delete('/instances/:instanceId', function (req, res) {
        logger.debug("Enter delete() for /instances/%s", req.params.instanceId);
        instancesDao.getInstanceById(req.params.instanceId, function (err, instances) {
            if (err) {
                logger.debug("Failed to fetch Instance ", err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (instances.length) {
                var instance = instances[0];
                var domainName = instance.domainName?instance.domainName:null;
                Task.getTasksByNodeIds([req.params.instanceId], function (err, tasks) {
                    if (err) {
                        logger.debug("Failed to fetch tasks by node id ", err);
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    logger.debug('length ==>', tasks.length);
                    if (tasks.length > 0) {
                        res.status(400).send({
                            message: "Instance is associated with task"
                        });
                        return;

                    }
                    var instanceLog = {
                        actionId: "",
                        instanceId: instances[0]._id,
                        orgName: instances[0].orgName,
                        bgName: instances[0].bgName,
                        projectName: instances[0].projectName,
                        envName: instances[0].environmentName,
                        status: instances[0].instanceState,
                        actionStatus: "pending",
                        platformId: instances[0].platformId,
                        blueprintName: instances[0].blueprintData.blueprintName,
                        data: instances[0].runlist,
                        platform: instances[0].hardware.platform,
                        os: instances[0].hardware.os,
                        size: instances[0].instanceType,
                        user: req.session.user.cn,
                        createdOn: new Date().getTime(),
                        startedOn: new Date().getTime(),
                        providerType: instances[0].providerType,
                        action: "Deleted",
                        logs: []
                    };
                    var timestampStarted = new Date().getTime();
                    var actionLog = instancesDao.insertDeleteActionLog(req.params.instanceId, req.session.user.cn, timestampStarted);
                    var logReferenceIds = [req.params.instanceId];
                    if (actionLog) {
                        logReferenceIds.push(actionLog._id);
                    }
                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: false,
                        log: "Instance Deleting",
                        timestamp: timestampStarted
                    });
                    instanceLog.actionId = actionLog._id;
                    instanceLog.logs = {
                        err: false,
                        log: "Instance Deleting",
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    if (req.query.chefRemove && req.query.chefRemove === 'true') {
                        var infraManagerData;
                        if (instance.chef && instance.chef.serverId) {
                            infraManagerData = instance.chef;
                        } else {
                            infraManagerData = instance.puppet;
                        }
                        var infraManagerId = infraManagerData.serverId;
                        if (!infraManagerId) {
                            res.status(500).send({
                                message: "Instance data corrupted"
                            });
                            return;
                        }

                        masterUtil.getCongifMgmtsById(infraManagerId, function (err, infraManagerDetails) {
                            if (err) {
                                logger.debug("Failed to fetch Infra Manager Details ", err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            logger.debug('infraManager ==>', infraManagerDetails);
                            if (!infraManagerDetails) {
                                logger.debug("Infra Manager details not found", err);
                                res.status(500).send({
                                    message: "Infra Manager Details Corrupted"
                                });
                                return;
                            }

                            if (infraManagerDetails.configType === 'chef') {
                                var chef = new Chef({
                                    userChefRepoLocation: infraManagerDetails.chefRepoLocation,
                                    chefUserName: infraManagerDetails.loginname,
                                    chefUserPemFile: infraManagerDetails.userpemfile,
                                    chefValidationPemFile: infraManagerDetails.validatorpemfile,
                                    hostedChefUrl: infraManagerDetails.url,
                                });
                                chef.deleteNode(instance.chef.chefNodeName, function (err, nodeData) {
                                    if (err) {
                                        logger.debug("Failed to delete node ", err);
                                        if (err.chefStatusCode && err.chefStatusCode === 404) {
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "success";
                                            instanceLog.status = "deleted";
                                            instanceLog.logs = {
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                                removeInstanceFromDb(domainName);
                                                logger.debug("Successfully removed instance from db.");
                                            })
                                        } else {
                                            res.send(500);
                                        }
                                    } else {
                                        chefDao.removeChefNodeByChefName(instance.chef.chefNodeName, function (err, data) {
                                            if (err) {
                                                logger.error(err, 'occured in removing chef node in mongo');
                                                callback(err, null);
                                                return;
                                            }
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "success";
                                            instanceLog.status = "deleted";
                                            instanceLog.logs = {
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                                removeInstanceFromDb(domainName);
                                                logger.debug("Successfully removed instance from db.");
                                            })
                                        });
                                    }
                                });
                            } else {
                                var puppetSettings = {
                                    host: infraManagerDetails.hostname,
                                    username: infraManagerDetails.username,
                                };
                                if (infraManagerDetails.pemFileLocation) {
                                    puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
                                } else {
                                    puppetSettings.password = infraManagerDetails.puppetpassword;
                                }

                                var puppet = new Puppet(puppetSettings);
                                puppet.deleteNode(instance.puppet.puppetNodeName, function (err, deleted) {
                                    if (err) {
                                        logger.debug("Failed to delete node ", err);
                                        if (typeof err.retCode !== 'undefined' && err.retCode === 24) {
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "success";
                                            instanceLog.status = "deleted";
                                            instanceLog.logs = {
                                                err: false,
                                                log: "Instance Deleted",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                                removeInstanceFromDb(domainName);
                                                logger.debug("Successfully removed instance from db.");
                                            })
                                        } else {
                                            res.send(500);
                                        }
                                    } else {
                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: false,
                                            log: "Instance Deleted",
                                            timestamp: new Date().getTime()
                                        });
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "success";
                                        instanceLog.status = "deleted";
                                        instanceLog.logs = {
                                            err: false,
                                            log: "Instance Deleted",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                            removeInstanceFromDb(domainName);
                                            logger.debug("Successfully removed instance from db.");
                                        })
                                    }
                                });

                            }
                        });
                    } else {
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: false,
                            log: "Instance Deleted",
                            timestamp: new Date().getTime()
                        });
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "success";
                        instanceLog.status = "deleted";
                        instanceLog.logs = {
                            err: false,
                            log: "Instance Deleted",
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                            removeInstanceFromDb(domainName);
                            logger.debug("Successfully removed instance from db.");
                        })
                    }

                });
            } else {
                res.send(404, {
                    "message": "Instance does not exist"
                });
            }
        });

        function removeInstanceFromDb(domainName) {
            containerDao.deleteContainerByInstanceId(req.params.instanceId, function (err, container) {
                if (err) {
                    logger.error("Container deletion Failed >> ", err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                } else {
                    instancesDao.removeInstanceById(req.params.instanceId, function (err, data) {
                        if (err) {
                            logger.error("Instance deletion Failed >> ", err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }else if(domainName !== null){
                            var resourceObj = {
                                stackStatus:"DELETED"
                            }
                            var resourceMapService = require('_pr/services/resourceMapService.js');
                            resourceMapService.updateResourceMap(domainName,resourceObj,function(err,resourceMap){
                                if(err){
                                    logger.error("Error in updating Resource Map.",err);
                                }
                                logger.debug("Exit delete() for /instances/%s", req.params.instanceId);
                                res.send(200);
                            });
                        }else{
                            logger.debug("Exit delete() for /instances/%s", req.params.instanceId);
                            res.send(200);
                        }
                    });
                }
            });
        }
    });

    app.post('/instances/:instanceId/appUrl', function (req, res) { //function(instanceId, ipaddress, callback)

        instancesDao.addAppUrls(req.params.instanceId, req.body.appUrls, function (err, appUrls) {
            if (err) {
                logger.error("Failed to add appurl", err);
                res.send(500);
                return;
            }
            if (appUrls) {
                res.send(appUrls);
            } else {
                res.send(404);
            }

        });
    });


    app.post('/instances/:instanceId/appUrl/:appUrlId/update', function (req, res) { //function(instanceId, ipaddress, callback)
        logger.debug("Enter post() for /instances/%s/appUrl/update", req.params.instanceId);
        instancesDao.updateAppUrl(req.params.instanceId, req.params.appUrlId, req.body.name, req.body.url, function (err, updateCount) {
            if (err) {
                logger.error("Failed to update appurl", err);
                res.send(500);
                return;
            }
            res.send({
                updateCount: updateCount
            });
        });
    });

    app.delete('/instances/:instanceId/appUrl/:appUrlId', function (req, res) { //function(instanceId, ipaddress, callback)
        logger.debug("Enter post() for /instances/%s/appUrl/update", req.params.instanceId);
        instancesDao.removeAppUrl(req.params.instanceId, req.params.appUrlId, function (err, deleteCount) {
            if (err) {
                logger.error("Failed to remove app url", err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.send({
                deleteCount: deleteCount
            });
        });
    });

    // add instance task
    app.post('/instances/:instanceId/addTask', function (req, res) {
        if (!(req.body.taskIds && req.body.taskIds.length)) {
            req.body.taskIds = [];
        }
        instancesDao.addTaskIds(req.params.instanceId, req.body.taskIds, function (err, updateCount) {
            if (err) {
                logger.error("Failed to add taskIds", err);
                res.send(500);
                return;
            }
            if (updateCount) {
                res.send(200, {
                    updateCount: updateCount
                });
            } else {
                res.send(404);
            }
        });
    });

    app.delete('/instances/:instanceId/removeTask', function (req, res) { //function(instanceId, ipaddress, callback)

        instancesDao.removeTaskId(req.params.instanceId, function (err, deleteCount) {
            if (err) {
                logger.error("Failed to taskId", err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.send({
                deleteCount: deleteCount
            });
        });
    });


    //updateInstanceIp
    app.get('/instances/updateip/:instanceId/:ipaddress', function (req, res) { //function(instanceId, ipaddress, callback)
        logger.debug("Enter get() for /instances/updateip/%s/%s", req.params.instanceId, req.params.ipaddress);
        instancesDao.updateInstanceIp(req.params.instanceId, req.params.ipaddress, function (err, data) {
            if (err) {
                logger.error("Failed to update instanceip", err);
                res.send(500);
                return;
            }
            logger.debug("Successfully updated instanceip");
            res.end('OK');
        });
        logger.debug("Exit get() for /instances/updateip/%s/%s", req.params.instanceId, req.params.ipaddress);
    });

    app.get('/instances/dockercontainerdetails/:instanceid', function (req, res) {
        logger.debug("Enter get() for /instances/dockercontainerdetails/%s", req.params.instanceid);
        var instanceid = req.params.instanceid;
        var _docker = new Docker();
        var stdmessages = '';
        var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';
        logger.debug('cmd received: ', cmd);
        var stdOut = '';
        _docker.runDockerCommands(cmd, instanceid, function (err, retCode) {
            if (err) {
                logger.error(err);
                res.status(500).send({
                    message: "unbale to run cmd",
                    retCode: retCode
                });
            }

            if (retCode === 0) {
                var _stdout = stdOut.split('\r\n');
                logger.debug('Docker containers : %s', _stdout.length);
                var start = false;
                var so = '';
                _stdout.forEach(function (k, v) {
                    logger.debug(_stdout[v] + ':' + _stdout[v].length);
                    if (start == true) {
                        so += _stdout[v];
                        logger.debug(v + ':' + _stdout[v].length);
                    }
                    if (_stdout[v].length == 1)
                        start = true;
                    if (v >= _stdout.length - 1) {
                        if (so) {
                            res.end(so);
                        } else {
                            res.end([]);
                        }

                    }
                });
            } else {
                res.status(500).send({
                    message: "unbale to run cmd",
                    retCode: retCode
                });
            }
        }, function (stdOutData) {
            stdOut += stdOutData;

        }, function (stdOutErr) {
            logger.error("Error hits to fetch docker details", stdOutErr);
            res.send(500);
        });
        console.log(stdOut);
        logger.debug("Exit get() for /instances/dockercontainerdetails/%s", req.params.instanceid);

    });
    app.get('/instances/dockercontainerdetails/:instanceid/:containerid', function (req, res) {
        logger.debug("Enter get() for /instances/dockercontainerdetails/%s/%s", req.params.instanceid, req.params.containerid);
        var instanceid = req.params.instanceid;
        var _docker = new Docker();
        var stdmessages = '';
        var cmd = 'echo -e \"GET /containers/' + req.params.containerid + '/json HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';

        logger.debug('cmd received: ', cmd);
        var stdOut = '';
        _docker.runDockerCommands(cmd, instanceid, function (err, retCode) {
            var _stdout = stdOut.split('\r\n');
            logger.debug('Docker containers : ', _stdout.length);
            var start = false;
            var so = '';
            _stdout.forEach(function (k, v) {
                logger.debug(_stdout[v] + ':' + _stdout[v].length);
                if (start == true) {
                    so += _stdout[v];
                    logger.debug(v + ':' + _stdout[v].length);
                }
                if (_stdout[v].length == 1)
                    start = true;
                if (v >= _stdout.length - 1)
                    res.end(so);
            });

        }, function (stdOutData) {
            stdOut += stdOutData;
        }, function (stdOutErr) {
            logger.error("Hit some error: ", stdOutErr);
            res.send(500);
        });
        logger.debug("Exit get() for /instances/dockercontainerdetails/%s/%s", req.params.instanceid, req.params.containerid);

    });
    app.get('/instances/dockerexecute/:instanceid/:containerid/:action', function (req, res) {
        logger.debug("Enter get() for /instances/dockerexecute/%s/%s/%s", req.params.instanceid, req.params.containerid, req.params.action);
        var instanceid = req.params.instanceid;
        var _docker = new Docker();
        var cmd = "sudo docker exec " + req.params.containerid + ' bash ' + req.params.action;
        //returning browser handle before execution starts.
        res.send(200);

        _docker.runDockerCommands(cmd, instanceid, function (err, retCode) {
            if (!err) {
                logsDao.insertLog({
                    referenceId: instanceid,
                    err: false,
                    log: "Container  " + req.params.containerid + " Executed :" + req.params.action,
                    timestamp: new Date().getTime()
                });
                logger.debug("Docker Command run Successfully");

                logger.debug("Exit get() for /instances/dockerexecute/%s/%s/%s", req.params.instanceid, req.params.containerid, req.params.action);
            } else {
                logger.error("Excute Error : ", err);
                logsDao.insertLog({
                    referenceId: instanceid,
                    err: true,
                    log: "Excute Error : " + err,
                    timestamp: new Date().getTime()
                });
                logger.error("Error hit while running Docker Command: ", err);
                logger.debug("Exit get() for /instances/dockerexecute/%s/%s/%s", req.params.instanceid, req.params.containerid, req.params.action);
            }
        });


    });
    app.get('/instances/dockercontainerdetails/:instanceid/:containerid/:action', function (req, res) {
        var actionId = parseInt(req.params.action);
        var action, action1;
        switch (actionId) {
            case 1:
                action = 'start';
                action1 = 'start';
                break;
            case 2:
                action = 'stop';
                action1 = 'start';
                break;
            case 3:
                action = 'restart';
                action1 = 'start';
                break;
            case 4:
                action = 'pause';
                action1 = 'start';
                break;
            case 5:
                action = 'unpause';
                action1 = 'start';
                break;
            case 6:
                action = 'delete';
                action1 = 'terminate';
                break;
            default:
                action = 'start';
                action1 = 'start';
                break;
        }

        var jsonData = {
            instanceId: req.params.instanceid,
            containerId: req.params.containerid,
            action: action,
            action1: action1,
            user: req.session.user,
            permissionSet: req.session.user.permissionset,
        };
        containerDao.getContainerByIdInstanceId(req.params.containerid, req.params.instanceid, function (err, containers) {
            if (err) {
                logger.error("Container fetch Failed >> ", err);
                res.send(500);
                return;
            }
            var actionObj = 'Container-' + containers[0].Names + '-' + action.charAt(0).toUpperCase() + action.slice(1);
            instancesDao.getInstanceById(req.params.instanceid, function (err, instance) {
                if (err) {
                    logger.error("Instance fetch Failed >> ", err);
                    res.send(500);
                    return;
                }
                var timestampStarted = new Date().getTime();
                var actionLog = instancesDao.insertDockerActionLog(req.params.instanceid, req.session.user.cn, actionObj, actionId, timestampStarted);
                var logReferenceIds = [instance._id, actionLog._id];
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: false,
                    log: "Docker-Container " + containers[0].Names + ' ' + action.charAt(0).toUpperCase() + action.slice(1) + 'ing',
                    timestamp: timestampStarted
                });

                var containerLog = {
                    actionId: actionLog._id,
                    containerId: containers[0].Id,
                    orgName: instance[0].orgName,
                    orgId: instance[0].orgId,
                    bgName: instance[0].bgName,
                    bgId: instance[0].bgId,
                    projectName: instance[0].projectName,
                    envName: instance[0].environmentName,
                    envId: instance[0].envId,
                    status: action.charAt(0).toUpperCase() + action.slice(1),
                    actionStatus: "pending",
                    instanceIP: instance[0].instanceIP,
                    platformId: instance[0].platformId,
                    containerName: containers[0].Names,
                    Image: containers[0].Image,
                    ImageID: containers[0].ImageID,
                    platform: instance[0].hardware.platform,
                    os: instance[0].hardware.os,
                    user: instance[0].catUser,
                    createdOn: new Date().getTime(),
                    startedOn: new Date().getTime(),
                    providerType: instance[0].providerType ? instance[0].providerType : null,
                    action: action.charAt(0).toUpperCase() + action.slice(1),
                    logs: []
                };

                containerService.executeActionOnContainer(jsonData, function (err, containerResponse) {
                    if (err) {
                        containerLog.actionStatus = "failed";
                        containerLog.endedOn = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: true,
                            log: 'Failed to Excute Docker command: ' + err,
                            timestamp: timestampStarted
                        });
                        containerLogModel.createOrUpdate(containerLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        instancesDao.updateActionLog(instance[0]._id, actionLog._id, false, new Date().getTime());
                        logger.error("Failed to Execute Docker command: ", err);
                        res.send(500);
                        return;
                    }
                    containerLog.actionStatus = "success";
                    containerLog.endedOn = new Date().getTime();
                    if (action === 'stop') {
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: false,
                            log: "Docker-Container Successfully " + containers[0].Names + ' ' + action.charAt(0).toUpperCase() + action.slice(1) + 'ped',
                            timestamp: timestampStarted
                        });
                    } else {
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: false,
                            log: "Docker-Container Successfully " + containers[0].Names + ' ' + action.charAt(0).toUpperCase() + action.slice(1) + 'ed',
                            timestamp: timestampStarted
                        });
                    }
                    containerLogModel.createOrUpdate(containerLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    instancesDao.updateActionLog(instance[0]._id, actionLog._id, true, new Date().getTime());
                    res.status(200).send(containerResponse);

                });
            });
        });
    });
    app.get('/instances/checkfordocker/:instanceid', function (req, res) {
        logger.debug("Enter get() for /instances/checkfordocker/%s", req.params.instanceid);

        //Confirming if Docker has been installed on the box
        var _docker = new Docker();
        var cmd = "sudo docker ps";
        logger.debug('Docker command executed : ', cmd);
        _docker.runDockerCommands(cmd, req.params.instanceid,
            function (err, retCode) {
                if (err) {
                    logger.error("Failed to Excute Docker command: ", err);
                    res.send(500);
                    return;
                }
                logger.debug('this ret:' + retCode);
                if (retCode == '0') {
                    instancesDao.updateInstanceDockerStatus(req.params.instanceid, "success", '', function (data) {
                        logger.debug('Instance Docker Status set to Success');
                        logger.debug("Exit get() for /instances/checkfordocker/%s", req.params.instanceid);
                        res.send('OK');
                        return;
                    });

                } else
                    logger.debug("Sending empty response.");
                res.send('');
            });


    });
    app.get('/instances/search/:orgid/:bgid/:projid/:envid/:querytext', function (req, res) {
        logger.debug("Enter get() for /instances/search/" + req.params.querytext);
        //constructing the options object to narrow down search
        req.params.querytext = req.params.querytext.replace(/\"/g, '\\"');
        logger.debug('Query:' + req.params.querytext);
        var options = {
            search: req.params.querytext,
            filter: {
                orgId: req.params.orgid,
                envId: req.params.envid,
                bgId: req.params.bgid,
                projectId: req.params.projid
            },
            limit: 10000
        }
        logger.debug(JSON.stringify(options));
        instancesDao.searchInstances(req.params.querytext, options, function (err, data) {
            if (!err) {
                logger.debug('Received from search');
                logger.debug(data.length);
                res.send(data);
            }
        });
    });
    app.get('/instances/dockerimagepull/:instanceid/:dockerreponame/:imagename/:tagname/:runparams/:startparams', function (req, res) {

        logger.debug("Enter get() for /instances/dockerimagepull");
        var instanceid = req.params.instanceid;
        instancesDao.getInstanceById(req.params.instanceid, function (err, data) {
            if (err) {
                logger.error("Instance fetch Failed >> ", err);
                res.send(500);
                return;
            }
            var instance = data;
            instance[0].id = data._id;
            logger.debug(data.length + ' ' + JSON.stringify(data));
            if (data.length) {
                logger.debug(' Docker dockerEngineStatus : ' + data[0].docker.dockerEngineStatus);
                if (data[0].docker.dockerEngineStatus) {
                    if (data[0].docker.dockerEngineStatus != "success") {
                        res.end('No Docker Found');
                        return;
                    }
                } else {
                    res.end('No Docker Found');
                    return;
                }
                configmgmtDao.getMasterRow(18, 'dockerreponame', req.params.dockerreponame, function (err, data) {
                    if (!err) {
                        var timestampStarted = new Date().getTime();
                        var actionLog = instancesDao.insertDockerActionLog(req.params.instanceid, req.session.user.cn, 'Docker-Run', 1, timestampStarted);
                        var instanceLog = {
                            actionId: "",
                            instanceId: instance[0].id,
                            orgName: instance[0].orgName,
                            bgName: instance[0].bgName,
                            projectName: instance[0].projectName,
                            envName: instance[0].environmentName,
                            status: instance[0].instanceState,
                            actionStatus: "pending",
                            platformId: instance[0].platformId,
                            blueprintName: instance[0].blueprintData.blueprintName,
                            data: instance[0].runlist,
                            platform: instance[0].hardware.platform,
                            os: instance[0].hardware.os,
                            size: instance[0].instanceType,
                            user: req.session.user.cn,
                            createdOn: new Date().getTime(),
                            startedOn: new Date().getTime(),
                            providerType: instance[0].providerType,
                            action: "Docker-Run",
                            logs: []
                        };

                        logger.debug('Docker Repo ->', JSON.stringify(data));
                        var dock = JSON.parse(data);
                        logger.debug('username:', dock.dockeruserid);
                        var _docker = new Docker();
                        var stdmessages = '';
                        var cmd = "sudo docker login -e " + dock.dockeremailid + ' -u ' + dock.dockeruserid + ' -p ' + dock.dockerpassword;
                        //removing docker userID
                        cmd += ' && sudo docker pull ' + decodeURIComponent(req.params.imagename);
                        logger.debug('Intermediate cmd: ', cmd);
                        if (req.params.tagname != null) {
                            cmd += ':' + req.params.tagname;
                        }
                        var runparams = '';
                        if (req.params.runparams != 'null') {
                            runparams = decodeURIComponent(req.params.runparams);
                        }
                        var startparams = '';
                        if (req.params.startparams != 'null') {
                            startparams = decodeURIComponent(req.params.startparams);
                        } else
                            startparams = '/bin/bash';
                        cmd += ' && sudo docker run -i -t -d ' + runparams + ' ' + decodeURIComponent(req.params.imagename) + ':' + req.params.tagname + ' ' + startparams;
                        logger.debug('Docker command executed : ', cmd);
                        _docker.runDockerCommands(cmd, req.params.instanceid,
                            function (err, retCode) {
                                if (err) {
                                    instanceLog.actionStatus = "failed";
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.logs = {
                                        err: true,
                                        log: 'Failed to Excute Docker command: . cmd : ' + cmd + '. Error: ' + err,
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    instancesDao.updateActionLog(instance[0]._id, actionLog._id, false, new Date().getTime());
                                    logsDao.insertLog({
                                        referenceId: instanceid,
                                        err: true,
                                        log: 'Failed to Excute Docker command: . cmd : ' + cmd + '. Error: ' + err,
                                        timestamp: new Date().getTime()
                                    });
                                    logger.error("Failed to Excute Docker command: ", err);
                                    res.send(err);
                                    return;
                                }

                                logger.debug("docker return ", retCode);
                                if (retCode == 0) {
                                    instanceLog.actionStatus = "success";
                                    instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    instancesDao.updateInstanceDockerStatus(instanceid, "success", '', function (data) {
                                        logger.debug('Instance Docker Status set to Success');
                                        res.send(200);
                                    });
                                    instancesDao.updateActionLog(instance[0]._id, actionLog._id, true, new Date().getTime());
                                } else {
                                    logger.debug('Failed running docker command ....');
                                    res.end('Image pull failed check instance log for details');


                                }
                                logger.debug("Exit get() for /instances/dockerimagepull");

                            },
                            function (stdOutData) {
                                if (!stdOutData) {

                                    logger.debug("SSH Stdout :" + stdOutData.toString('ascii'));
                                    stdmessages += stdOutData.toString('ascii');
                                } else {
                                    instanceLog.logs = {
                                        err: false,
                                        log: stdOutData.toString('ascii'),
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    logsDao.insertLog({
                                        referenceId: instanceid,
                                        err: false,
                                        log: stdOutData.toString('ascii'),
                                        timestamp: new Date().getTime()
                                    });
                                    logger.debug("Docker run stdout :" + instanceid + stdOutData.toString('ascii'));
                                    stdmessages += stdOutData.toString('ascii');
                                }
                            },
                            function (stdOutErr) {
                                instanceLog.logs = {
                                    err: true,
                                    log: stdOutErr.toString('ascii'),
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                logsDao.insertLog({
                                    referenceId: instanceid,
                                    err: true,
                                    log: stdOutErr.toString('ascii'),
                                    timestamp: new Date().getTime()
                                });
                                logger.debug("docker return ", stdOutErr);
                                res.send(stdOutErr);

                            });

                    }
                });
            } else {
                logger.debug('No Instance found with id : ' + instanceid);
                res.send(500);
                return;
            }
        });

    });
    //Coposite Docker container launch 
    app.post('/instances/dockercompositeimagepull/:instanceid/:dockerreponame', function (req, res) {


        var generateDockerLaunchParams = function (runparams) {
            logger.debug('rcvd runparams --->', runparams);
            var launchparams = [];
            var preparams = '';
            var startparams = '';
            var execparam = '';
            var containername = '';

            //eliminating any exec portion.
            var _execp = runparams.split('-exec');
            if (_execp.length > 0 && typeof _execp != 'undefined') {
                execparam = _execp[1];
                runparams = _execp[0];

            }
            if (runparams.indexOf('-c') > 0) {
                var _startparm = runparams.split('-c');
                if (_startparm.length > 0 && typeof _startparm[1] != 'undefined') {
                    startparams = _startparm[1];
                    runparams = _startparm[0];
                }
            }

            logger.debug('1 runparams: ' + runparams);

            var params = runparams.split(' -');



            for (var i = 0; i < params.length; i++) {
                if (params[i] != '') {
                    var itms = params[i].split(' ');
                    if (itms.length > 0) {
                        logger.debug('itms[0]:' + itms[0] + ';itms[1]:' + itms[1]);
                        preparams += ' -' + params[i];

                        if (itms[0] == '-name') {

                            containername = itms[1];
                        }

                    }

                }
            }
            logger.debug('execparam: ' + execparam);
            logger.debug('runparams: ' + runparams);
            logger.debug('preparams: ' + preparams);
            logger.debug('startparams: ' + startparams);


            launchparams[0] = preparams;
            launchparams[1] = startparams;
            launchparams[2] = execparam;
            launchparams[3] = containername;
            return (launchparams);
        }
        logger.debug("Enter get() for /instances/dockercompositeimagepull");
        var instanceid = req.params.instanceid;

        //  var dockercompose = decodeURIComponent(req.params.dockercomposejson); //req.body.compositedockerimage
        var dockercompose = decodeURIComponent(req.body.compositedockerimage); //
        var dockercomposejson = JSON.parse(dockercompose);
        logger.debug('DockerCompose Json rcvd: ', JSON.stringify(dockercomposejson));
        instancesDao.getInstanceById(req.params.instanceid, function (err, data) {
            if (err) {
                logger.error("Instance fetch Failed >> ", err);
                res.send(500);
                return;
            }
            logger.debug(data.length + ' ' + JSON.stringify(data));
            if (data.length) {
                var instance = data;
                var instanceLog = {
                    actionId: "",
                    instanceId: data[0]._id,
                    orgName: data[0].orgName,
                    bgName: data[0].bgName,
                    projectName: data[0].projectName,
                    envName: data[0].environmentName,
                    status: data[0].instanceState,
                    actionStatus: "pending",
                    platformId: data[0].platformId,
                    blueprintName: data[0].blueprintData.blueprintName,
                    data: data[0].runlist,
                    platform: data[0].hardware.platform,
                    os: data[0].hardware.os,
                    size: data[0].instanceType,
                    user: req.session.user.cn,
                    createdOn: new Date().getTime(),
                    startedOn: new Date().getTime(),
                    providerType: data[0].providerType,
                    action: "Docker-Run",
                    logs: []
                };

                logger.debug(' Docker dockerEngineStatus : ' + data[0].docker.dockerEngineStatus);
                if (data[0].docker.dockerEngineStatus) {
                    if (data[0].docker.dockerEngineStatus != "success") {
                        res.end('No Docker Found');
                        return;
                    }
                } else {
                    res.end('No Docker Found');
                    return;
                }

                //Finding out a catalyst docker entry in compose json 
                for (var cic = 0; cic < dockercomposejson.length; cic++) {
                    if (dockercomposejson[cic].dockerreponame) {
                        req.params.dockerreponame = dockercomposejson[cic].dockerreponame;
                    }

                }


                configmgmtDao.getMasterRow(18, 'dockerreponame', req.params.dockerreponame, function (err, data) {
                    if (!err) {
                        var dock = null;
                        logger.debug('Docker Repo ->', JSON.stringify(data));
                        if (data) {
                            dock = JSON.parse(data);
                            logger.debug('username:', dock.dockeruserid);
                        } else {
                            logger.debug('No Docker Repo found. Would pull only public repos.')
                        }

                        var _docker = new Docker();
                        var stdmessages = '';
                        var imagecount = 0; //to count the no of images started.
                        var pullandrundocker = function (imagename, tagname, runparams, startparams, execcommand, containername, callback) {
                            imagecount++;
                            var cmd = ""
                            if (dock)
                                cmd = "sudo docker login -e " + dock.dockeremailid + ' -u ' + dock.dockeruserid + ' -p ' + dock.dockerpassword + ' && ';
                            //removing docker userID
                            //Fix for nginx not parsing private repo
                            imagename = imagename.replace(/!!/g, "/");
                            runparams = runparams.replace(/!!/g, "/");
                            startparams = startparams.replace(/!!/g, "/");
                            execcommand = execcommand.replace(/!!/g, "/");

                            cmd += 'sudo docker pull ' + decodeURIComponent(imagename);
                            logger.debug('Intermediate cmd: ', cmd);
                            if (tagname != null) {
                                cmd += ':' + tagname;
                            }

                            if (runparams != 'null') {
                                runparams = decodeURIComponent(runparams);
                            }

                            if (startparams != 'null') {
                                startparams = decodeURIComponent(startparams);
                            } else
                                startparams = ''; //startparams = '/bin/bash';

                            cmd += ' && sudo docker run -i -t -d ' + runparams + ' ' + decodeURIComponent(imagename) + ':' + tagname + ' ' + startparams;
                            logger.debug('Docker command to be executed : ', cmd);
                            if (imagecount == 1) {
                                //this would be the first image that would be run. Returning handle to browser.
                                logger.debug('Returning handle to browser');
                                res.end('OK');
                            }
                            var timestampStarded = new Date().getTime();
                            var actionLog = instancesDao.insertDockerActionLog(instance[0]._id, req.session.user.cn, 'Docker-Run', 1, timestampStarded);
                            instanceLog.actionId = actionLog._id;
                            _docker.runDockerCommands(cmd, req.params.instanceid,
                                function (err, retCode) {
                                    if (err) {
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.logs = {
                                            err: true,
                                            log: 'Failed to Excute Docker command: . cmd : ' + cmd + '. Error: ' + err,
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        logsDao.insertLog({
                                            referenceId: [instanceid, actionLog._id],
                                            err: true,
                                            log: 'Failed to Excute Docker command: . cmd : ' + cmd + '. Error: ' + err,
                                            timestamp: new Date().getTime()
                                        });
                                        instancesDao.updateActionLog(instance[0]._id, actionLog._id, false, new Date().getTime());
                                        logger.error("Failed to Excute Docker command: ", err);
                                        res.send(err);
                                        return;
                                    }
                                    logger.debug("docker return ", retCode);
                                    if (retCode == 0) {
                                        logger.debug('Execcommand : ' + execcommand + ' ' + (execcommand != ''));
                                        if (execcommand != '' && execcommand != 'null') {
                                            logger.debug('In Execute command');
                                            logsDao.insertLog({
                                                referenceId: [instanceid, actionLog._id],
                                                err: false,
                                                log: 'Starting execute command: . cmd : ' + execcommand + ' on ' + containername,
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.logs = {
                                                err: false,
                                                log: 'Starting execute command: . cmd : ' + execcommand + ' on ' + containername,
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            instancesDao.updateActionLog(instance[0]._id, actionLog._id, true, new Date().getTime());
                                            //Execute command found 
                                            var cmd = "sudo docker exec " + containername + ' bash ' + execcommand;
                                            logger.debug('In docker exec ->' + cmd);
                                            req.params.containerid = containername;
                                            _docker.runDockerCommands(cmd, req.params.instanceid, function (err, retCode1) {
                                                if (retCode1 == 0) {

                                                    logger.debug('runDockerCommand : in done');
                                                    instancesDao.updateInstanceDockerStatus(instanceid, "success", '', function (data) {
                                                        logger.debug('Instance Docker Status set to Success');
                                                        logsDao.insertLog({
                                                            referenceId: [instanceid, actionLog._id],
                                                            err: false,
                                                            log: 'Done execute command: . cmd : ' + cmd + ' on ' + containername,
                                                            timestamp: new Date().getTime()
                                                        });
                                                        instanceLog.actionStatus = "success";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: 'Done execute command: . cmd : ' + cmd + ' on ' + containername,
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        instancesDao.updateActionLog(instance[0]._id, actionLog._id, true, new Date().getTime());
                                                        if (imagecount < dockercomposejson.length) {

                                                            var lp = generateDockerLaunchParams(dockercomposejson[imagecount]['dockerlaunchparameters']);
                                                            var startparams = 'null';
                                                            var execcommand = 'null';
                                                            if (lp.length > 0) {
                                                                if (lp[1]) {
                                                                    startparams = lp[1];
                                                                }
                                                                if (lp[2]) {
                                                                    execcommand = lp[2];
                                                                }
                                                            }
                                                            logger.debug('Running pullandrun count:', imagecount);
                                                            pullandrundocker(dockercomposejson[imagecount]['dockercontainerpaths'], dockercomposejson[imagecount]['dockerrepotags'], lp[0], startparams, execcommand, lp[3]);
                                                        }
                                                    });
                                                } else {
                                                    logsDao.insertLog({
                                                        referenceId: [instanceid, actionLog._id],
                                                        err: true,
                                                        log: 'Error executing command: . cmd : ' + cmd + ' on ' + containername + ' : Return Code ' + retCode1 + ' -' + err,
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: true,
                                                        log: 'Error executing command: . cmd : ' + cmd + ' on ' + containername + ' : Return Code ' + retCode1 + ' -' + err,
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                }

                                            });
                                        } else //no exec commands found
                                        {
                                            instancesDao.updateInstanceDockerStatus(instanceid, "success", '', function (data) {
                                                logger.debug('Instance Docker Status set to Success');
                                                logsDao.insertLog({
                                                    referenceId: [instanceid, actionLog._id],
                                                    err: false,
                                                    log: 'Done image pull and run.',
                                                    timestamp: new Date().getTime()
                                                });
                                                instanceLog.actionStatus = "success";
                                                instanceLog.logs = {
                                                    err: false,
                                                    log: "Done image pull and run.",
                                                    timestamp: new Date().getTime()
                                                };
                                                instancesDao.updateActionLog(instance[0]._id, actionLog._id, true, new Date().getTime());
                                                instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                if (imagecount < dockercomposejson.length) {

                                                    var lp = generateDockerLaunchParams(dockercomposejson[imagecount]['dockerlaunchparameters']);
                                                    logger.debug('lp returned from generate ', lp.join(' &&'));
                                                    var startparams = 'null';
                                                    var execcommand = 'null';
                                                    if (lp.length > 0) {
                                                        if (lp[1]) {
                                                            startparams = lp[1];
                                                        }
                                                        if (lp[2]) {
                                                            execcommand = lp[2];
                                                        }
                                                    }
                                                    logger.debug('Running pullandrun count:', imagecount);
                                                    pullandrundocker(dockercomposejson[imagecount]['dockercontainerpaths'], dockercomposejson[imagecount]['dockerrepotags'], lp[0], startparams, execcommand, lp[3]);
                                                }
                                            });
                                        }
                                        //Running any execute command.
                                    } else {
                                        logger.debug('Failed running docker command ....');
                                        res.end('Image pull failed check instance log for details');
                                    }
                                    logger.debug("Exit get() for /instances/dockerimagepull");

                                },
                                function (stdOutData) {
                                    if (!stdOutData) {

                                        logger.debug("SSH Stdout :" + stdOutData.toString('ascii'));
                                        stdmessages += stdOutData.toString('ascii');
                                    } else {
                                        logsDao.insertLog({
                                            referenceId: [instanceid, actionLog._id],
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        });
                                        logger.debug("Docker run stdout :" + instanceid + stdOutData.toString('ascii'));
                                        stdmessages += stdOutData.toString('ascii');

                                        instanceLog.logs = {
                                            err: false,
                                            log: stdOutData.toString('ascii'),
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                    }
                                },
                                function (stdOutErr) {
                                    logsDao.insertLog({
                                        referenceId: [instanceid, actionLog._id],
                                        err: true,
                                        log: stdOutErr.toString('ascii'),
                                        timestamp: new Date().getTime()
                                    });
                                    logger.debug("docker return ", stdOutErr);
                                    instanceLog.logs = {
                                        err: true,
                                        log: stdOutErr.toString('ascii'),
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, instance[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                });
                        };

                        if (dockercomposejson.length > 0) {
                            var lp = generateDockerLaunchParams(dockercomposejson[0]['dockerlaunchparameters']);

                            var startparams = 'null';
                            var execcommand = 'null';
                            if (lp.length > 0) {
                                if (lp[1]) {
                                    startparams = lp[1];
                                }
                                if (lp[2]) {
                                    execcommand = lp[2];
                                }
                            }
                            logger.debug('lp---->', lp[0]);
                            pullandrundocker(dockercomposejson[0]['dockercontainerpaths'], dockercomposejson[0]['dockerrepotags'], lp[0], startparams, execcommand, lp[3]);
                        } else {
                            res.send('200 ' + 'No Images to pull');
                        }
                    } //!(err)
                });
            } else {
                logger.debug('No Instance found with id : ' + instanceid);
                res.send(500);
                return;
            }
        });

    });
    app.post('/instances/:instanceId/updateRunlist', function (req, res) {
        if (req.session.user.rolename === 'Consumer') {
            res.send(401);
            return;
        }
        logger.debug("Enter post() for /instances/updateRunlist");
        //verifying permission to update runlist
        logger.debug('Verifying User permission set for execute.');
        var user = req.session.user;
        var category = 'instancerunlist';
        var permissionto = 'execute';
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission :  launch ' + data + ' , Condition State : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401);
                    return;
                } else {
                    instancesDao.getInstanceById(req.params.instanceId, function (err, data) {
                        if (err) {
                            logger.error("Failed to get Instance: ", err);
                            res.send(500);
                            return;
                        }
                        if (data.length) {
                            var instanceLog = {
                                actionId: "",
                                instanceId: data[0]._id,
                                orgName: data[0].orgName,
                                bgName: data[0].bgName,
                                projectName: data[0].projectName,
                                envName: data[0].environmentName,
                                status: data[0].instanceState,
                                actionStatus: "pending",
                                platformId: data[0].platformId,
                                blueprintName: data[0].blueprintData.blueprintName,
                                data: data[0].runlist,
                                platform: data[0].hardware.platform,
                                os: data[0].hardware.os,
                                size: data[0].instanceType,
                                user: req.session.user.cn,
                                createdOn: new Date().getTime(),
                                startedOn: new Date().getTime(),
                                providerType: data[0].providerType,
                                action: "Chef-Client-Run",
                                logs: []
                            };
                            var instance = data[0];
                            var actionLog;
                            var configManagmentId;
                            if (instance.chef && instance.chef.serverId) {
                                if (!req.body.runlist) {
                                    res.send(400);
                                    return;
                                }
                                configManagmentId = instance.chef.serverId;
                                actionLog = instancesDao.insertChefClientRunActionLog(instance.id, req.body.runlist, req.session.user.cn, new Date().getTime());
                            } else {
                                actionLog = instancesDao.insertPuppetClientRunActionLog(instance.id, req.session.user.cn, new Date().getTime());
                                configManagmentId = instance.puppet.serverId
                            }

                            if (!configManagmentId) {
                                res.status(500).send({
                                    message: "Instance Data Corrupted"
                                });
                                return;
                            }

                            var logReferenceIds = [instance.id, actionLog._id];
                            masterUtil.getCongifMgmtsById(configManagmentId, function (err, infraManagerDetails) {
                                if (err) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logReferenceIds,
                                        err: true,
                                        log: "Unable to get infraManager data. client run failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                    instanceLog.actionId = actionLog._id;
                                    instanceLog.actionStatus = "failed";
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.logs = {
                                        err: true,
                                        log: "Unable to get infraManager data. client run failed",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    res.send(200, {
                                        actionLogId: actionLog._id
                                    });
                                    return;
                                }
                                if (!infraManagerDetails) {
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logReferenceIds,
                                        err: true,
                                        log: "InfraManager information is corrupt. client run failed",
                                        timestamp: timestampEnded
                                    });
                                    instanceLog.actionId = actionLog._id;
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.actionStatus = "failed";
                                    instanceLog.logs = {
                                        err: true,
                                        log: "InfraManager information is corrupt. client run failed",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                    res.send(200, {
                                        actionLogId: actionLog._id
                                    });
                                    return;
                                }

                                //decrypting pem file
                                credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: true,
                                            log: "Unable to decrypt pem file. client run failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                        instanceLog.actionId = actionLog._id;
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Unable to decrypt pem file. client run failed",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        return;
                                    }

                                    //getting chef run execution Id 
                                    ChefClientExecution.createNew({
                                        instanceId: instance.id

                                    }, function (err, chefClientExecution) {
                                        if (err) {
                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: true,
                                                log: "Unable to generate client run execution id. client run failed",
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                            instanceLog.actionId = actionLog._id;
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLog.logs = {
                                                err: true,
                                                log: "Unable to generate client run execution id. client run failed",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                            return;
                                        }
                                        var infraManager;
                                        var runOptions;
                                        if (instance.chef && instance.chef.serverId) {
                                            // creating json attribute for execution id
                                            var jsonAttributeObj = {
                                                catalyst_attribute_handler: {
                                                    catalystCallbackUrl: req.protocol + '://' + req.get('host') + '/chefClientExecution/' + chefClientExecution.id
                                                }
                                            };

                                            var attributeObj = {};
                                            if (req.body.jsonAttributes && req.body.jsonAttributes.length) {
                                                var objectArray = [];
                                                for (var i = 0; i < req.body.jsonAttributes.length; i++) {
                                                    objectArray.push(req.body.jsonAttributes[i].jsonObj);
                                                }
                                                attributeObj = utils.mergeObjects(objectArray);
                                                logger.debug('json ==> ', attributeObj);
                                            } else {
                                                req.body.jsonAttributes = [];
                                            }
                                            jsonAttributeObj = utils.mergeObjects([attributeObj, jsonAttributeObj]);

                                            infraManager = new Chef({
                                                userChefRepoLocation: infraManagerDetails.chefRepoLocation,
                                                chefUserName: infraManagerDetails.loginname,
                                                chefUserPemFile: infraManagerDetails.userpemfile,
                                                chefValidationPemFile: infraManagerDetails.validatorpemfile,
                                                hostedChefUrl: infraManagerDetails.url,
                                            });

                                            runOptions = {
                                                privateKey: decryptedCredentials.pemFileLocation,
                                                username: decryptedCredentials.username,
                                                host: instance.instanceIP,
                                                instanceOS: instance.hardware.os,
                                                port: 22,
                                                runlist: req.body.runlist,
                                                overrideRunlist: false,
                                                jsonAttributes: JSON.stringify(jsonAttributeObj)
                                            }
                                            logger.debug('decryptCredentials ==>', decryptedCredentials);
                                            if (decryptedCredentials.pemFileLocation) {
                                                runOptions.privateKey = decryptedCredentials.pemFileLocation;
                                            } else {
                                                runOptions.password = decryptedCredentials.password;
                                            }

                                        } else {
                                            var puppetSettings = {
                                                host: infraManagerDetails.hostname,
                                                username: infraManagerDetails.username,
                                            };
                                            if (infraManagerDetails.pemFileLocation) {
                                                puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
                                            } else {
                                                puppetSettings.password = infraManagerDetails.puppetpassword;
                                            }
                                            logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
                                            infraManager = new Puppet(puppetSettings);
                                            var runOptions = {
                                                username: decryptedCredentials.username,
                                                host: instance.instanceIP,
                                                port: 22,
                                            }

                                            if (decryptedCredentials.pemFileLocation) {
                                                runOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
                                            } else {
                                                runOptions.password = decryptedCredentials.password;
                                            }

                                        }

                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: false,
                                            log: 'Running client on the node',
                                            timestamp: new Date().getTime()
                                        });
                                        instanceLog.actionId = actionLog._id;
                                        instanceLog.logs = {
                                            err: false,
                                            log: "Running client on the node",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        infraManager.runClient(runOptions, function (err, retCode) {
                                            if (decryptedCredentials.pemFileLocation) {
                                                fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                                                    if (err) {
                                                        logger.debug("Unable to delete temp pem file =>", err);
                                                    } else {
                                                        logger.debug("temp pem file deleted =>", err);
                                                    }
                                                });
                                            }

                                            if (err) {
                                                var timestampEnded = new Date().getTime();
                                                logsDao.insertLog({
                                                    referenceId: logReferenceIds,
                                                    err: true,
                                                    log: "Unable to run client",
                                                    timestamp: timestampEnded
                                                });
                                                instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                instanceLog.actionId = actionLog._id;
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLog.logs = {
                                                    err: true,
                                                    log: "Unable to run client",
                                                    timestamp: new Date().getTime()
                                                };
                                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                return;
                                            }
                                            logger.debug("knife ret code", retCode);
                                            if (retCode == 0) {
                                                logger.debug('updating node runlist in db');
                                                if (instance.chef && instance.chef.serverId) {

                                                    instancesDao.updateInstancesRunlistAndAttributes(req.params.instanceId, req.body.runlist, req.body.jsonAttributes, function (err, updateCount) {
                                                        if (err) {
                                                            return;
                                                        }

                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logReferenceIds,
                                                            err: false,
                                                            log: 'instance runlist updated',
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                        instanceLog.actionId = actionLog._id;
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "success";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: "instance runlist updated",
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        //Checking docker status and updating
                                                        var _docker = new Docker();
                                                        _docker.checkDockerStatus(instance.id,
                                                            function (err, retCode) {
                                                                if (err) {
                                                                    logger.error("Failed to check docker status: ", err);
                                                                    res.send(500);
                                                                    return;
                                                                }
                                                                logger.debug('Docker Check Returned:', retCode);
                                                                if (retCode == '0' || retCode == null) {
                                                                    instancesDao.updateInstanceDockerStatus(req.params.instanceId, "success", '', function (data) {
                                                                        logger.debug('Instance Docker Status set to Success');
                                                                        logger.debug("Exit post() for /instances/dockerimagepull");
                                                                    });
                                                                }
                                                                if (retCode == '1') {
                                                                    instancesDao.updateInstanceDockerStatus(req.params.instanceId, "", '', function (data) {
                                                                        logger.debug('Instance Docker Status set to None');
                                                                        logger.debug("Exit post() for /instances/dockerimagepull");
                                                                    });
                                                                }

                                                            });

                                                    });
                                                } else {
                                                    var timestampEnded = new Date().getTime();
                                                    logsDao.insertLog({
                                                        referenceId: logReferenceIds,
                                                        err: false,
                                                        log: 'puppet client ran successfully',
                                                        timestamp: timestampEnded
                                                    });
                                                    instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                    instanceLog.endedOn = new Date().getTime();
                                                    instanceLog.actionStatus = "success";
                                                    instanceLog.logs = {
                                                        err: false,
                                                        log: "puppet client ran successfully",
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                }
                                            } else {
                                                if (retCode === -5000) {
                                                    logsDao.insertLog({
                                                        referenceId: logReferenceIds,
                                                        err: true,
                                                        log: 'Host Unreachable',
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.endedOn = new Date().getTime();
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: true,
                                                        log: "Host Unreachable",
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                } else if (retCode === -5001) {
                                                    logsDao.insertLog({
                                                        referenceId: logReferenceIds,
                                                        err: true,
                                                        log: 'Invalid credentials',
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: true,
                                                        log: "Invalid credentials ",
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });

                                                } else {
                                                    logsDao.insertLog({
                                                        referenceId: logReferenceIds,
                                                        err: true,
                                                        log: 'Unknown error occured. ret code = ' + retCode,
                                                        timestamp: new Date().getTime()
                                                    });
                                                    instanceLog.actionStatus = "failed";
                                                    instanceLog.logs = {
                                                        err: true,
                                                        log: "Unknown error occured. ret code = " + retCode,
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });

                                                }
                                                var timestampEnded = new Date().getTime();
                                                logsDao.insertLog({
                                                    referenceId: logReferenceIds,
                                                    err: true,
                                                    log: 'Unable to run client',
                                                    timestamp: timestampEnded
                                                });
                                                instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                instanceLog.endedOn = new Date().getTime();
                                                instanceLog.actionStatus = "failed";
                                                instanceLog.logs = {
                                                    err: true,
                                                    log: "Unable to run client",
                                                    timestamp: new Date().getTime()
                                                };
                                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
                                                return;
                                            }
                                        }, function (stdOutData) {
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: false,
                                                log: stdOutData.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.logs = {
                                                err: false,
                                                log: stdOutData.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });

                                        }, function (stdOutErr) {
                                            logsDao.insertLog({
                                                referenceId: logReferenceIds,
                                                err: true,
                                                log: stdOutErr.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            });
                                            instanceLog.logs = {
                                                err: true,
                                                log: stdOutErr.toString('ascii'),
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                        });
                                        res.send(200, {
                                            actionLogId: actionLog._id
                                        });
                                    });
                                });
                            });
                        } else {
                            res.send(404);
                        }
                    });

                } //else haspermission
            } //if !err
        }); //haspermission
    });



    app.get('/instances/:instanceId/stopInstance', function (req, res) {
        logger.debug("Enter get() for /instances/%s/stopInstance", req.params.instanceId);
        logger.debug('Verifying User permission set for stopInstance.');
        var user = req.session.user;
        var category = 'instancestop';
        var permissionto = 'execute';
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission :  launch ' + data + ' , Condition State : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    var error = new Error("No permission");
                    error.status = 401;
                    res.send(error);
                    return;
                } else {
                    schedulerService.startStopInstance(req.params.instanceId, user.cn, 'Stop', function (err, data) {
                        if (err) {
                            return res.send(err);
                        }
                        res.send(data);
                    });
                }
            }
        });
    });

    app.get('/instances/:instanceId/startInstance', function (req, res) {
        logger.debug("Enter get() for /instances/%s/startInstance", req.params.instanceId);
        logger.debug('Verifying User permission set for startInstance.');
        var user = req.session.user;
        var category = 'instancestart';
        var permissionto = 'execute';
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission :  launch ' + data + ' , Condition State : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    var error = new Error("No permission");
                    error.status = 401;
                    res.send(error);
                    return;
                } else {
                    schedulerService.startStopInstance(req.params.instanceId, user.cn, 'Start', function (err, data) {
                        if (err) {
                            return res.send(err);
                        }
                        res.send(data);
                    });
                }
            }
        });
    });


    app.get('/instances/:instanceId/logs', function (req, res) {
        //logger.debug("Enter get() for /instances/%s/logs", req.params.instanceId);
        var timestamp = req.query.timestamp;
        if (timestamp) {
            timestamp = parseInt(timestamp);
        }
        var timestampEnded = req.query.timestampEnded;
        if (timestampEnded) {
            timestampEnded = parseInt(timestampEnded);
        }
        logsDao.getLogsByReferenceIdAndTimestamp(req.params.instanceId, timestamp, timestampEnded, function (err, data) {
            if (err) {
                logger.error("Found error to fetch Logs: ", err);
                res.send(500);
                return;
            }
            res.send(data);

        });
    });



    app.post('/instances/:instanceId/services/add', function (req, res) {
        logger.debug("Enter post() for /instances/%s/services/add", req.params.instanceId);
        logger.debug('serviceIds ==>', req.body.serviceIds);

        logger.debug('Verifying User permission set for execute.');
        var user = req.session.user;
        var category = 'instanceservices';
        var permissionto = 'execute';
        usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function (err, data) {
            if (!err) {
                logger.debug('Returned from haspermission :  launch ' + data + ' , Condition State : ' + (data == false));
                if (data == false) {
                    logger.debug('No permission to ' + permissionto + ' on ' + category);
                    res.send(401);
                    return;
                } else {
                    instancesDao.addService(req.params.instanceId, req.body.serviceIds, function (err, updateCount) {
                        if (err) {
                            logger.error("Found error while adding service: ", err);
                            res.send(500);
                            return;
                        }

                        if (updateCount && (typeof updateCount === 'Object' || typeof updateCount === 'object') && updateCount.n) {
                            updateCount = updateCount.n;
                        }
                        if (updateCount > 0) {
                            logger.debug("Exit post() for /instances/%s/services/add", req.params.instanceId);
                            res.send(200, req.body.serviceIds);
                        } else {
                            logger.debug("Exit post() for /instances/%s/services/add", req.params.instanceId);
                            res.send(200, []);
                        }

                    });
                } //else haspermission
            } //if !err
        }); //haspermission
    });

    app.delete('/instances/:instanceId/services/:serviceId', function (req, res) {
        logger.debug("Enter delete() for /instances/%s/services/%s", req.params.instanceId, req.params.serviceId);
        instancesDao.deleteService(req.params.instanceId, req.params.serviceId, function (err, deleteCount) {
            if (err) {
                logger.error("Found error while deleting service: ", err);
                res.send(500);
                return;
            }
            if (deleteCount) {
                logger.debug("Exit delete() for /instances/%s/services/%s", req.params.instanceId, req.params.serviceId);
                res.send({
                    deleteCount: deleteCount
                }, 200);
            } else {
                res.send(400);
            }

        });

    });

    app.get('/instances/:instanceId/services/:serviceId/:actionType', function (req, res) {
        logger.debug("Enter get() for /instances/%s/services/%s/%s", req.params.instanceId, req.params.serviceId, req.params.actionType);
        instancesDao.getInstanceById(req.params.instanceId, function (err, instances) {
            if (err) {
                logger.error("Getting error while fetching instance: ", err);
                res.send(500);
                return;
            }
            if (!instances.length) {
                res.send(400);
                return;
            }
            var instance = instances[0];
            configmgmtDao.getServiceFromId(req.params.serviceId, function (err, services) {
                if (err) {
                    logger.error("Getting error while fetching service: ", err);
                    res.send(500);
                    return;
                }
                if (!services.length) {
                    logger.error("Service not found: ", services.length);
                    res.send(404);
                    return;
                }

                var serviceData = services[0];
                logger.debug("serviceData", serviceData);
                var timestampStarted = new Date().getTime();
                var actionLog = instancesDao.insertServiceActionLog(req.params.instanceId, {
                    serviceName: serviceData.servicename,
                    type: req.params.actionType
                }, req.session.user.cn, timestampStarted);
                var logReferenceIds = [req.params.instanceId, actionLog._id];
                var instanceLog = {
                    actionId: actionLog._id,
                    instanceId: req.params.instanceId,
                    orgName: instance.orgName,
                    bgName: instance.bgName,
                    projectName: instance.projectName,
                    envName: instance.environmentName,
                    status: instance.instanceState,
                    actionStatus: "pending",
                    platformId: instance.platformId,
                    blueprintName: instance.blueprintData.blueprintName,
                    data: instance.runlist,
                    platform: instance.hardware.platform,
                    os: instance.hardware.os,
                    size: instance.instanceType,
                    user: req.session.user.cn,
                    createdOn: new Date().getTime(),
                    startedOn: new Date().getTime(),
                    providerType: instance.providerType,
                    action: "Service-" + req.params.actionType,
                    logs: []
                };

                function onComplete(err, retCode) {
                    if (err) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: true,
                            log: 'Unable to run services',
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(req.params.instanceId, actionLog._id, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLog.logs = {
                            err: true,
                            log: 'Unable to run services',
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        return;
                    }
                    logger.debug("ret code", retCode);

                    if (retCode == 0) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: false,
                            log: 'Service run success',
                            timestamp: timestampEnded
                        });
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "success";
                        instanceLog.logs = {
                            err: false,
                            log: 'Service run success',
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        instancesDao.updateActionLog(req.params.instanceId, actionLog._id, true, timestampEnded);
                    } else {
                        var timestampEnded = new Date().getTime();
                        if (retCode === -5000) {
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: 'Host Unreachable',
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: 'Host Unreachable',
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else if (retCode === -5001) {
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: 'Invalid credentials',
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: 'Invalid credentials',
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        } else {
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: true,
                                log: 'Unknown error occured. ret code = ' + retCode,
                                timestamp: timestampEnded
                            });
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.actionStatus = "failed";
                            instanceLog.logs = {
                                err: true,
                                log: 'Unknown error occured. ret code = ' + retCode,
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        }
                        timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: true,
                            log: 'Unable to run services',
                            timestamp: timestampEnded
                        });
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLog.logs = {
                            err: true,
                            log: 'Unable to run services',
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        instancesDao.updateActionLog(req.params.instanceId, actionLog._id, false, timestampEnded);

                    }
                }

                function onStdOut(stdOutData) {
                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: false,
                        log: stdOutData.toString('ascii'),
                        timestamp: new Date().getTime()
                    });
                    instanceLog.logs = {
                        err: false,
                        log: stdOutData.toString('ascii'),
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                }

                function onStdErr(stdOutErr) {
                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: true,
                        log: stdOutErr.toString('ascii'),
                        timestamp: new Date().getTime()
                    });
                    instanceLog.logs = {
                        err: true,
                        log: stdOutErr.toString('ascii'),
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                }
                credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                    //decrypting pem file
                    if (err) {
                        var timestampEnded = new Date().getTime();
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: true,
                            log: 'Unable to decrypt credentials. Unable to run service',
                            timestamp: timestampEnded
                        });
                        instancesDao.updateActionLog(req.params.instanceId, actionLog._id, false, timestampEnded);
                        instanceLog.endedOn = new Date().getTime();
                        instanceLog.actionStatus = "failed";
                        instanceLog.logs = {
                            err: true,
                            log: 'Unable to decrypt credentials. Unable to run service',
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });

                        res.status(500).send({
                            actionLogId: actionLog._id
                        });
                        return;
                    }
                    if (serviceData.commandtype === "Chef Cookbook/Recipe") {
                        configmgmtDao.getChefServerDetails(serviceData.chefserverid, function (err, chefDetails) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: 'Chef Data corrupted. Unable to run service',
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(req.params.instanceId, actionLog._id, false, timestampEnded);

                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: 'Chef Data corrupted. Unable to run service',
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                res.status(500).send({
                                    actionLogId: actionLog._id
                                });
                                return;
                            }
                            if (!chefDetails) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: 'Chef Data corrupted. Unable to run service',
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(req.params.instanceId, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: 'Chef Data corrupted. Unable to run service',
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, req.params.instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                res.status(500).send({
                                    actionLogId: actionLog._id
                                });
                                return;
                            }

                            var chef = new Chef({
                                userChefRepoLocation: chefDetails.chefRepoLocation,
                                chefUserName: chefDetails.loginname,
                                chefUserPemFile: chefDetails.userpemfile,
                                chefValidationPemFile: chefDetails.validatorpemfile,
                                hostedChefUrl: chefDetails.url,
                            });
                            logger.debug('instance IP ==>', instance.instanceIP);
                            var actionType = req.params.actionType;
                            var runlist = [];
                            if (actionType == 'start' && (serviceData.servicestart && serviceData.servicestart != 'none')) {
                                runlist.push('recipe[' + serviceData.servicestart + ']');
                            } else if (actionType == 'stop' && (serviceData.servicestop && serviceData.servicestop != 'none')) {
                                runlist.push('recipe[' + serviceData.servicestop + ']');
                            } else if (actionType == 'restart' && (serviceData.servicerestart && serviceData.servicerestart != 'none')) {
                                runlist.push('recipe[' + serviceData.servicerestart + ']');
                            } else if (actionType == 'kill' && (serviceData.servicekill && serviceData.servicekill != 'none')) {
                                runlist.push('recipe[' + serviceData.servicekill + ']');
                            } else if (actionType == 'status' && (serviceData.servicestatus && serviceData.servicestatus != 'none')) {
                                runlist.push('recipe[' + serviceData.servicestatus + ']');
                            }
                            var chefClientOptions = {
                                privateKey: instance.credentials.pemFileLocation,
                                username: instance.credentials.username,
                                host: instance.instanceIP,
                                instanceOS: instance.hardware.os,
                                port: 22,
                                runlist: runlist, // runing service runlist
                                overrideRunlist: true
                            }
                            if (decryptedCredentials.pemFileLocation) {
                                chefClientOptions.privateKey = decryptedCredentials.pemFileLocation;
                            } else {
                                chefClientOptions.password = decryptedCredentials.password;
                            }
                            logger.debug('running chef client');
                            chef.runChefClient(chefClientOptions, function (err, ret) {
                                if (decryptedCredentials.pemFileLocation) {
                                    fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                                        if (err) {
                                            logger.error("Unable to delete temp pem file =>", err);
                                        } else {
                                            logger.error("temp pem file deleted =>", err);
                                        }
                                    });
                                }
                                onComplete(err, ret);
                            }, onStdOut, onStdErr);
                            res.send(200, {
                                actionLogId: actionLog._id
                            });

                        });

                    } else {
                        //running command
                        var sshParamObj = {
                            host: instance.instanceIP,
                            port: 22,
                            username: instance.credentials.username,
                        };
                        var sudoCmd;
                        if (decryptedCredentials.pemFileLocation) {
                            sshParamObj.privateKey = decryptedCredentials.pemFileLocation;
                        } else {
                            sshParamObj.password = decryptedCredentials.password;
                        }

                        var serviceCmd = "service " + serviceData.command + " " + req.params.actionType;
                        var sudoCmd = "sudo";
                        if (sshParamObj.password) {
                            sudoCmd = 'echo \"' + sshParamObj.password + '\" | sudo -S';
                        }
                        serviceCmd = sudoCmd + " " + serviceCmd;


                        var sshConnection = new SSH(sshParamObj);

                        sshConnection.exec(serviceCmd, function (err, ret) {
                            if (decryptedCredentials.pemFileLocation) {
                                fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                                    if (err) {
                                        logger.error("Unable to delete temp pem file =>", err);
                                    } else {
                                        logger.error("temp pem file deleted =>", err);
                                    }
                                });
                            }
                            onComplete(err, ret);
                        }, onStdOut, onStdErr);

                    }
                });
            });
        });
    });


    app.get('/instances/:instanceId/actionLogs', function (req, res) {
        logger.debug("Enter get() for /instances/%s/actionLogs", req.params.instanceId);
        async.waterfall([
            function (next) {
                instanceService.parseActionLogsQuery(req.query, next)
            },
            function (filterByQuery, next) {
                instanceService.getInstanceActionLogs(req.params.instanceId, filterByQuery, next);
            }
        ], function (err, actionLogs) {
            if (err) {
                logger.error("Failed to fetch ActionLogs: ", err);
                res.send(500);
                return;
            } else {
                res.status(200).send(actionLogs)
            }
        });

    });

    app.get('/instances/:instanceId/actionLogs/:logId', function (req, res) {
        logger.debug("Enter get() for /instances/%s/actionLogs/%s", req.params.instanceId, req.params.logId);
        instancesDao.getActionLogById(req.params.instanceId, req.params.logId, function (err, instances) {
            if (err) {
                logger.error("Failed to fetch ActionLog: ", err);
                res.send(500);
                return;
            }

            if (!(instances.length && instances[0].actionLogs && instances[0].actionLogs.length)) {
                res.send(400);
                return;
            } else {
                logger.debug("Exit get() for /instances/%s/actionLogs/%s", req.params.instanceId, req.params.logId);
                res.send(instances[0].actionLogs[0]);
            }

        });

    });

    app.get('/instances/:instanceId/actionLogs/:logId/logs', function (req, res) {
        logger.debug("Enter get() for /instances/%s/actionLogs/%s/logs", req.params.instanceId, req.params.logId);
        instancesDao.getInstanceById(req.params.instanceId, function (err, instances) {
            if (err) {
                logger.error("Failed to fetch Instance: ", err);
                res.send(500);
                return;
            }
            if (!instances.length) {
                res.send(400);
                return;
            }
            var timestamp = null;
            if (req.query.timestamp) {
                timestamp = req.query.timestamp;
                timestamp = parseInt(timestamp);
            }

            logsDao.getLogsByReferenceId(req.params.logId, timestamp, function (err, data) {
                if (err) {
                    logger.error("Failed to fetch Logs: ", err);
                    res.send(500);
                    return;
                }
                logger.debug("Exit get() for /instances/%s/actionLogs/%s/logs", req.params.instanceId, req.params.logId);
                res.send(data);
            });

        });

    });

    app.post('/instances/bootstrap', function (req, res) {


    });

    app.post('/instances/:instanceId/updateName', function (req, res) {
        logger.debug("Enter post() for /instances/%s/updateName", req.params.instanceId);
        instancesDao.getInstanceById(req.params.instanceId, function (err, anInstance) {
            if (err) {
                logger.error("Failed to fetch Instance: ", err);
                res.status(500).send("Failed to fetch Instance: ");
                return;
            }
            if (anInstance) {
                instancesDao.updateInstanceName(req.params.instanceId, req.body.name, function (err, updateCount) {
                    if (err) {
                        res.status(500).send("Failed to update instance name");
                        return;
                    }
                    logger.debug(updateCount);
                    res.send(200, {
                        updateCount: updateCount
                    });
                });

            } else {
                res.send(404, "No Instance found.")
            }

        });

    });

    app.get('/instances/:instanceId/inspect', function (req, res) {
        logger.debug("Enter get() for /instances/%s/inspect", req.params.instanceId);
        instancesDao.getInstanceById(req.params.instanceId, function (err, anInstance) {
            if (err) {
                logger.error("Failed to fetch Instance: ", err);
                res.status(500).send("Failed to fetch Instance: ");
                return;
            }
            if (anInstance.length) {
                if (anInstance[0].bootStrapStatus !== 'success') {
                    res.status(400).send({
                        message: "Instance is not boostraped"
                    });
                    return;
                }
                configmgmtDao.getChefServerDetails(anInstance[0].chef.serverId, function (err, chefDetails) {
                    if (err) {
                        res.send(500);
                        return;
                    }
                    if (!chefDetails) {
                        res.send(404);
                        return;
                    }

                    //decrypting pem file
                    credentialCryptography.decryptCredential(anInstance[0].credentials, function (err, decryptedCredentials) {
                        if (err) {
                            res.status(500).send("Unable to decrypt file.");
                            return;
                        }

                        //getting chef run execution Id 
                        if (anInstance[0].hardware.os == 'linux') {
                            var cmd = 'dpkg --get-selections';
                            if (anInstance[0].hardware.platform === 'centos') {
                                cmd = 'rpm -qa';
                            }
                            var sudoCmd = "sudo";
                            if (decryptedCredentials.password) {
                                sudoCmd = 'echo \"' + decryptedCredentials.password + '\" | sudo -S';
                            }
                            cmd = sudoCmd + " " + cmd;

                            var sshParamObj = {
                                username: decryptedCredentials.username,
                                host: anInstance[0].instanceIP,
                                port: 22
                            }
                            if (decryptedCredentials.pemFileLocation) {
                                sshParamObj.privateKey = decryptedCredentials.pemFileLocation;
                            } else {
                                sshParamObj.password = decryptedCredentials.password;
                            }
                            var sshConnection = new SSH(sshParamObj);
                            var installedSoftwareString = '';
                            sshConnection.exec(cmd, function (err, retCode) {
                                if (err) {
                                    res.status(500).send({
                                        "message": "Unable to ssh"
                                    });
                                    return;
                                }
                                if (retCode == 0) {
                                    res.send(200, {
                                        installedSoftwareString: installedSoftwareString
                                    });
                                } else if (retCode === -5000) {
                                    res.status(500).send({
                                        "message": "Host Unreachable."
                                    });
                                    return;
                                } else if (retCode === -5001) {
                                    res.status(500).send({
                                        "message": "Invalid credentials."
                                    });
                                    return;
                                } else if (retCode === -5002) {
                                    res.status(500).send({
                                        "message": "Unknown Exeption Occured. Code : " + retCode
                                    });
                                    return;
                                } else {
                                    res.status(500).send({
                                        "message": "Unknown Exeption Occured. Code : " + retCode
                                    });
                                    return;
                                }

                            }, function (stdOut) {
                                installedSoftwareString = installedSoftwareString + stdOut.toString('UTF-8');
                            }, function (stdErr) {

                            });

                        } else {


                            var chef = new Chef({
                                userChefRepoLocation: chefDetails.chefRepoLocation,
                                chefUserName: chefDetails.loginname,
                                chefUserPemFile: chefDetails.userpemfile,
                                chefValidationPemFile: chefDetails.validatorpemfile,
                                hostedChefUrl: chefDetails.url,
                            });
                            var chefClientOptions = {
                                username: decryptedCredentials.username,
                                host: anInstance[0].instanceIP,
                                port: 22,
                            }

                            if (decryptedCredentials.pemFileLocation) {
                                chefClientOptions.privateKey = decryptedCredentials.pemFileLocation;
                            } else {
                                chefClientOptions.password = decryptedCredentials.password;
                            }
                            var installedSoftwareString = '';
                            var cmd = 'Get-WmiObject -Class Win32_Product | Select-Object -Property Name';
                            cmd = 'powershell \"' + cmd + '\"';
                            chef.runKnifeWinrmCmd(cmd, chefClientOptions, function (err, retCode) {

                                if (err) {
                                    res.status(500).send({
                                        "message": "Unable to winrm"
                                    });
                                    return;
                                }
                                logger.debug("Winrm finished with retcode ==> " + retCode);
                                if (retCode == 0) {
                                    installedSoftwareString = installedSoftwareString.replace(new RegExp(anInstance[0].instanceIP, 'g'), '');
                                    //removing first two lines of junk
                                    var stringParts = installedSoftwareString.split('\n');
                                    if (stringParts.length > 4) { // must be greater than 3
                                        stringParts = stringParts.slice(4);
                                        installedSoftwareString = stringParts.join('\r\n');
                                    } else { //returning empty string
                                        installedSoftwareString = '';
                                    }
                                    res.send(200, {
                                        installedSoftwareString: installedSoftwareString
                                    });
                                } else if (retCode === -5000) {
                                    res.status(500).send({
                                        "message": "Host Unreachable."
                                    });
                                    return;
                                } else if (retCode === -5001) {
                                    res.status(500).send({
                                        "message": "Invalid credentials."
                                    });
                                    return;
                                } else if (retCode === -5002) {
                                    res.status(500).send({
                                        "message": "Unknown Exeption Occured while trying knife winrm. Code : " + retCode
                                    });
                                    return;
                                } else {
                                    res.status(500).send({
                                        "message": "Unknown Exeption Occured while trying knife winrm. Code : " + retCode
                                    });
                                    return;
                                }
                            }, function (stdOut) {
                                installedSoftwareString = installedSoftwareString + stdOut.toString('UTF-8');

                            }, function (stdErr) {
                                logger.debug("err ==> " + stdErr.toString('ascii'));
                            });

                        }
                    });
                });

            } else {
                res.send(404, "No Instance found.");
                return;
            }

        });

    });

    app.get('/instances/:instanceId/setAsWorkStation', function (req, res) {

        instancesDao.getInstanceById(req.params.instanceId, function (err, instances) {
            if (err) {
                logger.debug("Failed to fetch Instance ", err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!instances.length) {
                return res.send(404, {
                    message: "Instance does not exist"
                });

            }

            var instance = instances[0];
            configmgmtDao.getChefServerDetails(instance.chef.serverId, function (err, chefDetails) {
                if (err) {
                    logger.debug("Failed to fetch ChefServerDetails ", err);
                    res.status(500).send(errorResponses.chef.corruptChefData);
                    return;
                }
                credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                    if (err) {
                        res.status(500).send({
                            "message": "Unable to decrypt file."
                        });
                        return;
                    }
                    var params = {
                        username: decryptedCredentials.username,
                        host: instance.instanceIP,
                        port: 22
                    };

                    if (decryptedCredentials.pemFileLocation) {
                        params.privateKey = decryptedCredentials.pemFileLocation;
                    } else {
                        params.password = decryptedCredentials.password;
                    }
                    var scpClient = new SCPClient(params);
                    scpClient.upload(chefDetails.chefRepoLocation + '/.chef/', '/home/' + decryptedCredentials.username + '/.chef/', function (err) {
                        if (err) {
                            logger.debug(err);
                            res.status(500).send(err);
                            return;
                        }
                        res.send(200, {
                            message: 'true'
                        })
                    });
                });

            });
        });
    });

    app.get('/instances/:instanceId/status', function (req, res) {
        logger.debug("Enter get() for /instances/%s/actionLogs", req.params.instanceId);
        instancesDao.getAllActionLogs(req.params.instanceId, function (err, actionLogs) {
            if (err) {
                logger.error("Failed to fetch ActionLogs: ", err);
                res.send(500);
                return;
            }

            if (actionLogs && actionLogs.length) {
                logger.debug("Enter get() for /instances/%s/actionLogs", req.params.instanceId);
                res.send(actionLogs);
            } else {
                logger.debug("Exit get() for /instances/%s/actionLogs", req.params.instanceId);
                res.send([]);
            }

        });

    });

    // Now for some reason moving this end point to out of authentication: Gobinda

    /*app.post('/instances/:instanceId/remediation', function(req, res) {
     logger.debug("Enter get() for /instances/%s/redemption", req.params.instanceId);
     instancesDao.getInstanceById(req.params.instanceId, function(err, instances) {
     if (err) {
     logger.error("Failed to fetch ActionLogs: ", err);
     res.status(500).send({
     message: "DB error"
     });
     return;
     }
     if (!instances.length) {
     res.send(404, {
     message: "Instance not found"
     });
     return;
     }
     var instance = instances[0];
     credentialCryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
     if (err) {
     res.status(500).send({
     message: "error occured while decrypting credentials"
     });
     return;
     }
     var sshParamObj = {
     host: instance.instanceIP,
     port: 22,
     username: instance.credentials.username,
     };
     var sudoCmd;
     if (decryptedCredentials.pemFileLocation) {
     sshParamObj.privateKey = decryptedCredentials.pemFileLocation;
     } else {
     sshParamObj.password = decryptedCredentials.password;
     }
     
     var serviceCmd = "service " + req.body.service + " " + req.body.action;
     var sudoCmd = "sudo";
     if (sshParamObj.password) {
     sudoCmd = 'echo \"' + sshParamObj.password + '\" | sudo -S';
     }
     serviceCmd = sudoCmd + " " + serviceCmd;
     
     
     var sshConnection = new SSH(sshParamObj);
     
     sshConnection.exec(serviceCmd, function(err, ret) {
     if (decryptedCredentials.pemFileLocation) {
     fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
     if (err) {
     logger.error("Unable to delete temp pem file =>", err);
     } else {
     logger.error("temp pem file deleted =>", err);
     }
     });
     }
     if (err) {
     res.status(500).send({
     message: "Unable to run service cmd on instance"
     });
     return;
     }
     if (ret === 0) {
     res.send(200, {
     message: "cmd ran successfully"
     });
     } else {
     res.status(500).send({
     message: "cmd failed. code : " + ret
     });
     }
     
     }, function(stdout) {
     logger.debug(stdout.toString());
     }, function(stderr) {
     logger.debug(stderr.toString());
     });
     
     });
     });
     });*/

    app.get('/instances/org/:orgId/bu/:buId/project/:projectId/env/:envId/docker/containers', function (req, res) {
        logger.debug("Enter get() for /instances/dockercontainerdetails/%s", req.params.instanceid);
        var orgId = req.params.orgId;
        var buId = req.params.buId;
        var projectId = req.params.projectId;
        var envId = req.params.envId;

        instancesDao.getInstancesByOrgBgProjectAndEnvForDocker(orgId, buId, projectId, envId, function (err, instances) {
            if (err) {
                logger.debug("Failed to fetch instances: ", err);
                res.status(500).send({
                    "errorCode": 500,
                    "message": "Failed to fetch instances"
                });
                return;
            }
            if (instances.length) {
                var containerList = [];
                for (var i = 0; i < instances.length; i++) {
                    var _docker = new Docker();
                    var stdmessages = '';
                    var cmd = 'echo -e \"GET /containers/json?all=1 HTTP/1.0\r\n\" | sudo nc -U /var/run/docker.sock';

                    logger.debug('cmd received: ', cmd);
                    var stdOut = '';
                    var instanceObj = {
                        "containers": "",
                        "instanceId": instances[i]._id,
                        "instanceName": instances[i].name,
                        "instanceIP": instances[i].instanceIP
                    };
                    _docker.runDockerCommands(cmd, instances[i]._id, function (err, retCode) {
                        var _stdout = stdOut.split('\r\n');
                        logger.debug('Docker containers : %s', _stdout.length);
                        var start = false;
                        var so = '';
                        _stdout.forEach(function (k, v) {
                            logger.debug(_stdout[v] + ':' + _stdout[v].length);
                            if (start == true) {
                                so += _stdout[v];
                                logger.debug(v + ':' + _stdout[v].length);
                            }
                            if (_stdout[v].length == 1)
                                start = true;
                            if (v >= _stdout.length - 1)
                                instanceObj.containers = so;
                            containerList.push(instanceObj);
                        });

                    }, function (stdOutData) {
                        stdOut += stdOutData;
                    }, function (stdOutErr) {
                        logger.error("Error hits to fetch docker details", stdOutErr);
                    });
                }
                res.send(containerList);
                return;
            }
        });
    });

    app.get('/instances/:ipAddress/project/:projectId/logs', function (req, res) {
        var timestamp = req.query.timestamp;
        if (timestamp) {
            timestamp = parseInt(timestamp);
        }
        var timestampEnded = req.query.timestampEnded;
        if (timestampEnded) {
            timestampEnded = parseInt(timestampEnded);
        }
        instancesDao.getInstanceByIPAndProject(req.params.ipAddress, req.params.projectId, function (err, instance) {
            if (err) {
                res.send("");
                return;
            }
            if (instance.length) {
                logsDao.getLogsByReferenceIdAndTimestamp(instance[0].id, timestamp, timestampEnded, function (err, data) {
                    if (err) {
                        logger.error("Found error to fetch Logs: ", err);
                        res.send(500);
                        return;
                    }
                    var logString = "";
                    if (data.length) {
                        for (var i = 0; i < data.length; i++) {
                            logString = logString + data[i].log + "\n";
                        }
                        res.send(logString);
                    } else {
                        res.send("No logs available.");
                    }

                });
            } else {
                res.send("No logs available.");
            }
        });
    });

    // This is post call even though no data insertion bcoz request has to send array of ipaddress.
    app.post('/instances/ipAddress/list', function (req, res) {
        logger.debug("Enter get() for /instances/%s/ipaddress", req.body.ipAddress);
        instancesDao.getInstanceIdsByIPs(req.body.ipAddress, function (err, instanceIds) {
            if (err) {
                logger.error("Failed to fetch ActionLogs: ", err);
                res.status(500).send(err);
                return;
            }
            res.send(instanceIds);
        });

    });

    app.get('/instances/instanceIds/list', function (req, res) {
        var instanceIds = (req.query.ids).split(",");
        instancesDao.getInstancesByIDs(instanceIds, function (err, instances) {
            if (err) {
                logger.error("Failed to fetch Instance  via Ids: ", err);
                res.status(500).send(err);
                return;
            }
            res.send(instances);
        });

    });

    app.put('/instances/schedule', function (req, res) {
        if (req.body !== null) {
            instanceService.updateScheduler(req.body, function (err, updatedResult) {
                if (err) {
                    logger.error("Failed to update scheduler: ", err);
                    return res.status(500).send("Failed to update scheduler.");
                }

                res.send(updatedResult);
            });
        } else {
            res.status(400).send("Bad Request.");
        }
    });
};
