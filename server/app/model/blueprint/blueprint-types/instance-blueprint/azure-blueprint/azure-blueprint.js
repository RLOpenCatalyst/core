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
var CHEFInfraBlueprint = require('../chef-infra-manager/chef-infra-manager');


var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var AzureCloud = require('_pr/lib/azure.js');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var fs = require('fs');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var auditTrailService = require('_pr/services/auditTrailService');

var Schema = mongoose.Schema;

var CLOUD_PROVIDER_TYPE = {
    AWS: 'aws',
    AZURE: 'azure'
};

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};

var azureInstanceBlueprintSchema = new Schema({
    cloudProviderType: {
        type: String,
        required: true,
        trim: true
    },
    cloudProviderId: {
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
        type: String,
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
    imageId: {
        type: String,
        required: true
    },
    cloudProviderData: Schema.Types.Mixed,
    infraMangerType: String,
    infraManagerId: String,
    infraManagerData: Schema.Types.Mixed
});



function getInfraManagerConfigType(blueprint) {
    var InfraManagerConfig;
    if (blueprint.infraMangerType === INFRA_MANAGER_TYPE.CHEF) {
        InfraManagerConfig = CHEFInfraBlueprint;
    } else if (blueprint.infraMangerType === INFRA_MANAGER_TYPE.PUPPET) {
        return null;
    } else {
        return null;
    }
    var infraManagerConfig = new InfraManagerConfig(blueprint.infraManagerData);
    return infraManagerConfig;
}

function getCloudProviderConfigType(blueprint) {
    var CloudProviderConfig;
    if (blueprint.cloudProviderType === CLOUD_PROVIDER_TYPE.AWS) {
        CloudProviderConfig = AWSBlueprint;
    } else if (blueprint.infraMangerType === CLOUD_PROVIDER_TYPE.azure) {
        return null;
    } else {
        return null;
    }
    var cloudProviderConfig = new CloudProviderConfig(blueprint.cloudProviderData);
    return cloudProviderConfig;
}

azureInstanceBlueprintSchema.methods.launch = function(launchParams, callback) {
    var versionData = this.getVersionData(launchParams.ver);
    launchParams.version = versionData;
    var self = this;
    azureProvider.getAzureCloudProviderById(self.cloudProviderId, function(err, providerdata) {
        if (err) {
            logger.error('getAzureCloudProviderById ' + err);
            callback({
                message: "Unable to fetch azure provider"
            });
            return;
        }
        logger.debug("Azure Provider Data:", providerdata);
        logger.debug('providerdata:', JSON.stringify(providerdata), typeof providerdata);
        providerdata = JSON.parse(providerdata);

        function launchAzureCloudBP() {

            logger.debug("Image Id:", self.imageId);

            VMImage.getImageById(self.imageId, function(err, anImage) {

                    if (err) {
                        logger.error(err);
                        callback({
                            message: "unable to get vm image from db"
                        })
                        return;
                    }
                    anImage = JSON.parse(JSON.stringify(anImage));
                    logger.debug("Loaded Image -- : >>>>>>>>>>> %s", anImage);

                    credentialcryptography.decryptCredential({
                        username: anImage.userName,
                        password: anImage.instancePassword
                    }, function(err, decryptedCredentials) {
                        if (err) {
                            callback({
                                message: "Unable to decrypt password"
                            });
                            return;
                        }

                        var launchparamsazure = {

                            VMName: "D4D-" + uuid.v4().split('-')[0],
                            imageName: self.instanceAmiid,
                            size: self.instanceType,
                            vnet: self.vpcId,
                            location: self.region,
                            subnet: self.subnetId,
                            username: decryptedCredentials.username,
                            password: decryptedCredentials.password,
                            sshPort: "22",
                            endpoints: self.securityGroupIds,
                            os: self.instanceOS
                        }

                        logger.debug("blueprint.blueprintConfig.instanceOS >>>", self.instanceOS);

                        //logger.debug("Azure VM launch params:" + launchparams);



                        var settings = appConfig;
                        var pemFile = settings.instancePemFilesDir + providerdata._id + '_' +providerdata.pemFileName;
                        var keyFile = settings.instancePemFilesDir + providerdata._id + '_' +providerdata.keyFileName;

                        logger.debug("pemFile path:", pemFile);
                        logger.debug("keyFile path:", pemFile);

                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

                        var uniqueVal = uuid.v4().split('-')[0];

                        var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
                        var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';

                        cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function(err) {
                            if (err) {
                                logger.error('Pem file decryption failed>> ', err);
                                return;
                            }

                            cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function(err) {
                                if (err) {
                                    logger.error('key file decryption failed>> ', err);
                                    return;
                                }

                                var options = {
                                    subscriptionId: providerdata.subscriptionId,
                                    certLocation: decryptedPemFile,
                                    keyLocation: decryptedKeyFile
                                };

                                var azureCloud = new AzureCloud(options);

                                azureCloud.createServer(launchparamsazure, function(err, instanceData) {
                                    if (err) {
                                        logger.error('azure createServer error', err);
                                        callback({
                                            message: "unable to create vm in azure"
                                        });
                                        return;
                                    }

                                    var credentials = {
                                        username: launchparamsazure.username,
                                        password: launchparamsazure.password
                                    };
                                    var paramRunList = [];
                                    if (launchParams && launchParams.version) {
                                        paramRunList = launchParams.version.runlist;
                                    }

                                    credentialcryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
                                        if (err) {
                                            logger.error('azure encryptCredential error', err);
                                            callback({
                                                message: "azure encryptCredential error"
                                            });
                                            return;
                                        }
                                        logger.debug('Credentials encrypted..');
                                        logger.debug('OS Launched');
                                        logger.debug(JSON.stringify(instanceData));
                                        //Creating instance in catalyst

                                        var instance = {
                                            //name: launchparams.VMName,
                                            name: launchParams.blueprintName,
                                            orgId: launchParams.orgId,
                                            orgName: launchParams.orgName,
                                            bgId: launchParams.bgId,
                                            bgName: launchParams.bgName,
                                            projectId: launchParams.projectId,
                                            projectName: launchParams.projectName,
                                            envId: launchParams.envId,
                                            environmentName: launchParams.envName,
                                            providerId: self.cloudProviderId,
                                            providerType: self.cloudProviderType,
                                            tagServer: launchParams.tagServer,
                                            keyPairId: 'azure',
                                            region: self.region,
                                            chefNodeName: launchparamsazure.VMName,
                                            runlist: paramRunList,
                                            platformId: launchparamsazure.VMName,
                                            appUrls: launchParams.appUrls,
                                            instanceIP: 'pending',
                                            instanceState: 'pending',
                                            bootStrapStatus: 'waiting',
                                            users: launchParams.users,
                                            instanceType: self.instanceType,
                                            catUser: launchParams.sessionUser,
                                            hardware: {
                                                platform: 'azure',
                                                platformVersion: 'unknown',
                                                architecture: 'unknown',
                                                memory: {
                                                    total: 'unknown',
                                                    free: 'unknown',
                                                },
                                                os: self.instanceOS
                                            },
                                            credentials: {
                                                username: encryptedCredentials.username,
                                                password: encryptedCredentials.password
                                            },
                                            chef: {
                                                serverId: self.infraManagerId,
                                                chefNodeName: launchparamsazure.VMName
                                            },
                                            blueprintData: {
                                                blueprintId: launchParams.blueprintData._id,
                                                blueprintName: launchParams.blueprintData.name,
                                                templateId: launchParams.blueprintData.templateId,
                                                templateType: launchParams.blueprintData.templateType,
                                                iconPath: launchParams.blueprintData.iconpath
                                            }

                                        };

                                        logger.debug('Instance Data');
                                        logger.debug(JSON.stringify(instance));

                                        instancesDao.createInstance(instance, function(err, data) {
                                            if (err) {
                                                logger.error("Failed to create Instance", err);
                                                callback({
                                                    message: "Failed to create instance in db"
                                                })
                                                return;
                                            }

                                            instance.id = data._id;
                                            var timestampStarted = new Date().getTime();
                                            var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, launchParams.sessionUser, timestampStarted);
                                            var logsReferenceIds = [instance.id, actionLog._id,launchParams.actionLogId];
                                            logsDao.insertLog({
                                                referenceId: logsReferenceIds,
                                                err: false,
                                                log: "Waiting for instance ok state",
                                                timestamp: timestampStarted
                                            });

                                            var instanceLog = {
                                                actionId: actionLog._id,
                                                instanceId: instance.id,
                                                orgName: launchParams.orgName,
                                                bgName: launchParams.bgName,
                                                projectName: launchParams.projectName,
                                                envName: launchParams.envName,
                                                status: "pending",
                                                actionStatus: "waiting",
                                                platformId: launchparamsazure.VMName,
                                                blueprintName: launchParams.blueprintData.name,
                                                data: paramRunList,
                                                platform: "unknown",
                                                os: self.instanceOS,
                                                size: self.instanceType,
                                                user: launchParams.sessionUser,
                                                createdOn: new Date().getTime(),
                                                startedOn: new Date().getTime(),
                                                providerType: self.cloudProviderType,
                                                action: "Bootstrap",
                                                logs: [{
                                                    err: false,
                                                    log: "Waiting for instance ok state",
                                                    timestamp: new Date().getTime()
                                                }]
                                            };

                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });


                                            logger.debug('Returned from Create Instance. About to wait for instance ready state');


                                            //waiting for server to become active
                                            logger.debug('Returned from Create Instance.' + instcount + ' of ' + self.instanceCount + '  About to send response');

                                            azureinstid.push(instance.id);
                                            if (azureinstid.length >= parseInt(self.instanceCount)) {
                                                callback(null, {
                                                    "id": azureinstid,
                                                    "message": "instance launch success"
                                                });
                                                logger.debug('Should have sent the response.');
                                            }
                                            if(launchParams.auditTrailId !== null){
                                                var resultTaskExecution={
                                                    "actionLogId":launchParams.actionLogId,
                                                    "auditTrailConfig.nodeIdsWithActionLog":[{
                                                        "actionLogId" : logsReferenceIds[1],
                                                        "nodeId" : logsReferenceIds[0]
                                                    }],
                                                    "auditTrailConfig.nodeIds":[logsReferenceIds[0]],
                                                    "masterDetails.orgName":launchParams.orgName,
                                                    "masterDetails.bgName":launchParams.bgName,
                                                    "masterDetails.projectName":launchParams.projectName,
                                                    "masterDetails.envName":launchParams.envName
                                                }
                                                auditTrailService.updateAuditTrail(launchParams.auditType,launchParams.auditTrailId,resultTaskExecution,function(err,auditTrail){
                                                    if (err) {
                                                        logger.error("Failed to create or update bots Log: ", err);
                                                    }
                                                });
                                            }

                                            azureCloud.waitforserverready(launchparamsazure.VMName, launchparamsazure.username, launchparamsazure.password, function(err, publicip) {

                                                if (!err) {
                                                    logger.debug('Instance Ready....');
                                                    logger.debug(JSON.stringify(data)); // logger.debug(data);
                                                    logger.debug('About to bootstrap Instance');
                                                    //identifying pulic ip

                                                    instancesDao.updateInstanceIp(instance.id, publicip, function(err, updateCount) {
                                                        if (err) {
                                                            logger.error("instancesDao.updateInstanceIp Failed ==>", err);
                                                            return;
                                                        }
                                                        logger.debug('Instance ip Updated');
                                                    });
                                                    instancesDao.updateInstanceState(instance.id, "running", function(err, updateCount) {
                                                        if (err) {
                                                            logger.error("instancesDao.updateInstanceState Failed ==>", err);
                                                            return;
                                                        }
                                                        logger.debug('Instance state Updated');
                                                    });

                                                    logsDao.insertLog({
                                                        referenceId: logsReferenceIds,
                                                        err: false,
                                                        log: "Instance Ready..about to bootstrap",
                                                        timestamp: timestampStarted
                                                    });

                                                    instanceLog.status = "running";
                                                    instanceLog.logs = {
                                                        err: false,
                                                        log: "Instance Ready..about to bootstrap",
                                                        timestamp: new Date().getTime()
                                                    };
                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });

                                                    var port = '';

                                                    if (instance.hardware.os === 'windows') {
                                                        port = '5985';
                                                    } else {
                                                        port = '22';
                                                    }
                                                    var repoData = {};
                                                    repoData['projectId'] = launchParams.blueprintData.projectId;
                                                    if (launchParams.blueprintData.nexus.repoName) {
                                                        repoData['repoName'] = launchParams.blueprintData.nexus.repoName;
                                                    } else if (launchParams.blueprintData.docker.image) {
                                                        repoData['repoName'] = launchParams.blueprintData.docker.image;
                                                    }
                                                    launchParams.blueprintData.getCookBookAttributes(instance.instanceIP, repoData, function(err, jsonAttributes) {
                                                        var runlist = instance.runlist;
                                                        logger.debug("launchParams.blueprintData.extraRunlist: ", JSON.stringify(launchParams.blueprintData.extraRunlist));
                                                        if (launchParams.blueprintData.extraRunlist) {
                                                            runlist = launchParams.blueprintData.extraRunlist.concat(instance.runlist);
                                                        }

                                                        logger.debug("runlist: ", JSON.stringify(runlist));
                                                        launchParams.infraManager.bootstrapInstance({
                                                            instanceIp: publicip,
                                                            runlist: runlist,
                                                            instanceUsername: launchparamsazure.username,
                                                            instancePassword: launchparamsazure.password, //should be the encryped file 
                                                            nodeName: launchparamsazure.VMName,
                                                            environment: launchParams.envName,
                                                            instanceOS: instance.hardware.os,
                                                            jsonAttributes: jsonAttributes,
                                                            port: port
                                                        }, function(err, code) {
                                                            fs.unlink(decryptedPemFile, function(err) {
                                                                logger.debug("Deleting decryptedPemFile..");
                                                                if (err) {
                                                                    logger.error("Error in deleting decryptedPemFile..");
                                                                }

                                                                fs.unlink(decryptedKeyFile, function(err) {
                                                                    logger.debug("Deleting decryptedKeyFile ..");
                                                                    if (err) {
                                                                        logger.error("Error in deleting decryptedKeyFile..");
                                                                    }
                                                                });
                                                            });

                                                            if (err) {
                                                                instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                                    if (err) {
                                                                        logger.error("Unable to set instance bootstarp status. code 0", err);
                                                                    }
                                                                });

                                                                var timestampEnded = new Date().getTime();
                                                                logsDao.insertLog({
                                                                    referenceId: logsReferenceIds,
                                                                    err: true,
                                                                    log: "Bootstrap failed",
                                                                    timestamp: timestampEnded
                                                                });
                                                                instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                instanceLog.endedOn = new Date().getTime();
                                                                instanceLog.actionStatus = "failed";
                                                                instanceLog.logs = {
                                                                    err: true,
                                                                    log: "Bootstrap failed",
                                                                    timestamp: new Date().getTime()
                                                                };
                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                    }
                                                                });
                                                                if(launchParams.auditTrailId !== null){
                                                                    var resultTaskExecution={
                                                                        actionStatus : "failed",
                                                                        status:"failed",
                                                                        endedOn : new Date().getTime(),
                                                                        actionLogId:launchParams.actionLogId
                                                                    }
                                                                    auditTrailService.updateAuditTrail(launchParams.auditType,launchParams.auditTrailId,resultTaskExecution,function(err,auditTrail){
                                                                        if (err) {
                                                                            logger.error("Failed to create or update bots Log: ", err);
                                                                        }
                                                                    });
                                                                }
                                                                return;
                                                            }

                                                            logger.debug("Azure vm bootstrap code:", code);

                                                            if (code == 0) {
                                                                instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
                                                                    if (err) {
                                                                        logger.error("Unable to set instance bootstarp status. code 0", err);
                                                                    }

                                                                });

                                                                var timestampEnded = new Date().getTime();

                                                                logsDao.insertLog({
                                                                    referenceId: logsReferenceIds,
                                                                    err: false,
                                                                    log: "Instance Bootstraped successfully",
                                                                    timestamp: timestampEnded
                                                                });
                                                                instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                                instanceLog.endedOn = new Date().getTime();
                                                                instanceLog.actionStatus = "success";
                                                                instanceLog.logs = {
                                                                    err: false,
                                                                    log: "Instance Bootstraped successfully",
                                                                    timestamp: new Date().getTime()
                                                                };
                                                                if(launchParams.auditTrailId !== null){
                                                                    var resultTaskExecution={
                                                                        actionStatus : "success",
                                                                        status:"success",
                                                                        endedOn : new Date().getTime(),
                                                                        actionLogId:launchParams.actionLogId
                                                                    }
                                                                    auditTrailService.updateAuditTrail(launchParams.auditType,launchParams.auditTrailId,resultTaskExecution,function(err,auditTrail){
                                                                        if (err) {
                                                                            logger.error("Failed to create or update bots Log: ", err);
                                                                        }
                                                                        var botService = require('_pr/services/botsService');
                                                                        botService.updateSavedTimePerBots(launchParams.botId,launchParams.auditType,function(err,data){
                                                                            if (err) {
                                                                                logger.error("Failed to update bots saved Time: ", err);
                                                                            }
                                                                        });
                                                                    });
                                                                }
                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                    }
                                                                });

                                                                launchParams.infraManager.getNode(instance.chefNodeName, function(err, nodeData) {
                                                                    if (err) {
                                                                        logger.error("Failed chef.getNode", err);
                                                                        return;
                                                                    }
                                                                    instanceLog.platform = nodeData.automatic.platform;
                                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
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
                                                                    instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
                                                                        if (err) {
                                                                            logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                                        } else {
                                                                            logger.debug("Instance hardware details set successessfully");
                                                                        }
                                                                    });

                                                                });

                                                            } else {

                                                                instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                                    if (err) {
                                                                        logger.error("Unable to set instance bootstarp status code != 0", err);
                                                                    } else {
                                                                        logger.debug("Instance bootstrap status set to failed");
                                                                    }
                                                                });
                                                                var timestampEnded = new Date().getTime();
                                                                logsDao.insertLog({
                                                                    referenceId: logsReferenceIds,
                                                                    err: false,
                                                                    log: "Bootstrap Failed",
                                                                    timestamp: timestampEnded
                                                                });
                                                                instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                instanceLog.endedOn = new Date().getTime();
                                                                instanceLog.actionStatus = "failed";
                                                                instanceLog.logs = {
                                                                    err: false,
                                                                    log: "Bootstrap Failed",
                                                                    timestamp: new Date().getTime()
                                                                };
                                                                if(launchParams.auditTrailId !== null){
                                                                    var resultTaskExecution={
                                                                        actionStatus : "failed",
                                                                        status:"failed",
                                                                        endedOn : new Date().getTime(),
                                                                        actionLogId:launchParams.actionLogId
                                                                    }
                                                                    auditTrailService.updateAuditTrail(launchParams.auditType,launchParams.auditTrailId,resultTaskExecution,function(err,auditTrail){
                                                                        if (err) {
                                                                            logger.error("Failed to create or update bots Log: ", err);
                                                                        }
                                                                    });
                                                                }
                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update instanceLog: ", err);
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

                                                            instanceLog.logs = {
                                                                err: false,
                                                                log: stdOutData.toString('ascii'),
                                                                timestamp: new Date().getTime()
                                                            };
                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });



                                                        }, function(stdErrData) {

                                                            //retrying 4 times before giving up.
                                                            logsDao.insertLog({
                                                                referenceId: logsReferenceIds,
                                                                err: true,
                                                                log: stdErrData.toString('ascii'),
                                                                timestamp: new Date().getTime()
                                                            });

                                                            instanceLog.logs = {
                                                                err: false,
                                                                log: stdErrData.toString('ascii'),
                                                                timestamp: new Date().getTime()
                                                            };
                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                                if (err) {
                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                }
                                                            });

                                                        });
                                                    });



                                                } else {
                                                    logger.debug('Err Creating Instance:' + err);
                                                    return;
                                                }
                                            });



                                        }); //close of createInstance
                                        //res.send(data);
                                    });
                                }); //close createServer
                            }); //decrypt file 1
                        }); //decrypt file 2
                    });
                }) //close of VMImage getImageById
        }
        var azureinstid = [];
        var instcount = 0;
        logger.debug('for state:', self.instanceCount);
        for (instcount = 0; instcount < parseInt(self.instanceCount); instcount++) {
            launchAzureCloudBP();
        }

    });


};

