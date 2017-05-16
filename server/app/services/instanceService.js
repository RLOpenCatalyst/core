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

var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var instancesModel = require('_pr/model/classes/instance/instance');
var containerModel = require('_pr/model/container');
var logger = require('_pr/logger')(module);
var EC2 = require('_pr/lib/ec2.js');
var Cryptography = require('../lib/utils/cryptography');
var tagsModel = require('_pr/model/tags/tags.js');
var resourceCost = require('_pr/model/resource-costs/resource-costs.js');
var resourceUsage = require('_pr/model/resource-metrics/resource-metrics.js');
var Route53 = require('_pr/lib/route53.js');

var async = require('async');
var logsDao = require('_pr/model/dao/logsdao.js');
var Chef = require('_pr/lib/chef.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var Docker = require('_pr/model/docker.js');
var resources = require('_pr/model/resources/resources.js');

var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');

var credentialCryptography = require('_pr/lib/credentialcryptography.js');

var fs = require('fs');
var nexus = require('_pr/lib/nexus.js');
var utils = require('_pr/model/classes/utils/utils.js');
var AppData = require('_pr/model/app-deploy/app-data');
var instancesDao = require('_pr/model/classes/instance/instance');
var providerService = require('_pr/services/providerService.js');
var schedulerService = require('_pr/services/schedulerService.js');
var entityCost = require('_pr/model/entity-costs');
var entityCapacity = require('_pr/model/entity-capacity');

var instanceService = module.exports = {};
instanceService.checkIfUnassignedInstanceExists = checkIfUnassignedInstanceExists;
instanceService.getUnassignedInstancesByProvider = getUnassignedInstancesByProvider;
instanceService.updateUnassignedInstanceProviderTags = updateUnassignedInstanceProviderTags;
instanceService.updateAWSInstanceTag = updateAWSInstanceTag;
instanceService.updateUnassignedInstanceTags = updateUnassignedInstanceTags;
instanceService.createUnassignedInstanceObject = createUnassignedInstanceObject;
instanceService.createUnassignedInstancesList = createUnassignedInstancesList;
instanceService.bulkUpdateInstanceProviderTags = bulkUpdateInstanceProviderTags;
instanceService.bulkUpdateUnassignedInstanceTags = bulkUpdateUnassignedInstanceTags;
instanceService.getTrackedInstancesForProvider = getTrackedInstancesForProvider;
instanceService.getTrackedInstances = getTrackedInstances;
instanceService.createTrackedInstancesResponse = createTrackedInstancesResponse;
instanceService.validateListInstancesQuery = validateListInstancesQuery;
instanceService.removeInstanceById = removeInstanceById;
instanceService.removeInstancesByProviderId = removeInstancesByProviderId;
instanceService.instanceSyncWithAWS = instanceSyncWithAWS;
instanceService.updateScheduler = updateScheduler;
instanceService.parseInstanceMonitorQuery = parseInstanceMonitorQuery;
instanceService.getInstanceActionLogs = getInstanceActionLogs;
instanceService.parseActionLogsQuery = parseActionLogsQuery;

function checkIfUnassignedInstanceExists(providerId, instanceId, callback) {
    unassignedInstancesModel.getById(instanceId,
        function (err, instance) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if (!instance) {
                var err = new Error('Instance not found');
                err.status = 404;
                return callback(err);
            } else if (instance && instance.providerId != providerId) {
                var err = new Error('Forbidden');
                err.status = 403;
                return callback(err);
            } else {
                return callback(null, instance);
            }
        });
}

// @TODO Try to move this to a common place for validation
function validateListInstancesQuery(orgs, filterQuery, callback) {
    var orgIds = [];
    var queryObjectAndCondition = filterQuery.queryObj['$and'][0];

    if (('orgName' in queryObjectAndCondition) && ('$in' in queryObjectAndCondition)) {
        var validOrgs = queryObjectAndCondition['orgName']['$in'].filter(function (orgName) {
            return (orgName in orgs);
        });

        if (validOrgs.length < queryObjectAndCondition['orgName']['$in']) {
            var err = new Error('Forbidden');
            err.status = 403;
            return callback(err);
        } else {
            orgIds = validOrgs.reduce(function (a, b) {
                return a.concat(orgs[b].rowid);
            }, orgIds);
        }
    } else if ('orgName' in queryObjectAndCondition) {
        if (queryObjectAndCondition['orgName'] in orgs) {
            orgIds.push(orgs[queryObjectAndCondition['orgName']].rowid);
        } else {
            var err = new Error('Forbidden');
            err.status = 403;
            return callback(err);
        }
    } else {
        orgIds = Object.keys(orgs).reduce(function (a, b) {
            return a.concat(orgs[b].rowid);
        }, orgIds);
    }

    if ('orgName' in queryObjectAndCondition)
        delete filterQuery.queryObj['$and'][0].orgName;

    if (orgIds.length > 0) {
        if (queryObjectAndCondition.providerId) {
            filterQuery.queryObj['$and'][0].orgId = {'$in': orgIds}
        } else {
            filterQuery.queryObj['$and'][0].providerId = {'$ne': null};
            filterQuery.queryObj['$and'][0].orgId = {'$in': orgIds};
        }
    }

    return callback(null, filterQuery);
}

function getUnassignedInstancesByProvider(jsonData, callback) {
    unassignedInstancesModel.getByProviderId(jsonData, function (err, assignedInstances) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!assignedInstances) {
            return callback(null, []);
        } else {
            return callback(null, assignedInstances);
        }
    });
}

