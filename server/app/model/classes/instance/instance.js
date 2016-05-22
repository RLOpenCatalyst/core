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


var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('./../../dao/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');
var logger = require('_pr/logger')(module);
var ChefClientExecution = require('./chefClientExecution/chefClientExecution');
var textSearch = require('mongoose-text-search');


var Schema = mongoose.Schema;

var ACTION_LOG_TYPES = {

    BOOTSTRAP: {
        type: 1,
        name: 'Bootstrap'
    },
    CHEF_RUN: {
        type: 2,
        name: 'Chef-Client-Run'
    },
    START: {
        type: 3,
        name: 'Start'
    },
    STOP: {
        type: 4,
        name: 'Stop'
    },
    SERVICE: {
        type: 5,
        name: 'Service'
    },
    TASK: {
        type: 6,
        name: 'Orchestration'
    },
    NODE_IMPORT: {
        type: 7,
        name: 'Node-Import'
    },
    SSH: {
        type: 8,
        name: 'SSH-Shell'
    },
    PUPPET_RUN: {
        type: 9,
        name: "puppet-agent-run"
    }
}

var ActionLogSchema = new Schema({
    type: {
        type: Number,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    success: {
        type: Boolean,
        required: true,
        trim: true
    },
    completed: {
        type: Boolean,
        required: true,
        trim: true
    },
    user: {
        type: String,
        required: true,
        trim: true
    },
    timeStarted: {
        type: Number,
        required: true,
        trim: true
    },
    timeEnded: {
        type: Number,
        trim: true
    },
    actionData: Schema.Types.Mixed
});

var ActionLog = mongoose.model('actionLogs', ActionLogSchema);


var InstanceSchema = new Schema({
    name: {
        type: String,
        trim: true
    },
    orgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.orgIdValidator
    },
    orgName: {
        type: String,
        required: false,
        trim: true
    },
    bgId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.bgIdValidator
    },
    projectId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.projIdValidator
    },
    projectName: {
        type: String,
        required: false,
        trim: true
    },
    envId: {
        type: String,
        required: true,
        trim: true,
        validate: schemaValidator.envIdValidator
    },
    environmentName: {
        type: String,
        required: false,
        trim: true
    },
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: String,
    providerData: Schema.Types.Mixed,
    keyPairId: {
        type: String,
        required: false,
        trim: true
    },
    chefNodeName: String,
    runlist: [{
        type: String,
        trim: true
    }],
    attributes: [{
        name: String,
        jsonObj: {}
    }],
    platformId: String,
    instanceIP: {
        type: String,
        index: true,
        trim: true
    },
    appUrls: [{
        name: String,
        url: String
    }],
    instanceState: String,
    bootStrapStatus: String,
    users: [{
        type: String,
        trim: true,
       //required: true,
        validate: schemaValidator.catalystUsernameValidator
    }],
    hardware: {
        platform: String,
        platformVersion: String,
        architecture: String,
        memory: {
            total: String,
            free: String,
        },
        os: String,
    },
    chef: {
        serverId: {
            type: String,
            trim: true
        },
        chefNodeName: String
    },
    puppet: {
        serverId: {
            type: String,
            trim: true
        },
        puppetNodeName: String
    },
    infraManager: {
        serverId: String,
        nodeName: String,
        type: String,
    },
    software: [{
        name: {
            type: String,
            trim: true
        },
        version: {
            type: String,
            trim: true
        }
    }],
    credentials: {
        username: {
            type: String,
            required: true,
            trim: true
        },
        password: String,
        pemFileLocation: String
    },
    blueprintData: {
        blueprintId: String,
        blueprintName: String,
        templateId: String,
        templateType: String,
        templateComponents: [String],
        iconPath: String,
    },
    docker: {
        dockerEngineStatus: String,
        dockerEngineUrl: String
    },
    serviceIds: [{
        type: String,
        trim: true
    }],
    actionLogs: [ActionLogSchema],
    chefClientExecutionIds: [String],
    taskIds: [String],
    tempActionLogId: String,
    cloudFormationId: String,
    armId: String,
    usage: Schema.Types.Mixed,
    cost: Schema.Types.Mixed
});

InstanceSchema.plugin(uniqueValidator);
InstanceSchema.plugin(textSearch);
InstanceSchema.index({
    "$**": "text"
});

var Instances = mongoose.model('instances', InstanceSchema);

