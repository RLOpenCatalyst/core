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

var EC2 = require('_pr/lib/ec2.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var CloudFormation = require('_pr/model/cloud-formation');
var AWSCloudFormation = require('_pr/lib/awsCloudFormation.js');
var AwsAutoScaleInstance = require('_pr/model/aws-auto-scale-instance');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var auditTrailService = require('_pr/services/auditTrailService');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var noticeService = require('_pr/services/noticeService.js');
var resourceMapService = require('_pr/services/resourceMapService.js');


var CHEFInfraBlueprint = require('./chef-infra-manager/chef-infra-manager');

var Schema = mongoose.Schema;

var INFRA_MANAGER_TYPE = {
    CHEF: 'chef',
    PUPPET: 'puppet'
};


var CloudFormationBlueprintSchema = new Schema({
    cloudProviderId: String,
    cloudProviderType: {
        type: String,
        "default": 'aws'
    },
    infraMangerType: String,
    infraManagerId: String,
    templateFile: String,
    stackParameters: [{
        _id: false,
        ParameterKey: {
            type: String,
            trim: true
        },
        ParameterValue: {
            type: String,
            trim: true
        }
    }],
    instances: [{
        _id: false,
        logicalId: String,
        username: String,
        runlist: [String]
    }],
    templateFile: String,
    region: String,
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

// TODO Reduce function size and reduce callbacks
CloudFormationBlueprintSchema.methods.launch = function (launchParams, callback) {
    var self = this;
    var nodeIdWithActionLogId = [];

    AWSProvider.getAWSProviderById(self.cloudProviderId, function (err, aProvider) {
        if (err) {
            logger.error("Unable to fetch provide", err);
            callback({
                message: "Unable to fetch provider"
            });
            return;
        }

        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var awsSettings;
        if (aProvider.isDefault) {
            awsSettings = {
                "isDefault": true,
                "region": self.region
            };
        } else {

            var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
            var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

            awsSettings = {
                "access_key": decryptedAccessKey,
                "secret_key": decryptedSecretKey,
                "region": self.region
            };
        }

        var templateFile = self.templateFile;
        var settings = appConfig.chef;
        var chefRepoPath = settings.chefReposLocation;
        fileIo.readFile(chefRepoPath + 'catalyst_files/' + templateFile, function (err, fileData) {
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

            var awsCF = new AWSCloudFormation(awsSettings);
            awsCF.createStack({
                name: launchParams.stackName,
                templateParameters: JSON.parse(JSON.stringify(self.stackParameters)),
                templateBody: fileData
            }, function (err, stackData) {
                if (err) {
                    logger.error("Unable to launch CloudFormation Stack", err);
                    callback({
                        message: "Unable to launch CloudFormation Stack"
                    });
                    return;
                }
                awsCF.getStack(stackData.StackId, function (err, stack) {
                    if (err) {
                        logger.error("Unable to get stack details", err);
                        callback({
                            "message": "Error occured while fetching stack status"
                        });
                        return;
                    }

                    if (stack) {
                        // getting autoscale topic arn from templateJSON
                        var topicARN = null;
                        var autoScaleUsername = null;
                        var autoScaleRunlist;
                        var templateObj = JSON.parse(fileData);
                        var templateResources = templateObj.Resources;
                        var templateResourcesKeys = Object.keys(templateResources);
                        for (var j = 0; j < templateResourcesKeys.length; j++) {
                            var resource = templateResources[templateResourcesKeys[j]];

                            if (resource && resource.Type === 'AWS::AutoScaling::AutoScalingGroup') {
                                var autoScaleProperties = resource.Properties;
                                if (autoScaleProperties && autoScaleProperties.NotificationConfigurations && autoScaleProperties.NotificationConfigurations.length) {
                                    for (var i = 0; i < autoScaleProperties.NotificationConfigurations.length; i++) {
                                        if (autoScaleProperties.NotificationConfigurations[i].TopicARN) {
                                            topicARN = autoScaleProperties.NotificationConfigurations[i].TopicARN;
                                            // getting auto scale instance username
                                            for (var count = 0; count < self.instances.length; count++) {
                                                if ('AutoScaleInstanceResource' === self.instances[count].logicalId) {
                                                    autoScaleUsername = self.instances[count].username;
                                                    autoScaleRunlist = self.instances[count].runlist;
                                                    break;
                                                }
                                            }

                                            break;
                                        }
                                    }
                                }
                            }
                        }


                        CloudFormation.createNew({
                            orgId: launchParams.orgId,
                            bgId: launchParams.bgId,
                            projectId: launchParams.projectId,
                            envId: launchParams.envId,
                            stackParameters: self.stackParameters,
                            templateFile: self.templateFile,
                            cloudProviderId: self.cloudProviderId,
                            infraManagerId: self.infraManagerId,
                            //runlist: version.runlist,
                            infraManagerType: self.infraMangerType,
                            stackName: launchParams.stackName,
                            stackId: stackData.StackId,
                            status: stack.StackStatus,
                            users: launchParams.users,
                            region: self.region,
                            instanceUsername: self.instanceUsername,
                            autoScaleTopicArn: topicARN,
                            autoScaleUsername: autoScaleUsername,
                            autoScaleRunlist: autoScaleRunlist


                        }, function (err, cloudFormation) {
                            if (err) {
                                logger.error("Unable to save CloudFormation data in DB", err);
                                callback(err, null);
                                return;
                            }
                            callback(null, {
                                stackId: cloudFormation._id,
                            });
                            var resourceMapObj = {
                                stackName: launchParams.stackName,
                                stackType: "CloudFormation",
                                stackStatus: "CREATED",
                                resources: []
                            }
                            resourceMapService.createNewResourceMap(resourceMapObj, function (err, resourceMapData) {
                                if (err) {
                                    logger.error("resourceMapService.createNewResourceMap is Failed ==>", err);
                                }
                                callback(null, {
                                    stackId: cloudFormation._id,
                                });
                                awsCF.waitForStackCompleteStatus(stackData.StackId, function (err, completeStack) {
                                    if (err) {
                                        logger.error('Unable to wait for stack status', err);
                                        if (err.stackStatus) {
                                            cloudFormation.status = err.stackStatus;
                                            cloudFormation.save();
                                        }
                                        resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                            if(err){
                                                logger.error("Error in updating Resource Map.",err);
                                            }
                                        });
                                        return;
                                    }
                                    cloudFormation.status = completeStack.StackStatus;
                                    cloudFormation.save();

                                    awsCF.listAllStackResources(stackData.StackId, function (err, resources) {
                                        if (err) {
                                            logger.error('Unable to fetch stack resources', err);
                                            resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                                if(err){
                                                    logger.error("Error in updating Resource Map.",err);
                                                }
                                            });
                                            return;
                                        }
                                        var keyPairName;
                                        var parameters = cloudFormation.stackParameters;
                                        for (var i = 0; i < parameters.length; i++) {
                                            if (parameters[i].ParameterKey === 'KeyName') {
                                                keyPairName = parameters[i].ParameterValue;
                                                break;
                                            }
                                        }
                                        var ec2 = new EC2(awsSettings);
                                        var ec2Resources = {};
                                        var autoScaleResourceIds = [];
                                        var autoScaleResourceId = 'temp-Id';
                                        for (var i = 0; i < resources.length; i++) {
                                            if (resources[i].ResourceType === 'AWS::EC2::Instance') {
                                                //instanceIds.push(resources[i].PhysicalResourceId);
                                                ec2Resources[resources[i].PhysicalResourceId] = resources[i].LogicalResourceId;
                                            } else if (resources[i].ResourceType === 'AWS::AutoScaling::AutoScalingGroup') {
                                                autoScaleResourceId = resources[i].PhysicalResourceId;
                                                autoScaleResourceIds.push(resources[i].PhysicalResourceId);
                                            }
                                        }
                                        if (autoScaleResourceIds.length) {
                                            cloudFormation.autoScaleResourceIds = autoScaleResourceIds;
                                            cloudFormation.save();
                                        }

                                        // fetching autoscale resouce if any
                                        AwsAutoScaleInstance.findByAutoScaleResourceId(autoScaleResourceId, function (err, autoScaleInstances) {
                                            if (err) {
                                                logger.error('Unable to fetch autoscale instance resources', err);
                                                resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                                    if(err){
                                                        logger.error("Error in updating Resource Map.",err);
                                                    }
                                                });
                                                return;
                                            }
                                            for (var i = 0; i < autoScaleInstances.length; i++) {
                                                //instanceIds.push(autoScaleInstances[0].awsInstanceId);
                                                ec2Resources[autoScaleInstances[i].awsInstanceId] = 'autoScaleAwsInstance';
                                            }
                                            var instanceIds = Object.keys(ec2Resources);

                                            if (instanceIds.length) {
                                                var instances = [];
                                                var resourceObj = {
                                                    stackStatus:"COMPLETED",
                                                    resources:[]
                                                }
                                                ec2.describeInstances(instanceIds, function (err, awsRes) {
                                                    if (err) {
                                                        logger.error("Unable to get instance details from aws", err);
                                                        resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                                            if(err){
                                                                logger.error("Error in updating Resource Map.",err);
                                                            }
                                                        });
                                                        return;
                                                    }
                                                    if (!(awsRes.Reservations && awsRes.Reservations.length)) {
                                                        return;
                                                    }
                                                    var reservations = awsRes.Reservations;
                                                    for (var k = 0; k < reservations.length; k++) {

                                                        if (reservations[k].Instances && reservations[k].Instances.length) {
                                                            //instances = reservations[k].Instances;
                                                            instances = instances.concat(reservations[k].Instances);
                                                        }


                                                    }
                                                    logger.debug('Instances length ==>', instances.length, instanceIds);
                                                    //creating jsonAttributesObj ??? WHY
                                                    var jsonAttributesObj = {
                                                        instances: {}
                                                    };

                                                    for (var i = 0; i < instances.length; i++) {
                                                        jsonAttributesObj.instances[ec2Resources[instances[i].InstanceId]] = instances[i].PublicIpAddress;
                                                    }
                                                    for (var i = 0; i < instances.length; i++) {
                                                        addAndBootstrapInstance(instances[i], jsonAttributesObj);
                                                    }

                                                });

                                                function addAndBootstrapInstance(instanceData, jsonAttributesObj) {

                                                    var keyPairName = instanceData.KeyName;
                                                    AWSKeyPair.getAWSKeyPairByProviderIdAndKeyPairName(cloudFormation.cloudProviderId, keyPairName, function (err, keyPairs) {
                                                        if (err) {
                                                            logger.error("Unable to get keypairs", err);
                                                            resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                                                if(err){
                                                                    logger.error("Error in updating Resource Map.",err);
                                                                }
                                                            });
                                                            return;
                                                        }
                                                        if (keyPairs && keyPairs.length) {
                                                            var keyPair = keyPairs[0];
                                                            var encryptedPemFileLocation = appConfig.instancePemFilesDir + keyPair._id;

                                                            if (!launchParams.appUrls) {
                                                                launchParams.appUrls = [];
                                                            }
                                                            var appUrls = launchParams.appUrls;
                                                            if (appConfig.appUrls && appConfig.appUrls.length) {
                                                                appUrls = appUrls.concat(appConfig.appUrls);
                                                            }
                                                            var os = instanceData.Platform;
                                                            if (os) {
                                                                os = 'windows';
                                                            } else {
                                                                os = 'linux';
                                                            }


                                                            var instanceName;

                                                            var runlist = [];
                                                            var instanceUsername;
                                                            var logicalId = ec2Resources[instanceData.InstanceId];

                                                            if (logicalId === 'autoScaleAwsInstance') {
                                                                runlist = cloudFormation.autoScaleRunlist || [];
                                                                instanceUsername = cloudFormation.autoScaleUsername || 'ubuntu';
                                                                instanceName = cloudFormation.stackName + '-AutoScale';

                                                            } else {
                                                                for (var count = 0; count < self.instances.length; count++) {
                                                                    if (logicalId === self.instances[count].logicalId) {
                                                                        instanceUsername = self.instances[count].username;
                                                                        runlist = self.instances[count].runlist;
                                                                        break;
                                                                    }
                                                                }
                                                                instanceName = launchParams.blueprintName;
                                                            }

                                                            if (instanceData.Tags && instanceData.Tags.length) {
                                                                for (var j = 0; j < instanceData.Tags.length; j++) {
                                                                    if (instanceData.Tags[j].Key === 'Name') {
                                                                        instanceName = instanceData.Tags[j].Value;
                                                                    }

                                                                }
                                                            }

                                                            if (!instanceUsername) {
                                                                instanceUsername = 'ubuntu'; // hack for default username
                                                            }
                                                            var instanceSize;
                                                            for (var i = 0; i < self.stackParameters.length; i++) {
                                                                if (self.stackParameters[i].ParameterKey == "InstanceType") {
                                                                    instanceSize = self.stackParameters[i].ParameterValue;
                                                                }
                                                            }

                                                            logger.debug("instanceSize: ", instanceSize);

                                                            var instance = {
                                                                name: instanceName,
                                                                orgId: launchParams.orgId,
                                                                orgName: launchParams.orgName,
                                                                bgId: launchParams.bgId,
                                                                bgName: launchParams.bgName,
                                                                projectId: launchParams.projectId,
                                                                projectName: launchParams.projectName,
                                                                envId: launchParams.envId,
                                                                environmentName: launchParams.envName,
                                                                providerId: cloudFormation.cloudProviderId,
                                                                providerType: self.cloudProviderType || 'aws',
                                                                keyPairId: keyPair._id,
                                                                region: self.region,
                                                                chefNodeName: instanceData.InstanceId,
                                                                runlist: runlist,
                                                                platformId: instanceData.InstanceId,
                                                                appUrls: appUrls,
                                                                instanceIP: instanceData.PublicIpAddress || instanceData.PrivateIpAddress,
                                                                instanceState: instanceData.State.Name,
                                                                bootStrapStatus: 'waiting',
                                                                users: launchParams.users,
                                                                instanceType: instanceSize,
                                                                catUser: launchParams.sessionUser,
                                                                monitor: launchParams.monitor,
                                                                hardware: {
                                                                    platform: 'unknown',
                                                                    platformVersion: 'unknown',
                                                                    architecture: 'unknown',
                                                                    memory: {
                                                                        total: 'unknown',
                                                                        free: 'unknown',
                                                                    },
                                                                    os: os
                                                                },
                                                                credentials: {
                                                                    username: instanceUsername,
                                                                    pemFileLocation: encryptedPemFileLocation,
                                                                },
                                                                chef: {
                                                                    serverId: self.infraManagerId,
                                                                    chefNodeName: instanceData.InstanceId
                                                                },
                                                                blueprintData: {
                                                                    blueprintId: launchParams.blueprintData._id,
                                                                    blueprintName: launchParams.blueprintData.name,
                                                                    templateId: launchParams.blueprintData.templateId,
                                                                    templateType: launchParams.blueprintData.templateType,
                                                                    templateComponents: launchParams.blueprintData.templateComponents,
                                                                    iconPath: launchParams.blueprintData.iconpath
                                                                },
                                                                cloudFormationId: cloudFormation._id
                                                            };
                                                            var botLogFile = appConfig.botLogDir + launchParams.actionLogId;
                                                            var fileName = 'BB_Execution.log';
                                                            var winston = require('winston');
                                                            var path = require('path');
                                                            var mkdirp = require('mkdirp');
                                                            var log_folder = path.normalize(botLogFile);
                                                            mkdirp.sync(log_folder);
                                                            var cftLogger = new winston.Logger({
                                                                transports: [
                                                                    new winston.transports.DailyRotateFile({
                                                                        level: 'debug',
                                                                        datePattern: '',
                                                                        filename: fileName,
                                                                        dirname: log_folder,
                                                                        handleExceptions: true,
                                                                        json: true,
                                                                        maxsize: 5242880,
                                                                        maxFiles: 5,
                                                                        colorize: true,
                                                                        timestamp: false,
                                                                        name: 'bb-execution-log'
                                                                    }),
                                                                    new winston.transports.Console({
                                                                        level: 'debug',
                                                                        handleExceptions: true,
                                                                        json: false,
                                                                        colorize: true,
                                                                        name: 'bot-console'
                                                                    })
                                                                ],
                                                                exitOnError: false
                                                            });
                                                            cftLogger.debug('Creating instance in catalyst');
                                                            logger.debug('Creating instance in catalyst');
                                                            instancesDao.createInstance(instance, function (err, data) {
                                                                if (err) {
                                                                    logger.error("Failed to create Instance", err);
                                                                    resourceMapService.updateResourceMap(launchParams.stackName,{stackStatus:"ERROR"},function(err,resourceMap){
                                                                        if(err){
                                                                            logger.error("Error in updating Resource Map.",err);
                                                                        }
                                                                    });
                                                                    return;
                                                                }
                                                                resourceObj.resources.push({
                                                                    id:data._id,
                                                                    type:"instance"
                                                                });
                                                                if(resourceObj.resources.length  === instances.length) {
                                                                    resourceMapService.updateResourceMap(launchParams.stackName, resourceObj, function (err, resourceMap) {
                                                                        if (err) {
                                                                            logger.error("Error in updating Resource Map.", err);
                                                                        }
                                                                    });
                                                                }
                                                                instance.id = data._id;
                                                                var timestampStarted = new Date().getTime();
                                                                var actionLog = instancesDao.insertBootstrapActionLog(instance.id, instance.runlist, launchParams.sessionUser, timestampStarted);
                                                                var logsReferenceIds = [instance.id, actionLog._id, launchParams.actionLogId];
                                                                logsDao.insertLog({
                                                                    referenceId: logsReferenceIds,
                                                                    err: false,
                                                                    log: "Waiting for instance ok state",
                                                                    timestamp: timestampStarted
                                                                });
                                                                cftLogger.debug('Waiting for instance ok state');
                                                                nodeIdWithActionLogId.push({
                                                                    nodeId: instance.id,
                                                                    actionLogId: actionLog._id
                                                                });

                                                                if (launchParams.auditTrailId !== null) {
                                                                    var resultTaskExecution = {
                                                                        "actionLogId": launchParams.actionLogId,
                                                                        "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                        "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                        "masterDetails.orgName": launchParams.orgName,
                                                                        "masterDetails.bgName": launchParams.bgName,
                                                                        "masterDetails.projectName": launchParams.projectName,
                                                                        "masterDetails.envName": launchParams.envName
                                                                    }
                                                                    auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
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
                                                                    status: instanceData.State.Name,
                                                                    actionStatus: "waiting",
                                                                    platformId: instanceData.InstanceId,
                                                                    blueprintName: launchParams.blueprintData.name,
                                                                    data: runlist,
                                                                    platform: "unknown",
                                                                    os: self.instanceOS,
                                                                    size: instanceSize,
                                                                    user: launchParams.sessionUser,
                                                                    startedOn: new Date().getTime(),
                                                                    createdOn: new Date().getTime(),
                                                                    providerType: self.cloudProviderType || 'aws',
                                                                    action: "CFT Launch",
                                                                    logs: [{
                                                                        err: false,
                                                                        log: "Waiting for instance ok state",
                                                                        timestamp: new Date().getTime()
                                                                    }]
                                                                };

                                                                instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                    if (err) {
                                                                        logger.error("Failed to create or update instanceLog: ", err);
                                                                    }
                                                                });
                                                                ec2.waitForEvent(instanceData.InstanceId, 'instanceStatusOk', function (err) {
                                                                    if (err) {
                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {

                                                                        });
                                                                        var timestampEnded = new Date().getTime();
                                                                        logsDao.insertLog({
                                                                            referenceId: logsReferenceIds,
                                                                            err: true,
                                                                            log: "Bootstrap failed",
                                                                            timestamp: timestampEnded
                                                                        });
                                                                        noticeService.notice(launchParams.sessionUser, {
                                                                            title: "Blueprint BOTs Execution",
                                                                            body: "Bootstrap failed"
                                                                        }, "error", function (err, data) {
                                                                            if (err) {
                                                                                logger.error("Error in Notification Service, ", err);
                                                                            }
                                                                        });
                                                                        cftLogger.error("Bootstrap failed");
                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                        instanceLog.actionStatus = "failed";
                                                                        instanceLog.logs = {
                                                                            err: true,
                                                                            log: "Bootstrap failed",
                                                                            timestamp: new Date().getTime()
                                                                        };
                                                                        instanceLog.endedOn = new Date().getTime();
                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                            if (err) {
                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                            }
                                                                        });
                                                                        if (nodeIdWithActionLogId.length === instances.length && launchParams.auditTrailId !== null) {
                                                                            var resultTaskExecution = {
                                                                                "actionLogId": launchParams.actionLogId,
                                                                                "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                                "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                                "masterDetails.orgName": launchParams.orgName,
                                                                                "masterDetails.bgName": launchParams.bgName,
                                                                                "masterDetails.projectName": launchParams.projectName,
                                                                                "masterDetails.envName": launchParams.envName,
                                                                                "actionStatus": "failed",
                                                                                "status": "failed",
                                                                                "endedOn": new Date().getTime()
                                                                            }
                                                                            auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                                if (err) {
                                                                                    logger.error("Failed to create or update bots Log: ", err);
                                                                                }
                                                                            });
                                                                        }
                                                                        return;
                                                                    }

                                                                    //decrypting pem file
                                                                    var cryptoConfig = appConfig.cryptoSettings;
                                                                    var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
                                                                    cryptography.decryptFile(instance.credentials.pemFileLocation, cryptoConfig.decryptionEncoding, tempUncryptedPemFileLoc, cryptoConfig.encryptionEncoding, function (err) {
                                                                        if (err) {
                                                                            instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function (err, updateData) {
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
                                                                            noticeService.notice(launchParams.sessionUser, {
                                                                                title: "Blueprint BOTs Execution",
                                                                                body: "Unable to decrpt pem file. Bootstrap failed"
                                                                            }, "error", function (err, data) {
                                                                                if (err) {
                                                                                    logger.error("Error in Notification Service, ", err);
                                                                                }
                                                                            });
                                                                            cftLogger.error("Unable to decrpt pem file. Bootstrap failed");
                                                                            instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                            instanceLog.actionStatus = "failed";
                                                                            instanceLog.logs = {
                                                                                err: true,
                                                                                log: "Unable to decrpt pem file. Bootstrap failed",
                                                                                timestamp: new Date().getTime()
                                                                            };
                                                                            instanceLog.endedOn = new Date().getTime();
                                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                if (err) {
                                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                                }
                                                                            });
                                                                            if (nodeIdWithActionLogId.length === instances.length && launchParams.auditTrailId !== null) {
                                                                                var resultTaskExecution = {
                                                                                    "actionLogId": launchParams.actionLogId,
                                                                                    "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                                    "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                                    "masterDetails.orgName": launchParams.orgName,
                                                                                    "masterDetails.bgName": launchParams.bgName,
                                                                                    "masterDetails.projectName": launchParams.projectName,
                                                                                    "masterDetails.envName": launchParams.envName,
                                                                                    "actionStatus": "failed",
                                                                                    "status": "failed",
                                                                                    "endedOn": new Date().getTime()
                                                                                }
                                                                                auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                                    if (err) {
                                                                                        logger.error("Failed to create or update bots Log: ", err);
                                                                                    }
                                                                                });
                                                                            }
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
                                                                        launchParams.blueprintData.getCookBookAttributes(instance.instanceIP, repoData, function (err, jsonAttributes) {
                                                                            var runlist = instance.runlist;
                                                                            logger.debug("launchParams.blueprintData.extraRunlist: ", JSON.stringify(launchParams.blueprintData.extraRunlist));
                                                                            if (launchParams.blueprintData.extraRunlist) {
                                                                                runlist = launchParams.blueprintData.extraRunlist.concat(instance.runlist);
                                                                            }

                                                                            var sensuCookBooks = masterUtil.getSensuCookbooks();
                                                                            var sensuCookBook = sensuCookBooks[0];
                                                                            if (runlist.indexOf(sensuCookBook) === -1 && launchParams.monitor && launchParams.monitor.parameters.transportProtocol === 'rabbitmq') {
                                                                                runlist = sensuCookBooks.concat(runlist);
                                                                                jsonAttributes['sensu-client'] = masterUtil.getSensuCookbookAttributes(launchParams.monitor, instance.id);
                                                                            }

                                                                            logger.debug("runlist: ", JSON.stringify(runlist));
                                                                            launchParams.infraManager.bootstrapInstance({
                                                                                instanceIp: instance.instanceIP,
                                                                                pemFilePath: tempUncryptedPemFileLoc,
                                                                                runlist: runlist,
                                                                                instanceUsername: instance.credentials.username,
                                                                                nodeName: instance.chef.chefNodeName,
                                                                                environment: launchParams.envName,
                                                                                instanceOS: instance.hardware.os,
                                                                                //jsonAttributes: jsonAttributesObj // This attribute not using,may use in future
                                                                                jsonAttributes: jsonAttributes
                                                                            }, function (err, code) {

                                                                                fileIo.removeFile(tempUncryptedPemFileLoc, function (err) {
                                                                                    if (err) {
                                                                                        logger.error("Unable to delete temp pem file =>", err);
                                                                                    } else {
                                                                                        logger.debug("temp pem file deleted =>", err);
                                                                                    }
                                                                                });


                                                                                logger.error('process stopped ==> ', err, code);
                                                                                if (err) {
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
                                                                                    cftLogger.error("Bootstrap failed");
                                                                                    instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                                    instanceLog.logs = {
                                                                                        err: true,
                                                                                        log: "Bootstrap failed",
                                                                                        timestamp: new Date().getTime()
                                                                                    };
                                                                                    noticeService.notice(launchParams.sessionUser, {
                                                                                        title: "Blueprint BOTs Execution",
                                                                                        body: "Bootstrap failed"
                                                                                    }, "error", function (err, data) {
                                                                                        if (err) {
                                                                                            logger.error("Error in Notification Service, ", err);
                                                                                        }
                                                                                    });
                                                                                    instanceLog.actionStatus = "failed";
                                                                                    instanceLog.endedOn = new Date().getTime();
                                                                                    instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                        if (err) {
                                                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                                                        }
                                                                                    });
                                                                                    if (nodeIdWithActionLogId.length === instances.length && launchParams.auditTrailId !== null) {
                                                                                        var resultTaskExecution = {
                                                                                            "actionLogId": launchParams.actionLogId,
                                                                                            "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                                            "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                                            "masterDetails.orgName": launchParams.orgName,
                                                                                            "masterDetails.bgName": launchParams.bgName,
                                                                                            "masterDetails.projectName": launchParams.projectName,
                                                                                            "masterDetails.envName": launchParams.envName,
                                                                                            "actionStatus": "failed",
                                                                                            "status": "failed",
                                                                                            "endedOn": new Date().getTime()
                                                                                        }
                                                                                        auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                                            if (err) {
                                                                                                logger.error("Failed to create or update bots Log: ", err);
                                                                                            }
                                                                                        });
                                                                                    }

                                                                                } else {
                                                                                    if (code == 0) {
                                                                                        instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function (err, updateData) {
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
                                                                                        noticeService.notice(launchParams.sessionUser, {
                                                                                            title: "Blueprint BOTs Execution",
                                                                                            body: "Instance " + instanceData.InstanceId + " is launched  on " + launchParams.envName,
                                                                                        }, "success", function (err, data) {
                                                                                            if (err) {
                                                                                                logger.error("Error in Notification Service, ", err);
                                                                                            }
                                                                                        });
                                                                                        cftLogger.debug("Instance Bootstraped successfully");
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: false,
                                                                                            log: "You can access stack using below URL.",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        cftLogger.debug("You can access stack using below URL.");
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: false,
                                                                                            log: 'http://' + launchParams.stackName + '.rlcatalyst.com',
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        cftLogger.debug('http://' + launchParams.stackName + '.rlcatalyst.com');
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
                                                                                        instanceLog.logs = {
                                                                                            err: false,
                                                                                            log: "Instance Bootstraped successfully",
                                                                                            timestamp: new Date().getTime()
                                                                                        };
                                                                                        instanceLog.actionStatus = "success";
                                                                                        instanceLog.endedOn = new Date().getTime();
                                                                                        if (nodeIdWithActionLogId.length === instances.length && launchParams.auditTrailId !== null) {
                                                                                            var resultTaskExecution = {
                                                                                                "actionLogId": launchParams.actionLogId,
                                                                                                "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                                                "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                                                "masterDetails.orgName": launchParams.orgName,
                                                                                                "masterDetails.bgName": launchParams.bgName,
                                                                                                "masterDetails.projectName": launchParams.projectName,
                                                                                                "masterDetails.envName": launchParams.envName,
                                                                                                "actionStatus": "success",
                                                                                                "status": "success",
                                                                                                "endedOn": new Date().getTime()
                                                                                            }
                                                                                            auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                                                if (err) {
                                                                                                    logger.error("Failed to create or update bots Log: ", err);
                                                                                                }
                                                                                                var botService = require('_pr/services/botsService');
                                                                                                botService.updateSavedTimePerBots(launchParams.botId, launchParams.auditType, function (err, data) {
                                                                                                    if (err) {
                                                                                                        logger.error("Failed to update bots saved Time: ", err);
                                                                                                    }
                                                                                                });
                                                                                            });
                                                                                        }

                                                                                        launchParams.infraManager.getNode(instance.chefNodeName, function (err, nodeData) {
                                                                                            if (err) {
                                                                                                logger.error("Failed chef.getNode", err);
                                                                                                return;
                                                                                            }
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
                                                                                            instanceLog.platform = nodeData.automatic.platform;
                                                                                            instanceLog.os = instance.hardware.os;
                                                                                            instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                                if (err) {
                                                                                                    logger.error("Failed to create or update instanceLog: ", err);
                                                                                                }
                                                                                            });
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
                                                                                        var timestampEnded = new Date().getTime();
                                                                                        logsDao.insertLog({
                                                                                            referenceId: logsReferenceIds,
                                                                                            err: false,
                                                                                            log: "Bootstrap Failed",
                                                                                            timestamp: timestampEnded
                                                                                        });
                                                                                        cftLogger.error("Bootstrap Failed");
                                                                                        noticeService.notice(launchParams.sessionUser, {
                                                                                            title: "Blueprint BOTs Execution",
                                                                                            body: "Bootstrap failed"
                                                                                        }, "error", function (err, data) {
                                                                                            if (err) {
                                                                                                logger.error("Error in Notification Service, ", err);
                                                                                            }
                                                                                        });
                                                                                        instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
                                                                                        instanceLog.logs = {
                                                                                            err: true,
                                                                                            log: "Bootstrap Failed",
                                                                                            timestamp: new Date().getTime()
                                                                                        };
                                                                                        instanceLog.actionStatus = "failed";
                                                                                        instanceLog.endedOn = new Date().getTime();
                                                                                        if (nodeIdWithActionLogId.length === instances.length && launchParams.auditTrailId !== null) {
                                                                                            var resultTaskExecution = {
                                                                                                "actionLogId": launchParams.actionLogId,
                                                                                                "auditTrailConfig.nodeIdsWithActionLog": nodeIdWithActionLogId,
                                                                                                "auditTrailConfig.nodeIds": [logsReferenceIds[0]],
                                                                                                "masterDetails.orgName": launchParams.orgName,
                                                                                                "masterDetails.bgName": launchParams.bgName,
                                                                                                "masterDetails.projectName": launchParams.projectName,
                                                                                                "masterDetails.envName": launchParams.envName,
                                                                                                "actionStatus": "failed",
                                                                                                "status": "failed",
                                                                                                "endedOn": new Date().getTime()
                                                                                            }
                                                                                            auditTrailService.updateAuditTrail(launchParams.auditType, launchParams.auditTrailId, resultTaskExecution, function (err, auditTrail) {
                                                                                                if (err) {
                                                                                                    logger.error("Failed to create or update bots Log: ", err);
                                                                                                }
                                                                                            });
                                                                                        }
                                                                                        instanceLogModel.createOrUpdate(actionLog._id, instance.id, instanceLog, function (err, logData) {
                                                                                            if (err) {
                                                                                                logger.error("Failed to create or update instanceLog: ", err);
                                                                                            }
                                                                                        });
                                                                                    }
                                                                                }

                                                                            }, function (stdOutData) {

                                                                                logsDao.insertLog({
                                                                                    referenceId: logsReferenceIds,
                                                                                    err: false,
                                                                                    log: stdOutData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                });
                                                                                cftLogger.debug(stdOutData.toString('ascii'));
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

                                                                                //retrying 4 times before giving up.
                                                                                logsDao.insertLog({
                                                                                    referenceId: logsReferenceIds,
                                                                                    err: true,
                                                                                    log: stdErrData.toString('ascii'),
                                                                                    timestamp: new Date().getTime()
                                                                                });
                                                                                cftLogger.error(stdErrData.toString('ascii'));
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
                                                                        });

                                                                    });
                                                                });
                                                            });
                                                        } else {
                                                            logger.error('keypair with name : ' + keyPairName + ' not found');
                                                        }
                                                    });


                                                }

                                            }
                                        });

                                    });

                                });

                            });
                        });

                    } else {
                        callback({
                            "message": "Error occured while fetching stack status"
                        });
                        return;

                    }

                });
            });
        });
    });

};

