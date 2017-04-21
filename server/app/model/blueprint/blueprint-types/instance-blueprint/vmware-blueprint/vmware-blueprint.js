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
var Docker = require('_pr/model/docker.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var VmwareCloud = require('_pr/lib/vmware.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var fs = require('fs');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var auditTrailService = require('_pr/services/auditTrailService');


var Schema = mongoose.Schema;

var CLOUD_PROVIDER_TYPE = {
    AWS: 'aws',
    AZURE: 'azure',
    VMWARE: 'vmware'
};

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};

var vmwareInstanceBlueprintSchema = new Schema({
    imageId: {
        type: String,
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

        trim: true
    },

    securityGroupIds: {
        type: [String],

        trim: true
    },

    dataStore: {
        type: String,
        trim: true
    },
    subnet: {
        type: String,

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
    infraMangerType: String,
    infraManagerId: String,
    infraManagerData: Schema.Types.Mixed,
    cloudProviderData: Schema.Types.Mixed
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
    } else if (blueprint.infraMangerType === CLOUD_PROVIDER_TYPE.vmware) {
        CloudProviderConfig = vmwareBlueprint;
    } else {
        return null;
    }
    var cloudProviderConfig = new CloudProviderConfig(blueprint.cloudProviderData);
    return cloudProviderConfig;
}

vmwareInstanceBlueprintSchema.methods.launch = function(launchParams, callback) {
    var versionData = this.getVersionData(launchParams.ver);
    launchParams.version = versionData;
    var self = this;
    vmwareProvider.getvmwareProviderById(self.cloudProviderId, function(err, providerdata) {
        if (err) {
            logger.error('getAzureCloudProviderById ' + err);
            callback({
                message: "Unable to fetch vmware providerdata from db"
            });
            return;
        }

        VMImage.getImageById(self.imageId, function(err, anImage) {
            if (!err) {

                var serverjson = {};
                serverjson["vm_name"] = "D4D-" + launchParams.blueprintName;
                serverjson["ds"] = self.dataStore;
                serverjson["no_of_vm"] = self.instanceCount;

                var vmwareCloud = new VmwareCloud(providerdata);


                vmwareCloud.createServer(appConfig.vmware.serviceHost, anImage.imageIdentifier, serverjson, function(err, createserverdata) {
                    if (err) {
                        callback({
                            message: "Server Behaved Unexpectedly"
                        });
                        return;
                    }
                    if (!err) {
                        //send the response back and create the instance 


                        var credentials = {
                            username: anImage.userName,
                            password: anImage.instancePassword
                        };


                        var paramRunList = [];
                        if (launchParams && launchParams.version) {
                            paramRunList = launchParams.version.runlist;
                        }

                        credentialcryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
                            if (err) {
                                logger.error('vmware encryptCredential error', err);
                                callback({
                                    message: "vmware encryption error"
                                })
                                return;
                            }

                            //create instaance
                            logger.debug('Credentials encrypted..');
                            logger.debug('OS Launched');
                            logger.debug(JSON.stringify(createserverdata));
                            //Creating instance in catalyst

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
                                providerId: self.cloudProviderId,
                                providerType: self.cloudProviderType,
                                tagServer: launchParams.tagServer,
                                keyPairId: 'unknown',
                                region: self.region,
                                chefNodeName: createserverdata["vm_name"],
                                runlist: paramRunList,
                                platformId: createserverdata["vm_name"],
                                appUrls: launchParams.appUrls,
                                instanceIP: 'unknown',
                                instanceState: 'pending',
                                bootStrapStatus: 'waiting',
                                users: launchParams.users,
                                instanceType: "unknown",
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
                                    username: anImage.userName,
                                    password: anImage.instancePassword
                                },
                                chef: {
                                    serverId: self.infraManagerId,
                                    chefNodeName: createserverdata["vm_name"]
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
                                        message: "Unable to create instance in db"
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
                                    platformId: createserverdata["vm_name"],
                                    blueprintName: launchParams.blueprintData.name,
                                    data: paramRunList,
                                    platform: "unknown",
                                    os: self.instanceOS,
                                    size: "unknown",
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
                                //res.send(200);
                                callback(null, {
                                    "id": [instance.id],
                                    "message": "instance launch success"
                                });
                                logger.debug('Should have sent the response.');
                                vmwareCloud.waitforserverready(appConfig.vmware.serviceHost, createserverdata["vm_name"], anImage.userName, anImage.instancePassword, function(err, publicip, vmdata) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logger.error("Instance wait failes", err);
                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                            if (err) {
                                                logger.error("Unable to set instance bootstarp status. code 0", err);
                                            } else {
                                                logger.debug("Instance bootstrap status set to success");
                                            }
                                        });
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: 'Instance not responding. Bootstrap failed',
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Instance not responding. Bootstrap failed",
                                            timestamp: new Date().getTime()
                                        };
                                        if(launchParams.auditTrailId !== null){
                                            var resultTaskExecution={
                                                actionStatus : "failed",
                                                status:"failed",
                                                endedOn : new Date().getTime()
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
                                    if (!err) {
                                        logger.debug('Instance Ready....');
                                        logger.debug(JSON.stringify(vmdata)); // logger.debug(data);
                                        logger.debug('About to bootstrap Instance');

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
                                        var repoData = {
                                            "projectId": launchParams.blueprintData.projectId,
                                            "repoName": launchParams.blueprintData.nexus.repoName
                                        };
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
                                            credentialcryptography.decryptCredential(instance.credentials, function(err, decryptedCredentials) {
                                                launchParams.infraManager.bootstrapInstance({
                                                    instanceIp: publicip,
                                                    runlist: runlist,
                                                    instanceUsername: anImage.userName,
                                                    instancePassword: decryptedCredentials.password,
                                                    nodeName: createserverdata["vm_name"],
                                                    environment: launchParams.envName,
                                                    instanceOS: instance.hardware.os,
                                                    jsonAttributes: jsonAttributes
                                                }, function(err, code) {
                                                    var timestampEnded = new Date().getTime();
                                                    if (err) {
                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                            if (err) {
                                                                logger.error("Unable to set instance bootstarp status. code 0", err);
                                                            } else {


                                                                logger.debug("Instance bootstrap status set to success");
                                                            }
                                                        });
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: true,
                                                            log: 'Bootstrap failed',
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
                                                            err: true,
                                                            log: "Bootstrap failed",
                                                            timestamp: new Date().getTime()
                                                        };
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
                                                            } else {


                                                                logger.debug("Instance bootstrap status set to success");
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
                                                            //Checking docker status and updating
                                                            var _docker = new Docker();
                                                            _docker.checkDockerStatus(instance.id,
                                                                function(err, retCode) {
                                                                    if (err) {
                                                                        logger.error("Failed _docker.checkDockerStatus", err);
                                                                        res.send(500);
                                                                        return;
                                                                        //res.end('200');

                                                                    }
                                                                    logger.debug('Docker Check Returned:' + retCode);
                                                                    if (retCode == '0') {
                                                                        instancesDao.updateInstanceDockerStatus(instance.id, "success", '', function(data) {
                                                                            logger.debug('Instance Docker Status set to Success');
                                                                        });

                                                                    }
                                                                });

                                                        });
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: false,
                                                            log: 'Instance Bootstraped Successfully.',
                                                            timestamp: timestampEnded
                                                        });
                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                        instanceLog.endedOn = new Date().getTime();
                                                        instanceLog.actionStatus = "success";
                                                        instanceLog.logs = {
                                                            err: false,
                                                            log: "Instance Bootstraped Successfully.",
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


                                                    } else {
                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                                            if (err) {
                                                                logger.error("Unable to set instance bootstarp status. code 0", err);
                                                            } else {


                                                                logger.debug("Instance bootstrap status set to success");
                                                            }
                                                        });
                                                        logsDao.insertLog({
                                                            referenceId: logsReferenceIds,
                                                            err: true,
                                                            log: 'Bootstrap failed',
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
                                                            err: true,
                                                            log: "Bootstrap failed.",
                                                            timestamp: new Date().getTime()
                                                        };
                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                            if (err) {
                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                            }
                                                        });
                                                        return;

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
                                        });

                                    }
                                }); //end of waitforserverready

                            }); //end of createInstance

                        });
                    }
                });

            }
        });

    });

};