function bulkUpdateInstanceProviderTags(provider, instances, callback) {
    var providerTypes = appConfig.providerTypes;
    if (instances.length > 10) {
        var err = new Error("Invalid request");
        err.status = 400;
        return callback(err);
    } else {
        var unassignedInstances = [];
        for (var i = 0; i < instances.length; i++) {
            (function (j) {
                // @TODO replace with single query
                // @TODO Improve error handling
                unassignedInstancesModel.getById(instances[j].id, function (err, unassignedInstance) {
                    if (err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (!unassignedInstance) {
                        var err = new Error('Instance not found');
                        err.status = 404;
                        return callback(err);
                    } else if (unassignedInstance) {
                        logger.debug('Update tags for instance ', unassignedInstance._id);
                        for (tagName in instances[j].tags) {
                            unassignedInstance.tags[tagName] = instances[j].tags[tagName];
                        }
                        unassignedInstances.push(unassignedInstance);
                    }

                    if (j == instances.length - 1) {
                        switch (provider.providerType) {
                            case providerTypes.AWS:
                                logger.debug('Update aws instance tags ', unassignedInstances.length);
                                bulkUpdateAWSInstanceTags(provider, unassignedInstances, callback);
                                break;
                            default:
                                var err = new Error('Invalid request');
                                err.status = 400;
                                return callback(err);
                                break;
                        }
                    }
                })
            })(i);
        }
    }
}

function bulkUpdateAWSInstanceTags(provider, instances, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

    var awsSettings = {};
    if (provider.isDefault) {
        awsSettings = {
            "isDefault": true
        };
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        awsSettings = {
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey
        };
    }

    for (var i = 0; i < instances.length; i++) {
        (function (j) {
            awsSettings.region = instances[j].providerData.region;
            var ec2 = new EC2(awsSettings);
            logger.debug('Updating tags for instance ', instances[j]._id);

            // @TODO Improve error handling
            ec2.createTags(instances[j].platformId, instances[j].tags,
                function (err, data) {
                    if (err) {
                        logger.error(err);
                        if (err.code === 'AccessDenied') {
                            var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                            err.status = 500;
                            return callback(err);
                        } else {
                            var err = new Error('Internal server error');
                            err.status = 500;
                            return callback(err);
                        }
                    } else if (j == instances.length - 1) {
                        return callback(null, instances);
                    }
                });
        })(i);
    }
}

function bulkUpdateUnassignedInstanceTags(instances, callback) {
    var catalystEntityTypes = appConfig.catalystEntityTypes;

    for (var i = 0; i < instances.length; i++) {
        (function (j) {
            var params = {
                '_id': instances[j]._id
            }
            var fields = {
                'tags': instances[j].tags
            }
            unassignedInstancesModel.updateInstance(params, fields,
                function (err, instanceUpdated) {
                    if (err) {
                        logger.error(err);
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if (j == instances.length - 1) {
                        return callback(null, instances);
                    }
                }
            );
        })(i);
    }
}

function updateUnassignedInstanceProviderTags(provider, instanceId, tags, callback) {
    var providerTypes = appConfig.providerTypes;

    unassignedInstancesModel.getById(instanceId,
        function (err, instance) {
            if (err) {
                logger.error(err);
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if (!instance) {
                var err = new Error('Instance not found');
                err.status = 404;
                return callback(err);
            } else if (instance && instance.providerId != provider._id) {
                var err = new Error('Forbidden');
                err.status = 403;
                return callback(err);
            } else {
                switch (provider.providerType) {
                    case providerTypes.AWS:
                        updateAWSInstanceTag(provider, instance, tags, callback);
                        break;
                    default:
                        var err = new Error('Request cannot be processed');
                        err.status = 500;
                        return callback(err);
                        break;
                }
            }
        });
}

function updateAWSInstanceTag(provider, instance, tags, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

    var ec2;
    if (provider.isDefault) {
        ec2 = new EC2({
            "isDefault": true,
            "region": instance.providerData.region
        });
    } else {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm,
            cryptoConfig.password);

        var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        ec2 = new EC2({
            "access_key": decryptedAccessKey,
            "secret_key": decryptedSecretKey,
            "region": instance.providerData.region
        });
    }


    ec2.createTags(instance.platformId, tags,
        function (err, data) {
            if (err) {
                logger.error(err);
                if (err.code === 'AccessDenied') {
                    var err = new Error('Update tag failed, Invalid keys or Permission Denied');
                    err.status = 500;
                    return callback(err);
                } else {
                    var err = new Error('Internal server error');
                    err.status = 500;
                    return callback(err);
                }
            } else {
                logger.debug(data);
                return callback(null, instance);
            }
        }
    );
}

// @TODO Remove synchronous loops
function updateUnassignedInstanceTags(instance, tags, tagMappingsList, callback) {
    var catalystEntityTypes = appConfig.catalystEntityTypes;

    var tagMappings = {};
    tagMappingsList.forEach(function (tagMapping) {
        tagMappings[tagMapping.name] = tagMapping;
    });

    var fields = {
        'tags': instance.tags
    };
    for (var key in tags) {
        fields.tags[key] = tags[key];

        if (key in tagMappings) {
            switch (tagMappings[key].catalystEntityType) {
                case catalystEntityTypes.PROJECT:
                    fields.projectTag = tags[key];
                    instance.projectTag = tags[key];
                    break;
                case catalystEntityTypes.ENVIRONMENT:
                    fields.environmentTag = tags[key];
                    instance.environmentTag = tags[key];
                    break;
                default:
                    break;
            }
        }
    }
    instance.tags = fields.tags;

    var params = {
        '_id': instance._id
    };

    unassignedInstancesModel.updateInstance(params, fields,
        function (err, instanceUpdated) {
            if (err) {
                logger.error(err);
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if (instanceUpdated) {
                return callback(null, instance);
            }
        }
    );
}

function getTrackedInstancesForProvider(provider, next) {
    async.parallel({
        managed: function (callback) {
            instancesModel.getInstanceByProviderId(provider._id, callback);
        },
        unmanaged: function (callback) {
            //@TODO Duplicate function of  getByProviderId, to be cleaned up
            unManagedInstancesModel.getInstanceByProviderId(provider._id, callback);
        },
        unassigned: function (callback) {
            unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id, callback);
        }
    },
        function (err, results) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                next(null, provider, results);
            }
        }
    );
}