CloudFormationBlueprintSchema.methods.update = function (updateData) {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // infraManagerConfig.update(updateData);
    // this.infraManagerData = infraManagerConfig;

};


CloudFormationBlueprintSchema.methods.getVersionData = function (ver) {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // return infraManagerConfig.getVersionData(ver);
    return null;
};



CloudFormationBlueprintSchema.methods.getLatestVersion = function () {
    // infraManagerConfig = getInfraManagerConfigType(this);
    // return infraManagerConfig.getLatestVersion();
    return null;
};



CloudFormationBlueprintSchema.methods.getCloudProviderData = function () {
    return {
        cloudProviderId: this.cloudProviderId
    };

}

CloudFormationBlueprintSchema.methods.getInfraManagerData = function () {
    return {
        infraMangerType: this.infraManagerType,
        infraManagerId: this.infraManagerId
        //   infraManagerData: this.infraManagerData
    };
};


// static methods
CloudFormationBlueprintSchema.statics.createNew = function (data) {


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
    var stackParameters = [];
    if (data.stackParameters) {
        for (var i = 0; i < data.stackParameters.length; i++) {
            var parameterObj = {
                ParameterKey: data.stackParameters[i].ParameterKey
            };
            if (data.stackParameters[i].type === 'Number') {
                parameterObj.ParameterValue = parseFloat(data.stackParameters[i].ParameterValue);
            } else {
                parameterObj.ParameterValue = data.stackParameters[i].ParameterValue;
            }
            stackParameters.push(parameterObj);
        }

    }

    var self = this;
    var cftBlueprint = new self({
        cloudProviderId: data.cloudProviderId,
        infraMangerType: infraManagerType,
        infraManagerId: data.infraManagerId,
        /*infraManagerData: infraManagerBlueprint,*/
        stackParameters: stackParameters,
        //stackName: data.stackName,
        templateFile: data.templateFile,
        region: data.region,
        instances: data.instances
        // instanceUsername: data.instanceUsername
    });


    return cftBlueprint;
};

var CloudFormationBlueprint = mongoose.model('CloudFormationBlueprint', CloudFormationBlueprintSchema);

module.exports = CloudFormationBlueprint;
