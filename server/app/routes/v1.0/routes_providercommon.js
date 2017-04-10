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

var logger = require('_pr/logger')(module);
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var appConfig = require('_pr/config');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var waitForPort = require('wait-for-port');
var uuid = require('node-uuid');
var taskStatusModule = require('_pr/model/taskstatus');
var Cryptography = require('_pr/lib/utils/cryptography');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var fileIo = require('_pr/lib/utils/fileio');
var logsDao = require('_pr/model/dao/logsdao.js');
var Chef = require('_pr/lib/chef');
var Puppet = require('_pr/lib/puppet');
var validate = require('express-validation');
var tagsValidator = require('_pr/validators/tagsValidator');
var instanceValidator = require('_pr/validators/instanceValidator');
var providerService = require('_pr/services/providerService');
var instanceService = require('_pr/services/instanceService');
var apiErrorUtil = require('_pr/lib/utils/apiErrorUtil');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var Docker = require('_pr/model/docker.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var SSHExec = require('_pr/lib/utils/sshexec');
var monitorsModel = require('_pr/model/monitors/monitors.js');
// @TODO Authorization to be checked for all end points
module.exports.setRoutes = function (app, sessionVerificationFunc) {

    app.all("/providers/*", sessionVerificationFunc);
    // @TODO To be refactored
    app.get('/providers/:providerId', function (req, res) {
        AWSProvider.getAWSProviderById(req.params.providerId, function (err, provider) {
            if (err) {
                res.status(500).send({
                    message: "Server Behaved Unexpectedly"
                });
                return;
            }
            if (!provider) {
                res.status(404).send({
                    message: "provider not found"
                });
                return;
            }

            MasterUtils.getOrgByRowId(provider.orgId[0], function (err, orgs) {
                if (err) {
                    res.status(500).send({
                        message: "Server Behaved Unexpectedly"
                    });
                    return;
                }
                if (!orgs) {
                    res.status(500).send({
                        message: "Data Corrupt"
                    });
                    return;
                }


                var tempProvider = JSON.parse(JSON.stringify(provider));
                tempProvider.org = orgs[0];
                res.status(200).send(tempProvider)
            });

        });
    });

    app.get('/providers/:providerId/managedInstanceList', validate(instanceValidator.get), getManagedInstancesList);

    function getManagedInstancesList(req, res, next) {
        var reqObj = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.changeRequestForJqueryPagination(req.query, next);
                    },
                    function (reqData, next) {
                        reqObj = reqData;
                        apiUtil.paginationRequest(reqData, 'managedInstances', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['providerId'] = req.params.providerId;
                        paginationReq['searchColumns'] = ['instanceIP', 'instanceState', 'platformId', 'hardware.os', 'projectName', 'environmentName'];
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        instancesDao.getByProviderId(queryObj, next);
                    },
                    function (managedInstances, next) {
                        apiUtil.changeResponseForJqueryPagination(managedInstances, reqObj, next);
                    }
                ],
                function (err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
    }
    ;

    app.get('/providers/:providerId/managedInstances', validate(instanceValidator.get), getManagedInstances);

    function getManagedInstances(req, res, next) {
        var reqData = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.paginationRequest(req.query, 'managedInstances', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['providerId'] = req.params.providerId;
                        paginationReq['searchColumns'] = ['instanceIP', 'instanceState', 'platformId', 'hardware.os', 'projectName', 'environmentName'];
                        reqData = paginationReq;
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        instancesDao.getByProviderId(queryObj, next);
                    },
                    function (managedInstances, next) {
                        apiUtil.paginationResponse(managedInstances, reqData, next);
                    }
                ],
                function (err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
    }


    app.get('/providers/:providerId/unmanagedInstances', validate(instanceValidator.get), getUnManagedInstances);

    function getUnManagedInstances(req, res, next) {
        var reqData = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.paginationRequest(req.query, 'unmanagedInstances', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['providerId'] = req.params.providerId;
                        paginationReq['searchColumns'] = ['ip', 'platformId', 'os', 'state', 'projectName', 'environmentName', 'providerData.region'];
                        reqData = paginationReq;
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        unManagedInstancesDao.getByProviderId(queryObj, next);
                    },
                    function (unmanagedInstances, next) {
                        apiUtil.paginationResponse(unmanagedInstances, reqData, next);
                    }

                ],
                function (err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
    }
    ;

    app.get('/providers/:providerId/unmanagedInstanceList', validate(instanceValidator.get), getUnManagedInstancesList);

    function getUnManagedInstancesList(req, res, next) {
        var reqObj = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.changeRequestForJqueryPagination(req.query, next);
                    },
                    function (reqData, next) {
                        reqObj = reqData;
                        apiUtil.paginationRequest(reqData, 'unmanagedInstances', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['providerId'] = req.params.providerId;
                        paginationReq['searchColumns'] = ['ip', 'platformId', 'os', 'state', 'projectName', 'environmentName', 'providerData.region'];
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        unManagedInstancesDao.getByProviderId(queryObj, next);
                    },
                    function (unmanagedInstances, next) {
                        apiUtil.changeResponseForJqueryPagination(unmanagedInstances, reqObj, next);
                    }

                ],
                function (err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
    }
    ;
    // @TODO To be refactored and API end point to be changed
    app.post('/providers/:providerId/sync', function (req, res) {
        AWSProvider.getAWSProviderById(req.params.providerId, function (err, provider) {
            if (err) {
                res.status(500).send({
                    message: "Server Behaved Unexpectedly"
                });
                return;
            }
            if (!provider) {
                res.status(404).send({
                    message: "provider not found"
                });
                return;
            }
            logger.debug("provider--------------->", JSON.stringify(provider));

            configmgmtDao.getEnvNameFromEnvId(req.body.envId, function (err, envName) {
                if (err) {
                    res.status(500).send({
                        message: "Server Behaved Unexpectedly"
                    });
                    return;
                }

                function getCredentialsFromReq(callback) {
                    var credentials = req.body.credentials;
                    if (req.body.credentials.pemFileData) {
                        credentials.pemFileLocation = appConfig.tempDir + uuid.v4();
                        fileIo.writeFile(credentials.pemFileLocation, req.body.credentials.pemFileData, null, function (err) {
                            if (err) {
                                logger.error('unable to create pem file ', err);
                                callback(err, null);
                                return;
                            }
                            callback(null, credentials);
                        });
                    } else {
                        callback(null, credentials);
                    }
                }
                getCredentialsFromReq(function (err, credentials) {
                    if (err) {
                        res.status(500).send({
                            message: "Server Behaved Unexpectedly"
                        });
                        return;
                    }
                    if (!req.body.configManagmentId) {
                        res.status(400).send({
                            message: "Invalid Config Management Id"
                        });
                        return;
                    }
                    MasterUtils.getCongifMgmtsById(req.body.configManagmentId, function (err, infraManagerDetails) {
                        if (err) {
                            res.status(500).send({
                                message: "Server Behaved Unexpectedly"
                            });
                            return;
                        }
                        if (!infraManagerDetails) {
                            res.status(500).send({
                                message: "Config Management not found"
                            });
                            return;
                        }

                        if (infraManagerDetails.configType === 'chef') {
                            var chef = new Chef({
                                userChefRepoLocation: infraManagerDetails.chefRepoLocation,
                                chefUserName: infraManagerDetails.loginname,
                                chefUserPemFile: infraManagerDetails.userpemfile,
                                chefValidationPemFile: infraManagerDetails.validatorpemfile,
                                hostedChefUrl: infraManagerDetails.url
                            });

                            chef.getEnvironment(envName, function (err, env) {
                                if (err) {
                                    logger.error("Failed chef.getEnvironment", err);
                                    res.status(500).send({
                                        message: "Unable to get chef environment"
                                    });
                                    return;
                                }

                                if (!env) {
                                    logger.debug("Blueprint env ID = ", req.query.envId);
                                    chef.createEnvironment(envName, function (err) {
                                        if (err) {
                                            logger.error("Failed chef.getEnvironment", err);
                                            res.status(500).send({
                                                message: "unable to create environment in chef"
                                            });
                                            return;
                                        }
                                        addAndBootstrapInstances();
                                    });
                                } else {
                                    addAndBootstrapInstances();
                                }

                            });
                        } else {
                            addAndBootstrapInstances();

                        }

                        function addAndBootstrapInstances() {

                            var ids = req.body.instanceIds;

                            unManagedInstancesDao.getByIds(ids, function (err, unmanagedInstances) {
                                if (err) {
                                    res.status(500).send(unmanagedInstances);
                                    return;
                                }
                                if (!unmanagedInstances.length) {
                                    res.status(404).send({
                                        message: "Unmanaged instances not found"
                                    });
                                    return;
                                }

                                var appUrls = [];

                                if (appConfig.appUrls && appConfig.appUrls.length) {
                                    appUrls = appUrls.concat(appConfig.appUrls);
                                }

                                credentialCryptography.encryptCredential(credentials, function (err, encryptedCredentials) {
                                    if (err) {
                                        logger.error("unable to encrypt credentials", err);
                                        res.status(500).send({
                                            message: "unable to encrypt credentials"
                                        });
                                        return;
                                    }
                                    var taskStatusObj = null;
                                    var count = 0;

                                    function updateTaskStatusNode(nodeName, msg, err, i) {
                                        count++;
                                        var status = {};
                                        status.nodeName = nodeName;
                                        status.message = msg;
                                        status.err = err;

                                        logger.debug('taskstatus updated');

                                        if (count == unmanagedInstances.length) {
                                            logger.debug('setting complete');
                                            taskstatus.endTaskStatus(true, status);
                                        } else {
                                            logger.debug('setting task status');
                                            taskstatus.updateTaskStatus(status);
                                        }

                                    }
                                    ;

                                    taskStatusModule.getTaskStatus(null, function (err, obj) {
                                        if (err) {
                                            res.send(500);
                                            return;
                                        }
                                        taskstatus = obj;

                                        for (var i = 0; i < unmanagedInstances.length; i++) {
                                            (function (unmanagedInstance) {
                                                var openport = 22;
                                                if (unmanagedInstance.os === 'windows') {
                                                    openport = 5985;
                                                }
                                                waitForPort(unmanagedInstance.ip, openport, function (err) {
                                                    if (err) {
                                                        logger.debug(err);
                                                        updateTaskStatusNode(unmanagedInstance.platformId, "Unable to ssh/winrm into instance " + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
                                                        return;
                                                    }
                                                    var nodeDetails = {
                                                        nodeIp: unmanagedInstance.ip !== null?unmanagedInstance.ip:unmanagedInstance.privateIpAddress,
                                                        nodeOs: unmanagedInstance.os,
                                                        nodeName: unmanagedInstance.platformId,
                                                        nodeEnv: req.body.environmentName
                                                    }
                                                    checkNodeCredentials(credentials, nodeDetails, function (err, credentialStatus) {

                                                        if (err) {
                                                            logger.error(err);
                                                            res.status(400).send({
                                                                message: "Invalid Credentials"
                                                            });
                                                            return;
                                                        } else if (credentialStatus) {
                                                            monitorsModel.getById(req.body.monitorId, function (err, monitor) {
                                                                var instance = {
                                                                    name: unmanagedInstance.platformId,
                                                                    orgId: req.body.orgId,
                                                                    orgName: req.body.orgName,
                                                                    bgName: req.body.bgName,
                                                                    environmentName: req.body.environmentName,
                                                                    bgId: req.body.bgId,
                                                                    projectId: req.body.projectId,
                                                                    projectName: req.body.projectName,
                                                                    envId: req.body.envId,
                                                                    tagServer: req.body.tagServer,
                                                                    providerId: provider._id,
                                                                    providerType: 'aws',
                                                                    providerData: {
                                                                        region: unmanagedInstance.providerData.region
                                                                    },
                                                                    chefNodeName: unmanagedInstance.platformId,
                                                                    runlist: [],
                                                                    platformId: unmanagedInstance.platformId,
                                                                    appUrls: appUrls,
                                                                    instanceIP: unmanagedInstance.ip,
                                                                    instanceState: unmanagedInstance.state,
                                                                    network: unmanagedInstance.network,
                                                                    vpcId: unmanagedInstance.vpcId,
                                                                    privateIpAddress: unmanagedInstance.privateIpAddress,
                                                                    hostName: unmanagedInstance.hostName,
                                                                    monitor: monitor,
                                                                    bootStrapStatus: 'waiting',
                                                                    hardware: {
                                                                        platform: 'unknown',
                                                                        platformVersion: 'unknown',
                                                                        architecture: 'unknown',
                                                                        memory: {
                                                                            total: 'unknown',
                                                                            free: 'unknown',
                                                                        },
                                                                        os: unmanagedInstance.os
                                                                    },
                                                                    credentials: encryptedCredentials,
                                                                    blueprintData: {
                                                                        blueprintName: unmanagedInstance.platformId,
                                                                        templateId: "chef_import",
                                                                        iconPath: "../private/img/templateicons/chef_import.png"
                                                                    }
                                                                };

                                                                if (infraManagerDetails.configType === 'chef') {
                                                                    instance.chef = {
                                                                        serverId: infraManagerDetails.rowid,
                                                                        chefNodeName: unmanagedInstance.platformId
                                                                    }
                                                                } else {
                                                                    instance.puppet = {
                                                                        serverId: infraManagerDetails.rowid

                                                                    }
                                                                }

                                                                instancesDao.createInstance(instance, function (err, data) {
                                                                    if (err) {
                                                                        logger.error('Unable to create Instance ', err);
                                                                        updateTaskStatusNode(unmanagedInstance.platformId, "server beahved unexpectedly while importing instance :" + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
                                                                        return;
                                                                    }
                                                                    instance.id = data._id;
                                                                    instance._id = data._id;
                                                                    var timestampStarded = new Date().getTime();
                                                                    var actionLog = instancesDao.insertBootstrapActionLog(instance.id, [], req.session.user.cn, timestampStarded);
                                                                    var logsRefernceIds = [instance.id, actionLog._id];
                                                                    logsDao.insertLog({
                                                                        referenceId: logsRefernceIds,
                                                                        err: false,
                                                                        log: "Bootstrapping instance",
                                                                        timestamp: timestampStarded
                                                                    });

                                                                    var instanceLog = {
                                                                        actionId: actionLog._id,
                                                                        instanceId: instance.id,
                                                                        orgName: req.body.orgName,
                                                                        bgName: req.body.bgName,
                                                                        projectName: req.body.projectName,
                                                                        envName: req.body.environmentName,
                                                                        status: unmanagedInstance.state,
                                                                        actionStatus: "waiting",
                                                                        platformId: unmanagedInstance.platformId,
                                                                        blueprintName: unmanagedInstance.platformId,
                                                                        data: [],
                                                                        platform: "unknown",
                                                                        os: unmanagedInstance.os,
                                                                        size: "",
                                                                        user: req.session.user.cn,
                                                                        startedOn: new Date().getTime(),
                                                                        createdOn: new Date().getTime(),
                                                                        providerType: "aws",
                                                                        action: "Imported From Provider",
                                                                        logs: [{
                                                                                err: false,
                                                                                log: "Bootstrapping instance",
                                                                                timestamp: new Date().getTime()
                                                                            }]
                                                                    };

                                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                        if (err) {
                                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                                        }
                                                                    });

                                                                    credentialCryptography.decryptCredential(encryptedCredentials, function (err, decryptedCredentials) {
                                                                        if (err) {
                                                                            logger.error("unable to decrypt credentials", err);
                                                                            var timestampEnded = new Date().getTime();
                                                                            logsDao.insertLog({
                                                                                referenceId: logsRefernceIds,
                                                                                err: true,
                                                                                log: "Unable to decrypt credentials. Bootstrap Failed",
                                                                                timestamp: timestampEnded
                                                                            });
                                                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                            updateTaskStatusNode(unmanagedInstance.platformId, "server beahved unexpectedly while importing instance :" + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
                                                                            instanceLog.logs = {
                                                                                err: true,
                                                                                log: "Unable to decrypt credentials. Bootstrap Failed",
                                                                                timestamp: new Date().getTime()
                                                                            };
                                                                            instanceLog.endedOn = new Date().getTime();
                                                                            instanceLog.actionStatus = "failed";
                                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                if (err) {
                                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                                }
                                                                            });
                                                                            return;
                                                                        }
                                                                        var infraManager;
                                                                        var bootstarpOption;
                                                                        var deleteOptions;
                                                                        if (infraManagerDetails.configType === 'chef') {
                                                                            logger.debug('In chef ');
                                                                            infraManager = new Chef({
                                                                                userChefRepoLocation: infraManagerDetails.chefRepoLocation,
                                                                                chefUserName: infraManagerDetails.loginname,
                                                                                chefUserPemFile: infraManagerDetails.userpemfile,
                                                                                chefValidationPemFile: infraManagerDetails.validatorpemfile,
                                                                                hostedChefUrl: infraManagerDetails.url
                                                                            });
                                                                            bootstarpOption = {
                                                                                instanceIp: instance.instanceIP,
                                                                                pemFilePath: decryptedCredentials.pemFileLocation,
                                                                                instancePassword: decryptedCredentials.password,
                                                                                instanceUsername: instance.credentials.username,
                                                                                nodeName: instance.chef.chefNodeName,
                                                                                environment: envName,
                                                                                instanceOS: instance.hardware.os
                                                                            };


                                                                            if (instance.monitor && instance.monitor.parameters.transportProtocol === 'rabbitmq') {
                                                                                var sensuCookBooks = MasterUtils.getSensuCookbooks();
                                                                                var runlist = sensuCookBooks;
                                                                                var jsonAttributes = {};
                                                                                jsonAttributes['sensu-client'] = MasterUtils.getSensuCookbookAttributes(instance.monitor, instance.id);
                                                                                ;

                                                                                bootstarpOption['runlist'] = runlist;
                                                                                bootstarpOption['jsonAttributes'] = jsonAttributes;

                                                                            }
                                                                            deleteOptions = {
                                                                                privateKey: decryptedCredentials.pemFileLocation,
                                                                                username: decryptedCredentials.username,
                                                                                host: instance.instanceIP,
                                                                                instanceOS: instance.hardware.os,
                                                                                port: 22,
                                                                                cmds: ["rm -rf /etc/chef/", "rm -rf /var/chef/"],
                                                                                cmdswin: ["del "]
                                                                            }
                                                                            if (decryptedCredentials.pemFileLocation) {
                                                                                deleteOptions.privateKey = decryptedCredentials.pemFileLocation;
                                                                            } else {
                                                                                deleteOptions.password = decryptedCredentials.password;
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
                                                                            bootstarpOption = {
                                                                                host: instance.instanceIP,
                                                                                username: instance.credentials.username,
                                                                                pemFileLocation: decryptedCredentials.pemFileLocation,
                                                                                password: decryptedCredentials.password,
                                                                                environment: envName
                                                                            };

                                                                            var deleteOptions = {
                                                                                username: decryptedCredentials.username,
                                                                                host: instance.instanceIP,
                                                                                port: 22,
                                                                            }

                                                                            if (decryptedCredentials.pemFileLocation) {
                                                                                deleteOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
                                                                            } else {
                                                                                deleteOptions.password = decryptedCredentials.password;
                                                                            }

                                                                            infraManager = new Puppet(puppetSettings);
                                                                        }


                                                                        //removing files on node to facilitate re-bootstrap
                                                                        logger.debug("Node OS : %s", instance.hardware.os);
                                                                        logger.debug('Cleaning instance');
                                                                        infraManager.cleanClient(deleteOptions, function (err, retCode) {
                                                                            logger.debug("Entering chef.bootstarp");
                                                                            infraManager.bootstrapInstance(bootstarpOption, function (err, code, bootstrapData) {

                                                                                if (err) {
                                                                                    logger.error("knife launch err ==>", err);
                                                                                    instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {

                                                                                    });
                                                                                    if (err.message) {
                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsRefernceIds,
                                                                                            err: true,
                                                                                            log: err.message,
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        instanceLog.actionStatus = "failed";
                                                                                        instanceLog.logs = {
                                                                                            err: true,
                                                                                            log: err.message,
                                                                                            timestamp: new Date().getTime()
                                                                                        };
                                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                            if (err) {
                                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                                            }
                                                                                        });

                                                                                    }
                                                                                    var timestampEnded = new Date().getTime();
                                                                                    logsDao.insertLog({
                                                                                        referenceId: logsRefernceIds,
                                                                                        err: true,
                                                                                        log: "Bootstrap Failed",
                                                                                        timestamp: timestampEnded
                                                                                    });
                                                                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                                    instanceLog.logs = {
                                                                                        err: true,
                                                                                        log: "Bootstrap Failed",
                                                                                        timestamp: new Date().getTime()
                                                                                    };
                                                                                    instanceLog.actionStatus = "failed";
                                                                                    instanceLog.endedOn = new Date().getTime();
                                                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                        if (err) {
                                                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                                                        }
                                                                                    });
                                                                                } else {
                                                                                    if (code == 0) {
                                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function (err, updateData) {
                                                                                            if (err) {
                                                                                                logger.error("Unable to set instance bootstarp status. code 0");
                                                                                            } else {
                                                                                                logger.debug("Instance bootstrap status set to success");
                                                                                            }
                                                                                        });

                                                                                        // updating puppet node name
                                                                                        var nodeName;
                                                                                        if (bootstrapData && bootstrapData.puppetNodeName) {
                                                                                            instancesDao.updateInstancePuppetNodeName(instance.id, bootstrapData.puppetNodeName, function (err, updateData) {
                                                                                                if (err) {
                                                                                                    logger.error("Unable to set puppet node name");
                                                                                                } else {
                                                                                                    logger.debug("puppet node name updated successfully");
                                                                                                }
                                                                                            });
                                                                                            nodeName = bootstrapData.puppetNodeName;
                                                                                        } else {
                                                                                            nodeName = instance.chef.chefNodeName;
                                                                                        }


                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsRefernceIds,
                                                                                            err: false,
                                                                                            log: "Instance Bootstrapped Successfully",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                                                        instanceLog.logs = {
                                                                                            err: false,
                                                                                            log: "Instance Bootstrapped Successfully",
                                                                                            timestamp: new Date().getTime()
                                                                                        };
                                                                                        instanceLog.actionStatus = "success";
                                                                                        instanceLog.endedOn = new Date().getTime();
                                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                            if (err) {
                                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                                            }
                                                                                        });
                                                                                        var hardwareData = {};
                                                                                        if (bootstrapData && bootstrapData.puppetNodeName) {
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
                                                                                                    logger.error("Unable to run puppet client", err);
                                                                                                    return;
                                                                                                }
                                                                                                // waiting for 30 sec to update node data
                                                                                                setTimeout(function () {
                                                                                                    infraManager.getNode(nodeName, function (err, nodeData) {
                                                                                                        if (err) {
                                                                                                            logger.error(err);
                                                                                                            return;
                                                                                                        }
                                                                                                        instanceLog.platform = nodeData.facts.values.operatingsystem;
                                                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                                            if (err) {
                                                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                                                            }
                                                                                                        });
                                                                                                        // is puppet node
                                                                                                        hardwareData.architecture = nodeData.facts.values.hardwaremodel;
                                                                                                        hardwareData.platform = nodeData.facts.values.operatingsystem;
                                                                                                        hardwareData.platformVersion = nodeData.facts.values.operatingsystemrelease;
                                                                                                        hardwareData.memory = {
                                                                                                            total: 'unknown',
                                                                                                            free: 'unknown'
                                                                                                        };
                                                                                                        hardwareData.memory.total = nodeData.facts.values.memorysize;
                                                                                                        hardwareData.memory.free = nodeData.facts.values.memoryfree;
                                                                                                        hardwareData.os = instance.hardware.os;
                                                                                                        instancesDao.setHardwareDetails(instance.id, hardwareData, function (err, updateData) {
                                                                                                            if (err) {
                                                                                                                logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                                                            } else {
                                                                                                                logger.debug("Instance hardware details set successessfully");
                                                                                                            }
                                                                                                        });
                                                                                                    });
                                                                                                }, 30000);
                                                                                            });

                                                                                        } else {
                                                                                            infraManager.getNode(nodeName, function (err, nodeData) {
                                                                                                if (err) {
                                                                                                    logger.error(err);
                                                                                                    return;
                                                                                                }
                                                                                                instanceLog.platform = nodeData.automatic.platform;
                                                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                                    if (err) {
                                                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                                                    }
                                                                                                });
                                                                                                hardwareData.architecture = nodeData.automatic.kernel.machine;
                                                                                                hardwareData.platform = nodeData.automatic.platform;
                                                                                                hardwareData.platformVersion = nodeData.automatic.platform_version;
                                                                                                hardwareData.memory = {
                                                                                                    total: 'unknown',
                                                                                                    free: 'unknown'
                                                                                                };
                                                                                                if (nodeData.automatic.memory) {
                                                                                                    hardwareData.memory.total = nodeData.automatic.memory.total;
                                                                                                    hardwareData.memory.free = nodeData.automatic.memory.free;
                                                                                                }
                                                                                                hardwareData.os = instance.hardware.os;
                                                                                                instancesDao.setHardwareDetails(instance.id, hardwareData, function (err, updateData) {
                                                                                                    if (err) {
                                                                                                        logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                                                    } else {
                                                                                                        logger.debug("Instance hardware details set successessfully");
                                                                                                    }
                                                                                                });
                                                                                                if (decryptedCredentials.pemFilePath) {
                                                                                                    fileIo.removeFile(decryptedCredentials.pemFilePath, function (err) {
                                                                                                        if (err) {
                                                                                                            logger.error("Unable to delete temp pem file =>", err);
                                                                                                        } else {
                                                                                                            logger.debug("temp pem file deleted");
                                                                                                        }
                                                                                                    });
                                                                                                }
                                                                                            });
                                                                                        }


                                                                                        var _docker = new Docker();
                                                                                        _docker.checkDockerStatus(instance.id, function (err, retCode) {
                                                                                            if (err) {
                                                                                                logger.error("Failed _docker.checkDockerStatus", err);
                                                                                                return;
                                                                                                //res.end('200');

                                                                                            }
                                                                                            logger.debug('Docker Check Returned:' + retCode);
                                                                                            if (retCode == '0') {
                                                                                                instancesDao.updateInstanceDockerStatus(instance.id, "success", '', function (data) {
                                                                                                    logger.debug('Instance Docker Status set to Success');
                                                                                                });

                                                                                            }
                                                                                        });

                                                                                    } else {
                                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
                                                                                            if (err) {
                                                                                                logger.error("Unable to set instance bootstarp status code != 0");
                                                                                            } else {
                                                                                                logger.debug("Instance bootstrap status set to failed");
                                                                                            }
                                                                                        });

                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsRefernceIds,
                                                                                            err: true,
                                                                                            log: "Bootstrap Failed",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                                        instanceLog.logs = {
                                                                                            err: true,
                                                                                            log: "Bootstrap Failed",
                                                                                            timestamp: new Date().getTime()
                                                                                        };
                                                                                        instanceLog.actionStatus = "failed";
                                                                                        instanceLog.endedOn = new Date().getTime();
                                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                            if (err) {
                                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }

                                                                            }, function (stdOutData) {

                                                                                logsDao.insertLog({
                                                                                    referenceId: logsRefernceIds,
                                                                                    err: false,
                                                                                    log: stdOutData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                });
                                                                                instanceLog.logs = {
                                                                                    err: false,
                                                                                    log: stdOutData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                };
                                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                    if (err) {
                                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                                    }
                                                                                });

                                                                            }, function (stdErrData) {

                                                                                logsDao.insertLog({
                                                                                    referenceId: logsRefernceIds,
                                                                                    err: true,
                                                                                    log: stdErrData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                });
                                                                                instanceLog.logs = {
                                                                                    err: true,
                                                                                    log: stdErrData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                };
                                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                    if (err) {
                                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                                    }
                                                                                });
                                                                            });
                                                                        }); //end of chefcleanup

                                                                        updateTaskStatusNode(unmanagedInstance.platformId, "Instance Imported : " + unmanagedInstance.platformId, false, count);
                                                                        unmanagedInstance.remove({});

                                                                    });
                                                                });
                                                            });
                                                        } else {
                                                            updateTaskStatusNode(unmanagedInstance.platformId, "The username or password/pemfile you entered is incorrect " + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
                                                            return;
                                                        }
                                                    });
                                                });

                                            })(unmanagedInstances[i])
                                        }
                                        res.status(200).send({
                                            taskId: taskstatus.getTaskId()
                                        });
                                    });
                                });
                            });
                        }
                    });
                });
            });
        });

        function checkNodeCredentials(credentials, nodeDetail, callback) {
            if (nodeDetail.nodeOs !== 'windows') {
                var sshOptions = {
                    username: credentials.username,
                    host: nodeDetail.nodeIp,
                    port: 22,
                }
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

    /*app.param('providerId', providerService.providerExists);
     app.param('catalystEntityType', providerService.isValidCatalystEntityType);
     app.param('catalystEntity', providerService.catalystEntityExists);*/

    /**
     * @api {get} /providers/:providerId/tags   Get tags list
     * @apiName getTags
     * @apiGroup tags
     *
     * @apiParam {Number} providerId            Provider ID
     *
     * @apiSuccess {Object[]} tags              List of tags
     * @apiSuccess {String} tags.name           Tag name
     * @apiSuccess {String} tags.description    Tag description
     * @apiSuccess {String[]} tags.values       Tag values
     * @apiSuccess {Number} count               Number of tags in the result set
     * @apiSuccess {pageSize} pageSize          Page size
     * @apiSuccess {pageIndex} pageIndex        Page index
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *
     *          "tags": [
     *              {
     *                  "name": "env",
     *                  "description": "Deployment environment",
     *                  "values": ["value1", "value2"]
     *              },
     *              {
     *                  "name": "application",
     *                  "description": "Project name",
     *                  "values": ["value1", "value2"]
     *              }
     *          ],
     *          "count": 2,
     *          "pageSize": 10,
     *          "pageIndex": 1
     *      }
     *
     */
    // @TODO Response should match doc
    // @TODO Pagination, search and sorting to be implemented
    app.get('/providers/:providerId/tags', validate(tagsValidator.list), getTagsList);

    /**
     * @api {get} /providers/:providerId/tags/:tagName Get tag details
     * @apiName getTagDetails
     * @apiGroup tags
     *
     * @apiParam {Number} providerId            Provider ID
     * @apiParam {String} tagName               Tag Name
     *
     * @apiSuccess {Object} tag                 Tag details
     * @apiSuccess {String} tag.name            Tag name
     * @apiSuccess {String} tag.description     Tag description
     * @apiSuccess {String[]} tag.values        Tag values
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "name": "environment",
     *          "description": "Deployment environment",
     *          "values": ["value1", "value2"]
     *      }
     *
     */
    app.get('/providers/:providerId/tags/:tagName', validate(tagsValidator.get), getTag);

    /**
     * @api {post} /providers/:providerId/tags  Add tag
     * @apiName addTag
     * @apiGroup tags
     *
     * @apiParam {Number} providerId            Provider ID
     * @apiParam {String} tagName               Tags name
     * @apiParam {Object} tag                   Tag object in request body
     * @apiParam {String} tag.name              Tag name
     * @apiParam {String} tag.description       Tag description
     * @apiParamExample {json} Request-Example:
     *      {
     *          "name": "environment",
     *          "description": "Tag description",
     *          "values": ["value1", "value2"]
     *      }
     *
     * @apiSuccess {Object} tag                 Tag details
     * @apiSuccess {String} tags.name           Tag name
     * @apiSuccess {String} tags.description    Tag description
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "name": "environment",
     *          "description": "Deployment environment",
     *          "values": ["value1", "value2"]
     *      }
     */
    // app.post('/providers/:providerId/tags', validate(tagsValidator.create), createTags);

    /**
     * @api {put} /providers/:providerId/tags/:tagName  Update tag
     * @apiName updateTag
     * @apiGroup tags
     *
     * @apiParam {Number} providerId            Provider ID
     * @apiParam {String} tagName               Tags name
     * @apiParam {Object[]} tag                 Tag object in request body
     * @apiParam {String} tag.description       Tag description
     * @apiParamExample {json} Request-Example:
     *      {
     *          "description": "Tag description"
     *      }
     *
     * @apiSuccess {Object} tag                 Tag details
     * @apiSuccess {String} tags.name           Tag name
     * @apiSuccess {String} tags.description    Tag description
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "name": "environment",
     *          "description": "Deployment environment",
     *          "values": ["value1", "value2"]
     *      }
     */
    app.put('/providers/:providerId/tags/:tagName', validate(tagsValidator.update), updateTag);

    /**
     * @api {delete} /providers/:providerId/tags/:tagName Delete tag
     * @apiName deleteTag
     * @apiGroup tags
     *
     * @apiParam {Number} providerId    Provider ID
     *
     * @apiSuccess {Object} response    Empty response object
     *
     */
    app.delete('/providers/:providerId/tags/:tagName', validate(tagsValidator.update), deleteTag);


    /**
     * @api {get} /providers/:providerId/tag-mappings           Get tag mappings
     * @apiName getTagMappingsList
     * @apiGroup tag mappings
     *
     * @apiParam {Number} providerId    Provider ID
     *
     * @apiSuccess {Object[]} tagNameMappings                   Tag name mappings
     * @apiSuccess {String} tagNameMappings.tagName             Tag name
     * @apiSuccess {String[]} tagNameMappings.tagValues         Encountered tag values
     * @apiSuccess {String} tagNameMappings.catalystEntityType  Catalyst entity type
     * @apiSuccess {pageIndex} pageIndex                        Page index
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "project": {
     *              "tagName":  "application",
     *              "tagValues": ["proj1", "proj2"],
     *              "catalystEntityType": "project",
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "tagValue": "proj1"
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "tagValue": "proj2"
     *                  }
     *              }
     *           },
     *          "environment": {
     *              "tagName":  "environment",
     *              "tagValues": ["prod", "dev"],
     *              "catalystEntityType": "environment"
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "tagValue": "dev"
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "tagValue": "prod"
     *                  }
     *              }
     *          }
     *      }
     */
    // @TODO Response should match doc
    // @TODO Pagination, search and sorting to be implemented
    app.get('/providers/:providerId/tag-mappings', validate(tagsValidator.list), getTagMappingsList);

    /**
     * @api {get} /providers/:providerId/tag-mappings/:catalystEntityType       Get tags mapping for an entity type
     * @apiName getTagMapping
     * @apiGroup tag mappings
     *
     * @apiParam {Number} providerId            Provider ID
     * @apiParam {String} catalystEntityType    Catalyst entity type. Currently "project" and "environment" are the
     *                                          available options
     *
     * @apiSuccess {Object} tagMapping                                          Tag name mapping
     * @apiSuccess {String} tagMapping.name                                     Tag name
     * @apiSuccess {String[]} tagMapping.values                                 Encountered tag values
     * @apiSuccess {Object[]} tagMapping.catalystEntityMapping                  Catalyst entity mapping
     * @apiSuccess {String} tagMapping.catalystEntityMapping.catalystEntityId   Catalyst entity id
     * @apiSuccess {String} tagMapping.catalystEntityMapping.catalystEntityName Catalyst entity name
     * @apiSuccess {String} tagMapping.catalystEntityMapping.tagValue           Tag value
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "name": "application",
     *          "values": ["proj1", "proj2"],
     *          "catalystEntityType": "project",
     *          "catalystEntityMapping": {
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "tagValue": "proj1"
     *              },
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "tagValue": "proj2"
     *              }
     *          }
     *      }
     */
    app.get('/providers/:providerId/tag-mappings/:catalystEntityType', validate(tagsValidator.tagsMapping),
            getTagMapping);

    /**
     * @api {post} /providers/:providerId/tags-mappings                             Create tag mappings
     * @apiName createTagNameMapping
     * @apiGroup tag mappings
     *
     * @apiParam {Number} providerId                                                Provider ID
     * @apiParam {Object[]} tagMappings                                             Tag mappings
     * @apiParam {String} tagMappings.tagName                                       Tag name
     * @apiSuccess {Object[]} tagMappings.catalystEntityType                        Catalyst entity type
     * @apiSuccess {String} tagNameMapping.catalystEntityMapping.catalystEntityId   Catalyst entity id
     * @apiSuccess {String} tagNameMapping.catalystEntityMapping.tagValue           Tag value
     * @apiParamExample {json} Request-Example:
     *      {
     *          "project": {
     *              "tagName": "application"
     *              "catalystEntityType": "project",
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "project 1",
     *                      "tagValues": ["proj1"]
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "project 2",
     *                      "tagValues": ["proj2"]
     *                  }
     *              }
     *          },
     *          "environment": {
     *              "tagName": "env",
     *              "catalystEntityType": "environment",
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "Environment 1",
     *                      "tagValues": ["env1"]
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "Environment 2",
     *                      "tagValues": ["env2"]
     *                  }
     *              }
     *          }
     *       }
     *
     * @apiSuccess {Object[]} tags                                              Tags
     * @apiSuccess {String} tagMappings                                         Tag mappings
     * @apiSuccess {String} tagMappings.name                                    Tag name
     * @apiSuccess {String[]} tagMappings.values                                Encountered tag values
     * @apiSuccess {String} tagMappings.catalystEntityType                      Catalyst entity type
     * @apiSuccess {String} tagMappings.catalystEntityMapping.catalystEntityId  Catalyst entity id
     * @apiSuccess {String} tagMappings.catalystEntityMapping.tagValue          Tag value
     * @apiSuccess {pageIndex} pageIndex                        Page index
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 201 OK
     *      {
     *          "project": {
     *              "name": "application",
     *              "values": ["proj1", "proj2"],
     *              "catalystEntityType": "project",
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "project 1",
     *                      "tagValues": ["proj1"]
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "project 2",
     *                      "tagValues": ["proj2"]
     *                  }
     *              }
     *          },
     *          "environment": {
     *              "name": "environment",
     *              "values": ["prod", "dev"],
     *              "catalystEntityType": "environment",
     *              "catalystEntityMapping": {
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "Environment 1",
     *                      "tagValues": ["env1"]
     *                  },
     *                  "<catalystEntityId>": {
     *                      "catalystEntityId": "<MongoID>",
     *                      "catalystEntityName": "Environment 2",
     *                      "tagValues": ["env2"]
     *                  }
     *              }
     *          }
     *
     *      }
     */
    app.post('/providers/:providerId/tag-mappings', validate(tagsValidator.list), addTagMappings);

    /**
     * @api {patch} /providers/:providerId/tag-mappings/:catalystEntityType     Update tag mapping
     * @apiName updateTagMapping
     * @apiGroup tag mappings
     *
     * @apiParam {Number} providerId                                            Provider ID
     * @apiParam {Object} tagMapping                                            Tag name mapping
     * @apiSuccess {String} tagMapping.name                                     Tag name
     * @apiSuccess {Object[]} tagMapping.catalystEntityMapping                  Catalyst entity mapping
     * @apiSuccess {String} tagMapping.catalystEntityMapping.catalystEntityId   Catalyst entity id
     * @apiSuccess {String} tagMapping.catalystEntityMapping.catalystEntityName Catalyst entity name
     * @apiSuccess {String} tagMapping.catalystEntityMapping.tagValue           Tag value
     * @apiParamExample {json} Request-Example:
     *      {
     *          "catalystEntityMapping": {
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "catalystEntityName": "project 1",
     *                  "tagValues": ["proj1"]
     *              },
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "catalystEntityName": "project 2",
     *                  "tagValues": ["proj2"]
     *              }
     *          }
     *      }
     *
     * @apiSuccess {Object} tagMapping                                          Tag mapping
     * @apiSuccess {String} tagMapping.tagName                                  Tag name
     * @apiSuccess {String} tagMapping.catalystEntityType                       Catalyst entity type
     * @apiSuccess {String[]} tagMapping.tagValues                              Encountered tag values
     * @apiSuccess {Object[]} tagMapping.catalystEntityMapping                  Catalyst entity mapping
     * @apiSuccess {String} tagMapping.catalystEntityMapping.catalystEntityId   Catalyst entity id
     * @apiSuccess {String} tagMapping.catalystEntityMapping.tagValue           Tag value
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "tagName":  "application",
     *          "tagValues": ["proj1", "proj2"],
     *          "catalystEntityType": "project",
     *          "catalystEntityMapping": {
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "catalystEntityName": "project 1",
     *                  "tagValues": ["proj2", "Proj2"]
     *              },
     *              "<catalystEntityId>": {
     *                  "catalystEntityId": "<MongoID>",
     *                  "catalystEntityName": "project 2",
     *                  "tagValues": ["proj2", "Proj2"]
     *
     *              }
     *          }
     *      }
     */
    app.patch('/providers/:providerId/tag-mappings/:catalystEntityType', validate(tagsValidator.tagsMapping),
            updateTagMapping);

    /**
     * @api {delete} /providers/:providerId/tag-mappings/:catalystEntityType     Delete tag mapping
     * @apiName deleteTagMapping
     * @apiGroup tag mappings
     *
     * @apiParam {Number} providerID                            Provider ID
     * @apiParam {String} catalystEntityType                    Catalyst entity type
     *
     * @apiSuccess {Object} response                            Empty response object
     *
     */
    app.delete('/providers/:providerId/tag-mappings/:catalystEntityType', validate(tagsValidator.tagsMapping),
            deleteTagMapping);


    /**
     * @api {get} /providers/:providerId/unassigned-instances       Get unassigned instances
     * @apiName getAssignedInstances
     * @apiGroup unassigned instances
     *
     * @apiParam {Number} providerId    Provider ID
     *
     * @apiSuccess {Object[]} instances                         Unasssigned instances
     * @apiSuccess {String} instances.orgId                     Organization id
     * @apiSuccess {Object} instances.provider                  Provider
     * @apiSuccess {String} instances.provider.id               Provider Id
     * @apiSuccess {String} instances.provider.type             Provider type
     * @apiSuccess {Object} instances.provider.data             Provider data
     * @apiSuccess {String} instances.platformId                Platform id
     * @apiSuccess {String} instances.ip                        IP address
     * @apiSuccess {String} instances.os                        OS
     * @apiSuccess {String} instances.state                     Instance state
     * @apiSuccess {Object} instances.tags                      Instance tags
     * @apiSuccess {pageIndex} pageIndex                        Page index
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "instances": [
     *              {
     *                  "orgId": "organziationID",
     *                  "provider": {
     *                          "id": "providerID",
     *                          "type": "AWS",
     *                          "data": {
     *                          },
     *                  },
     *                  "platformId": "platorm-id",
     *                  "ip": "192.168.1.0",
     *                  "os": "Ubuntu",
     *                  "state": "running",
     *                  "tags": {
     *                      "environment": "dev",
     *                      "application": "proj1"
     *                  }
     *              }
     *           ],
     *          "count": 2,
     *          "pageSize": 10,
     *          "pageIndex": 1
     *      }
     */
    // @TODO Pagination, search and sorting to be implemented
    app.get('/providers/:providerId/unassigned-instances', validate(instanceValidator.get), getUnassignedInstancesList);

    /**
     * @api {patch} /providers/:providerId/unassigned-instances/:instanceId     Update unassigned instance tags
     * @apiName updateTags
     * @apiGroup unassigned instances
     *
     * @apiParam {Number} providerId    Provider ID
     * @apiParam {Number} instanceId    Instance ID
     * @apiSuccessExample {json} Request-example:
     *      HTTP/1.1 200 OK
     *      {
     *          "tags": {
     *              "environment": "dev",
     *              "application": "proj1"
     *           }
     *      }
     *
     * @apiSuccess {Object[]} instance                      Unasssigned instance
     * @apiSuccess {String} instance.orgId                  Organization id
     * @apiSuccess {Object} instance.provider               Provider
     * @apiSuccess {String} instance.provider.id            Provider Id
     * @apiSuccess {String} instance.platformId             Platform id
     * @apiSuccess {String} instance.ip                     IP address
     * @apiSuccess {String} instance.os                     OS
     * @apiSuccess {String} instance.state                  Instance state
     * @apiSuccess {Object} instance.tags                   Instance tags
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "organziationID",
     *          "provider": {
     *              "id": "providerID",
     *              "type": "AWS",
     *              "data": {
     *                      },
     *          },
     *          "platformId": "platorm-id",
     *          "ip": "192.168.1.0",
     *          "os": "Ubuntu",
     *          "state": "running",
     *          "tags": {
     *              "environment": "dev",
     *              "application": "proj1"
     *          }
     *      }
     */
    app.patch('/providers/:providerId/unassigned-instances/:instanceId',
            validate(instanceValidator.update), updateUnassignedInstanceTags);

    /**
     * @api {patch} /providers/:providerId/unassigned-instances     Update unassigned instance
     * @apiName bulkUpdateInstances
     * @apiGroup unassigned instances
     *
     * @apiParam {Number} providerId    Provider ID
     * @apiParam {Number} instanceId    Instance ID
     * @apiSuccessExample {json} Request-example:
     *      HTTP/1.1 200 OK
     *      {
     *          "instances": [
     *              {
     *                  "id": "<MongoID>",
     *                  "tags": {
     *                      "environment": "dev",
     *                      "application": "proj1"
     *                  }
     *              },
     *              {
     *                  "id": "<MongoID>",
     *                  "tags": {
     *                      "environment": "dev",
     *                      "application": "proj1"
     *                  }
     *              }
     *          ]
     *      }
     *
     * @apiSuccess {Object[]} instance                      Unasssigned instance
     * @apiSuccess {String} instance.orgId                  Organization id
     * @apiSuccess {Object} instance.provider               Provider
     * @apiSuccess {String} instance.provider.id            Provider Id
     * @apiSuccess {String} instance.provider.type          Provider type
     * @apiSuccess {Object} instance.provider.data          Provider data
     * @apiSuccess {String} instance.platformId             Platform id
     * @apiSuccess {String} instance.ip                     IP address
     * @apiSuccess {String} instance.os                     OS
     * @apiSuccess {String} instance.state                  Instance state
     * @apiSuccess {Object} instance.tags                   Instance tags
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "organziationID",
     *          "provider": {
     *              "id": "providerID",
     *              "type": "AWS",
     *              "data": {
     *                      },
     *          },
     *          "platformId": "platorm-id",
     *          "ip": "192.168.1.0",
     *          "os": "Ubuntu",
     *          "state": "running",
     *          "tags": {
     *              "environment": "dev",
     *              "application": "proj1"
     *          }
     *      }
     */
    app.patch('/providers/:providerId/unassigned-instances',
            validate(instanceValidator.get), bulkUpdateUnassignedInstances);

    function getTagsList(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    providerService.getTagsByProvider,
                    providerService.createTagsList
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function getUnassignedInstancesList(req, res, callback) {
        var reqData = {};
        async.waterfall(
                [
                    function (next) {
                        apiUtil.changeRequestForJqueryPagination(req.query, next);
                    },
                    function (reqData, next) {
                        apiUtil.paginationRequest(reqData, 'unassignedInstances', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['providerId'] = req.params.providerId;
                        paginationReq['searchColumns'] = ['ip', 'platformId', 'os', 'state', 'providerData.region'];
                        reqData = paginationReq;
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        instanceService.getUnassignedInstancesByProvider(queryObj, next);
                    },
                    function (unAssignedInstances, next) {
                        apiUtil.changeResponseForJqueryPagination(unAssignedInstances, reqData, next);
                    }

                ],
                function (err, results) {
                    if (err)
                        callback(err);
                    else
                        return res.status(200).send(results);
                });
    }

    function getTag(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.getTagByNameAndProvider(provider._id, req.params.tagName, next);
                    },
                    providerService.createTagObject
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    // @TODO to be implemented
    function createTags(req, res, next) {}

    function updateTag(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        var tagDetails = {
                            'name': req.params.tagName,
                            'description': req.body.description
                        };
                        providerService.updateTag(provider, tagDetails, next);
                    },
                    providerService.createTagObject
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function deleteTag(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.deleteTag(provider, req.params.tagName, next);
                    }
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function getTagMappingsList(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    providerService.getTagsByProvider,
                    providerService.createTagMappingList
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function getTagMapping(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.getTagByCatalystEntityTypeAndProvider(provider._id,
                                req.params.catalystEntityType, next);
                    },
                    providerService.createTagMappingObject
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function addTagMappings(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.addMultipleTagMappings(provider._id, req.body, next);
                    },
                    providerService.createTagMappingList
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(201).send(results);
                    }
                }
        );

    }

    function updateTagMapping(req, res, callback) {
        async.waterfall(
                [
                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.getTagByCatalystEntityTypeAndProvider(provider._id,
                                req.params.catalystEntityType, next);
                    },
                    function (tag, next) {
                        providerService.updateTagMapping(tag, req.body, next);
                    },
                    /*function (tag, next) {
                     providerService.getTagByNameAndProvider(req.params.providerId, tag.name, next);
                     },*/
                    providerService.createTagMappingObject
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function deleteTagMapping(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.deleteTagMapping(provider._id, req.params.catalystEntityType, next);
                    }
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function getCatalystEntityMapping(req, res, callback) {
        async.waterfall(
                [

                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        providerService.getTagByCatalystEntityTypeAndProvider(provider._id,
                                req.params.catalystEntityType, next);
                    },
                    function (tag, next) {
                        providerService.createCatalystEntityMappingObject(tag, req.params.catalystEntityId, next);
                    }
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function updateUnassignedInstanceTags(req, res, callback) {
        async.waterfall(
                [
                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        instanceService.updateUnassignedInstanceProviderTags(provider, req.params.instanceId,
                                req.body.tags, next);
                    },
                    function (instance, next) {
                        // @TODO Nested callback with anonymous function to be avoided.
                        providerService.getTagMappingsByProviderId(instance.providerId,
                                function (err, tagMappingsList) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        instanceService.updateUnassignedInstanceTags(instance,
                                                req.body.tags, tagMappingsList, next);
                                    }
                                }
                        );
                    },
                    instanceService.createUnassignedInstanceObject
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }

    function bulkUpdateUnassignedInstances(req, res, callback) {
        async.waterfall(
                [
                    function (next) {
                        providerService.checkIfProviderExists(req.params.providerId, next);
                    },
                    function (provider, next) {
                        if ('instances' in req.body) {
                            instanceService.bulkUpdateInstanceProviderTags(provider, req.body.instances, next);
                        } else {
                            var err = new Error("Malformed request");
                            err.status = 400;
                            next(err);
                        }
                    },
                    function (instances, next) {
                        instanceService.bulkUpdateUnassignedInstanceTags(instances, next);
                    }
                ],
                function (err, results) {
                    if (err) {
                        callback(err);
                    } else {
                        return res.status(200).send(results);
                    }
                }
        );
    }
};
