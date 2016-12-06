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
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var appConfig = require('_pr/config');

var instancesDao = require('_pr/model/classes/instance/instance');
var EC2 = require('_pr/lib/ec2.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var Schema = mongoose.Schema;
var resourceService = require('_pr/services/resourceService');
var auditTrailService = require('_pr/services/auditTrailService');
var monitorsModel = require('_pr/model/monitors/monitors.js');

var AWSInstanceBlueprintSchema = new Schema({
    keyPairId: {
        type: String,
        required: true,
        trim: true
    },
    subnetId: {
        type: String,
        required: true,
        trim: true
    },
    vpcId: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    securityGroupIds: {
        type: [String],
        required: true,
        trim: true
    },
    instanceType: {
        type: String,
        //  required: true
    },
    instanceOS: {
        type: String,
        // required: true
    },
    instanceCount: {
        type: String,
    },
    instanceAmiid: {
        type: String,
        //  required: true
    },
    instanceUsername: {
        type: String,
        required: true
    },
    imageId: {
        type: String,
        required: true
    }
});

AWSInstanceBlueprintSchema.methods.launch = function (launchParams, callback) {
    var self = this;
    var domainName = launchParams.domainName;
    VMImage.getImageById(self.imageId, function (err, anImage) {
        if (err) {
            logger.error(err);
            callback({
                message: "db-error"
            });
            return;
        }
        logger.debug("Loaded Image -- : >>>>>>>>>>> %s", anImage.providerId);
        // //determining osType and decrypting the password field if windows found
        // if(anImage.osType === 'windows'){
        //     anImage.instancePassword = 
        // }

        AWSProvider.getAWSProviderById(anImage.providerId, function (err, aProvider) {
            if (err) {
                logger.error(err);
                callback({
                    message: "db-error"
                });
                return;
            }
            if (!aProvider) {
                callback({
                    message: "Unable to fetch provider from DB"
                });
                return;
            }
            AWSKeyPair.getAWSKeyPairById(self.keyPairId, function (err, aKeyPair) {
                if (err) {
                    logger.error(err);
                    callback({
                        message: "db-error"
                    });
                    return;
                }

                var awsSettings;
                if (aProvider.isDefault) {
                    awsSettings = {
                        "isDefault": true,
                        "region": aKeyPair.region,
                        "keyPairName": aKeyPair.keyPairName
                    };
                } else {
                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                        cryptoConfig.password);

                    var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                    awsSettings = {
                        "access_key": decryptedAccessKey,
                        "secret_key": decryptedSecretKey,
                        "region": aKeyPair.region,
                        "keyPairName": aKeyPair.keyPairName
                    };
                }

                logger.debug("Enter launchInstance -- ");
                // New add
                //var encryptedPemFileLocation= currentDirectory + '/../catdata/catalyst/provider-pemfiles/';

                var settings = appConfig;
                //encrypting default pem file
                var cryptoConfig = appConfig.cryptoSettings;
                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

                //setting instance credentials when windows box is used.
                var encrptedPassword;
                var encryptedPemFileLocation;
                if (anImage.instancePassword && anImage.instancePassword.length) {
                    encrptedPassword = anImage.instancePassword;
                } else {
                    encryptedPemFileLocation = settings.instancePemFilesDir + aKeyPair._id;
                }

                var securityGroupIds = [];
                for (var i = 0; i < self.securityGroupIds.length; i++) {
                    securityGroupIds.push(self.securityGroupIds[i]);
                }

                logger.debug("encryptFile of %s successful", encryptedPemFileLocation);

                var ec2 = new EC2(awsSettings);
                //Used to ensure that there is a default value of "1" in the count.
                if (!self.instanceCount) {
                    self.instanceCount = "1";
                }
                var paramRunList = [];
                var paramAttributes = [];

                if (launchParams && launchParams.version) {
                    paramRunList = launchParams.version.runlist;
                    paramAttributes = launchParams.version.attributes;
                }

                ec2.launchInstance(anImage.imageIdentifier, self.instanceType, securityGroupIds, self.subnetId, 'D4D-' + launchParams.blueprintName, aKeyPair.keyPairName, self.instanceCount, function (err, instanceDataAll) {
                    if (err) {
                        logger.error("launchInstance Failed >> ", err);
                        callback({
                            // message: "Instance Launched Failed"
                            message: err.message
                        });
                        return;
                    }


                    var newinstanceIDs = [];

                    function addinstancewrapper(instanceData, instancesLength) {
                        logger.debug('Entered addinstancewrapper ++++++' + instancesLength);
                        var instance = {
                            name: launchParams.blueprintName,
                            orgId: launchParams.orgId,
                            orgName: launchParams.orgName,
                            bgId: launchParams.bgId,
                            bgName: launchParams.bgName,
                            projectId: launchParams.projectId,
                            projectName: launchParams.projectName,
                            envId: launchParams.envId,
                            environmentName: launchParams.envName,
                            providerId: launchParams.cloudProviderId,
                            providerType: launchParams.cloudProviderType,
                            keyPairId: self.keyPairId,
                            region: aKeyPair.region,
                            chefNodeName: instanceData.InstanceId,
                            tagServer: launchParams.tagServer,
                            runlist: paramRunList,
                            attributes: paramAttributes,
                            platformId: instanceData.InstanceId,
                            appUrls: launchParams.appUrls,
                            instanceIP: instanceData.PublicIpAddress || null,
                            instanceState: instanceData.State.Name,
                            bootStrapStatus: 'waiting',
                            users: launchParams.users,
                            instanceType: self.instanceType,
                            catUser: launchParams.sessionUser,
                            hardware: {
                                platform: 'unknown',
                                platformVersion: 'unknown',
                                architecture: 'unknown',
                                memory: {
                                    total: 'unknown',
                                    free: 'unknown',
                                },
                                os: self.instanceOS
                            },
                            vpcId: instanceData.VpcId,
                            subnetId: instanceData.SubnetId,
                            privateIpAddress: instanceData.PrivateIpAddress,
                            hostName: instanceData.PrivateDnsName,
                            credentials: {
                                username: anImage.userName,
                                pemFileLocation: encryptedPemFileLocation,
                                password: encrptedPassword
                            },
                            chef: {
                                serverId: launchParams.infraManagerId,
                                chefNodeName: instanceData.InstanceId
                            },
                            blueprintData: {
                                blueprintId: launchParams.blueprintData.id,
                                blueprintName: launchParams.blueprintData.name,
                                templateId: launchParams.blueprintData.templateId,
                                templateType: launchParams.blueprintData.templateType,
                                templateComponents: launchParams.blueprintData.templateComponents,
                                iconPath: launchParams.blueprintData.iconpath
                            }
                        };


                        logger.debug('Creating instance in catalyst');
                        instancesDao.createInstance(instance, function (err, data) {
                            if (err) {
                                logger.error("Failed to create Instance", err);
                                callback({
                                    message: "Failed to create instance in DB"
                                });
                                return;
                            }
                            instance = data;
                            instance.id = data._id;

                            //Returning handle when all instances are created
                            newinstanceIDs.push(instance.id);
                            logger.debug('Lengths ---- ' + newinstanceIDs.length + '  ' + instancesLength);
                            var timestampStarted = new Date().getTime();
                            var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, launchParams.sessionUser, timestampStarted);
                            var logsReferenceIds = [instance.id, actionLog._id];

                            if (launchParams.auditTrailId !== null) {
                                var resultTaskExecution = {
                                    "actionLogId": logsReferenceIds[1],
                                    "auditTrailConfig.nodeIdsWithActionLog": [{
                                            "actionLogId": logsReferenceIds[1],
                                            "nodeId": logsReferenceIds[0]
                                        }],
                                    "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                    "masterDetails.orgName": launchParams.orgName,
                                    "masterDetails.bgName": launchParams.bgName,
                                    "masterDetails.projectName": launchParams.projectName,
                                    "masterDetails.envName": launchParams.envName
                                }
                                auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                    if (err) {
                                        logger.error("Failed to create or update bot Log: ", err);
                                    }
                                });
                            }
                            if (newinstanceIDs.length >= instancesLength) {
                                callback(null, {
                                    "id": newinstanceIDs,
                                    "message": "instance launch success"
                                });
                            }
                            var instanceLog = {
                                actionId: actionLog._id,
                                instanceId: instance.id,
                                orgName: launchParams.orgName,
                                bgName: launchParams.bgName,
                                projectName: launchParams.projectName,
                                envName: launchParams.envName,
                                status: instanceData.State.Name,
                                actionStatus: "waiting",
                                platformId: instanceData.InstanceId,
                                blueprintName: launchParams.blueprintData.name,
                                data: paramRunList,
                                platform: "unknown",
                                os: self.instanceOS,
                                size: self.instanceType,
                                user: launchParams.sessionUser,
                                startedOn: new Date().getTime(),
                                createdOn: new Date().getTime(),
                                providerType: launchParams.cloudProviderType,
                                action: "Bootstrap",
                                logs: [{
                                        err: false,
                                        log: "Starting instance",
                                        timestamp: new Date().getTime()
                                    }]
                            };

                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });

                            logsDao.insertLog({
                                referenceId: logsReferenceIds,
                                err: false,
                                log: "Starting instance",
                                timestamp: timestampStarted
                            });
                            //For windows instance handle another check..

                            ec2.waitForInstanceRunnnigState(instance.platformId, function (err, instanceData) {
                                if (err) {
                                    var timestamp = new Date().getTime();
                                    instanceLog.logs = {
                                        err: true,
                                        log: "Instance ready state wait failed. Unable to bootstrap",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLog.actionStatus = "failed";
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    if (launchParams.auditTrailId !== null) {
                                        var resultTaskExecution = {
                                            actionStatus: "failed",
                                            status: "failed",
                                            endedOn: new Date().getTime()
                                        }
                                        auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                            if (err) {
                                                logger.error("Failed to create or update bot Log: ", err);
                                            }
                                        });
                                    }
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Instance ready state wait failed. Unable to bootstrap",
                                        timestamp: timestamp
                                    });
                                    logger.error("waitForInstanceRunnnigState returned an error  >>", err);
                                    return;
                                }
                                logger.debug("Enter waitForInstanceRunnnigState :", instanceData);
                                instance.instanceIP = instanceData.PublicIpAddress || instanceData.PrivateIpAddress;
                                instancesDao.updateInstanceIp(instance.id, instance.instanceIP, function (err, updateCount) {
                                    if (err) {
                                        logger.error("instancesDao.updateInstanceIp Failed ==>", err);
                                        return;
                                    }
                                    logger.debug('Instance ip upadated');
                                });
                                instancesDao.updateInstanceState(instance.id, instanceData.State.Name, function (err, updateCount) {
                                    if (err) {
                                        logger.error("error(date instance state err ==>", err);
                                        return;
                                    }
                                    logger.debug('instance state upadated');
                                });

                                instanceLog.status = instanceData.State.Name;
                                instanceLog.logs = {
                                    err: false,
                                    log: "waiting for instance state to be ok",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });

                                logger.debug('waiting for instance');
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: "waiting for instance state to be ok",
                                    timestamp: new Date().getTime()
                                });
                                ec2.waitForEvent(instanceData.InstanceId, 'instanceStatusOk', function (err) {
                                    if (err) {
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Instance ok state wait failed. Unable to bootstrap",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });

                                        if (launchParams.auditTrailId !== null) {
                                            var resultTaskExecution = {
                                                actionStatus: "failed",
                                                status: "failed",
                                                endedOn: new Date().getTime()
                                            }
                                            auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                if (err) {
                                                    logger.error("Failed to create or update bot Log: ", err);
                                                }
                                            });
                                        }

                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: "Instance ok state wait failed. Unable to bootstrap",
                                            timestamp: new Date().getTime()
                                        });
                                        logger.error('intance wait failed ==> ', err);
                                        return;
                                    }

                                    logger.debug('intance wait success');


                                    //decrypting pem file
                                    var cryptoConfig = appConfig.cryptoSettings;
                                    var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
                                    //cryptography.decryptFile(instance.credentials.pemFileLocation, cryptoConfig.decryptionEncoding, tempUncryptedPemFileLoc, cryptoConfig.encryptionEncoding, function(err) {
                                    credentialcryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {

                                        if (err) {
                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance bootstarp status", err);
                                                } else {
                                                    logger.debug("Instance bootstrap status set to failed");
                                                }
                                            });
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLog.actionStatus = "failed";
                                            instanceLog.logs = {
                                                err: true,
                                                log: "Unable to decrpt pem file. Bootstrap failed",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });

                                            if (launchParams.auditTrailId !== null) {
                                                var resultTaskExecution = {
                                                    actionStatus: "failed",
                                                    status: "failed",
                                                    endedOn: new Date().getTime()
                                                }
                                                auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                    if (err) {
                                                        logger.error("Failed to create or update bot Log: ", err);
                                                    }
                                                });
                                            }

                                            var timestampEnded = new Date().getTime();
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: true,
                                                log: "Unable to decrpt pem file. Bootstrap failed",
                                                timestamp: timestampEnded
                                            });
                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                            if (instance.hardware.os != 'windows')
                                                return;
                                        }


                                        var repoData = {};
                                        repoData['projectId'] = launchParams.blueprintData.projectId;
                                        if (launchParams.blueprintData.nexus.repoName) {
                                            repoData['repoName'] = launchParams.blueprintData.nexus.repoName;
                                        } else if (launchParams.blueprintData.docker.image) {
                                            repoData['repoName'] = launchParams.blueprintData.docker.image;
                                        }

                                        launchParams.blueprintData.getCookBookAttributes(instance, repoData, function (err, jsonAttributes) {

                                            AWSProvider.getAWSProviderById(instance.providerId, function (err, aProvider) {
                                                if (aProvider && aProvider.monitorId) {

                                                    monitorsModel.getById(aProvider.monitorId, function (err, monitor) {
                                                        if (monitor) {
                                                            fnBootstrapInstance(monitor);
                                                        } else {
                                                            fnBootstrapInstance(null);
                                                        }

                                                    });
                                                } else {
                                                    fnBootstrapInstance(null);
                                                }

                                            });
                                            function fnBootstrapInstance(monitor) {
                                                var runlist = instance.runlist;
                                                if (launchParams.blueprintData.extraRunlist) {
                                                    runlist = launchParams.blueprintData.extraRunlist.concat(instance.runlist);
                                                }

                                                var sensuCookBook = 'recipe[sensu-client]';
                                                if (runlist.indexOf(sensuCookBook) === -1 && monitor && monitor.parameters.transportProtocol === 'rabbitmq') {
                                                    runlist.unshift(sensuCookBook);

                                                    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                                                    var decryptedPassword = cryptography.decryptText(monitor.parameters.transportProtocolParameters.password, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                                                    var sensuAttributes = {
                                                        'rabbitmq_host': monitor.parameters.transportProtocolParameters.host,
                                                        'rabbitmq_port': monitor.parameters.transportProtocolParameters.port,
                                                        'rabbitmq_username': monitor.parameters.transportProtocolParameters.user,
                                                        'rabbitmq_password': decryptedPassword,
                                                        'rabbitmq_vhostname': monitor.parameters.transportProtocolParameters.vhost,
                                                        'instance-id': instance.platformId
                                                    };

                                                    logger.debug("sensuAttributes-------->", JSON.stringify(sensuAttributes));
                                                    jsonAttributes['sensu-client'] = sensuAttributes;

                                                }

                                                //logger.debug("runlist: ", JSON.stringify(runlist));
                                                var bootstrapInstanceParams = {
                                                    instanceIp: instance.instanceIP,
                                                    pemFilePath: decryptedCredentials.pemFileLocation,
                                                    runlist: runlist,
                                                    instanceUsername: instance.credentials.username,
                                                    nodeName: instance.chef.chefNodeName,
                                                    environment: launchParams.envName,
                                                    instanceOS: instance.hardware.os,
                                                    jsonAttributes: jsonAttributes,
                                                    instancePassword: decryptedCredentials.password
                                                };
                                                launchParams.infraManager.bootstrapInstance(bootstrapInstanceParams, function (err, code) {

                                                    if (decryptedCredentials.pemFileLocation) {
                                                        fileIo.removeFile(decryptedCredentials.pemFileLocation, function (err) {
                                                            if (err) {
                                                                logger.error("Unable to delete temp pem file =>", err);
                                                            } else {
                                                                logger.debug("temp pem file deleted =>", err);
                                                            }
                                                        });
                                                    }
                                                    logger.error('process stopped ==> ', err, code);
                                                    if (err) {
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "failed";
                                                        instanceLog.logs = {
                                                            err: true,
                                                            log: "Bootstrap failed",
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        if (launchParams.auditTrailId !== null) {
                                                            var resultTaskExecution = {
                                                                actionStatus: "failed",
                                                                status: "failed",
                                                                endedOn: new Date().getTime()
                                                            }
                                                            auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update bot Log: ", err);
                                                                }
                                                            });
                                                        }
                                                        logger.error("knife launch err ==>", err);
                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {

                                                        });
                                                        var timestampEnded = new Date().getTime();
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: true,
                                                            log: "Bootstrap failed",
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);


                                                    } else {
                                                        if (code == 0) {
                                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function (err, updateData) {
                                                                if (err) {
                                                                    logger.error("Unable to set instance bootstarp status. code 0", err);
                                                                } else {
                                                                    logger.debug("Instance bootstrap status set to success");
                                                                }
                                                            });
                                                            instanceLog.endedOn = new Date().getTime();
                                                            instanceLog.actionStatus = "success";
                                                            instanceLog.logs = {
                                                                err: false,
                                                                log: "Instance Bootstrapped successfully",
                                                                timestamp: new Date().getTime()
                                                            };
                                                            if (launchParams.auditTrailId !== null) {
                                                                var resultTaskExecution = {
                                                                    actionStatus: "success",
                                                                    status: "success",
                                                                    endedOn: new Date().getTime()
                                                                }
                                                                auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update bot Log: ", err);
                                                                    }
                                                                });
                                                            }
                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            var timestampEnded = new Date().getTime();
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
                                                                err: false,
                                                                log: "Instance Bootstrapped successfully",
                                                                timestamp: timestampEnded
                                                            });
                                                            if (typeof domainName !== 'undefined' && domainName !== '' && domainName !== null && domainName !== 'null') {
                                                                resourceService.updateDomainNameForInstance(domainName, instance.instanceIP, instance.id, awsSettings, function (err, updateDomainName) {
                                                                    if (err) {
                                                                        logger.error("resourceService.updateDomainNameForInstance Failed ==>", err);
                                                                        return;
                                                                    }
                                                                    logger.debug("Domain name is updated successfully");
                                                                });
                                                            }
                                                            instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                            launchParams.infraManager.getNode(instance.chefNodeName, function (err, nodeData) {
                                                                if (err) {
                                                                    logger.error("Failed chef.getNode", err);
                                                                    return;
                                                                }
                                                                instanceLog.platform = nodeData.automatic.platform;
                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                    }
                                                                });
                                                                var hardwareData = {};
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
                                                                //Checking docker status and updating
                                                                var _docker = new Docker();
                                                                _docker.checkDockerStatus(instance.id,
                                                                    function (err, retCode) {
                                                                        if (err) {
                                                                            logger.error("Failed _docker.checkDockerStatus", err);
                                                                            res.send(500);
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

                                                            });

                                                        } else {
                                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
                                                                if (err) {
                                                                    logger.error("Unable to set instance bootstarp status code != 0", err);
                                                                } else {
                                                                    logger.debug("Instance bootstrap status set to failed");
                                                                }
                                                            });
                                                            instanceLog.endedOn = new Date().getTime();
                                                            instanceLog.actionStatus = "failed";
                                                            instanceLog.logs = {
                                                                err: false,
                                                                log: "Bootstrap Failed",
                                                                timestamp: new Date().getTime()
                                                            };
                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });
                                                            if (launchParams.auditTrailId !== null) {
                                                                var resultTaskExecution = {
                                                                    actionStatus: "failed",
                                                                    status: "failed",
                                                                    endedOn: new Date().getTime()
                                                                }
                                                                auditTrailService.updateAuditTrail('BOTs', launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update bot Log: ", err);
                                                                    }
                                                                });
                                                            }
                                                            var timestampEnded = new Date().getTime();
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
                                                                err: false,
                                                                log: "Bootstrap Failed",
                                                                timestamp: timestampEnded
                                                            });
                                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

                                                        }
                                                    }

                                                }, function (stdOutData) {

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

                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: stdOutData.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    });

                                                }, function (stdErrData) {
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

                                                    //retrying 4 times before giving up.
                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: true,
                                                        log: stdErrData.toString('ascii'),
                                                        timestamp: new Date().getTime()
                                                    });


                                                });
                                            }
                                        });
                                    });
                                });
                            });


                        }); //end of create instance.
                    } //end of createinstancewrapper function


                    for (var ic = 0; ic < instanceDataAll.length; ic++) {
                        logger.debug('InstanceDataAll ' + JSON.stringify(instanceDataAll));
                        logger.debug('Length : ' + instanceDataAll.length);
                        addinstancewrapper(instanceDataAll[ic], instanceDataAll.length);
                    }
                });
            });

        });

    });
};

// static methods
AWSInstanceBlueprintSchema.statics.createNew = function (awsData) {
    var self = this;
    var awsInstanceBlueprint = new self(awsData);
    return awsInstanceBlueprint;
};

var AWSInstanceBlueprint = mongoose.model('AWSInstanceBlueprint', AWSInstanceBlueprintSchema);

module.exports = AWSInstanceBlueprint;