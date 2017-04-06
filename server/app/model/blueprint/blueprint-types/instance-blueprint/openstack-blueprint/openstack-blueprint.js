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
var Openstack = require('_pr/lib/openstack');
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');

var Hppubliccloud = require('_pr/lib/hppubliccloud.js');
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var auditTrailService = require('_pr/services/auditTrailService');

var fs = require('fs');



var Schema = mongoose.Schema;

var CLOUD_PROVIDER_TYPE = {
    AWS: 'aws',
    AZURE: 'azure'
};

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};

var openstackInstanceBlueprintSchema = new Schema({
    instanceImageID: {
        type: String,
        required: true,
        trim: true
    },
    flavor: {
        type: String,
        required: true,
        trim: true
    },
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
    network: {
        type: String,
        required: true,
        trim: true
    },
    securityGroupIds: {
        type: [String],
        required: true,
        trim: true
    },
    subnet: {
        type: String,
        required: true,
        trim: true
    },
    instanceOS: {
        type: String,
        // required: true
    },
    instanceCount: {
        type: String,
    },
    instanceImageName: {
        type: String,
        //  required: true
    },
    instanceUsername: {
        type: String
            //required: true
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

openstackInstanceBlueprintSchema.methods.launch = function(launchParams, callback) {
    var versionData = this.getVersionData(launchParams.ver);
    launchParams.version = versionData;
    var self = this;
    var getProviderData = null;
    var context = null;

    if (self.cloudProviderType === 'openstack') {
        getProviderData = openstackProvider.getopenstackProviderById;
        context = openstackProvider;

    } else {
        getProviderData = hppubliccloudProvider.gethppubliccloudProviderById;
        context = hppubliccloudProvider;

    }

    getProviderData.call(context, self.cloudProviderId, function(err, providerdata) {
        if (err) {
            logger.error('getopenstackProviderById ' + err);
            callback({
                message: "Unable to get openstack Provider"
            });
            return;
        }
        logger.debug(providerdata);
        var launchparamsOpenstack = {
            server: {
                name: "D4D-" + launchParams.blueprintName,
                imageRef: self.instanceImageName,
                flavorRef: self.flavor,
                key_name: 'key',
                max_count: 1,
                min_count: 1,
                networks: [{
                    uuid: self.network
                }],
                security_groups: [{
                    name: 'default'
                }]

            }
        }
        var openstackconfig = {
            host: providerdata.host,
            username: providerdata.username,
            password: providerdata.password,
            tenantName: providerdata.tenantname,
            tenantId: providerdata.tenantid,
            serviceendpoints: providerdata.serviceendpoints
        };
        var provider = null;
        if (self.cloudProviderType === 'openstack') {
            Provider = Openstack;
        } else {
            Provider = Hppubliccloud;
        }

        var paramRunList = [];
        if (launchParams && launchParams.version) {
            paramRunList = launchParams.version.runlist;
        }
        var openstack = new Provider(openstackconfig);
        openstack.createServer(openstackconfig.tenantId, launchparamsOpenstack, function(err, instanceData) {
            if (err) {
                logger.error('openstack createServer error', err);
                callback({
                    message: "Unable to create openstack vm"
                })
                return;
            }
            logger.debug('OS Launched');
            logger.debug(JSON.stringify(instanceData));
            //Creating instance in catalyst
            var instance = {
                name: launchparamsOpenstack.server.name,
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
                keyPairId: 'unknown',
                region: self.region,
                chefNodeName: instanceData.server.id,
                runlist: paramRunList,
                platformId: instanceData.server.id,
                appUrls: launchParams.appUrls,
                instanceIP: 'pending',
                instanceState: 'pending',
                bootStrapStatus: 'waiting',
                users: launchParams.users,
                instanceType: self.flavor,
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
                credentials: {
                    username: 'ubuntu',
                    pemFileLocation: appConfig.catalystDataDir + '/' + appConfig.catalysHomeDirName + '/' + appConfig.instancePemFilesDirName + '/' + self.cloudProviderId
                },
                chef: {
                    serverId: self.infraManagerId,
                    chefNodeName: instanceData.server.id
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
                        message: "Unable to insert instance in DB"
                    });
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
                var instanceLog = {
                    actionId: actionLog._id,
                    instanceId: instance.id,
                    orgName: launchParams.orgName,
                    bgName: launchParams.bgName,
                    projectName: launchParams.projectName,
                    envName: launchParams.envName,
                    status: "pending",
                    actionStatus: "waiting",
                    platformId: instanceData.server.id,
                    blueprintName: launchParams.blueprintData.name,
                    data: paramRunList,
                    platform: "unknown",
                    os: self.instanceOS,
                    size: self.flavor,
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
                logger.debug('Returned from Create Instance. About to send response');

                callback(null, {
                    "id": [instance.id],
                    "message": "instance launch success"
                });
                logger.debug('Should have sent the response & Entering wait state for instance ready:', JSON.stringify(instanceData));
                var cryptoConfig = appConfig.cryptoSettings;
                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                //decrypting and including key in instancedata


                var tempUncryptedPemFileLoc = appConfig.tempDir + '/' + uuid.v4();
                logger.debug('instance.credentials.pemFileLocation:', instance.credentials.pemFileLocation);
                cryptography.decryptFile(instance.credentials.pemFileLocation, cryptoConfig.decryptionEncoding, tempUncryptedPemFileLoc, cryptoConfig.encryptionEncoding, function(err) {

                    instanceData.credentials = {
                        "username": "ubuntu", //to be fetched from vm images, based on the image.
                        "pemFilePath": tempUncryptedPemFileLoc
                    }

                    openstack.waitforserverready(openstackconfig.tenantId, instanceData, function(err, data) {
                        if (!err) {
                            logger.debug('Instance Ready....');
                            logger.debug(JSON.stringify(data)); // logger.debug(data);
                            logger.debug('About to bootstrap Instance');
                            //identifying pulic ip
                            var publicip = '';
                            if (data.floatingipdata) {
                                publicip = data.floatingipdata.floatingip.floating_ip_address;

                            } else {
                                //to be handled if floating ip is not received.
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: "Instance was not associated with an IP",
                                    timestamp: timestampStarted
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.logs = {
                                    err: false,
                                    log: "Instance was not associated with an IP",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                            }
                            instancesDao.updateInstanceState(instance.id, "running", function(err, updateCount) {
                                if (err) {
                                    logger.error("instancesDao.updateInstanceState Failed ==>", err);
                                    return;
                                }
                                logger.debug('Instance state Updated');
                            });
                            instancesDao.updateInstanceIp(instance.id, publicip, function(err, updateCount) {
                                if (err) {
                                    logger.error("instancesDao.updateInstanceIp Failed ==>", err);
                                    return;
                                }
                                logger.debug('Instance ip Updated');
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
                                    instanceUsername: 'ubuntu',
                                    pemFilePath: tempUncryptedPemFileLoc,
                                    nodeName: instance.chef.chefNodeName,
                                    environment: launchParams.envName,
                                    instanceOS: instance.hardware.os,
                                    jsonAttributes: jsonAttributes
                                }, function(err, code) {
                                    fs.unlink(tempUncryptedPemFileLoc, function(err) {
                                        logger.debug("Deleting decryptedPemFile..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedPemFile..");
                                        }

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
                                        return;
                                    }

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
                                                botService.updateSavedTimePerBots(launchParams.botId,launchParams,auditType,function(err,data){
                                                    if (err) {
                                                        logger.error("Failed to update bots saved Time: ", err);
                                                    }
                                                });
                                            });
                                        }
                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "success";
                                        instanceLog.logs = {
                                            err: false,
                                            log: "Instance Bootstraped successfully",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        launchParams.infraManager.getNode(instance.chef.chefNodeName, function(err, nodeData) {
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
                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.logs = {
                                            err: false,
                                            log: "Bootstrap Failed",
                                            timestamp: new Date().getTime()
                                        };
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
                                        err: true,
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
                });

            });



        });

    });

};

openstackInstanceBlueprintSchema.methods.update = function(updateData) {
    infraManagerConfig = getInfraManagerConfigType(this);
    infraManagerConfig.update(updateData);
    this.infraManagerData = infraManagerConfig;
};

openstackInstanceBlueprintSchema.methods.getVersionData = function(ver) {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getVersionData(ver);

};

openstackInstanceBlueprintSchema.methods.getLatestVersion = function() {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getLatestVersion();

};

openstackInstanceBlueprintSchema.methods.getInfraManagerData = function() {
    return {
        infraMangerType: this.infraManagerType,
        infraManagerId: this.infraManagerId,
        infraManagerData: this.infraManagerData
    };
};

openstackInstanceBlueprintSchema.methods.getCloudProviderData = function() {
    return {
        cloudProviderType: this.cloudProviderType,
        cloudProviderId: this.cloudProviderId,
        cloudProviderData: this.cloudProviderData
    };
};

// static methods
openstackInstanceBlueprintSchema.statics.createNew = function(awsData) {
    var self = this;
    logger.debug('In openstackInstanceBlueprintSchema createNew');
    var infraManagerBlueprint = CHEFInfraBlueprint.createNew({
        runlist: awsData.runlist
    });
    awsData.infraManagerData = infraManagerBlueprint;
    awsData.infraMangerType = "chef";
    awsData.infraManagerId = awsData.infraManagerId;
    awsData.cloudProviderData = {
        instanceCount: awsData.instanceCount,
        instanceOS: awsData.instanceOS,
        imageId: awsData.instanceImageID,
        network: awsData.network,
        subnet: awsData.subnet,
        securityGroupIds: awsData.securityGroupIds,

        //dataStore: awsData.dataStore,
        cloudProviderType: awsData.cloudProviderType
    };

    logger.debug(JSON.stringify(awsData));

    var awsInstanceBlueprint = new self(awsData);
    return awsInstanceBlueprint;
};

var openstackInstanceBlueprint = mongoose.model('openstackInstanceBlueprint', openstackInstanceBlueprintSchema);

module.exports = openstackInstanceBlueprint;