function getTrackedInstances(query, category, next) {
    async.parallel([
        function (callback) {
            if (category === 'managed') {
                instancesModel.getAll(query, callback);
            } else if (category === 'assigned') {
                unManagedInstancesModel.getAll(query, callback);
            } else if (category === 'unassigned') {
                unassignedInstancesModel.getAll(query, callback);
            } else {
                callback(null, [{docs: [], total: 0}]);
            }
        }
    ],
        function (err, results) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                var instances = results.reduce(function (a, b) {
                    return a.concat(b);
                }, []);

                next(null, instances);
            }
        }
    );
}

function createUnassignedInstanceObject(instance, callback) {
    var instanceObject = {};
    var provider = {
        'id': instance.providerId,
        'type': instance.providerType,
        'data': instance.providerData ? instance.providerData : null,
    };
    instanceObject.id = instance._id;
    instanceObject.orgId = instance.orgId;
    instanceObject.provider = provider;
    instanceObject.platformId = instance.platformId;
    instanceObject.ip = instance.ip;
    instanceObject.os = instance.os;
    instanceObject.state = instance.state;
    instanceObject.projectTag = instance.projectTag;
    instanceObject.environmentTag = instance.environmentTag;
    instanceObject.tags = instance.tags;

    return callback(null, instanceObject);
}

function createUnassignedInstancesList(instances, callback) {
    var instancesListObject = {};
    var instancesList = [];

    instances.forEach(function (instance) {
        // @TODO Copy object, reduce code
        var tempInstance = {};
        var provider = {
            'id': instance.providerId,
            'type': instance.providerType,
            'data': instance.providerData ? instance.providerData : null,
        };
        tempInstance.id = instance._id;
        tempInstance.orgId = instance.orgId;
        tempInstance.provider = provider;
        tempInstance.platformId = instance.platformId;
        tempInstance.ip = instance.ip;
        tempInstance.os = instance.os;
        tempInstance.state = instance.state;
        tempInstance.tags = ('tags' in instance) ? instance.tags : {};

        instancesList.push(tempInstance);
    });

    instancesListObject.instances = instancesList;

    return callback(null, instancesListObject);
}

function createTrackedInstancesResponse(instances, callback) {
    var instancesListObject = {};
    var instancesList = [];

    instancesListObject.trackedInstances = instances.map(function (instance) {
        var instanceObj = {};
        instanceObj.id = instance._id;
        instanceObj.category = ('chefNodeName' in instance) ? 'managed' : 'unmanaged';
        instanceObj.instancePlatformId = instance.platformId;
        instanceObj.orgName = instance.orgName;
        instanceObj.projectName = instance.projectName;
        instanceObj.providerName = instance.providerName;
        instanceObj.providerId = instance.providerId;
        instanceObj.environmentName = instance.environmentName;
        instanceObj.providerType = instance.providerType;
        instanceObj.instanceState = instance.instanceState ? instance.instanceState : instance.state;
        instanceObj.bgId = ('bgId' in instance) ? instance.bgId : null;

        if (('hardware' in instance) && ('os' in instance.hardware))
            instanceObj.os = instance.hardware.os;
        else if ('os' in instance)
            instanceObj.os = instance.os;
        else
            instanceObj.os = null;

        if ('ip' in instance)
            instanceObj.ip = instance.ip;
        else if ('instanceIP' in instance)
            instanceObj.ip = instance.instanceIP;
        else
            instanceObj.ip = null;

        instanceObj.usage = ('usage' in instance) ? instance.usage : null;
        instanceObj.cost = (('cost' in instance) && instance.cost) ? (instance.cost.symbol + ' ' + parseFloat(instance.cost.aggregateInstanceCost).toFixed(2)) : 0;
        return instanceObj;
    });

    callback(null, instancesListObject);
}



instanceService.createInstance = function createInstance(instanceObj, callback) {
    var blueprint = instanceObj.blueprint;
    var instance = instanceObj.instance;
    var tempLocation = appConfig.tempDir + uuid.v4();

    var attributes = [];
    var runList = [];
    if (blueprint.runList && blueprint.runList.length) {
        for (var j = 0; j < blueprint.runList.length; j++) {
            // Attributes which are configures in blueprint.
            var attr = blueprint.runList[j].attributes;
            if (attr && attr.length) {
                attributes.push(attr);
            }
            if (blueprint.runList[j] && blueprint.runList[j].name) {
                runList.push(blueprint.runList[j].name);
            }
        }
    }
    var buffer = new Buffer(instanceObj.provider.providerDetails.sshPrivateKey, 'base64');
    var toAscii = buffer.toString('ascii');
    fs.writeFile(tempLocation, toAscii, function (err) {
        if (err) {
            var error = new Error("Unable to create pem file.");
            error.status = 500;
            return callback(error, null);
        }

        credentialCryptography.encryptCredential({
            username: blueprint.vmImage.userName,
            pemFileLocation: tempLocation,
            password: blueprint.vmImage.password
        }, function (err, encryptedCredential) {
            fs.unlink(tempLocation, function () {
                logger.debug('temp file deleted');
            })
            if (err) {
                return callback(err);
            }

            var instances = {
                name: instance.name,
                orgId: blueprint.organizationId,
                bgId: blueprint.businessGroupId,
                projectId: blueprint.projectId,
                envId: instanceObj.envId,
                providerId: blueprint.networkProfile.providerId,
                providerType: blueprint.networkProfile.type,
                runlist: runList,
                attributes: attributes,
                appUrls: blueprint.applicationURL,
                zone: blueprint.networkProfile.networkDetails.zone,
                instanceState: 'pending',
                hardware: {
                    platform: 'unknown',
                    platformVersion: 'unknown',
                    architecture: 'unknown',
                    memory: {
                        total: 'unknown',
                        free: 'unknown',
                    },
                    os: blueprint.vmImage.osType
                },
                credentials: encryptedCredential,
                blueprintData: {
                    blueprintId: blueprint._id,
                    blueprintName: blueprint.name,
                    templateId: "",
                    templateType: "",
                    templateComponents: "",
                    iconPath: ""
                },
                chef: {
                    serverId: blueprint.chefServerId,
                    chefNodeName: instance.name
                }
            };
            switch (blueprint.networkProfile.type) {
                case 'gcp':
                    instances['chefNodeName'] = instance.name,
                        instances['platformId'] = instance.id,
                        instances['instanceIP'] = instance.ip,
                        instances['instanceState'] = instance.status,
                        instances['bootStrapStatus'] = 'waiting',
                        instances['instanceState'] = 'running'

                    break;
                    defaut: break;
            }
            instancesModel.createInstance(instances, function (err, instanceData) {
                if (err) {
                    logger.debug("Failed to createInstance.", err);
                    var error = new Error("Failed to createInstance.");
                    error.status = 500;
                    return callback(error, null);
                }
                logger.debug("createInstance.", JSON.stringify(instanceData));
                callback(null, instanceData);
            });
        });
    });
};

