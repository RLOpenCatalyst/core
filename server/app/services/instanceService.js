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
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var EC2 = require('_pr/lib/ec2.js');
var Cryptography = require('../lib/utils/cryptography');
var tagsModel = require('_pr/model/tags/tags.js');
var resourceCost = require('_pr/model/resource-costs-deprecated/resource-costs-deprecated.js');
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

var usersDao = require('_pr/model/users.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var VMware = require('_pr/lib/vmware');
var vmwareCloudProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var AzureCloud = require('_pr/lib/azure');
var providerService = require('_pr/services/providerService.js');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var GCP = require('_pr/lib/gcp.js');
var crontab = require('node-crontab');


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
instanceService.startInstance = startInstance;
instanceService.stopInstance = stopInstance;
instanceService.executeScheduleJob = executeScheduleJob;
instanceService.updateScheduler = updateScheduler;

function checkIfUnassignedInstanceExists(providerId, instanceId, callback) {
    unassignedInstancesModel.getById(instanceId,
        function(err, instance) {
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
        var validOrgs = queryObjectAndCondition['orgName']['$in'].filter(function(orgName) {
            return (orgName in orgs);
        });

        if (validOrgs.length < queryObjectAndCondition['orgName']['$in']) {
            var err = new Error('Forbidden');
            err.status = 403;
            return callback(err);
        } else {
            orgIds = validOrgs.reduce(function(a, b) {
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
        orgIds = Object.keys(orgs).reduce(function(a, b) {
            return a.concat(orgs[b].rowid);
        }, orgIds);
    }

    if ('orgName' in queryObjectAndCondition)
        delete filterQuery.queryObj['$and'][0].orgName;

    if (orgIds.length > 0) {
        if (queryObjectAndCondition.providerId) {
            filterQuery.queryObj['$and'][0].orgId = { '$in': orgIds }
        } else {
            filterQuery.queryObj['$and'][0].providerId = { '$ne': null };
            filterQuery.queryObj['$and'][0].orgId = { '$in': orgIds };
        }
    }

    return callback(null, filterQuery);
}

function getUnassignedInstancesByProvider(jsonData, callback) {
    unassignedInstancesModel.getByProviderId(jsonData, function(err, assignedInstances) {
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
            (function(j) {
                // @TODO replace with single query
                // @TODO Improve error handling
                unassignedInstancesModel.getById(instances[j].id, function(err, unassignedInstance) {
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
        (function(j) {
            awsSettings.region = instances[j].providerData.region;
            var ec2 = new EC2(awsSettings);
            logger.debug('Updating tags for instance ', instances[j]._id);

            // @TODO Improve error handling
            ec2.createTags(instances[j].platformId, instances[j].tags,
                function(err, data) {
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
        (function(j) {
            var params = {
                '_id': instances[j]._id
            }
            var fields = {
                'tags': instances[j].tags
            }
            unassignedInstancesModel.updateInstance(params, fields,
                function(err, instanceUpdated) {
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
        function(err, instance) {
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
        function(err, data) {
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
    tagMappingsList.forEach(function(tagMapping) {
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
        function(err, instanceUpdated) {
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
            managed: function(callback) {
                instancesModel.getInstanceByProviderId(provider._id, callback);
            },
            unmanaged: function(callback) {
                //@TODO Duplicate function of  getByProviderId, to be cleaned up
                unManagedInstancesModel.getInstanceByProviderId(provider._id, callback);
            },
            unassigned: function(callback) {
                unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id, callback);
            }
        },
        function(err, results) {
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
            function(callback) {
                if (category === 'managed') {
                    instancesModel.getAll(query, callback);
                } else if (category === 'assigned') {
                    unManagedInstancesModel.getAll(query, callback);
                } else if (category === 'unassigned') {
                    unassignedInstancesModel.getAll(query, callback);
                } else {
                    callback(null, [{ docs: [], total: 0 }]);
                }
            }
        ],
        function(err, results) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                var instances = results.reduce(function(a, b) {
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

    instances.forEach(function(instance) {
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

    instancesListObject.trackedInstances = instances.map(function(instance) {
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
    fs.writeFile(tempLocation, toAscii, function(err) {
        if (err) {
            var error = new Error("Unable to create pem file.");
            error.status = 500;
            return callback(error, null);
        }

        credentialCryptography.encryptCredential({
            username: blueprint.vmImage.userName,
            pemFileLocation: tempLocation,
            password: blueprint.vmImage.password
        }, function(err, encryptedCredential) {
            fs.unlink(tempLocation, function() {
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
            instancesModel.createInstance(instances, function(err, instanceData) {
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
    credentialCryptography.decryptCredential(bootstrapData.credentials, function(err, decryptedCredential) {
        configmgmtDao.getEnvNameFromEnvId(bootstrapData.envId, function(err, envName) {
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

            getCookBookAttributes(bootstrapData, function(err, jsonAttributes) {
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
                configmgmtDao.getChefServerDetails(bootstrapData.chef.serverId, function(err, chefDetails) {
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

                    chef.getEnvironment(envName, function(err, env) {
                        if (err) {
                            var error = new Error("Failed chef.getEnvironment");
                            error.status = 500;
                            return callback(error, null);
                        }

                        if (!env) {
                            chef.createEnvironment(envName, function(err) {
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
                            var logsReferenceIds = [bootstrapData.id, actionLog._id];
                            chef.bootstrapInstance(bootstrapInstanceParams, function(err, code) {
                                if (bootstrapInstanceParams.pemFilePath) {
                                    //fs.unlink(bootstrapInstanceParams.pemFilePath);
                                }

                                logger.error('process stopped ==> ', err, code);
                                if (err) {
                                    logger.error("knife launch err ==>", err);
                                    instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'failed', function(err, updateData) {});
                                    var timestampEnded = new Date().getTime();
                                    logsDao.insertLog({
                                        referenceId: logsReferenceIds,
                                        err: true,
                                        log: "Bootstrap failed",
                                        timestamp: timestampEnded
                                    });
                                    instancesModel.updateActionLog(bootstrapData.id, actionLog._id, false, timestampEnded);
                                    return callback(err);
                                } else {
                                    if (code == 0) {
                                        instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'success', function(err, updateData) {
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
                                        instancesModel.updateActionLog(bootstrapData.id, actionLog._id, true, timestampEnded);


                                        chef.getNode(bootstrapData.chefNodeName, function(err, nodeData) {
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
                                            instancesModel.setHardwareDetails(bootstrapData.id, hardwareData, function(err, updateData) {
                                                if (err) {
                                                    logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
                                                } else {
                                                    logger.debug("Instance hardware details set successessfully");
                                                }
                                            });
                                            //Checking docker status and updating
                                            var docker = new Docker();
                                            docker.checkDockerStatus(bootstrapData.id, function(err, retCode) {
                                                if (err) {
                                                    logger.error("Failed docker.checkDockerStatus", err);
                                                    var error = new Error("Failed to check Status from Docker.");
                                                    error.status = 500;
                                                    return;

                                                }
                                                logger.debug('Docker Check Returned:' + retCode);
                                                if (retCode == '0') {
                                                    instancesModel.updateInstanceDockerStatus(bootstrapData.id, "success", '', function(data) {
                                                        logger.debug('Instance Docker Status set to Success');
                                                    });
                                                }
                                            });
                                        });

                                        return callback(null, {
                                            message: "bootstraped"
                                        });

                                    } else {
                                        instancesModel.updateInstanceBootstrapStatus(bootstrapData.id, 'failed', function(err, updateData) {
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
                                        instancesModel.updateActionLog(bootstrapData.id, actionLog._id, false, timestampEnded);

                                        var error = new Error("Bootstrap failed with ret code ==>" + code);
                                        error.status = 500;
                                        return callback(error);
                                    }
                                }

                            }, function(stdOutData) {

                                logsDao.insertLog({
                                    referenceId: logsReferenceIds,
                                    err: false,
                                    log: stdOutData.toString('ascii'),
                                    timestamp: new Date().getTime()
                                });

                            }, function(stdErrData) {

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
            (function(j) {
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

            nexus.getNexusArtifactVersions(blueprint.applications[0].repoId, repoName, groupId, artifactId, function(err, data) {
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

                    nexus.getNexusArtifact(blueprint.applications[0].repoId, repoName, groupId, function(err, artifacts) {
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
                        configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
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
                            AppData.createNewOrUpdate(appData, function(err, data) {
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
            configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
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
                AppData.createNewOrUpdate(appData, function(err, data) {
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
};

instanceService.getInstanceActionList = function getInstanceActionList(callback) {

    instancesDao.listInstances(function(err, list) {
        if (err) {
            logger.debug("Error while fetching instance actionLog: ", err);
            return callback(err, null);
        }
        var count = 0;
        if (list && list.length) {
            var actionLogs = [];
            for (var i = 0; i < list.length; i++) {
                (function(i) {
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
    instancesDao.getActionLogsById(actionId, function(err, action) {
        if (err) {
            logger.error("Failed to fetch Instance Action: ", err);
            return callback(err, null);
        }
        if (action && action.length) {
            var instanceAction = JSON.parse(JSON.stringify(action[0].actionLogs[0]));
            logsDao.getLogsByReferenceId(actionId, null, function(err, data) {
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
    containerModel.deleteContainerByInstanceId(instanceId, function(err, container) {
        if (err) {
            logger.error("Container deletion Failed >> ", err);
            callback(err, null);
            return;
        } else {
            instancesModel.removeInstanceById(instanceId, function(err, data) {
                if (err) {
                    logger.error("Instance deletion Failed >> ", err);
                    callback(err, null);
                    return;
                }
                callback(err, data);
            });
        }
    });
};

function removeInstancesByProviderId(providerId, callback) {
    async.parallel({
        managedInstance: function(callback) {
            instancesModel.removeInstancesByProviderId(providerId, callback);
        },
        assignedInstance: function(callback) {
            unManagedInstancesModel.removeInstancesByProviderId(providerId, callback);
        },
        unassignedInstance: function(callback) {
            unassignedInstancesModel.removeInstancesByProviderId(providerId, callback);
        },
        resources: function(callback) {
            resources.removeResourcesByProviderId(providerId, callback);
        },
        resourcesCost: function(callback) {
            resourceCost.removeResourceCostByProviderId(providerId, callback);
        },
        resourcesUsage: function(callback) {
            resourceUsage.removeResourceUsageByProviderId(providerId, callback);
        },
        resourcesTags: function(callback) {
            tagsModel.removeTagsByProviderId(providerId, callback);
        }
    }, function(err, results) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    })
}

function instanceSyncWithAWS(instanceId, instanceData, providerDetails, callback) {
    async.waterfall([
        function(next) {
            instancesModel.getInstanceById(instanceId, next);
        },
        function(instances, next) {
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
                };
                if (instanceData.state === 'terminated' && instance.instanceState === 'shutting-down') {
                    instanceLogModel.getLogsByInstanceIdStatus(instance._id, instance.instanceState, function(err, data) {
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
                            referenceId: [data.actionId, data.instanceId],
                            err: false,
                            log: "Instance " + instanceData.state,
                            timestamp: timestampStarted
                        });
                        instanceLogModel.createOrUpdate(data.actionId, instance._id, data, function(err, logData) {
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
        function(paramList, next) {
            async.parallel({
                instanceDataSync: function(callback) {
                    instancesModel.updateInstanceStatus(instanceId, instanceData, callback);
                },
                route53Sync: function(callback) {
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
                            (function(params) {
                                params.ChangeBatch.Changes[0].Action = 'DELETE';
                                route53.changeResourceRecordSets(params, function(err, data) {
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
            }, function(err, results) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            })

        }
    ], function(err, results) {
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
    var logReferenceIds = [instance._id, actionLog._id];
    logsDao.insertLog({
        referenceId: logReferenceIds,
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
    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
            next(err, null);
        }
        next(null, routeHostedZoneParamList);
    });
}

function executeScheduleJob(instance) {
    logger.debug("Instance scheduler::::: ");
    var currentDate = new Date();
    async.parallel({
        instanceStartSchedule: function(callback){
            if(instance[0].isInstanceStartScheduled === false){
                logger.debug("Instance cannot start schedule for Start");
                callback(null,null);
            }
            if (instance[0].isInstanceStartScheduled === true && currentDate >= instance[0].instanceStartScheduler.endOn) {
                instancesDao.updateInstanceScheduler(instance[0]._id,'start',function(err, updatedData) {
                    if (err) {
                        logger.error("Failed to update task: ", err);
                        callback(err,null);
                    }
                });
            }else{
                var startJobId = crontab.scheduleJob(instance[0].instanceStartScheduler.cronPattern, function() {
                    startInstance(instance[0]._id,instance[0].catUser,function(err,callback){
                        if(err){
                            callback(err,null);
                        }
                        callback(null,startJobId);
                    });
                });
            }
        },
        instanceStopSchedule: function(callback){
            if(instance[0].isInstanceStopScheduled === false){
                logger.debug("Instance cannot start schedule for Stop");
                callback(null,null);
            }
            if (instance[0].isInstanceStopScheduled === true && currentDate >= instance[0].instanceStopScheduler.endOn) {
                instancesDao.updateInstanceScheduler(instance[0]._id,'stop',function(err, updatedData) {
                    if (err) {
                        logger.error("Failed to update task: ", err);
                        callback(err,null);
                    }
                });
            }else{
                var stopJobId = crontab.scheduleJob(instance[0].instanceStopScheduler.cronPattern, function() {
                    logger.debug("Stop api called...");
                    stopInstance(instance[0]._id,instance[0].catUser,function(err,callback){
                        if(err){
                            callback(err,null);
                        }
                        callback(null,startJobId);
                    });
                });
            }
        }
    },function(err,results){
        if(err){
            logger.error(err);
            return;
        }else{
            logger.debug("Instance Scheduler Finished");
            return;
        }
    })
}

function startInstance(instanceId,catUser, callback) {
    instancesDao.getInstanceById(instanceId, function (err, data) {
        if (err) {
            var error = new Error("Internal Server Error.");
            error.status = 500;
            callback(error, null);
            return;
        }
        if (data.length > 0) {
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
                user: catUser,
                createdOn: new Date().getTime(),
                startedOn: new Date().getTime(),
                providerType: data[0].providerType,
                action: "Start",
                logs: []
            };
            if (data[0].providerType && data[0].providerType == 'vmware') {
                vmwareCloudProvider.getvmwareProviderById(data[0].providerId, function (err, providerdata) {
                    var timestampStarted = new Date().getTime();
                    var actionLog = instancesDao.insertStartActionLog(instanceId, catUser, timestampStarted);
                    var logReferenceIds = [instanceId];
                    if (actionLog) {
                        logReferenceIds.push(actionLog._id);
                    }
                    logger.debug('IN getvmwareProviderById: data: ');
                    logger.debug(JSON.stringify(data));
                    var vmwareconfig = {
                        host: '',
                        username: '',
                        password: '',
                        dc: '',
                        serviceHost: ''
                    };
                    if (providerdata) {
                        vmwareconfig.host = providerdata.host;
                        vmwareconfig.username = providerdata.username;
                        vmwareconfig.password = providerdata.password;
                        vmwareconfig.dc = providerdata.dc;
                        vmwareconfig.serviceHost = appConfig.vmware.serviceHost;
                        logger.debug('IN getvmwareProviderById: vmwareconfig: ');
                    } else {
                        vmwareconfig = null;
                    }
                    if (vmwareconfig) {
                        var vmware = new VMware(vmwareconfig);
                        vmware.startstopVM(vmwareconfig.serviceHost, data[0].platformId, 'poweron', function (err, vmdata) {
                            if (!err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: false,
                                    log: "Instance Starting",
                                    timestamp: timestampEnded
                                });
                                instanceLog.actionId = actionLog._id;
                                instanceLog.logs = {
                                    err: false,
                                    log: "Instance Starting",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                instancesDao.updateInstanceState(instanceId, 'running', function (err, updateCount) {
                                    if (err) {
                                        logger.error("update instance state err ==>", err);
                                        return;
                                    }
                                    logger.debug('instance state updated');
                                });
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: false,
                                    log: "Instance Started",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.status = "running";
                                instanceLog.actionStatus = "success";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Instance Started",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                callback(null, {
                                    instanceCurrentState: 'running',
                                    actionLogId: actionLog._id
                                });
                                return;
                            } else {
                                logger.debug('Error in action query :', err);
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: timestampEnded
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var error = new Error("Internal Server Error.");
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                        });
                    } else {
                        logger.debug('No Provider found :');
                        var error = new Error("No Provider found.");
                        error.status = 400;
                        callback(error, null);
                        return;
                    }
                });
            } else if (data[0].keyPairId && data[0].keyPairId == 'azure') {
                logger.debug("Starting Azure instance..");
                var timestampStarted = new Date().getTime();
                var actionLog = instancesDao.insertStopActionLog(instanceId, catUser, timestampStarted);
                var logReferenceIds = [instanceId];
                if (actionLog) {
                    logReferenceIds.push(actionLog._id);
                }
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: false,
                    log: "Instance Starting",
                    timestamp: timestampStarted
                });
                instanceLog.actionId = actionLog._id;
                instanceLog.logs = {
                    err: false,
                    log: "Instance Starting",
                    timestamp: new Date().getTime()
                };
                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });
                if (!data[0].providerId) {
                    var error = new Error("Insufficient provider details, to complete the operation");
                    error.status = 500;
                    callback(error, null);
                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: true,
                        log: "Insufficient provider details, to complete the operation",
                        timestamp: new Date().getTime()
                    });
                    instanceLog.endedOn = new Date().getTime();
                    instanceLog.actionStatus = "failed";
                    instanceLog.logs = {
                        err: true,
                        log: "Insufficient provider details, to complete the operation",
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });
                    return;
                }
                azureProvider.getAzureCloudProviderById(data[0].providerId, function (err, providerdata) {
                    if (err) {
                        logger.error('getAzureCloudProviderById ', err);
                        return;
                    }
                    logger.debug('providerdata:', providerdata);
                    providerdata = JSON.parse(providerdata);
                    var settings = appConfig;
                    var pemFile = settings.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
                    var keyFile = settings.instancePemFilesDir + providerdata._id + providerdata.keyFileName;
                    logger.debug("pemFile path:", pemFile);
                    logger.debug("keyFile path:", pemFile);
                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                    var uniqueVal = uuid.v4().split('-')[0];
                    var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
                    var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
                    cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function (err) {
                        if (err) {
                            logger.error('Pem file decryption failed>> ', err);
                            return;
                        }
                        cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function (err) {
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
                            azureCloud.startVM(data[0].chefNodeName, function (err, currentState) {
                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: true,
                                            log: "Unable to start instance",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Unable to start instance",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        var error = new Error({
                                            actionLogId: actionLog._id
                                        });
                                        error.status = 500;
                                        callback(error, null);
                                        return;
                                    }
                                    logger.debug("Exit get() for /instances/%s/startInstance", instanceId);
                                    callback(null, {
                                        instanceCurrentState: currentState,
                                        actionLogId: actionLog._id
                                    });
                                    instancesDao.updateInstanceState(instanceId, "starting", function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance state err ==>", err);
                                            return;
                                        }
                                        logger.debug('instance state upadated');
                                    });
                                },
                                function (err, state) {
                                    if (err) {
                                        return callback(err, null);
                                    }
                                    instancesDao.updateInstanceState(instanceId, "running", function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance state err ==>", err);
                                            return callback(err, null);
                                        }

                                        logger.debug('instance state upadated');
                                    });

                                    var timestampEnded = new Date().getTime();

                                    logsDao.insertLog({
                                        referenceId: logReferenceIds,
                                        err: false,
                                        log: "Instance Started",
                                        timestamp: timestampEnded
                                    });
                                    instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.status = "running";
                                    instanceLog.actionStatus = "success";
                                    instanceLog.logs = {
                                        err: false,
                                        log: "Instance Started",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    fs.unlink(decryptedPemFile, function (err) {
                                        logger.debug("Deleting decryptedPemFile..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedPemFile..");
                                        }

                                        fs.unlink(decryptedKeyFile, function (err) {
                                            logger.debug("Deleting decryptedKeyFile ..");
                                            if (err) {
                                                logger.error("Error in deleting decryptedKeyFile..");
                                            }
                                        });
                                    });
                                });
                        });
                    });
                })
            }
            else if (data[0].providerType && data[0].providerType == 'gcp') {
                var providerService = require('_pr/services/providerService.js');
                var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
                var GCP = require('_pr/lib/gcp.js');
                providerService.getProvider(data[0].providerId, function (err, provider) {
                    if (err) {
                        var error = new Error("Error while fetching Provider.");
                        error.status = 500;
                        callback(error, null);
                        return;
                    }
                    var gcpProvider = new gcpProviderModel(provider);
                    // Get file from provider decode it and save, after use delete file
                    // Decode file content with base64 and save.
                    var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
                    fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded);
                    var params = {
                        "projectId": gcpProvider.providerDetails.projectId,
                        "keyFilename": '/tmp/' + provider.id + '.json'
                    }
                    var gcp = new GCP(params);
                    var gcpParam = {
                        "zone": data[0].zone,
                        "name": data[0].name
                    }

                    var timestampStarted = new Date().getTime();
                    var actionLog = instancesDao.insertStartActionLog(instanceId, catUser, timestampStarted);
                    var logReferenceIds = [instanceId];
                    if (actionLog) {
                        logReferenceIds.push(actionLog._id);
                    }


                    logsDao.insertLog({
                        referenceId: logReferenceIds,
                        err: false,
                        log: "Instance Starting",
                        timestamp: timestampStarted
                    });

                    instanceLog.actionId = actionLog._id;
                    instanceLog.logs = {
                        err: false,
                        log: "Instance Starting",
                        timestamp: new Date().getTime()
                    };
                    instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                        if (err) {
                            logger.error("Failed to create or update instanceLog: ", err);
                        }
                    });

                    gcp.startVM(gcpParam, function (err, vmResponse) {
                        if (err) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                                    if (err) {
                                        logger.error("Unable to delete json file.");
                                    }
                                });
                                var error = new Error({
                                    actionLogId: actionLog._id
                                });
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                        } else {
                            instancesDao.updateInstanceIp(instanceId, vmResponse.ip, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance ip err ==>", err);
                                    return;
                                }
                                logger.debug('instance ip upadated');
                            });
                            instancesDao.updateInstanceState(instanceId, "running", function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return;
                                }
                                logger.debug('instance state upadated');
                            });
                            callback(null, {
                                instanceCurrentState: "running",
                                actionLogId: actionLog._id
                            });
                            var timestampEnded = new Date().getTime()
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: false,
                                log: "Instance Started",
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.status = "running";
                            instanceLog.actionStatus = "success";
                            instanceLog.logs = {
                                err: false,
                                log: "Instance Started",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                                if (err) {
                                    logger.error("Unable to delete json file.");
                                }
                            });
                        }
                    });
                });
            } else {
                AWSProvider.getAWSProviderById(data[0].providerId, function (err, aProvider) {
                    if (err) {
                        logger.error(err);
                        var error = new Error("Unable to find Provider.");
                        error.status = 500;
                        callback(error, null);
                        return;
                    }
                    function getRegion(callback) {
                        if (data[0].providerData && data[0].providerData.region) {
                            process.nextTick(function () {
                                callback(null, data[0].providerData.region);
                            });
                        } else {
                            AWSKeyPair.getAWSKeyPairByProviderId(aProvider._id, function (err, keyPair) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                callback(null, keyPair[0].region);
                            });
                        }
                    }
                    getRegion(function (err, region) {
                        if (err) {
                            var error = new Error("Error while fetching Keypair.");
                            error.status = 500;
                            callback(error, null);
                            return;
                        }
                        var timestampStarted = new Date().getTime();
                        var actionLog = instancesDao.insertStartActionLog(instanceId, catUser, timestampStarted);
                        var logReferenceIds = [instanceId];
                        if (actionLog) {
                            logReferenceIds.push(actionLog._id);
                        }
                        logsDao.insertLog({
                            referenceId: logReferenceIds,
                            err: false,
                            log: "Instance Starting",
                            timestamp: timestampStarted
                        });
                        instanceLog.actionId = actionLog._id;
                        instanceLog.logs = {
                            err: false,
                            log: "Instance Starting",
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                        });
                        var ec2;
                        if (aProvider.isDefault) {
                            ec2 = new EC2({
                                "isDefault": true,
                                "region": region
                            });
                        } else {
                            var cryptoConfig = appConfig.cryptoSettings;
                            var cryptography = new Cryptography(cryptoConfig.algorithm,
                                cryptoConfig.password);
                            var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                            var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                            ec2 = new EC2({
                                "access_key": decryptedAccessKey,
                                "secret_key": decryptedSecretKey,
                                "region": region
                            });
                        }
                        ec2.startInstance([data[0].platformId], function (err, startingInstances) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionId = actionLog._id;
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: "Unable to start instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var error = new Error({
                                    actionLogId: actionLog._id
                                });
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                            logger.debug("Exit get() for /instances/%s/startInstance", instanceId);
                            callback(null, {
                                instanceCurrentState: startingInstances[0].CurrentState.Name,
                                actionLogId: actionLog._id
                            });
                            instancesDao.updateInstanceState(instanceId, startingInstances[0].CurrentState.Name, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance state upadated');
                            });

                        }, function (err, state) {
                            if (err) {
                                return callback(err, null);
                            }
                            instancesDao.updateInstanceState(instanceId, state, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance state upadated');
                            });
                            var timestampEnded = new Date().getTime()
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: false,
                                log: "Instance Started",
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.status = state;
                            instanceLog.actionStatus = "success";
                            instanceLog.logs = {
                                err: false,
                                log: "Instance Started",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, data[0]._id, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            ec2.describeInstances([data[0].platformId], function (err, data) {
                                if (err) {
                                    logger.error("Hit some error: ", err);
                                    return callback(err, null);
                                }
                                if (data.Reservations.length && data.Reservations[0].Instances.length) {
                                    logger.debug("ip =>", data.Reservations[0].Instances[0].PublicIpAddress);
                                    instancesDao.updateInstanceIp(instanceId, data.Reservations[0].Instances[0].PublicIpAddress, function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance ip err ==>", err);
                                            return callback(err, null);
                                        }
                                        logger.debug('instance ip upadated');
                                    });
                                }
                            });
                        });
                    });
                });
            }

        } else {
            var error = new Error();
            error.status = 404;
            callback(error, null);
            return;
        }
    });
}

function stopInstance(instanceId, catUser, callback) {
    instancesDao.getInstanceById(instanceId, function(err, data) {
        if (err) {
            logger.error("Error hits getting instance: ", err);
            var error = new Error("Error hits getting instance");
            error.status = 500;
            callback(error, null);
            return;
        }
        logger.debug("data.providerId: ::::   ", JSON.stringify(data[0]));
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
                user: catUser,
                createdOn: new Date().getTime(),
                startedOn: new Date().getTime(),
                providerType: data[0].providerType,
                action: "Stop",
                logs: []
            };
            var timestampStarted = new Date().getTime();
            var actionLog = instancesDao.insertStopActionLog(instanceId, catUser, timestampStarted);
            var logReferenceIds = [instanceId];
            if (actionLog) {
                logReferenceIds.push(actionLog._id);
            }
            logsDao.insertLog({
                referenceId: logReferenceIds,
                err: false,
                log: "Instance Stopping",
                timestamp: timestampStarted
            });
            instanceLog.actionId = actionLog._id;
            instanceLog.logs = {
                err: false,
                log: "Instance Stopping",
                timestamp: new Date().getTime()
            };
            instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                if (err) {
                    logger.error("Failed to create or update instanceLog: ", err);
                }
            });
            if (!data[0].providerId) {
                var error = new Error("Insufficient provider details, to complete the operation");
                error.status = 500;
                callback(error, null);
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: true,
                    log: "Insufficient provider details, to complete the operation",
                    timestamp: new Date().getTime()
                });
                instanceLog.endedOn = new Date().getTime();
                instanceLog.actionStatus = "failed";
                instanceLog.logs = {
                    err: false,
                    log: "Insufficient provider details, to complete the operation",
                    timestamp: new Date().getTime()
                };
                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });
                return;
            }
            if (data[0].providerType && data[0].providerType == 'vmware') {
                vmwareCloudProvider.getvmwareProviderById(data[0].providerId, function (err, providerdata) {
                    logger.debug('IN getvmwareProviderById: data: ');
                    var vmwareconfig = {
                        host: '',
                        username: '',
                        password: '',
                        dc: '',
                        serviceHost: ''
                    };
                    if (data) {
                        vmwareconfig.host = providerdata.host;
                        vmwareconfig.username = providerdata.username;
                        vmwareconfig.password = providerdata.password;
                        vmwareconfig.dc = providerdata.dc;
                        vmwareconfig.serviceHost = appConfig.vmware.serviceHost;
                        logger.debug('IN getvmwareProviderById: vmwareconfig: ');
                        logger.debug(JSON.stringify(appConfig.vmware));
                        logger.debug(JSON.stringify(vmwareconfig));
                    } else {
                        vmwareconfig = null;
                    }
                    if (vmwareconfig) {
                        var vmware = new VMware(vmwareconfig);
                        vmware.startstopVM(vmwareconfig.serviceHost, data[0].platformId, 'poweroff', function (err, vmdata) {
                            if (!err) {
                                var timestampEnded = new Date().getTime();

                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: false,
                                    log: "Instance Stopping",
                                    timestamp: timestampEnded
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.status = "stopped";
                                instanceLog.actionStatus = "success";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Instance Stopping",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                instancesDao.updateInstanceState(instanceId, 'stopped', function (err, updateCount) {
                                    if (err) {
                                        logger.error("update instance state err ==>", err);
                                        return callback(err, null);
                                    }
                                    logger.debug('instance state upadated');
                                });
                                var timestampEnded = new Date().getTime();


                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: false,
                                    log: "Instance Stopped",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "success";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Instance Stopped",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                callback(null, {
                                    instanceCurrentState: 'stopped',
                                    actionLogId: actionLog._id
                                });
                                return;
                            } else {
                                logger.debug('Error in action query :', err);
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to stop instance",
                                    timestamp: timestampEnded
                                });
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Unable to stop instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var error = new Error();
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                        });
                    } else {
                        //no provider found.
                        logger.debug('No Provider found :');
                        var error = new Error("No Provider found");
                        error.status = 404;
                        callback(error, null);
                        return;
                    }
                });

            } else if (data[0].providerType && data[0].providerType == 'openstack') {
                var timestampEnded = new Date().getTime();
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: true,
                    log: "Unable to stop openstack instance",
                    timestamp: timestampEnded
                });
                instanceLog.endedOn = new Date().getTime();
                instanceLog.actionStatus = "failed";
                instanceLog.logs = {
                    err: true,
                    log: "Unable to stop openstack instance",
                    timestamp: new Date().getTime()
                };
                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                    }
                });
                var error = new Error({
                    message: "Unable to stop openstack instance "
                });
                error.status = 500;
                callback(error, null);

            } else if (data[0].keyPairId && data[0].keyPairId == 'azure') {

                logger.debug("Stopping Azure ");

                azureProvider.getAzureCloudProviderById(data[0].providerId, function (err, providerdata) {
                    if (err) {
                        logger.error('getAzureCloudProviderById ', err);
                        return callback(err, null);
                    }

                    logger.debug('providerdata:', providerdata);
                    providerdata = JSON.parse(providerdata);

                    var settings = appConfig;
                    var pemFile = settings.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
                    var keyFile = settings.instancePemFilesDir + providerdata._id + providerdata.keyFileName;

                    logger.debug("pemFile path:", pemFile);
                    logger.debug("keyFile path:", pemFile);

                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

                    var uniqueVal = uuid.v4().split('-')[0];

                    var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
                    var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';

                    cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function (err) {
                        if (err) {
                            logger.error('Pem file decryption failed>> ', err);
                            return callback(err, null);
                        }

                        cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function (err) {
                            if (err) {
                                logger.error('key file decryption failed>> ', err);
                                return callback(err, null);
                            }

                            var options = {
                                subscriptionId: providerdata.subscriptionId,
                                certLocation: decryptedPemFile,
                                keyLocation: decryptedKeyFile
                            };

                            var azureCloud = new AzureCloud(options);

                            azureCloud.shutDownVM(data[0].chefNodeName, function (err, currentState) {

                                    if (err) {
                                        var timestampEnded = new Date().getTime();
                                        logsDao.insertLog({
                                            referenceId: logReferenceIds,
                                            err: true,
                                            log: "Unable to stop instance",
                                            timestamp: timestampEnded
                                        });
                                        instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                        instanceLog.endedOn = new Date().getTime();
                                        instanceLog.actionStatus = "failed";
                                        instanceLog.logs = {
                                            err: true,
                                            log: "Unable to stop instance",
                                            timestamp: new Date().getTime()
                                        };
                                        instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                            if (err) {
                                                logger.error("Failed to create or update instanceLog: ", err);
                                            }
                                        });
                                        var error = new Error({
                                            actionLogId: actionLog._id
                                        });
                                        error.status = 500;
                                        callback(error, null);
                                        return;
                                    }

                                    logger.debug("Exit get() for /instances/%s/stopInstance", instanceId);
                                    callback(null, {
                                        instanceCurrentState: currentState,
                                        actionLogId: actionLog._id
                                    });

                                    instancesDao.updateInstanceState(instanceId, "stopping", function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance state err ==>", err);
                                            return callback(err, null);
                                        }
                                        logger.debug('instance state upadated');
                                    });


                                },
                                function (err, state) {
                                    if (err) {
                                        return callback(err, null);
                                    }
                                    instancesDao.updateInstanceState(instanceId, 'stopped', function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance state err ==>", err);
                                            return callback(err, null);
                                        }

                                        logger.debug('instance state upadated');
                                    });

                                    var timestampEnded = new Date().getTime();

                                    logsDao.insertLog({
                                        referenceId: logReferenceIds,
                                        err: false,
                                        log: "Instance Stopped",
                                        timestamp: timestampEnded
                                    });

                                    instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                                    instanceLog.endedOn = new Date().getTime();
                                    instanceLog.status = "stopped";
                                    instanceLog.actionStatus = "success";
                                    instanceLog.logs = {
                                        err: false,
                                        log: "Instance Stopped",
                                        timestamp: new Date().getTime()
                                    };
                                    instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                        if (err) {
                                            logger.error("Failed to create or update instanceLog: ", err);
                                        }
                                    });
                                    fs.unlink(decryptedPemFile, function (err) {
                                        logger.debug("Deleting decryptedPemFile..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedPemFile..");
                                        }

                                        fs.unlink(decryptedKeyFile, function (err) {
                                            logger.debug("Deleting decryptedKeyFile ..");
                                            if (err) {
                                                logger.error("Error in deleting decryptedKeyFile..");
                                            }
                                        });
                                    });
                                });

                        });
                    });
                });

            } else if (data[0].providerType && data[0].providerType == 'gcp') {
                providerService.getProvider(data[0].providerId, function (err, provider) {
                    if (err) {
                        var error = new Error("Error while fetching Provider.");
                        error.status = 500;
                        callback(error, null);
                        return;
                    }
                    var gcpProvider = new gcpProviderModel(provider);
                    // Get file from provider decode it and save, after use delete file
                    // Decode file content with base64 and save.
                    var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
                    fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded);
                    var params = {
                        "projectId": gcpProvider.providerDetails.projectId,
                        "keyFilename": '/tmp/' + provider.id + '.json'
                    }
                    var gcp = new GCP(params);
                    var gcpParam = {
                        "zone": data[0].zone,
                        "name": data[0].name
                    }
                    gcp.stopVM(gcpParam, function (err, vmResponse) {
                        if (err) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to stop instance",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: true,
                                    log: "Unable to stop instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                                    if (err) {
                                        logger.error("Unable to delete json file.");
                                    }
                                });
                                var error = new Error({
                                    actionLogId: actionLog._id
                                });
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                        } else {
                            instancesDao.updateInstanceIp(instanceId, vmResponse.ip, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance ip err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance ip upadated');
                            });
                            instancesDao.updateInstanceState(instanceId, "stopped", function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance state upadated');
                            });
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: false,
                                log: "Instance Stopped",
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.status = "stopped";
                            instanceLog.actionStatus = "success";
                            instanceLog.logs = {
                                err: false,
                                log: "Instance Stopped",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                            callback(null, {
                                instanceCurrentState: "stopped",
                                actionLogId: actionLog._id
                            });

                            fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                                if (err) {
                                    logger.error("Unable to delete json file.");
                                }
                            });
                        }
                    });
                });
            } else {
                AWSProvider.getAWSProviderById(data[0].providerId, function (err, aProvider) {
                    if (err) {
                        logger.error(err);
                        var error = new Error("Unable to get Provider.");
                        error.status = 500;
                        callback(error, null);
                        return;
                    }

                    function getRegion(callback) {
                        if (data[0].providerData && data[0].providerData.region) {
                            process.nextTick(function () {
                                callback(null, data[0].providerData.region);
                            });
                        } else {
                            AWSKeyPair.getAWSKeyPairByProviderId(aProvider._id, function (err, keyPair) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                }
                                callback(null, keyPair[0].region);
                            });

                        }

                    }

                    getRegion(function (err, region) {

                        if (err) {
                            var error = new Error("Error getting to fetch Keypair.");
                            error.status = 500;
                            callback(error, null);
                        }

                        var ec2;
                        if (aProvider.isDefault) {
                            ec2 = new EC2({
                                "isDefault": true,
                                "region": region
                            });
                        } else {
                            var cryptoConfig = appConfig.cryptoSettings;
                            var cryptography = new Cryptography(cryptoConfig.algorithm,
                                cryptoConfig.password);

                            var decryptedAccessKey = cryptography.decryptText(aProvider.accessKey,
                                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                            var decryptedSecretKey = cryptography.decryptText(aProvider.secretKey,
                                cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

                            ec2 = new EC2({
                                "access_key": decryptedAccessKey,
                                "secret_key": decryptedSecretKey,
                                "region": region
                            });
                        }

                        ec2.stopInstance([data[0].platformId], function (err, stoppingInstances) {
                            if (err) {
                                var timestampEnded = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: logReferenceIds,
                                    err: true,
                                    log: "Unable to stop instance",
                                    timestamp: timestampEnded
                                });
                                instancesDao.updateActionLog(instanceId, actionLog._id, false, timestampEnded);
                                instanceLog.endedOn = new Date().getTime();
                                instanceLog.actionStatus = "failed";
                                instanceLog.logs = {
                                    err: false,
                                    log: "Unable to stop instance",
                                    timestamp: new Date().getTime()
                                };
                                instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                var error = new Error({
                                    actionLogId: actionLog._id
                                });
                                error.status = 500;
                                callback(error, null);
                                return;
                            }
                            logger.debug("Exit get() for /instances/%s/stopInstance", instanceId);
                            callback(null, {
                                instanceCurrentState: stoppingInstances[0].CurrentState.Name,
                                actionLogId: actionLog._id
                            });

                            instancesDao.updateInstanceState(instanceId, stoppingInstances[0].CurrentState.Name, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance state upadated');
                            });

                        }, function (err, state) {
                            if (err) {
                                return callback(err, null);
                            }

                            instancesDao.updateInstanceState(instanceId, state, function (err, updateCount) {
                                if (err) {
                                    logger.error("update instance state err ==>", err);
                                    return callback(err, null);
                                }
                                logger.debug('instance state upadated');
                            });
                            var timestampEnded = new Date().getTime();
                            logsDao.insertLog({
                                referenceId: logReferenceIds,
                                err: false,
                                log: "Instance Stopped",
                                timestamp: timestampEnded
                            });
                            instancesDao.updateActionLog(instanceId, actionLog._id, true, timestampEnded);
                            instanceLog.endedOn = new Date().getTime();
                            instanceLog.status = "stopped";
                            instanceLog.actionStatus = "success";
                            instanceLog.logs = {
                                err: false,
                                log: "Instance Stopped",
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(actionLog._id, instanceId, instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                            });
                        });
                    });
                });
            }


        } else {
            var error = new Error();
            error.status = 404;
            callback(error, null);
            return;
        }
    });
}

function updateScheduler(instanceScheduler, callback) {
    async.waterfall([
        function(next){
            var scheduler= {
                instanceStartScheduler:createCronJobPattern(instanceScheduler.instanceStartScheduler),
                instanceStopScheduler:createCronJobPattern(instanceScheduler.instanceStopScheduler),
                isScheduled:instanceScheduler.isScheduled
            };
            next(null,scheduler);
        },
        function(schedulerDetails,next){
            instancesDao.updateScheduler(instanceScheduler.instanceIds, schedulerDetails,next);
        }
    ],function(err,results){
        if(err){
            return callback(err, null);
        }else{
            var count = 0
            for(var i = 0;i < instanceScheduler.instanceIds.length; i++){
                (function(instanceId){
                    instancesDao.getInstanceById(instanceId, function(err, instance) {
                        if (err) {
                            logger.error("Failed to get Instance: ", err);
                            return
                        }
                        if(instance.length > 0 && instanceScheduler.isScheduled){
                            executeScheduleJob(instance);
                        }
                    });
                })(instanceScheduler.instanceIds[i]);
            }
            callback(null, {"message": "Scheduler Updated."});
        }
    });
}

function createCronJobPattern(instanceScheduler){
    if(instanceScheduler.repeats ==='Minutes'){
        instanceScheduler.pattern = '*/'+instanceScheduler.repeatEvery+' * * * *';
    }else if(instanceScheduler.repeats ==='Hourly'){
        instanceScheduler.pattern = '0 */'+instanceScheduler.repeatEvery+' * * *';
    }else if(instanceScheduler.repeats ==='Daily'){
        var startOn = new Date(instanceScheduler.startOn);
        var startHours= startOn.getHours();
        var startMinutes= startOn.getMinutes();
        instanceScheduler.pattern = startMinutes+' '+startHours+' */'+instanceScheduler.repeatEvery+' * *';
    }else if(instanceScheduler.repeats ==='Weekly') {
        var startOn = new Date(instanceScheduler.startOn);
        var startDay= startOn.getDay();
        var startHours= startOn.getHours();
        var startMinutes= startOn.getMinutes();
        if(instanceScheduler.repeatEvery === 2) {
            instanceScheduler.pattern = startMinutes+' '+startHours+' 8-14 * ' + startDay;
        }else if(instanceScheduler.repeatEvery === 3) {
            instanceScheduler.pattern = startMinutes+' '+startHours+' 15-21 * ' + startDay;
        }else if(instanceScheduler.repeatEvery === 4) {
            instanceScheduler.pattern = startMinutes+' '+startHours+' 22-28 * ' + startDay;
        }else{
            instanceScheduler.pattern = startMinutes+' '+startHours+' * * ' + startDay;
        }
    }
    if(instanceScheduler.repeats ==='Monthly') {
        var startOn = new Date(instanceScheduler.startOn);
        var startDate= startOn.getDate();
        var startMonth= startOn.getMonth();
        var startDay= startOn.getDay();
        var startHours= startOn.getHours();
        var startMinutes= startOn.getMinutes();
        if(instanceScheduler.repeatEvery === 1) {
            instanceScheduler.pattern = startMinutes+' '+startHours+' '+startDate+' * *';
        }else{
            instanceScheduler.pattern = startMinutes+' '+startHours+' '+startDate+' */'+instanceScheduler.repeatEvery+' *';
        }
    }
    if(instanceScheduler.repeats ==='Yearly') {
        var startOn = new Date(instanceScheduler.startOn);
        var startDate= startOn.getDate();
        var startYear= startOn.getFullYear();
        var startMonth= startOn.getMonth();
        var startHours= startOn.getHours();
        var startMinutes= startOn.getMinutes();
        instanceScheduler.pattern ='0 '+startMinutes+' '+startHours+' '+startDate+' '+startMonth+' ? '+startYear/instanceScheduler.repeatEvery;
    }
    var scheduler = {
        "startOn": new Date(instanceScheduler.startOn),
        "endOn": new Date(instanceScheduler.endOn),
        "repeats": instanceScheduler.repeats,
        "repeatEvery": instanceScheduler.repeatEvery,
        "pattern":instanceScheduler.pattern
    }
    return scheduler;
}