var InstancesDao = function() {
	
    this.searchInstances = function(searchquery, options, callback) {
        logger.debug("Enter searchInstances query - (%s)", searchquery);
        Instances.textSearch(searchquery, options, function(err, data) {
            if (!err) {
                var data1 = {
                    "tasks": [],
                    instances: [],
                    queryduration: ''
                }
                for (var i = 0; i < data.results.length; i++) {
                    data1.instances.push(data.results[i].obj);
                }
                data1.queryduration = (data.stats.timeMicros / 100000);
                callback(null, data1);
                return;
            } else {
                logger.debug('Error in search:' + err);
                callback(err, null);
                return;
            }
        });
    };
    this.getInstanceById = function(instanceId, callback) {
        Instances.find({
            "_id": new ObjectId(instanceId)
        }, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceById (%s)", instanceId, err);
                callback(err, null);
                return;
            }
            callback(null, data);

        });
    };

    this.getInstanceByPlatformId = function(platformId, callback) {
        logger.debug("Enter getInstanceByPlatformId (%s)", platformId);

        Instances.find({
            platformId: platformId
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceByPlatformId (%s)", platformId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstanceByPlatformId (%s)", platformId);
            callback(null, data);

        });
    };

    this.getInstanceByProviderId = function(providerId, callback) {
        logger.debug("Enter getInstanceByProviderId (%s)", providerId);

        Instances.find({
            providerId: providerId
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceByProviderId (%s)", providerId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstanceByProviderId (%s)", providerId);
            callback(null, data);

        });
    };

    this.getInstances = function(instanceIds, callback) {
        logger.debug("Enter getInstances :: ", instanceIds);
        var queryObj = {};
        if (instanceIds && instanceIds.length) {
            queryObj._id = {
                $in: instanceIds
            }
        }

        Instances.find(queryObj, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to getInstances :: ", instanceIds, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstances :: ", instanceIds);
            callback(null, data);
        });

    };


    this.getInstancesByProjectAndEnvId = function(projectId, envId, instanceType, userName, callback) {
        logger.debug("Enter getInstancesByProjectAndEnvId(%s, %s, %s, %s)", projectId, envId, instanceType, userName);
        var queryObj = {
            projectId: projectId,
            envId: envId
        }
        if (instanceType) {
            queryObj['blueprintData.templateType'] = instanceType;
        }
        if (userName) {
            queryObj.users = userName;
        }
        Instances.find(queryObj, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to getInstancesByProjectAndEnvId(%s, %s, %s, %s)", projectId, envId, instanceType, userName, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesByProjectAndEnvId(%s, %s, %s, %s)", projectId, envId, instanceType, userName);
            callback(null, data);
        });
    };

    this.getInstancesByOrgProjectAndEnvId = function(orgId, projectId, envId, instanceType, userName, callback) {
        logger.debug("Enter getInstancesByOrgProjectAndEnvId (%s, %s, %s, %s, %s)", orgId, projectId, envId, instanceType, userName);
        var queryObj = {
            orgId: orgId,
            projectId: projectId,
            envId: envId
        }
        if (instanceType) {
            queryObj['blueprintData.templateType'] = instanceType;
        }
        if (userName) {
            queryObj.users = userName;
        }
        Instances.find(queryObj, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to getInstancesByOrgProjectAndEnvId (%s, %s, %s, %s, %s)", orgId, projectId, envId, instanceType, userName, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit getInstancesByOrgProjectAndEnvId (%s, %s, %s, %s, %s)", orgId, projectId, envId, instanceType, userName);
            callback(null, data);
        });
    };

    this.getInstancesByOrgBgProjectAndEnvId = function(orgId, bgId, projectId, envId, instanceType, userName, callback) {
        logger.debug("Enter getInstancesByOrgBgProjectAndEnvId (%s,%s, %s, %s, %s, %s)", orgId, bgId, projectId, envId, instanceType, userName);
        var queryObj = {
            orgId: orgId,
            bgId: bgId,
            projectId: projectId,
            envId: envId
        }
        if (instanceType) {
            queryObj['blueprintData.templateType'] = instanceType;
        }
        Instances.find(queryObj, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to getInstancesByOrgBgProjectAndEnvId (%s,%s, %s, %s, %s, %s)", orgId, bgId, projectId, envId, instanceType, userName, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit getInstancesByOrgBgProjectAndEnvId (%s,%s, %s, %s, %s, %s)", orgId, bgId, projectId, envId, instanceType, userName);
            callback(null, data);
        });
    };

    this.getInstancesByOrgBgProjectAndEnvIdForDocker = function(jsonData, callback) {
        var queryObj = {
            orgId: jsonData.orgId,
            bgId: jsonData.bgId,
            projectId: jsonData.projectId,
            envId: jsonData.envId
        }
        Instances.find(queryObj,function(err, instances) {
            if (err) {
                logger.error("Failed to getInstancesByOrgBgProjectAndEnvIdForDocker", err);
                callback(err, null);
                return;
            }
            callback(null, instances);
        });
    };

    this.getInstancesByOrgEnvIdAndChefNodeName = function(orgId, envId, nodeName, callback) {
        logger.debug("Enter getInstancesByOrgEnvIdAndChefNodeName (%s, %s, %s)", orgId, envId, nodeName);
        var queryObj = {
            orgId: orgId,
            envId: envId
        }
        queryObj['chef.chefNodeName'] = nodeName;
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstancesByOrgEnvIdAndChefNodeName (%s, %s, %s)", orgId, envId, nodeName);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesByOrgEnvIdAndChefNodeName (%s, %s, %s)", orgId, envId, nodeName);
            callback(null, data);
        });
    };

    this.getInstancesByOrgEnvIdAndIp = function(orgId, envId, ip, callback) {
        logger.debug("Enter getInstancesByOrgEnvIdAndIp (%s, %s, %s)", orgId, envId, ip);
        var queryObj = {
            orgId: orgId,
            envId: envId,
            instanceIP: ip
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstancesByOrgEnvIdAndIp (%s, %s, %s)", orgId, envId, ip);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesByOrgEnvIdAndIp (%s, %s, %s)", orgId, envId, ip);
            callback(null, data);
        });
    };

    this.getInstanceByOrgAndNodeNameOrIP = function(orgId, nodeName, ip, callback) {
        logger.debug("Enter getInstanceByOrgAndNodeNameOrIP (%s, %s, %s)", orgId, nodeName, ip);
        var queryObj = {
            orgId: orgId,
            '$or': [{
                instanceIP: ip
            }, {
                'chef.chefNodeName': nodeName
            }, {
                'puppet.puppetNodeName': nodeName
            }],
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstanceByOrgAndNodeNameOrIP (%s, %s, %s)", orgId, nodeName, ip);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstanceByOrgAndNodeNameOrIP (%s, %s, %s)", orgId, nodeName, ip);
            callback(null, data);
        });
    };

    this.getInstanceByProjectId = function(ProjectId, callback) {
        logger.debug("Enter getInstanceByProjectId (%s,)", ProjectId);
        var queryObj = {
            $or: [{
                projectId: ProjectId
            }, {
                'chef.serverId': ProjectId
            }, {
                serviceIds: ProjectId
            }]
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstanceByProjectId (%s)", ProjectId);
                callback(err, null);
                return;
            }
            logger.debug(JSON.stringify(data));
            logger.debug("Exit getInstanceByProjectId (%s)", ProjectId);
            callback(null, data);
        });
    };

    this.getInstancesByCloudformationId = function(cfId, callback) {
        logger.debug("Enter getInstancesByCloudformationId (%s)", cfId);
        var queryObj = {
            cloudFormationId: cfId
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstancesByCloudformationId (%s)", cfId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesByCloudformationId (%s)", cfId);
            callback(null, data);
        });

    };

    this.getInstancesByARMId = function(armId, callback) {
        logger.debug("Enter getInstancesByCloudformationId (%s)", armId);
        var queryObj = {
            armId: armId
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getInstancesByCloudformationId (%s)", armId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesByCloudformationId (%s)", armId);
            callback(null, data);
        });

    };

    this.getAll = function getAll(query, callback) {
        Instances.find(query,
            function(err, instances) {
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, instances);
                }
            }
        );
    };

    this.findByProviderId = function(providerId, callback) {
        var queryObj = {
            providerId: providerId
        }
        Instances.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to findByProviderId (%s)", providerId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit findByProviderId (%s)", providerId);
            callback(null, data);
        });
    };


    this.createInstance = function(instanceData, callback) {
        logger.debug("Enter createInstance");
        var instance = new Instances(instanceData);
        instance.save(function(err, data) {
            if (err) {
                logger.error("CreateInstance Failed", err, instanceData);
                callback(err, null);
                return;
            }
            logger.debug("Exit createInstance : " + JSON.stringify(data));
            callback(null, data);
        });
    };

    this.updateInstanceIp = function(instanceId, ipaddress, callback) {
        logger.debug("Enter updateInstanceIp (%s, %s)", instanceId, ipaddress);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "instanceIP": ipaddress
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceIp (%s, %s)", instanceId, ipaddress, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstanceIp (%s, %s)", instanceId, ipaddress);
            callback(null, data);
        });

    };

    this.addAppUrls = function(instanceId, appUrls, callback) {
        logger.debug(appUrls);
        for (var i = 0; i < appUrls.length; i++) {
            appUrls[i]._id = new ObjectId();
        }
        logger.debug("Enter updateAppUrl2 (%s, %s)", instanceId, appUrls);
        Instances.update({
            "_id": new ObjectId(instanceId)
        }, {
            $push: {
                appUrls: {
                    $each: appUrls
                }
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to addAppUrl (%s, %s,%s)", instanceId, appUrls, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit addAppUrl (%s, %s)", instanceId, appUrls);
            if (updateCount) {
                callback(null, appUrls);
            } else {
                callback(null, null);
            }

        });
    }

    this.addTaskIds = function(instanceId, taskIds, callback) {


        logger.debug("Enter addTaskId (%s, %s)", instanceId, taskIds);
        Instances.update({
            "_id": new ObjectId(instanceId)
        }, {
            $set: {
                taskIds: taskIds
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to addTaskId (%s, %s,%s)", instanceId, taskIds, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit addTaskId (%s, %s)", instanceId, taskIds);
            if (updateCount) {
                callback(null, updateCount);
            } else {
                callback(null, null);
            }

        });
    };

    this.removeTaskId = function(instanceId, callback) {

        logger.debug("Enter removeTaskId (%s)", instanceId);
        Instances.update({
            "_id": new ObjectId(instanceId)
        }, {
            $unset: {
                taskId: ""
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to addAppUrl (%s, %s)", instanceId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit addAppUrl (%s)", instanceId);
            if (updateCount) {
                callback(null, updateCount);
            } else {
                callback(null, null);
            }

        });
    };

    this.removeTaskIdFromAllInstances = function(taskId, callback) {


        logger.debug("Enter removeTaskIdFromAllInstances (%s)", taskId);
        Instances.update({
            taskIds: taskId
        }, {
            $pull: {
                taskIds: taskId
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to removeTaskIdFromAllInstances (%s, %s)", taskId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit addAppUrl (%s)", taskId);
            if (updateCount) {
                callback(null, updateCount);
            } else {
                callback(null, null);
            }

        });
    };

    this.updateAppUrl = function(instanceId, appUrlId, name, url, callback) {
        logger.debug("Enter updateAppUrl2 (%s, %s)", instanceId, url);
        Instances.update({
            "_id": new ObjectId(instanceId),
            "appUrls._id": new ObjectId(appUrlId)
        }, {
            $set: {
                "appUrls.$.url": url,
                "appUrls.$.name": name
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateAppUrl (%s, %s,%s,%s)", instanceId, appUrlId, url, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateAppUrl2 (%s, %s,%s)", instanceId, appUrlId, url);
            callback(null, data);
        });
    };

    this.removeAppUrl = function(instanceId, appUrlId, callback) {
        logger.debug("Enter removeAppUrl (%s, %s)", instanceId, appUrlId);
        Instances.update({
            "_id": new ObjectId(instanceId)
        }, {
            $pull: {
                appUrls: {
                    "_id": new ObjectId(appUrlId),
                }
            }
        }, {
            upsert: false
        }, function(err, count) {
            if (err) {
                logger.error("Failed to removeAppUrl (%s, %s,%s,%s)", instanceId, appUrlId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeAppUrl (%s, %s,%s)", instanceId, appUrlId);
            callback(null, count);
        });
    };

    this.updateInstanceDockerStatus = function(instanceId, dockerstatus, dockerapiurl, callback) {
        logger.debug("Enter updateInstanceDockerStatus(%s, %s, %s)", instanceId, dockerstatus, dockerapiurl);

        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "docker": {
                    dockerEngineStatus: dockerstatus,
                    dockerEngineUrl: dockerapiurl
                }
            }
        }, {
            upsert: false
        }, function(err, data) {

            if (err) {
                logger.error("Failed to updateInstanceDockerStatus(%s, %s, %s) - " + err, instanceId, dockerstatus, dockerapiurl, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit updateInstanceDockerStatus(%s, %s, %s,%s)", instanceId, dockerstatus, dockerapiurl, data);
            callback(null, data);
        });

    };

    this.updateInstanceState = function(instanceId, state, callback) {
        logger.debug("Enter updateInstanceState (%s, %s)", instanceId, state);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "instanceState": state
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceState (%s, %s)", instanceId, state, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit updateInstanceState (%s, %s)", instanceId, state);
            callback(null, data);
        });
    };

    this.updateInstanceBootstrapStatus = function(instanceId, status, callback) {
        logger.debug("Enter updateInstanceBootstrapStatus (%s, %s)", instanceId, status);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "bootStrapStatus": status
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceBootstrapStatus (%s, %s)", instanceId, status, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstanceBootstrapStatus (%s, %s)", instanceId, status);
            callback(null, data);
        });
    };

    this.updateInstancePuppetNodeName = function(instanceId, nodeName, callback) {
        logger.debug("Enter updateInstancePuppetNodeName (%s, %s)", instanceId, nodeName);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "puppet.puppetNodeName": nodeName
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstancePuppetNodeName (%s, %s)", instanceId, nodeName, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstancePuppetNodeName (%s, %s)", instanceId, nodeName);
            callback(null, data);
        });
    };


    this.removeInstancebyId = function(instanceId, callback) {
        logger.debug("Enter removeInstancebyId (%s)", instanceId);
        Instances.remove({
            "_id": ObjectId(instanceId)
        }, function(err, data) {
            if (err) {
                logger.error("Failed to removeInstancebyId (%s)", instanceId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeInstancebyId (%s)", instanceId);
            callback(null, data);
        });
    };

    this.removeInstancebyCloudFormationId = function(cfId, callback) {
        logger.debug("Enter removeInstancebyCloudFormationId (%s)", cfId);
        Instances.remove({
            cloudFormationId: cfId
        }, function(err, data) {
            if (err) {
                logger.error("Failed to removeInstancebyCloudFormationId (%s)", cfId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeInstancebyCloudFormationId (%s)", cfId);
            callback(null, data);
        });
    };

    this.removeInstancebyArmId = function(armId, callback) {
        logger.debug("Enter removeInstancebyArmId (%s)", armId);
        Instances.remove({
            armId: armId
        }, function(err, data) {
            if (err) {
                logger.error("Failed to removeInstancebyArmId (%s)", armId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeInstancebyArmId (%s)", armId);
            callback(null, data);
        });
    };

    this.removeInstancebyCloudFormationIdAndAwsId = function(cfId, awsInstanceId, callback) {
        logger.debug("Enter removeInstancebyCloudFormationId (%s)", cfId);
        Instances.remove({
            cloudFormationId: cfId,
            platformId: awsInstanceId
        }, function(err, data) {
            if (err) {
                logger.error("Failed to removeInstancebyCloudFormationIdAndAwsId (%s)", cfId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit removeInstancebyCloudFormationIdAndAwsId (%s)", cfId);
            callback(null, data);
        });
    };

    this.findInstancebyCloudFormationIdAndAwsId = function(cfId, awsInstanceId, callback) {
        logger.debug("Enter findInstancebyCloudFormationIdAndAwsId (%s)", cfId, awsInstanceId);
        Instances.find({
            cloudFormationId: cfId,
            platformId: awsInstanceId
        }, function(err, data) {
            if (err) {
                logger.error("Failed to findInstancebyCloudFormationIdAndAwsId (%s)", cfId, awsInstanceId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit findInstancebyCloudFormationIdAndAwsId (%s)", cfId, awsInstanceId);
            callback(null, data);
        });
    };


    this.updateInstanceLog = function(instanceId, log, callback) {
        logger.debug("Enter updateInstanceLog ", instanceId, log);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $push: {
                "logs": log
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceLog ", instanceId, log, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstanceLog", instanceId, log);
            callback(null, data);
        });
    };

    this.updateInstancesRunlist = function(instanceId, runlist, callback) {
        logger.debug("Enter updateInstancesRunlist ", instanceId, runlist);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "runlist": runlist
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstancesRunlist ", instanceId, runlist, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstancesRunlist ", instanceId, runlist);
            callback(null, data);
        });

    };
    this.updateInstancesRunlistAndAttributes = function(instanceId, runlist, attributes, callback) {
        if (!(attributes && attributes.length)) {
            attributes = [];
        }
        logger.debug("Enter updateInstancesRunlistAndAttributes ", instanceId, runlist);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "runlist": runlist,
                "attributes": attributes
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstancesRunlistAndAttributes ", instanceId, runlist, attributes, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit updateInstancesRunlistAndAttributes ", instanceId, runlist, attributes);
            callback(null, data);
        });

    };

    this.setHardwareDetails = function(instanceId, hardwareData, callback) {
        logger.debug("Enter setHardwareDetails ", instanceId, hardwareData);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "hardware": {
                    platform: hardwareData.platform,
                    platformVersion: hardwareData.platformVersion,
                    architecture: hardwareData.architecture,
                    memory: {
                        total: hardwareData.memory.total,
                        free: hardwareData.memory.free,
                    },
                    os: hardwareData.os
                }
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to setHardwareDetails ", instanceId, hardwareData, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit setHardwareDetails ", instanceId, hardwareData);
            callback(null, data);
        });

    };

    this.addService = function(instanceId, serviceIds, callback) {
        logger.debug("Enter addService ", instanceId, serviceIds);

        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $push: {
                "serviceIds": {
                    $each: serviceIds
                }
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to addService ", instanceId, serviceIds, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit addService ", instanceId, serviceIds);
            callback(null, updateCount);

        });

    };

    this.deleteService = function(instanceId, serviceId, callback) {
        logger.debug("Enter deleteService ", instanceId, serviceId);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $pull: {
                "serviceIds": serviceId
            }
        }, {
            upsert: false,
            multi: true
        }, function(err, deleteCount) {
            if (err) {
                logger.error("Failed to deleteService ", instanceId, serviceId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit deleteService ", instanceId, serviceId);
            callback(null, deleteCount);

        });

    };

    this.createServiceAction = function(instanceId, serviceId, actionData, callback) {
        logger.debug("Enter createServiceAction", instanceId, serviceId, actionData);
        var serviceAction = new ServiceAction({
            actionType: actionData.actionType,
            serviceRunlist: actionData.runlist,
            command: actionData.command,
        });

        Instances.update({
            "_id": new ObjectId(instanceId),
            "services._id": new ObjectId(serviceId),
        }, {
            $push: {
                "services.$.actions": serviceAction
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                logger.error("Failed to createServiceAction", instanceId, serviceId, actionData, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit createServiceAction", instanceId, serviceId, actionData);
            if (updateCount > 0) {
                callback(null, serviceAction);
            } else {
                callback(null, null);
            }

        });
    };

    this.getServiceAction = function(instanceId, serviceId, actionId, callback) {
        logger.debug("Enter getServiceAction ", instanceId, serviceId, actionId);
        Instances.find({
            "_id": new ObjectId(instanceId),
            "services._id": new ObjectId(serviceId),
        }, {
            "services": {
                "$elemMatch": {
                    "_id": new ObjectId(serviceId),
                    "actions": {
                        "$elemMatch": {
                            "_id": new ObjectId(actionId)
                        }
                    }
                }
            }
        }, function(err, data) {
            if (err) {
                logger.debug("Failed to getServiceAction ", instanceId, serviceId, actionId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getServiceAction ", instanceId, serviceId, actionId);
            callback(null, data);


        });

    };


    //action logs 
    function insertActionLog(instanceId, logData, callback) {
        var actionLog = new ActionLog(logData);
        Instances.update({
            _id: new ObjectId(instanceId)
        }, {
            $push: {
                actionLogs: actionLog
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            if (err) {
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (updateCount > 0) {
                logData._id = actionLog._id;
                if (typeof callback === 'function') {
                    callback(null, logData);
                }

            } else {
                if (typeof callback === 'function') {
                    callback(null, null);
                }

            }
        });
        return actionLog._id;
    }

    this.getAllActionLogs = function(instanceId, callback) {
        logger.debug("Enter getAllActionLogs (%s)", instanceId);
        Instances.find({
            "_id": new ObjectId(instanceId)
        }, function(err, data) {
            if (err) {
                logger.error("Failed getAllActionLogs (%s)", instanceId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getAllActionLogs (%s)", instanceId);
            if (data.length && data[0].actionLogs && data[0].actionLogs.length) {
                callback(null, data[0].actionLogs);
            } else {
                callback(null, []);
            }

        });
    };

    this.getActionLogById = function(instanceId, logId, callback) {
        logger.debug("Enter getActionLogById ", instanceId, logId);
        Instances.find({
            "_id": new ObjectId(instanceId),
            "actionLogs._id": new ObjectId(logId),
        }, {
            "actionLogs": {
                "$elemMatch": {
                    "_id": new ObjectId(logId),
                }
            }
        }, function(err, data) {
            if (err) {
                logger.debug("Failed to getActionLogById ", instanceId, logId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getActionLogById ", instanceId, logId);
            callback(null, data);
        });
    };

    this.updateActionLog = function(instanceId, logId, success, timestampEnded, callback) {
        logger.debug("Enter updateActionLog ", instanceId, logId, success, timestampEnded);
        Instances.update({
            _id: new ObjectId(instanceId),
            'actionLogs._id': new ObjectId(logId)
        }, {
            '$set': {
                'actionLogs.$.success': success,
                'actionLogs.$.completed': true,
                'actionLogs.$.timeEnded': timestampEnded
            }
        }, {
            upsert: false
        }, function(err, updateCount) {
            logger.debug('update ', err, updateCount);
            if (err) {
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (typeof callback === 'function') {
                callback(err, updateCount);
            }
        });
    };


    this.insertStartActionLog = function(instanceId, user, timestampStarted, callback) {
        logger.debug("Enter insertStartActionLog ", instanceId, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.START.type,
            name: ACTION_LOG_TYPES.START.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertStopActionLog = function(instanceId, user, timestampStarted, callback) {
        logger.debug("Enter insertStopActionLog ", instanceId, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.STOP.type,
            name: ACTION_LOG_TYPES.STOP.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertChefClientRunActionLog = function(instanceId, runlist, user, timestampStarted, callback) {
        logger.debug("Enter insertChefClientRunActionLog ", instanceId, runlist, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.CHEF_RUN.type,
            name: ACTION_LOG_TYPES.CHEF_RUN.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
            actionData: {
                runlist: runlist
            }

        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertPuppetClientRunActionLog = function(instanceId, user, timestampStarted, callback) {
        logger.debug("Enter insertPuppetClientRunActionLog ", instanceId, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.PUPPET_RUN.type,
            name: ACTION_LOG_TYPES.PUPPET_RUN.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,

        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertServiceActionLog = function(instanceId, serviceData, user, timestampStarted, callback) {
        logger.debug("Enter insertServiceActionLog ", instanceId, serviceData, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.SERVICE.type,
            name: ACTION_LOG_TYPES.SERVICE.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
            actionData: serviceData

        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertBootstrapActionLog = function(instanceId, runlist, user, timestampStarted, callback) {
        logger.debug("Enter insertBootstrapActionLog ", instanceId, runlist, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.BOOTSTRAP.type,
            name: ACTION_LOG_TYPES.BOOTSTRAP.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
            actionData: {
                runlist: runlist
            }
        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertOrchestrationActionLog = function(instanceId, runlist, user, timestampStarted, callback) {
        logger.debug("Enter insertOrchestrationActionLog ", instanceId, runlist, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.TASK.type,
            name: ACTION_LOG_TYPES.TASK.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
            actionData: {
                runlist: runlist
            }
        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.insertSSHActionLog = function(instanceId, loginName, user, timestampStarted, callback) {
        logger.debug("Enter insertSSHActionLog ", instanceId, user, timestampStarted);
        var log = {
            type: ACTION_LOG_TYPES.SSH.type,
            name: ACTION_LOG_TYPES.SSH.name,
            completed: false,
            success: false,
            user: user,
            timeStarted: timestampStarted,
            actionData: {
                'login-name': loginName
            }
        };
        var logId = insertActionLog(instanceId, log, callback);
        log._id = logId;
        return log;
    };

    this.getInstanceByKeyPairId = function(keyPairId, callback) {
        logger.debug("Enter getInstanceByKeyPairId (%s)", keyPairId);

        Instances.find({
            "keyPairId": keyPairId
        }, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceByKeyPairId (%s)", keyPairId, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstanceByKeyPairId (%s)", keyPairId);
            if (data) {
                callback(null, data);
            } else {
                callback(null, null);
            }
        });
    };

    this.getInstancesFilterByChefServerIdAndNodeNames = function(chefServerId, nodeNames, callback) {
        if (!nodeNames) {
            nodeNames = [];
        }
        logger.debug('serverId -->', chefServerId);
        Instances.find({
            "chef.serverId": chefServerId,
            "chef.chefNodeName": {
                $in: nodeNames
            }

        }, {
            'actionLogs': false
        }, function(err, data) {
            if (err) {
                logger.error("getInstancesFilterByNotChefServerIdAndNodeNames", err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getInstancesFilterByNotChefServerIdAndNodeNames ");
            if (data) {
                callback(null, data);
            } else {
                callback(null, null);
            }
        });
    };

    this.updateInstanceName = function(instanceId, name, callback) {
        logger.debug("Enter updateInstanceName (%s, %s)", instanceId, name);
        Instances.update({
            "_id": new ObjectId(instanceId),
        }, {
            $set: {
                "name": name
            }
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceName (%s, %s)", instanceId, name, err);
                callback(err, null);
                return;
            }

            logger.debug("Exit updateInstanceName (%s, %s)", instanceId, name);
            callback(null, data);
        });
    };

    this.getAllInstances = function(callback) {
        logger.debug("Enter getAllInstances");

        Instances.find(function(err, data) {
            if (err) {
                logger.error("Failed getAllInstances", err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getAllInstances");
            callback(null, data);

        });
    };

    // Method to give list of all Docker instances for Org,BG,Proj and Env.
    this.getInstancesByOrgBgProjectAndEnvForDocker = function(orgId, bgId, projectId, envId, callback) {
        var queryObj = {
            orgId: orgId,
            bgId: bgId,
            projectId: projectId,
            envId: envId,
            docker: {
                $exists: true
            }
        }
        Instances.find(queryObj, {
            'actionLogs': false
        }, function(err, instances) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, instances);
        });
    };

    this.getInstanceByIP = function(instanceIp, callback) {
        instanceIp = instanceIp.trim();
        Instances.find({
            "instanceIP": instanceIp
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceById (%s)", instanceId, err);
                callback(err, null);
                return;
            }
            callback(null, data);

        });
    };
    this.getByOrgProviderAndPlatformId = function(opts, callback) {

        Instances.find({
            "orgId": opts.orgId,
            "providerId": opts.providerId,
            platformId: opts.platformId
        }, {
            'actionLogs': false
        }, function(err, instances) {
            if (err) {
                logger.error("Failed getByOrgProviderAndPlatformId (%s)", opts, err);
                callback(err, null);
                return;
            }
            if (instances.length) {
                callback(null, instances[0]);
            } else {
                callback(null, null);
            }
        });
    };

    this.getByOrgProviderId = function(opts, callback) {

        Instances.find({
            "orgId": opts.orgId,
            "providerId": opts.providerId
        }, {
            'actionLogs': false
        }, function(err, instances) {
            if (err) {
                logger.error("Failed getByOrgProviderId (%s)", opts, err);
                callback(err, null);
                return;
            }

            callback(null, instances);

        });
    };

    this.getByProviderId = function(providerId, callback) {
        if (!providerId) {
            process.nextTick(function() {
                callback({
                    message: "Invalid provider id"
                });

            });
            return;
        }

        Instances.find({
            "providerId": providerId
        }, {
            'actionLogs': false
        }, function(err, instances) {
            if (err) {
                logger.error("Failed getByOrgProviderId (%s)", opts, err);
                callback(err, null);
                return;
            }

            callback(null, instances);

        });
    };

    this.getInstanceByIPAndProject = function(instanceIp,projectId, callback) {
        instanceIp = instanceIp.trim();
        Instances.find({
            "instanceIP": instanceIp,
            "projectId": projectId
        }, function(err, data) {
            if (err) {
                logger.error("Failed getInstanceById (%s)", instanceId, err);
                callback(err, null);
                return;
            }
            callback(null, data);

        });
    };

    this.getInstanceIdsByIPs = function(instanceIps, callback) {
        if (instanceIps.length) {
            var instanceIds = [];
            var count = 0;
            for (var i = 0; i < instanceIps.length; i++) {
                var instanceIp = instanceIps[i].trim();
                Instances.find({
                    "instanceIP": instanceIp
                }, function(err, data) {
                    count++;
                    if(data && data.length){
                        instanceIds.push(data[0]._id);
                    }
                    if(count === instanceIps.length){
                        callback(null, instanceIds);
                        return;
                    }
                });
            }
        }else{
            callback(null,[]);
            return;
        }
    };

    this.updateInstanceUsage = function(instanceId, usage, callback) {
        Instances.update({
            _id: new ObjectId(instanceId)
        }, {
            $set: {usage: usage}
        }, {
            upsert: false
        }, function(err, data) {
            if (err) {
                return callback(err, null);
            } else {
                callback(null, data);
            }
        });
    };
};

module.exports = new InstancesDao();

