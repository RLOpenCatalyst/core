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
var ARM = require('_pr/lib/azure-arm.js');
var AzureARM = require('_pr/model/azure-arm');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var resourceMapService = require('_pr/services/resourceMapService.js');

var CHEFInfraBlueprint = require('./chef-infra-manager/chef-infra-manager');

var Schema = mongoose.Schema;

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};


var ARMTemplateBlueprintSchema = new Schema({
    cloudProviderId: String,
    infraMangerType: String,
    infraManagerId: String,
    templateFile: String,
    parameters: Object,
    instances: Object,
    //stackName: String,
    resourceGroup: String,
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

ARMTemplateBlueprintSchema.methods.launch = function(launchParams, callback) {
    var self = this;
    azureProvider.getAzureCloudProviderById(self.cloudProviderId, function(err, providerdata) {
        if (err) {
            logger.error("Unable to fetch provider", err);
            callback({
                message: "Unable to fetch provider"
            });
            return;
        }
        providerdata = JSON.parse(providerdata);

        var settings = appConfig;
        var pemFile = settings.instancePemFilesDir + providerdata._id  +'_' + providerdata.pemFileName;
        var keyFile = settings.instancePemFilesDir + providerdata._id  +'_' + providerdata.keyFileName;

        logger.debug("pemFile path:", pemFile);
        logger.debug("keyFile path:", keyFile);

        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

        var uniqueVal = uuid.v4().split('-')[0];


        // read template file

        var templateFile = self.templateFile;
        var settings = appConfig.chef;
        var chefRepoPath = settings.chefReposLocation;
        fileIo.readFile(chefRepoPath + 'catalyst_files/' + templateFile, function(err, fileData) {
            if (err) {
                logger.error("Unable to read template file " + templateFile, err);
                callback({
                    message: "Unable to read template file"
                });
                return;
            }

            if (typeof fileData === 'object') {
                fileData = fileData.toString('ascii');
            }

            fileData = JSON.parse(fileData);


            if (!launchParams.appUrls) {
                launchParams.appUrls = [];
            }
            var appUrls = launchParams.appUrls;
            if (appConfig.appUrls && appConfig.appUrls.length) {
                appUrls = appUrls.concat(appConfig.appUrls);
            }

            var options = {
                subscriptionId: providerdata.subscriptionId,
                clientId: providerdata.clientId,
                clientSecret: providerdata.clientSecret,
                tenant: providerdata.tenant
            };

            var arm = new ARM(options);
            function addAndBootstrapInstance(instanceData) {
                var credentials = {
                    username: instanceData.username,
                    password: instanceData.password
                };
                credentialcryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
                    if (err) {
                        logger.error('azure encryptCredential error', err);
                        callback({
                            message: "Unable to encryptCredential"
                        });
                        resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                            if(err){
                                logger.error("Error in updating Resource Map.",err);
                            }
                        });
                        return;
                    }
                    logger.debug('Credentials encrypted..');
                    var instance = {
                        name: instanceData.name,
                        orgId: launchParams.orgId,
                        orgName: launchParams.orgName,
                        bgId: launchParams.bgId,
                        bgName: launchParams.bgName,
                        projectId: launchParams.projectId,
                        projectName: launchParams.projectName,
                        envId: launchParams.envId,
                        environmentName: launchParams.envName,
                        providerId: self.cloudProviderId,
                        providerType: 'azure',
                        tagServer: launchParams.tagServer,
                        keyPairId: 'azure',
                        region: self.region,
                        chefNodeName: instanceData.name,
                        runlist: instanceData.runlist,
                        platformId: instanceData.name,
                        appUrls: appUrls,
                        instanceIP: instanceData.ip,
                        instanceState: 'running',
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
                            os: instanceData.os
                        },
                        credentials: {
                            username: encryptedCredentials.username,
                            password: encryptedCredentials.password
                        },
                        chef: {
                            serverId: self.infraManagerId,
                            chefNodeName: instanceData.name
                        },
                        blueprintData: {
                            blueprintId: launchParams.blueprintData._id,
                            blueprintName: launchParams.blueprintData.name,
                            templateId: launchParams.blueprintData.templateId,
                            templateType: launchParams.blueprintData.templateType,
                            iconPath: launchParams.blueprintData.iconpath
                        },
                        armId: instanceData.armId

                    };
                    logger.debug('Creating instance in catalyst');
                    instancesDao.createInstance(instance, function(err, data) {
                        if (err) {
                            logger.error("Failed to create Instance", err);
                            callback({
                                message: "Unable to create instance in db"
                            })
                            resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                if(err){
                                    logger.error("Error in updating Resource Map.",err);
                                }
                            });
                            return;
                        }
                        instance.id = data._id;
                        var resourceObj = {
                            stackStatus:"COMPLETED",
                            resources :[{
                                id:instance.id,
                                type:"instance"
                            }]
                        }
                        resourceMapService.updateResourceMap(launchParams.stackName, resourceObj, function (err, resourceMap) {
                                if (err) {
                                    logger.error("Error in updating Resource Map.", err);
                                }
                        });
                        var timestampStarted = new Date().getTime();
                        var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, launchParams.sessionUser, timestampStarted);
                        var logsReferenceIds = [instance.id, actionLog._id];
                        var instanceLog = {
                            actionId: actionLog._id,
                            instanceId: instance.id,
                            orgName: launchParams.orgName,
                            bgName: launchParams.bgName,
                            projectName: launchParams.projectName,
                            envName: launchParams.envName,
                            status: "running",
                            actionStatus: "waiting",
                            platformId: instanceData.name,
                            blueprintName: launchParams.blueprintData.name,
                            data: instanceData.runlist,
                            platform: "unknown",
                            os: instanceData.os,
                            size: self.instanceType,
                            user: launchParams.sessionUser,
                            startedOn: new Date().getTime(),
                            createdOn: new Date().getTime(),
                            providerType: "azure",
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
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: false,
                            log: "Waiting for instance ok state",
                            timestamp: timestampStarted
                        });
                        //decrypting pem file
                        var cryptoConfig = appConfig.cryptoSettings;
                        var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
                        credentialcryptography.decryptCredential(instance.credentials, function(err, decryptedCredential) {
                            if (err) {
                                instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
                                    if (err) {
                                        logger.error("Unable to set instance bootstarp status", err);
                                    } else {
                                        logger.debug("Instance bootstrap status set to failed");
                                    }
                                });
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: true,
                                    log: "Unable to decrpt pem file. Bootstrap failed",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                instanceLog.logs = {
                                    err: true,
                                    log: "Unable to decrpt pem file. Bootstrap failed",
                                    timestamp: new Date().getTime()
                                };
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
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
                            launchParams.blueprintData.getCookBookAttributes(instance.instanceIP, repoData, function(err, jsonAttributes) {
                                var runlist = instance.runlist;
                                logger.debug("launchParams.blueprintData.extraRunlist: ", JSON.stringify(launchParams.blueprintData.extraRunlist));
                                if (launchParams.blueprintData.extraRunlist) {
                                    runlist = launchParams.blueprintData.extraRunlist.concat(instance.runlist);
                                }

                                logger.debug("runlist: ", JSON.stringify(runlist));
                                launchParams.infraManager.bootstrapInstance({
                                    instanceIp: instance.instanceIP,
                                    instancePassword: decryptedCredential.password,
                                    runlist: runlist,
                                    instanceUsername: instance.credentials.username,
                                    nodeName: instance.chef.chefNodeName,
                                    environment: launchParams.envName,
                                    instanceOS: instance.hardware.os,
                                    jsonAttributes: jsonAttributes
                                }, function(err, code) {

                                    logger.error('process stopped ==> ', err, code);
                                    if (err) {
                                        logger.error("knife launch err ==>", err);
                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {

                                        });
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logsReferenceIds,
                                            err: true,
                                            log: "Bootstrap failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Bootstrap failed",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });

                                    } else {
                                        if (code == 0) {
                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance bootstarp status. code 0", err);
                                                } else {
                                                    logger.debug("Instance bootstrap status set to success");
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

                                            instanceLog.logs = {
                                                err: false,
                                                log: "Instance Bootstraped successfully",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLog.actionStatus = "success";
                                            instanceLog.endedOn = new Date().getTime();
                                            instancesDao.getInstancesByARMId(instanceData.armId,function(err,armInstanceList){
                                                if(err){
                                                    logger.error("Error in getting ARM Instances ",err);
                                                }else if(armInstanceList.length > 0){
                                                    var resourceObj = {
                                                        stackStatus:"COMPLETED",
                                                        resources :[]
                                                    }
                                                    armInstanceList.forEach(function(armData){
                                                        resourceObj.resources.push({
                                                            id:armData._id,
                                                            type:"instance"
                                                        })
                                                    });
                                                    resourceMapService.updateResourceMap(launchParams.stackName, resourceObj, function (err, resourceMap) {
                                                        if (err) {
                                                            logger.error("Error in updating Resource Map.", err);
                                                        }
                                                    });
                                                }else{
                                                    logger.debug("There is no instance attached with armId:",instanceData.armId);
                                                }
                                            })
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
                                                instanceLog.platform=nodeData.automatic.platform;
                                                instanceLog.os=instance.hardware.os;
                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                    if (err) {
                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                    }
                                                });
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
                                                            return;
                                                        }
                                                        logger.debug('Docker Check Returned:' + retCode);
                                                        if (retCode == '0') {
                                                            instancesDao.updateInstanceDockerStatus(instance.id, "success", '', function(data) {
                                                                logger.debug('Instance Docker Status set to Success');
                                                            });
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
                                            instanceLog.logs = {
                                                err: true,
                                                log: "Bootstrap Failed",
                                                timestamp: new Date().getTime()
                                            };
                                            instanceLog.actionStatus = "failed";
                                            instanceLog.endedOn = new Date().getTime();
                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function(err, logData) {
                                                if (err) {
                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                }
                                            });
                                        }
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
                    });
                });
            }
            function getVMIPAddress(networksInterfaces, count, callback) {
                var networkId = networksInterfaces[count].id;
                arm.getNetworkInterface({
                    id: networkId
                }, function(err, networkResourceData) {
                    count++;
                    if (err) {
                        logger.error("Unable to fetch azure vm network interface");
                        callback(err, null);
                        return;
                    }
                    if (networkResourceData.properties.ipConfigurations) {
                        var ipConfigurations = networkResourceData.properties.ipConfigurations;
                        var ipAddressIdFound = false
                        for (var k = 0; k < ipConfigurations.length; k++) {
                            if (ipConfigurations[k].properties && ipConfigurations[k].properties.publicIPAddress) {
                                ipAddressIdFound = true;
                                var ipAddressId = ipConfigurations[k].properties.publicIPAddress.id;
                                arm.getPublicIpAddress({
                                    id: ipAddressId
                                }, function(err, publicIPAddressResource) {
                                    if (err) {
                                        logger.error("Unable to fetch azure vm ipaddress");
                                        callback(err, null);
                                        return;
                                    }
                                    callback(null, {
                                        ip: publicIPAddressResource.properties.ipAddress
                                    });
                                    return;
                                });
                            }
                        }
                        if (!ipAddressIdFound) {
                            if (networksInterfaces.length === count) {
                                callback(null, null);
                            } else {
                                getVMIPAddress(networksInterfaces, count, callback);
                            }
                        }
                    } else {
                        if (networksInterfaces.length === count) {
                            callback(null, null);
                        } else {
                            getVMIPAddress(networksInterfaces, count, callback);
                        }
                    }
                });
            }
            function processVM(vmResource, armId) {
                var vmName = vmResource.resourceName;
                var dependsOn = vmResource.dependsOn;
                var ipFound = false;
                arm.getDeploymentVMData({
                    name: vmName,
                    resourceGroup: self.resourceGroup
                }, function(err, vmData) {
                    if (err) {
                        logger.error("Unable to fetch azure vm data");
                        resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                            if(err){
                                logger.error("Error in updating Resource Map.",err);
                            }
                        });
                        return;
                    }
                    var networkInterfaces = vmData.properties.networkProfile.networkInterfaces;
                    getVMIPAddress(networkInterfaces, 0, function(err, ipAddress) {
                        if (err) {
                            logger.error("Unable to fetch azure vm ipaddress");
                            resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                if(err){
                                    logger.error("Error in updating Resource Map.",err);
                                }
                            });
                            return;
                        }
                        var osType = 'linux';
                        if (vmData.properties.storageProfile && vmData.properties.storageProfile.osDisk && vmData.properties.storageProfile.osDisk) {
                            if (vmData.properties.storageProfile.osDisk.osType) {
                                if (vmData.properties.storageProfile.osDisk.osType === 'Linux') {
                                    osType = 'linux';
                                } else {
                                    osType = "windows";
                                }
                            }
                        }
                        var username = vmData.properties.osProfile.adminUsername;
                        var password;
                        var runlist = [];
                        var instances = self.instances;

                        if (instances) {
                            password = instances[vmName].password;
                            runlist = instances[vmName].runlist;
                        }
                        addAndBootstrapInstance({
                            name: vmName,
                            username: username,
                            password: password,
                            runlist: runlist,
                            ip: ipAddress.ip,
                            os: osType,
                            armId: armId
                        });
                    });
                });
            }
            arm.deployTemplate({
                name: launchParams.stackName,
                parameters: JSON.parse(JSON.stringify(self.parameters)),
                template: fileData,
                resourceGroup: self.resourceGroup
            }, function(err, stackData) {
                if (err) {
                    logger.error("Unable to launch CloudFormation Stack", err);
                    callback(err,null);
                    return;
                }
                arm.getDeployedTemplate({
                    name: launchParams.stackName,
                    resourceGroup: self.resourceGroup
                }, function(err, deployedTemplateData) {
                    if (err) {
                        logger.error("Unable to get arm deployed template", err);
                        callback(err,null);
                        return;
                    }
                    AzureARM.createNew({
                        orgId: launchParams.orgId,
                        bgId: launchParams.bgId,
                        projectId: launchParams.projectId,
                        envId: launchParams.envId,
                        parameters: self.parameters,
                        templateFile: self.templateFile,
                        cloudProviderId: self.cloudProviderId,
                        infraManagerId: self.infraManagerId,
                        //runlist: version.runlist,
                        infraManagerType: 'chef',
                        deploymentName: launchParams.stackName,
                        deploymentId: deployedTemplateData.id,
                        status: deployedTemplateData.properties.provisioningState,
                        users: launchParams.users,
                        resourceGroup: self.resourceGroup,

                    }, function(err, azureArmDeployement) {
                        if (err) {
                            logger.error("Unable to save arm data in DB", err);
                            callback({
                                message: "unable to save arm in db"
                            },null);
                            return;
                        }
                        callback(null, {
                            armId: azureArmDeployement._id
                        });
                        var resourceMapObj = {
                            stackName: launchParams.stackName,
                            stackType: "AzureArm",
                            stackStatus: "CREATED",
                            resources: []
                        }
                        resourceMapService.createNewResourceMap(resourceMapObj, function (err, resourceMapData) {
                            if (err) {
                                logger.error("resourceMapService.createNewResourceMap is Failed ==>", err);
                            }
                            arm.waitForDeploymentCompleteStatus({
                                name: launchParams.stackName,
                                resourceGroup: self.resourceGroup
                            }, function (err, deployedTemplateData) {
                                if (err) {
                                    logger.error('Unable to wait for deployed template status', err);
                                    if (err.status) {
                                        azureArmDeployement.status = err.status;
                                        azureArmDeployement.save();
                                    }
                                    resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                        if(err){
                                            logger.error("Error in updating Resource Map.",err);
                                        }
                                    });
                                    return;
                                }
                                azureArmDeployement.status = deployedTemplateData.properties.provisioningState;
                                azureArmDeployement.save();
                                var dependencies = deployedTemplateData.properties.dependencies;
                                for (var i = 0; i < dependencies.length; i++) {
                                    var resource = dependencies[i];
                                    if (resource.resourceType == 'Microsoft.Compute/virtualMachines') {
                                        logger.debug('resource name ==>', resource.resourceName);
                                        processVM(resource, azureArmDeployement.id);
                                    }
                                }
                            });
                        });
                    });
                });
            });
        });
    });
};

