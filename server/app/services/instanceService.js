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
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var EC2 = require('_pr/lib/ec2.js');
var Cryptography = require('../lib/utils/cryptography');
var tagsModel = require('_pr/model/tags/tags.js');
var async = require('async');

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

function checkIfUnassignedInstanceExists(providerId, instanceId, callback) {
    unassignedInstancesModel.getById(instanceId,
        function(err, instance) {
            if(err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if(!instance) {
                var err = new Error('Instance not found');
                err.status = 404;
                return callback(err);
            } else if(instance && instance.providerId != providerId) {
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
     if(('orgName' in queryObjectAndCondition) && ('$in' in queryObjectAndCondition)) {
        var validOrgs = queryObjectAndCondition['orgName']['$in'].filter(function(orgName) {
            return (orgName in orgs);
        });

        if(validOrgs.length < queryObjectAndCondition['orgName']['$in']) {
            var err = new Error('Forbidden');
            err.status = 403;
            return callback(err);
        } else {
            orgIds = validOrgs.reduce(function(a, b) {
                return a.concat(orgs[b].rowid);
            }, orgIds);
        }
    } else if('orgName' in queryObjectAndCondition) {
        if(queryObjectAndCondition['orgName'] in orgs) {
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

    if('orgName' in queryObjectAndCondition)
        delete filterQuery.queryObj['$and'][0].orgName;

    if(orgIds.length > 0) {
        if(queryObjectAndCondition.providerId) {
            filterQuery.queryObj['$and'][0].orgId = {
                '$in': orgIds
            }
        }else{
            filterQuery.queryObj['$and'][0] = {
                providerId:{'$ne':null},
                orgId:{'$in': orgIds}
            }
        }
    }

    return callback(null, filterQuery);
}

function getUnassignedInstancesByProvider(provider, callback) {
    unassignedInstancesModel.getByProviderId(provider._id, function(err, assignedInstances) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!assignedInstances) {
            return callback(null, []);
        }else {
            return callback(null, assignedInstances);
        }
    });
}

function bulkUpdateInstanceProviderTags(provider, instances, callback) {
    var providerTypes = appConfig.providerTypes;

    if(instances.length > 10) {
        var err = new Error("Invalid request");
        err.status = 400;
        return callback(err);
    } else {
        var unassignedInstances = [];
        for(var i = 0; i < instances.length; i++) {
            (function (j) {
                // @TODO replace with single query
                // @TODO Improve error handling
                unassignedInstancesModel.getById(instances[j].id, function(err, unassignedInstance) {
                    if(err) {
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if(!unassignedInstance) {
                        var err = new Error('Instance not found');
                        err.status = 404;
                        return callback(err);
                    } else if(unassignedInstance) {
                        logger.debug('Update tags for instance ', unassignedInstance._id);
                        for (tagName in instances[j].tags) {
                            unassignedInstance.tags[tagName] = instances[j].tags[tagName];
                        }
                        unassignedInstances.push(unassignedInstance);
                    }

                    if (j == instances.length - 1) {
                        switch(provider.providerType) {
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
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
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
                function(err, instanceUpdated) {
                    if(err) {
                        logger.error(err);
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    } else if(j == instances.length - 1) {
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
            if(err) {
                logger.error(err);
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if(!instance) {
                var err = new Error('Instance not found');
                err.status = 404;
                return callback(err);
            } else if(instance && instance.providerId != provider._id) {
                var err = new Error('Forbidden');
                err.status = 403;
                return callback(err);
            } else {
                switch(provider.providerType) {
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
            if(err) {
                logger.error(err);
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
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

    var fields = {'tags': instance.tags};
    for(var key in tags) {
        fields.tags[key] = tags[key];

        if(key in tagMappings) {
            switch(tagMappings[key].catalystEntityType) {
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
            if(err) {
                logger.error(err);
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if(instanceUpdated) {
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
            unmanaged: function(callback) {
                unManagedInstancesModel.getUnmanagedByProviderId(provider._id, callback);
            }
        },
        function(err, results) {
            if(err) {
                var err = new Error('Internal server error');
                err.status = 500;
                next(err)
            } else {
                /*var instances = results.reduce(function(a, b) {
                 return a.concat(b);
                 }, []);*/
                next(null, provider, results);
            }
        }
    );
}

function getTrackedInstances(query, next) {
    async.parallel([
            function (callback) {
                instancesModel.getAll(query, callback);
            },
            function(callback) {
                unManagedInstancesModel.getAll(query, callback);
            }
        ],
        function(err, results) {
            if(err) {
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
        'data': instance.providerData?instance.providerData:null,
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
            'data': instance.providerData?instance.providerData:null,
        };
        tempInstance.id = instance._id;
        tempInstance.orgId = instance.orgId;
        tempInstance.provider = provider;
        tempInstance.platformId = instance.platformId;
        tempInstance.ip = instance.ip;
        tempInstance.os = instance.os;
        tempInstance.state = instance.state;
        tempInstance.tags = ('tags' in instance)?instance.tags:{};

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
        instanceObj.category = ('chefNodeName' in instance)?'managed':'unmanaged';
        instanceObj.instancePlatformId = instance.platformId;
        instanceObj.orgName = instance.orgName;
        instanceObj.projectName = instance.projectName;
        instanceObj.providerName = instance.providerName;
        instanceObj.providerId = instance.providerId;
        instanceObj.environmentName = instance.environmentName;
        instanceObj.providerType = instance.providerType;
        instanceObj.bgId = ('bgId' in instance)?instance.bgId:null;
        instanceObj.cost = (('cost' in instance) && instance.cost)?instance.cost:0;

        if(('hardware' in instance) && ('os' in instance.hardware))
            instanceObj.os = instance.hardware.os;
        else if('os' in instance)
            instanceObj.os = instance.os;
        else
            instanceObj.os = null;

        if('ip' in instance)
            instanceObj.ip = instance.ip;
        else if('instanceIP' in instance)
            instanceObj.ip = instance.instanceIP;
        else
            instanceObj.ip = null;

        instanceObj.usage = ('usage' in instance)?instance.usage:null;
        instanceObj.cost = ('cost' in instance)?instance.cost:null;

        return instanceObj;
    });

    callback(null, instancesListObject);
}