instanceService.bootstrapInstance = function bootstrapInstance(bootstrapData, callback) {
    var blueprintObj = bootstrapData.blueprint;
    credentialCryptography.decryptCredential(bootstrapData.credentials, function (err, decryptedCredential) {
        configmgmtDao.getEnvNameFromEnvId(bootstrapData.envId, function (err, envName) {
            if (err) {
                callback({
                    message: "Failed to get env name from env id"
                }, null);
                return;
            }
            if (!envName) {
                callback({
                    "message": "Unable to find environment name from environment id"
                });
                return;
            }

            getCookBookAttributes(bootstrapData, function (err, jsonAttributes) {
                logger.debug("jsonAttributes::::: ", JSON.stringify(jsonAttributes));
                var runlist = bootstrapData.runlist;
                //logger.debug("launchParams.blueprintData.extraRunlist: ", JSON.stringify(launchParams.blueprintData.extraRunlist));
                if (bootstrapData.extraRunlist) {
                    runlist = bootstrapData.runlist.extraRunlist.concat(runlist);
                }
                var bootstrapInstanceParams = {
                    instanceIp: bootstrapData.instanceIP,
                    pemFilePath: decryptedCredential.pemFileLocation,
                    runlist: bootstrapData.runlist,
                    instanceUsername: bootstrapData.credentials.username,
                    nodeName: bootstrapData.name,
                    environment: envName,
                    instanceOS: bootstrapData.os,
                    jsonAttributes: jsonAttributes,
                    instancePassword: decryptedCredential.password
                };
                configmgmtDao.getChefServerDetails(bootstrapData.chef.serverId, function (err, chefDetails) {
                    if (err) {
                        var error = new Error("Failed to getChefServerDetails");
                        error.status = 500;
                        return callback(error, null);
                    }
                    if (!chefDetails) {
                        var error = new Error("No Chef Server Detailed available");
                        error.status = 500;
                        return callback(error, null);
                    }
                    var chef = new Chef({
                        userChefRepoLocation: chefDetails.chefRepoLocation,
                        chefUserName: chefDetails.loginname,
                        chefUserPemFile: chefDetails.userpemfile,
                        chefValidationPemFile: chefDetails.validatorpemfile,
                        hostedChefUrl: chefDetails.url
                    });

                    chef.getEnvironment(envName, function (err, env) {
                        if (err) {
                            var error = new Error("Failed chef.getEnvironment");
                            error.status = 500;
                            return callback(error, null);
                        }

                        if (!env) {
                            chef.createEnvironment(envName, function (err) {
                                if (err) {
                                    logger.error("Failed chef.createEnvironment", err);
                                    var error = new Error("Failed to create environment in chef server.");
                                    error.status = 500;
                                    return callback(error, null);
                                }
                                bootstrap();
                            });
                        } else {
                            bootstrap();
                        }

                        function bootstrap() {
                            var timestampStarted = new Date().getTime();
                            var actionLog = instancesModel.insertBootstrapActionLog(bootstrapData.id, bootstrapData.runlist, "admin", timestampStarted);
                            chef.bootstrapInstance(bootstrapInstanceParams, function (err, code) {
                                if (bootstrapInstanceParams.pemFilePath) {
                                    //fs.unlink(bootstrapInstanceParams.pemFilePath);
                                }

                                logger.error('process stopped ==> ', err, code);
                                if (err) {
                                    logger.error("knife launch err ==>", err);
                                    instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'failed', function (err, updateData) {});
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        instanceId:bootstrapData._id,
                                        instanceRefId:actionLog._id,
                                        err: true,
                                        log: "Bootstrap failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesModel.updateActionLog(bootstrapData.id, actionLog._id, false, timestampEnded);
                                    return callback(err);
                                } else {
                                    if (code == 0) {
                                        instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'success', function (err, updateData) {
                                            if (err) {
                                                logger.error("Unable to set instance bootstarp status. code 0", err);
                                            } else {
                                                logger.debug("Instance bootstrap status set to success");
                                            }
                                        });
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            instanceId:bootstrapData._id,
                                            instanceRefId:actionLog._id,
                                            err: false,
                                            log: "Instance Bootstraped successfully",
                                            timestamp: timestampEnded
                                        });
                                        instancesModel.updateActionLog(bootstrapData.id, actionLog._id, true, timestampEnded);


                                        chef.getNode(bootstrapData.chefNodeName, function (err, nodeData) {
                                            if (err) {
                                                logger.error("Failed chef.getNode", err);
                                                var error = new Error("Failed to get Node from chef server.");
                                                error.status = 500;
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
                                            hardwareData.os = bootstrapData.hardware.os;
                                            instancesModel.setHardwareDetails(bootstrapData.id, hardwareData, function (err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                } else {
                                                    logger.debug("Instance hardware details set successessfully");
                                                }
                                            });
                                            //Checking docker status and updating
                                            var docker = new Docker();
                                            docker.checkDockerStatus(bootstrapData.id, function (err, retCode) {
                                                if (err) {
                                                    logger.error("Failed docker.checkDockerStatus", err);
                                                    var error = new Error("Failed to check Status from Docker.");
                                                    error.status = 500;
                                                    return;

                                                }
                                                logger.debug('Docker Check Returned:' + retCode);
                                                if (retCode == '0') {
                                                    instancesModel.updateInstanceDockerStatus(bootstrapData.id, "success", '', function (data) {
                                                        logger.debug('Instance Docker Status set to Success');
                                                    });
                                                }
                                            });
                                        });

                                        return callback(null, {
                                            message: "bootstraped"
                                        });

                                    } else {
                                        instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'failed', function (err, updateData) {
                                            if (err) {
                                                logger.error("Unable to set instance bootstarp status code != 0", err);
                                            } else {
                                                logger.debug("Instance bootstrap status set to failed");
                                            }
                                        });
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            instanceId:bootstrapData._id,
                                            instanceRefId:actionLog._id,
                                            err: false,
                                            log: "Bootstrap Failed",
                                            timestamp: timestampEnded
                                        });
                                        instancesModel.updateActionLog(bootstrapData.id, actionLog._id, false, timestampEnded);

                                        var error = new Error("Bootstrap failed with ret code ==>" + code);
                                        error.status = 500;
                                        return callback(error);
                                    }
                                }

                            }, function (stdOutData) {

                                logsDao.insertLog({
                                    instanceId:bootstrapData._id,
                                    instanceRefId:actionLog._id,
                                    err: false,
                                    log: stdOutData.toString('ascii'),
                                    timestamp: new Date().getTime()
                                });

                            }, function (stdErrData) {

                                //retrying 4 times before giving up.
                                logsDao.insertLog({
                                    instanceId:bootstrapData._id,
                                    instanceRefId:actionLog._id,
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
    });
};

function getCookBookAttributes(instance, callback) {
    logger.debug("getCookBookAttributes calles: ", JSON.stringify(instance));
    var blueprint = instance.blueprint;
    //merging attributes Objects
    var attributeObj = {};
    var objectArray = [];
    var attr = [];
    if (instance.runlist && instance.runlist.length) {
        for (var j = 0; j < instance.runlist.length; j++) {
            (function (j) {
                // Attributes which are configures in blueprint.
                attr = instance.runlist[j].attributes;
                if (attr && attr.length) {
                    for (var i = 0; i < attr.length; i++) {
                        objectArray.push(attr[i].jsonObj);
                    }
                }
            })(j);
        }
    }
    // While passing extra attribute to chef cookbook "rlcatalyst" is used as attribute.
    //var temp = new Date().getTime();
    if (blueprint.applications && blueprint.applications.length) {
        if (blueprint.applications[0].repoType === "nexus") {
            var url = blueprint.applications[0].repoDetails.url;
            var repoName = blueprint.applications[0].repoDetails.repoName;
            var groupId = blueprint.applications[0].repoDetails.groupId;
            var artifactId = blueprint.applications[0].repoDetails.artifactId;
            var version = blueprint.applications[0].repoDetails.version;
            objectArray.push({
                "rlcatalyst": {
                    "upgrade": false
                }
            });
            objectArray.push({
                "rlcatalyst": {
                    "applicationNodeIP": instance.instanceIP
                }
            });

            nexus.getNexusArtifactVersions(blueprint.applications[0].repoId, repoName, groupId, artifactId, function (err, data) {
                if (err) {
                    logger.debug("Failed to fetch Repository from Mongo: ", err);
                    objectArray.push({
                        "rlcatalyst": {
                            "nexusUrl": url
                        }
                    });
                    objectArray.push({
                        "rlcatalyst": {
                            "version": version
                        }
                    });
                }

                if (data) {
                    var flag = false;
                    var versions = data.metadata.versioning[0].versions[0].version;
                    var latestVersionIndex = versions.length;
                    var latestVersion = versions[latestVersionIndex - 1];
                    //logger.debug("Got latest catalyst version from nexus: ", latestVersion);

                    nexus.getNexusArtifact(blueprint.applications[0].repoId, repoName, groupId, function (err, artifacts) {
                        if (err) {
                            logger.debug("Failed to get artifacts.");
                            objectArray.push({
                                "rlcatalyst": {
                                    "nexusUrl": url
                                }
                            });
                            objectArray.push({
                                "rlcatalyst": {
                                    "version": version
                                }
                            });
                        } else {
                            if (artifacts.length) {
                                for (var i = 0; i < artifacts.length; i++) {
                                    if (latestVersion === artifacts[i].version && artifactId === artifacts[i].artifactId) {
                                        url = artifacts[i].resourceURI;

                                        objectArray.push({
                                            "rlcatalyst": {
                                                "nexusUrl": url
                                            }
                                        });
                                        objectArray.push({
                                            "rlcatalyst": {
                                                "version": latestVersion
                                            }
                                        });
                                        flag = true;
                                        //logger.debug("latest objectArray::: ", JSON.stringify(objectArray));
                                        break;
                                    }

                                }
                                if (!flag) {
                                    objectArray.push({
                                        "rlcatalyst": {
                                            "nexusUrl": url
                                        }
                                    });
                                    objectArray.push({
                                        "rlcatalyst": {
                                            "version": version
                                        }
                                    });
                                }
                            } else {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "nexusUrl": url
                                    }
                                });
                                objectArray.push({
                                    "rlcatalyst": {
                                        "version": latestVersion
                                    }
                                });
                            }
                        }

                        var actualVersion = "";
                        if (latestVersion) {
                            actualVersion = latestVersion;
                        } else {
                            actualVersion = version;
                        }

                        // Update app-data for promote
                        var nodeIp = [];
                        nodeIp.push(instance.instanceIP);
                        configmgmtDao.getEnvNameFromEnvId(instance.envId, function (err, envName) {
                            if (err) {
                                callback({
                                    message: "Failed to get env name from env id"
                                }, null);
                                return;
                            }
                            if (!envName) {
                                callback({
                                    "message": "Unable to find environment name from environment id"
                                });
                                return;
                            }
                            var appData = {
                                "projectId": instance.projectId,
                                "envId": envName,
                                "appName": artifactId,
                                "version": actualVersion,
                                "nexus": {
                                    "repoURL": url,
                                    "nodeIps": nodeIp
                                }
                            };
                            AppData.createNewOrUpdate(appData, function (err, data) {
                                if (err) {
                                    logger.debug("Failed to create or update app-data: ", err);
                                }
                                if (data) {
                                    logger.debug("Created or Updated app-data successfully: ", data);
                                }
                            });
                        });

                        var attributeObj = utils.mergeObjects(objectArray);
                        callback(null, attributeObj);
                        return;
                    });
                } else {
                    logger.debug("No artifact version found.");
                }

            });
        } else if (blueprint.applications[0].repoType === "docker") {
            if (blueprint.applications[0].repoDetails.containerId) {
                objectArray.push({
                    "rlcatalyst": {
                        "containerId": blueprint.applications[0].repoDetails.containerId
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.containerPort) {
                objectArray.push({
                    "rlcatalyst": {
                        "containerPort": blueprint.applications[0].repoDetails.containerPort
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.image) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerImage": blueprint.applications[0].repoDetails.image
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.hostPort) {
                objectArray.push({
                    "rlcatalyst": {
                        "hostPort": blueprint.applications[0].repoDetails.hostPort
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerUser) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerUser": blueprint.applications[0].repoDetails.dockerUser
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerPassword) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerPassword": blueprint.applications[0].repoDetails.dockerPassword
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerEmailId) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerEmailId": blueprint.applications[0].repoDetails.dockerEmailId
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.imageTag) {
                objectArray.push({
                    "rlcatalyst": {
                        "imageTag": blueprint.applications[0].repoDetails.imageTag
                    }
                });
            }
            objectArray.push({
                "rlcatalyst": {
                    "upgrade": false
                }
            });

            objectArray.push({
                "rlcatalyst": {
                    "applicationNodeIP": instance.instanceIP
                }
            });
            var attrs = utils.mergeObjects(objectArray);
            // Update app-data for promote
            var nodeIp = [];
            nodeIp.push(instance.instanceIP);
            configmgmtDao.getEnvNameFromEnvId(instance.envId, function (err, envName) {
                if (err) {
                    callback({
                        message: "Failed to get env name from env id"
                    }, null);
                    return;
                }
                if (!envName) {
                    callback({
                        "message": "Unable to find environment name from environment id"
                    });
                    return;
                }
                var actualDocker = [];
                var docker = {
                    "image": blueprint.applications[0].repoDetails.image,
                    "containerId": blueprint.applications[0].repoDetails.containerId,
                    "containerPort": blueprint.applications[0].repoDetails.containerPort,
                    "hostPort": blueprint.applications[0].repoDetails.hostPort,
                    "dockerUser": blueprint.applications[0].repoDetails.dockerUser,
                    "dockerPassword": blueprint.applications[0].repoDetails.dockerPassword,
                    "dockerEmailId": blueprint.applications[0].repoDetails.dockerEmailId,
                    "imageTag": blueprint.applications[0].repoDetails.imageTag,
                    "nodeIp": instance.instanceIP
                };
                actualDocker.push(docker);
                var appData = {
                    "projectId": instance.projectId,
                    "envId": envName,
                    "appName": artifactId,
                    "version": blueprint.applications[0].repoDetails.imageTag,
                    "docker": actualDocker
                };
                AppData.createNewOrUpdate(appData, function (err, data) {
                    if (err) {
                        logger.debug("Failed to create or update app-data: ", err);
                    }
                    if (data) {
                        logger.debug("Created or Updated app-data successfully: ", data);
                    }
                })
            });

            callback(null, attrs);
            return;
        }
    } else {
        var attributeObj = utils.mergeObjects(objectArray);
        callback(null, attributeObj);
        return;
    }
}
;

instanceService.getInstanceActionList = function getInstanceActionList(callback) {

    instancesDao.listInstances(function (err, list) {
        if (err) {
            logger.debug("Error while fetching instance actionLog: ", err);
            return callback(err, null);
        }
        var count = 0;
        if (list && list.length) {
            var actionLogs = [];
            for (var i = 0; i < list.length; i++) {
                (function (i) {
                    if (list[i].instanceState != "terminated" && list[i].actionLogs && list[i].actionLogs.length) {
                        for (var j = 0; j < list[i].actionLogs.length; j++) {
                            if (list[i].actionLogs[j].name != "Orchestration") {
                                list[i].actionLogs[j] = JSON.parse(JSON.stringify(list[i].actionLogs[j]));
                                list[i].actionLogs[j]['orgName'] = list[i].orgName;
                                list[i].actionLogs[j]['bgName'] = list[i].bgName;
                                list[i].actionLogs[j]['projectName'] = list[i].projectName;
                                list[i].actionLogs[j]['environmentName'] = list[i].environmentName;
                                list[i].actionLogs[j]['instanceState'] = list[i].instanceState;
                                list[i].actionLogs[j]['bootStrapStatus'] = list[i].bootStrapStatus;
                                list[i].actionLogs[j]['platformId'] = list[i].platformId;
                                list[i].actionLogs[j]['instanceIP'] = list[i].instanceIP;
                                list[i].actionLogs[j]['providerType'] = list[i].providerType;
                                list[i].actionLogs[j]['instanceType'] = list[i].instanceType;
                                list[i].actionLogs[j]['os'] = list[i].hardware.os;
                                list[i].actionLogs[j]['platform'] = list[i].hardware.platform;
                                list[i].actionLogs[j]['instanceId'] = list[i]._id;
                                list[i].actionLogs[j]['blueprintName'] = list[i].blueprintData.blueprintName;
                                actionLogs.push(list[i].actionLogs[j]);
                            }
                        }
                    }
                    count++;
                    if (list.length == count) {
                        return callback(null, actionLogs);
                    }
                })(i);
            }

        } else {
            return callback(null, list);
        }
    })
};

instanceService.getInstanceAction = function getInstanceAction(actionId, callback) {
    instancesDao.getActionLogsById(actionId, function (err, action) {
        if (err) {
            logger.error("Failed to fetch Instance Action: ", err);
            return callback(err, null);
        }
        if (action && action.length) {
            var instanceAction = JSON.parse(JSON.stringify(action[0].actionLogs[0]));
            var queryObj = {
                instanceRefId:actionId
            }
            logsDao.getLogsDetails(queryObj, function (err, data) {
                if (err) {
                    logger.error("Failed to fetch Logs: ", err);
                    callback(500, null);
                    return;
                }
                instanceAction['logs'] = data;
                return callback(null, instanceAction);
            });

        } else {
            var error = new Error("Action not found.");
            error.status = 404;
            return callback(error, null);
        }
    });
};

function removeInstanceById(instanceId, callback) {
    containerModel.deleteContainerByInstanceId(instanceId, function (err, container) {
        if (err) {
            logger.error("Container deletion Failed >> ", err);
            callback(err, null);
            return;
        } else {
            instancesModel.removeInstanceById(instanceId, function (err, data) {
                if (err) {
                    logger.error("Instance deletion Failed >> ", err);
                    callback(err, null);
                    return;
                }
                callback(err, data);
            });
        }
    });
}
;

function removeInstancesByProviderId(providerId, callback) {
    async.parallel({
        managedInstance: function (callback) {
            instancesModel.removeInstancesByProviderId(providerId, callback);
        },
        assignedInstance: function (callback) {
            unManagedInstancesModel.removeInstancesByProviderId(providerId, callback);
        },
        unassignedInstance: function (callback) {
            unassignedInstancesModel.removeInstancesByProviderId(providerId, callback);
        },
        resources: function (callback) {
            resources.removeResourcesByProviderId(providerId, callback);
        },
        resourcesCost: function (callback) {
            resourceCost.removeResourceCostByProviderId(providerId, callback);
        },
        resourcesUsage: function (callback) {
            resourceUsage.removeResourceUsageByProviderId(providerId, callback);
        },
        entityCost: function (callback) {
            entityCost.removeEntityCostByProviderId(providerId, callback);
        },
        entityCapacity: function (callback) {
            entityCapacity.removeEntityCapacityByProviderId(providerId, callback);
        },
        resourcesTags: function (callback) {
            tagsModel.removeTagsByProviderId(providerId, callback);
        }
    }, function (err, results) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    })
}

function instanceSyncWithAWS(instanceId, instanceData, providerDetails, callback) {
    async.waterfall([
        function (next) {
            instancesModel.getInstanceById(instanceId, next);
        },
        function (instances, next) {
            var instance = instances[0];
            var routeHostedZoneParamList = [];
            if (instance.instanceState !== instanceData.state && instance.bootStrapStatus === 'success') {
                var timestampStarted = new Date().getTime();
                var user = instance.catUser ? instance.catUser : 'superadmin';
                var action = '';
                if (instanceData.state === 'stopped' || instanceData.state === 'stopping') {
                    action = 'Stop';
                } else if (instanceData.state === 'terminated') {
                    action = 'Terminated';
                    if (instance.route53HostedParams) {
                        routeHostedZoneParamList = instance.route53HostedParams;
                    }
                } else if (instanceData.state === 'shutting-down') {
                    action = 'Shutting-Down';
                } else {
                    action = 'Start';
                }
                ;
                if (instanceData.state === 'terminated' && instance.instanceState === 'shutting-down') {
                    instanceLogModel.getLogsByInstanceIdStatus(instance._id, instance.instanceState, function (err, data) {
                        if (err) {
                            logger.error("Failed to get Instance Logs: ", err);
                            next(err, null);
                        }
                        data.status = 'terminated';
                        data.action = action;
                        data.user = user;
                        data.actionStatus = "success";
                        data.endedOn = new Date().getTime();
                        logsDao.insertLog({
                            instanceId:data.instanceId,
                            instanceRefId:data.actionId,
                            err: false,
                            log: "Instance " + instanceData.state,
                            timestamp: timestampStarted
                        });
                        instanceLogModel.createOrUpdate(data.actionId, instance._id, data, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                                next(err, null);
                            }
                            next(null, routeHostedZoneParamList);
                        });
                    })
                } else {
                    createOrUpdateInstanceLogs(instance, instanceData.state, action, user, timestampStarted, routeHostedZoneParamList, next);
                }
            } else {
                next(null, routeHostedZoneParamList);
            }
        },
        function (paramList, next) {
            async.parallel({
                instanceDataSync: function (callback) {
                    instancesModel.updateInstanceStatus(instanceId, instanceData, callback);
                },
                route53Sync: function (callback) {
                    if (paramList.length > 0) {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                        var decryptedAccessKey = cryptography.decryptText(providerDetails.accessKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var decryptedSecretKey = cryptography.decryptText(providerDetails.secretKey,
                            cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                        var route53Config = {
                            access_key: decryptedAccessKey,
                            secret_key: decryptedSecretKey,
                            region: 'us-west-1'
                        };
                        var route53 = new Route53(route53Config);
                        var count = 0;
                        for (var i = 0; i < paramList.length; i++) {
                            (function (params) {
                                params.ChangeBatch.Changes[0].Action = 'DELETE';
                                route53.changeResourceRecordSets(params, function (err, data) {
                                    count++;
                                    if (err) {
                                        callback(err, null);
                                    }
                                    if (count === paramList.length) {
                                        callback(null, paramList);
                                    }
                                });
                            })(paramList[i]);

                        }
                    } else {
                        callback(null, paramList);
                    }
                }
            }, function (err, results) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            })

        }
    ], function (err, results) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    })
}

function createOrUpdateInstanceLogs(instance, instanceState, action, user, timestampStarted, routeHostedZoneParamList, next) {
    var actionLog = instancesModel.insertInstanceStatusActionLog(instance._id, user, instanceState, timestampStarted);
    var actionStatus = 'success';
    logsDao.insertLog({
        instanceId:instance._id,
        instanceRefId:actionLog._id,
        err: false,
        log: "Instance " + instanceState,
        timestamp: timestampStarted
    });
    if (instanceState === 'shutting-down') {
        actionStatus = 'pending';
    }
    var instanceLog = {
        actionId: actionLog._id,
        instanceId: instance._id,
        orgName: instance.orgName,
        bgName: instance.bgName,
        projectName: instance.projectName,
        envName: instance.environmentName,
        status: instanceState,
        actionStatus: actionStatus,
        platformId: instance.platformId,
        blueprintName: instance.blueprintData.blueprintName,
        data: instance.runlist,
        platform: instance.hardware.platform,
        os: instance.hardware.os,
        size: instance.instanceType,
        user: user,
        createdOn: new Date().getTime(),
        startedOn: new Date().getTime(),
        providerType: instance.providerType,
        action: action,
        logs: []
    };
    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
            next(err, null);
        }
        next(null, routeHostedZoneParamList);
    });
}

function updateScheduler(instanceScheduler, callback) {
    async.waterfall([
        function (next) {
            generateCronPattern(instanceScheduler.interval, instanceScheduler.schedulerStartOn, instanceScheduler.schedulerEndOn, next);
        },
        function (schedulerDetails, next) {
            schedulerDetails.interval = instanceScheduler.interval;
            instancesDao.updateScheduler(instanceScheduler.instanceIds, schedulerDetails, next);
        }
    ], function (err, results) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, {"message": "Scheduler Updated."});
            var catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
            catalystSync.executeScheduledInstances();
            return;
        }
    });
}