azureInstanceBlueprintSchema.methods.update = function(updateData) {
    infraManagerConfig = getInfraManagerConfigType(this);
    infraManagerConfig.update(updateData);
    this.infraManagerData = infraManagerConfig;
};

azureInstanceBlueprintSchema.methods.getVersionData = function(ver) {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getVersionData(ver);

};

azureInstanceBlueprintSchema.methods.getLatestVersion = function() {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getLatestVersion();

};

azureInstanceBlueprintSchema.methods.getInfraManagerData = function() {
    return {
        infraMangerType: this.infraManagerType,
        infraManagerId: this.infraManagerId,
        infraManagerData: this.infraManagerData
    };
};

azureInstanceBlueprintSchema.methods.getCloudProviderData = function() {
    return {
        cloudProviderType: this.cloudProviderType,
        cloudProviderId: this.cloudProviderId,
        cloudProviderData: this.cloudProviderData
    };
};

azureInstanceBlueprintSchema.statics.createNew = function(data) {
    var self = this;
    logger.debug('In azureInstanceBlueprintSchema createNew');

    var infraManagerBlueprint = CHEFInfraBlueprint.createNew({
        runlist: data.runlist
    });

    logger.debug(JSON.stringify(data));

    var azureInstanceBlueprint = new self({
        cloudProviderType: data.cloudProviderType,
        cloudProviderId: data.cloudProviderId,
        securityGroupIds: data.securityGroupIds,
        instanceType: data.instanceType,
        instanceAmiid: data.instanceAmiid,
        vpcId: data.vpcId,
        region: data.region,
        subnetId: data.subnetId,
        imageId: data.imageId,
        instanceOS: data.instanceOS,
        instanceCount: data.instanceCount,
        infraMangerType: data.infraManagerType,
        infraManagerId: data.infraManagerId,
        infraManagerData: infraManagerBlueprint
    });

    return azureInstanceBlueprint;
};

var azureInstanceBlueprint = mongoose.model('azureInstanceBlueprint', azureInstanceBlueprintSchema);

module.exports = azureInstanceBlueprint;