ARMTemplateBlueprintSchema.methods.update = function(updateData) {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // infraManagerConfig.update(updateData);
    // this.infraManagerData = infraManagerConfig;

};


ARMTemplateBlueprintSchema.methods.getVersionData = function(ver) {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // return infraManagerConfig.getVersionData(ver);
    return null;
};



ARMTemplateBlueprintSchema.methods.getLatestVersion = function() {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // return infraManagerConfig.getLatestVersion();
    return null;
};



ARMTemplateBlueprintSchema.methods.getCloudProviderData = function() {
    return {
        cloudProviderId: this.cloudProviderId
    };

}

ARMTemplateBlueprintSchema.methods.getInfraManagerData = function() {
    return {
        infraMangerType: this.infraManagerType,
        infraManagerId: this.infraManagerId
            //   infraManagerData: this.infraManagerData
    };
};


// static methods
ARMTemplateBlueprintSchema.statics.createNew = function(data) {


    var infraManagerBlueprint;
    var infraManagerType;
    if (data.infraManagerType === INFRA_MANAGER_TYPE.CHEF) {
        infraManagerType = INFRA_MANAGER_TYPE.CHEF;
        // infraManagerBlueprint = CHEFInfraBlueprint.createNew({
        //     runlist: data.runlist
        // });

    } else if (data.infraManagerType === INFRA_MANAGER_TYPE.PUPPET) {
        infraManagerType = INFRA_MANAGER_TYPE.PUPPET;
        return null;
    }
    var parameters = {};

    if (data.stackParameters) {
        for (var i = 0; i < data.stackParameters.length; i++) {

            parameters[data.stackParameters[i].ParameterKey] = {};

            var value = data.stackParameters[i].ParameterValue;
            if (data.stackParameters[i].type === 'int') {
                value = parseFloat(data.stackParameters[i].ParameterValue);
            }
            parameters[data.stackParameters[i].ParameterKey].value = value;
        }

    }

    var self = this;
    var cftBlueprint = new self({
        cloudProviderId: data.cloudProviderId,
        infraMangerType: infraManagerType,
        infraManagerId: data.infraManagerId,
        /*infraManagerData: infraManagerBlueprint,*/
        parameters: parameters,
        //stackName: data.stackName,
        templateFile: data.templateFile,
        resourceGroup: data.resourceGroup,
        instances: data.instances
            // instanceUsername: data.instanceUsername
    });


    return cftBlueprint;
};



var ARMTemplateBlueprint = mongoose.model('ARMTemplateBlueprint', ARMTemplateBlueprintSchema);

module.exports = ARMTemplateBlueprint;