function parseInstanceMonitorQuery(paginationReq, callback) {
    if (paginationReq.filterBy && paginationReq.filterBy.monitor) {
        if (paginationReq.filterBy.monitor === "true") {
            paginationReq.filterBy.monitor = {$ne: null};
        } else {
            paginationReq.filterBy.monitor = null;
        }
    }
    return callback(null, paginationReq);
}

function getInstanceActionLogs(instanceId, filterByQuery, callback) {
    logger.debug("filterByQuery------>>>>", JSON.stringify(filterByQuery));
    instancesDao.getAllActionLogs(instanceId, filterByQuery, function (err, actionLogs) {
        if (err) {
            callback(err);
            return;
        }

        if (actionLogs && actionLogs.length) {
            logger.debug("Enter get() for /instances/%s/actionLogs", instanceId);
            callback(null, actionLogs);
        } else {
            logger.debug("Exit get() for /instances/%s/actionLogs", instanceId);
            callback(null, []);
        }

    });
}

function parseActionLogsQuery(requestQuery, callback) {
    logger.debug("requestQuery------>>>>", JSON.stringify(requestQuery));
    var query = {};
    if (requestQuery.fromTime || requestQuery.toTime) {
        query = {
            "actionLogs": {
                "$elemMatch": {
                    "timeStarted": {
                    }
                }
            }
        };
        if (requestQuery.fromTime) {
            query.actionLogs.$elemMatch.timeStarted['$gte'] = Date.parse(requestQuery.fromTime);
        }
        if (requestQuery.toTime) {
            query.actionLogs.$elemMatch.timeStarted['$lte'] = Date.parse(requestQuery.toTime);
        }
    }
    return callback(null, query);
}