vmwareInstanceBlueprintSchema.methods.update = function(updateData) {
    infraManagerConfig = getInfraManagerConfigType(this);
    infraManagerConfig.update(updateData);
    this.infraManagerData = infraManagerConfig;
};

vmwareInstanceBlueprintSchema.methods.getVersionData = function(ver) {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getVersionData(ver);

};

vmwareInstanceBlueprintSchema.methods.getLatestVersion = function() {
    infraManagerConfig = getInfraManagerConfigType(this);
    return infraManagerConfig.getLatestVersion();

};

vmwareInstanceBlueprintSchema.methods.getInfraManagerData = function() {
    return {
        infraMangerType: this.infraManagerType,
        infraManagerId: this.infraManagerId,
        infraManagerData: this.infraManagerData
    };
};

vmwareInstanceBlueprintSchema.methods.getCloudProviderData = function() {
    return {
        cloudProviderType: this.cloudProviderType,
        cloudProviderId: this.cloudProviderId,
        cloudProviderData: this.cloudProviderData
    };
};

// static methods
vmwareInstanceBlueprintSchema.statics.createNew = function(awsData) {
    var self = this;
    logger.debug('In vmwareInstanceBlueprintSchema createNew');


    var infraManagerBlueprint = CHEFInfraBlueprint.createNew({
        runlist: awsData.runlist
    });
    awsData.infraManagerData = infraManagerBlueprint;
    awsData.infraMangerType = "chef";
    awsData.infraManagerId = awsData.infraManagerId;
    awsData.dataStore = awsData.dataStore;
    awsData.imageId = awsData.imageId;
    logger.debug(awsData);
    awsData.cloudProviderData = {
        instanceCount: awsData.instanceCount,
        instanceOS: awsData.instanceOS,
        imageId: awsData.imageId,
        dataStore: awsData.dataStore,
        cloudProviderType: awsData.cloudProviderType
    };
    var awsInstanceBlueprint = new self(awsData);

    return awsInstanceBlueprint;
};

var vmwareInstanceBlueprint = mongoose.model('vmwareInstanceBlueprint', vmwareInstanceBlueprintSchema);

module.exports = vmwareInstanceBlueprint;
