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

var unassignedInstancesModel = require('_pr/model/unassigned-instances/');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var EC2 = require('_pr/lib/ec2.js');
var Cryptography = require('../lib/utils/cryptography');
var tagsModel = require('_pr/model/tags/tags.js');

var instanceService = module.exports = {};
instanceService.checkIfUnassignedInstanceExists = checkIfUnassignedInstanceExists;
instanceService.getUnassignedInstancesByProvider = getUnassignedInstancesByProvider;
instanceService.updateUnassignedInstanceProviderTags = updateUnassignedInstanceProviderTags;
instanceService.updateAWSInstanceTag = updateAWSInstanceTag;
instanceService.updateUnassignedInstanceTags = updateUnassignedInstanceTags;
instanceService.createUnassignedInstanceObject = createUnassignedInstanceObject;
instanceService.createUnassignedInstancesList = createUnassignedInstancesList;

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
            } else if(instance && instance.providerId != provider._id) {
                var err = new Error('Forbidden');
                err.status = 403;
                return callback(err);
            } else {
                return callback(null, instance);
            }
    });
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

        // @TODO Change tags schema to improve
        var catalystEntityMappingList = tagMapping.catalystEntityMapping;
        var catalystEntityMapping = {};
        for(var j = 0; j < catalystEntityMappingList.length; j++) {
            catalystEntityMapping[catalystEntityMappingList[j].tagValue]
                = catalystEntityMappingList[j];
        }

        tagMappings[tagMapping.name].catalystEntityMapping = catalystEntityMapping;
    });

    instance.tags = tags;
    var fields = {'tags': instance.tags};
    for(var key in tags) {
        fields.tags[key] = tags[key];
        if((key in tagMappings)
            && (tags[key] in tagMappings[key].catalystEntityMapping)) {

            var tagValue = tags[key];

            switch(tags[key].catalystEntityType) {
                case catalystEntityTypes.PROJECT:
                    fields.project = {
                        'id': tagMappings[key].catalystEntityMapping[tagValue].catalystEntityId,
                        'name': tagMappings[key].catalystEntityMapping[tagValue].catalystEntityName
                    };
                    instance.project = fields.project;
                    break;
                case catalystEntityTypes.ENVIRONMENT:
                    fields.environment = {
                        'id': tagMappings[key].catalystEntityMapping[tagValue].catalystEntityId,
                        'name': tagMappings[key].catalystEntityMapping[tagValue].catalystEntityName
                    };
                    instance.environment = fields.environment;
                    break;
                default:
                    break;
            }
        }
    }

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

function createUnassignedInstanceObject(instance, callback) {
    var instanceObject = instance;

    var provider = {
        'id': instance.providerId,
        'type': instance.providerType,
        'data': instance.providerData?instance.providerData:null,
    };

    instanceObject.provider = provider;
    instanceObject.id = instance._id;
    delete instanceObject._id;

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
        tempInstance.project = instance.project;
        tempInstance.environment = instance.environment;
        tempInstance.tags = instance.tags;

        instancesList.push(tempInstance);
    });

    instancesListObject.instances = instancesList;

    return callback(null, instancesListObject);
}