function generateCronPattern(cronInterval, startDate, endDate, callback) {
    var startIntervalList = [], stopIntervalList = [], count = 0;
    var startOn = null, endOn = null;
    if (startDate === endDate) {
        startOn = new Date();
        endOn = new Date()
        endOn.setHours(23);
        endOn.setMinutes(59);
    } else {
        startOn = startDate;
        endOn = endDate;
    }
    if (cronInterval.length === 0) {
        var scheduler = {
            instanceStartScheduler: startIntervalList,
            instanceStopScheduler: stopIntervalList,
            schedulerStartOn: Date.parse(startOn),
            schedulerEndOn: Date.parse(endOn),
            isScheduled: false
        }
        callback(null, scheduler);
        return;
    } else {
        for (var i = 0; i < cronInterval.length; i++) {
            (function (interval) {
                if (interval.action === 'start') {
                    count++;
                    var timeSplit = interval.time.split(":");
                    var hours = parseInt(timeSplit[0]);
                    var minutes = parseInt(timeSplit[1]);
                    var sortedDays = interval.days.sort(function (a, b) {
                        return a - b
                    });
                    var strDays = '';
                    for (var j = 0; j < sortedDays.length; j++) {
                        if (strDays !== '')
                            strDays = strDays + ',' + sortedDays[j];
                        else
                            strDays = sortedDays[j];
                    }
                    startIntervalList.push({
                        cronTime: interval.time,
                        cronDays: sortedDays,
                        cronPattern: minutes + ' ' + hours + ' ' + '* * ' + strDays
                    });
                    if (count === cronInterval.length) {
                        var scheduler = {
                            instanceStartScheduler: startIntervalList,
                            instanceStopScheduler: stopIntervalList,
                            schedulerStartOn: Date.parse(startOn),
                            schedulerEndOn: Date.parse(endOn),
                            isScheduled: true
                        }
                        callback(null, scheduler);
                        return;
                    }
                } else {
                    count++;
                    var timeSplit = interval.time.split(":");
                    var hours = parseInt(timeSplit[0]);
                    var minutes = parseInt(timeSplit[1]);
                    var sortedDays = interval.days.sort(function (a, b) {
                        return a - b
                    });
                    var strDays = '';
                    for (var j = 0; j < sortedDays.length; j++) {
                        if (strDays !== '')
                            strDays = strDays + ',' + sortedDays[j];
                        else
                            strDays = sortedDays[j];
                    }
                    stopIntervalList.push({
                        cronTime: interval.time,
                        cronDays: sortedDays,
                        cronPattern: minutes + ' ' + hours + ' ' + '* * ' + strDays
                    });
                    if (count === cronInterval.length) {
                        var scheduler = {
                            instanceStartScheduler: startIntervalList,
                            instanceStopScheduler: stopIntervalList,
                            schedulerStartOn: Date.parse(startOn),
                            schedulerEndOn: Date.parse(endOn),
                            isScheduled: true
                        }
                        callback(null, scheduler);
                        return;
                    }
                }
            })(cronInterval[i]);
        }
    }
}