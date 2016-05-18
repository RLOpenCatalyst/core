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
// @TODO Move tag related functions to a different service
var tagsModel = require('_pr/model/tags/tags.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var logger = require('_pr/logger')(module);
var providersModel = require('_pr/model/providers/providers');
var gcpProviderModel = require('_pr/model/providers/gcp-providers');

const errorType = 'provider';

var providerService = module.exports = {};

providerService.checkIfProviderExists = function checkIfProviderExists(providerId, callback) {
    AWSProvider.getAWSProviderById(providerId, function(err, provider) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!provider) {
            var err = new Error('Provider not found');
            err.status = 404;
            return callback(err);
        } else {
            return callback(null, provider);
        }
    });
};

providerService.getProvider = function getProvider(providerId, callback) {
    providersModel.getById(providerId, function(err, provider) {
        if(err) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else if(provider) {
            callback(null, provider);
        } else {
            var err = new Error('Provider not found');
            err.status = 404;
            callback(err);
        }
    })
}

providerService.createProvider = function createProvider(provider, orgDetails, callback) {
    if(!orgDetails) {
        var err = new Error('Invalid request');
        err.status = 400;
        return callback(err);
    }

    switch(provider.type) {
        case 'GCP':
            logger.debug('Creating new GCP provider');
            provider.organization = {
                id: orgDetails.rowid,
                name: orgDetails.orgname
            };
            delete provider.organizationId;
            gcpProviderModel.createNew(provider, callback);
            break;
        defaut:
            break;
    }
};

providerService.updateProvider = function updateProvider(provider, updateFields, callback) {
    var fields = {};
    if('name' in updateFields) {
        fields.name = updateFields.name;
        provider.name = updateFields.name;
    }

    if('providerDetails' in updateFields) {
        switch(provider.type) {
            case 'GCP':
                if('projectId' in updateFields.providerDetails) {
                    fields.providerDetails.projectId = updateFields.providerDetails.projectId;
                    provider.providerDetails.projectId = updateFields.providerDetails.projectId;
                }

                if('keyFile' in updateFields.providerDetails)
                    fields.providerDetails.keyFile = updateFields.providerDetails.keyFile;

                if('sshKey' in updateFields.providerDetails)
                    fields.providerDetails.sshKey = updateFields.providerDetails.sshKey;
                break;
            default:
                break;
        }
    }

    providersModel.updateById(provider._id, fields, function(err, result) {
        if(err || !result) {
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else if(result) {
            callback(null, provider);
        }
    });
};

providerService.createProviderResponseObject = function createProviderResponseObject(provider, callback) {
    var providerResponseObject = {
        id: provider._id,
        name: provider.name,
        type: provider.type,
        organization: provider.organization,
        providerDetails: {}
    };

    switch(provider.type) {
        case 'GCP':
            var gcpProvider =  new gcpProviderModel(provider);
            providerResponseObject.providerDetails.projectId = gcpProvider.providerDetails.projectId;
            break;
        default:
            break;
    }

    callback(null, providerResponseObject);
}

providerService.getAllProviders = function getAllProviders(orgId, callback) {
    providersModel.getAllProviders(callback);
};

providerService.getTagsByProvider = function getTagsByProvider(provider, callback) {
    tagsModel.getTagsByProviderId(provider._id, function(err, tags) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            callback(err);
        } else {
            return callback(null, tags);
        }
    });
};

providerService.getTagByNameAndProvider
    = function getTagByNameAndProvider(providerId, tagName, callback) {
    var params = {
        'providerId': providerId,
        'name': tagName
    };
    tagsModel.getTag(params, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        }else {
            return callback(null, tag);
        }
    });
};

providerService.getTagMappingsByProviderId
    = function getTagMappingsByProviderId(providerId, callback) {
    tagsModel.getTagsWithMappingByProviderId(providerId,
        function(err, tags) {
            if(err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else if(tags.length == 0) {
                return callback(null, []);
            } else {
                return callback(null, tags);
            }
        }
    );
};

providerService.getTagByCatalystEntityTypeAndProvider
    = function getTagByCatalystEntityTypeAndProvider(providerId, catalystEntityType, callback) {
    // @TODO entity types to be moved to config
    if((catalystEntityType != 'project') && (catalystEntityType != 'environment')) {
        var err = new Error('Malformed Request');
        err.status = 400;
        return callback(err);
    }

    var params = {
        'providerId': providerId,
        'catalystEntityType': catalystEntityType
    };
    tagsModel.getTag(params, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        }else {
            return callback(null, tag);
        }
    });
};

providerService.updateTag = function updateTag(provider, tagDetails, callback) {
    if(!('name' in tagDetails) || !('description' in tagDetails)) {
        var err = new Error('Malformed Request');
        err.status = 400;
        return callback(err);
    }

    var params = {
        'providerId': provider._id,
        'name': tagDetails.name
    };
    var fields = {
        'description': tagDetails.description
    };

    tagsModel.updateTag(params, fields, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        }else {
            var tag = {
                'name': tagDetails.name,
                'description': tagDetails.description
            }
            return callback(null, tag);
        }
    });
};

// @TODO CatalystEntityMapping and values update to be implemented
// @TODO Handle asynchronous updates to guarantee correctness
// @TODO Update conflict based on tag names should be handled
// @TODO Nested callbacks to be handled
providerService.addMultipleTagMappings = function addMultipleTagMappings(providerId, tagMappings, callback) {
    if(tagMappings.length < 1) {
        return callback(null, []);
    }
    logger.debug(tagMappings.length);
    var tagNames = [];

    for(var i = 0; i < tagMappings.length; i++) {
        (function(tagMapping) {
            if (!('tagName' in tagMapping) || !('catalystEntityType' in tagMapping)) {
                var err = new Error('Malformed Request');
                err.status = 400;
                return callback(err);
            }

            // @TODO entity types to be moved to config
            if ((tagMapping.catalystEntityType != 'project')
                && (tagMapping.catalystEntityType != 'environment')) {
                var err = new Error('Malformed Request');
                err.status = 400;
                return callback(err);
            }

            var deleteParams = {
                'providerId': providerId,
                'catalystEntityType': tagMapping.catalystEntityType
            };
            var deleteFields = {
                'catalystEntityType': null,
                'catalystEntityMapping': []
            };
            tagsModel.updateTag(deleteParams, deleteFields, function (err, tag) {

                if (err) {
                    var err = new Error('Internal server error');
                    err.status = 500;
                    return callback(err);
                } else {

                    tagNames.push(tagMapping.tagName);
                    var params = {
                        'providerId': providerId,
                        'name': tagMapping.tagName
                    };
                    var fields = {
                        'catalystEntityType': tagMapping.catalystEntityType
                    };
                    tagsModel.updateTag(params, fields, function (err, tag) {
                        if (err) {
                            var err = new Error('Internal server error');
                            err.status = 500;
                            return callback(err);
                        } else if (!tag) {
                            var err = new Error('Tag not found');
                            err.status = 404;
                            return callback(err);
                        }
                    });

                }

            });
        })(tagMappings[i]);
    }

    if(tagNames.length > 0) {
        return tagsModel.getTagsByProviderIdAndNames(providerId, tagNames, callback);
    } else {
        return callback(null, []);
    }
};

providerService.updateTagMapping = function updateTagMapping(tagDetails, tagMapping, callback) {
    if(!('tagName' in tagMapping) && !('catalystEntityMapping' in tagMapping)) {
        var err = new Error('Malformed Request');
        err.status = 400;
        return callback(err);
    }
    if(!('values' in tagDetails)) {
        var err = new Error('Invalid Request');
        err.status = 400;
        return callback(err);
    }

    var catalystEntityMappingList = [];
    for(var i = 0; i < tagMapping.catalystEntityMapping.length; i++) {
        if(!('tagValue' in tagMapping.catalystEntityMapping[i])
            || !('catalystEntityId' in tagMapping.catalystEntityMapping[i])
            || !('catalystEntityName' in tagMapping.catalystEntityMapping[i])) {
            var err = new Error('Malformed Request');
            err.status = 400;
            return callback(err);
        }

        if((tagMapping.catalystEntityMapping[i].tagValue)
            && (tagDetails.values.indexOf(tagMapping.catalystEntityMapping[i].tagValue) < 0)) {
            var err = new Error('Tag value not found');
            err.status = 404;
            return callback(err);
        }

        catalystEntityMappingList.push({
            'tagValue': tagMapping.catalystEntityMapping[i].tagValue,
            'catalystEntityId': tagMapping.catalystEntityMapping[i].catalystEntityId,
            'catalystEntityName': tagMapping.catalystEntityMapping[i].catalystEntityName
        });
    }

    var params = {
        'providerId': tagDetails.providerId,
        'name': tagDetails.name
    };
    var fields = {
        'catalystEntityMapping': catalystEntityMappingList
    };
    tagsModel.updateTag(params, fields, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        }else {
            tagDetails.catalystEntityMapping = catalystEntityMappingList;
            return callback(null, tagDetails);
        }
    });
};

providerService.updateCatalystEntityMapping
    = function updateCatalystEntityMapping(tagDetails, catalystEntityMapping, callback) {
    if(catalystEntityMapping.length == 0) {
        var err = new Error('Malformed Request');
        err.status = 400;
        return callback(err);
    }

    var catalystEntityMappingList = [];
    for(var i = 0; i < catalystEntityMapping.length; i++) {
        if(!('tagValue' in catalystEntityMapping[i]) || !('catalystEntityId' in catalystEntityMapping[i])) {
            var err = new Error('Malformed Request');
            err.status = 400;
            return callback(err);
        }

        if(tagDetails.values.indexOf(catalystEntityMapping[i].tagValue) < 0) {
            var err = new Error('Tag value not found');
            err.status = 404;
            return callback(err);
        }

        catalystEntityMappingList.push({
            'tagValue': catalystEntityMapping[i].tagValue,
            'catalystEntityId': catalystEntityMapping[i].catalystEntityId
        });
    }

    var params = {
        'providerId': tagDetails.providerId,
        'name': tagDetails.name
    };
    var fields = {
        'catalystEntityMapping': catalystEntityMappingList
    };
    tagsModel.updateTag(params, fields, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        }else {
            tagDetails.catalystEntityMapping = catalystEntityMappingList;
            return callback(null, tagDetails);
        }
    });
};

providerService.deleteTag = function deleteTag(provider, tagName, callback) {
    var params = {
        'providerId': provider._id,
        'name': tagName
    };

    tagsModel.deleteTag(params, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

providerService.deleteTagMapping = function deleteTagMapping(providerId, catalystEntityType, callback) {
    var params = {
        'providerId': providerId,
        'catalystEntityType': catalystEntityType
    };
    var fields = {
        'catalystEntityMapping': [],
        'catalystEntityType': null
    }

    tagsModel.updateTag(params, fields, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

providerService.createTagsList = function createTagsList(tags, callback) {
    var tagsListObject = {};
    var tagsList = [];
    tags.forEach(function(tag) {
        tagsList.push({
            'name': tag.name,
            'description': tag.description?tag.description:null
        });
    });
    tagsListObject.tags = tagsList;

    return callback(null, tagsList);
};

providerService.createTagObject = function createTagObject(tag, callback) {
    var tagObject = {
        'name': tag.name,
        'description': tag.description?tag.description:null
    };
    return callback(null, tagObject);
};

providerService.createTagMappingList = function createTagMappingList(tags, callback) {
    var tagMappingsListObject = {};
    var tagMappingsList = [];
    tags.forEach(function(tag) {
        if(tag.catalystEntityType) {
            var tagMapping = {
                'tagName': tag.name,
                'tagValues': tag.values ? tag.values.sort(function (a, b) {
                                return a.toLowerCase().localeCompare(b.toLowerCase());
                            }) : [],
                'catalystEntityType': tag.catalystEntityType ? tag.catalystEntityType : null,
                'catalystEntityMapping': tag.catalystEntityMapping ? tag.catalystEntityMapping : []
            };
            for (var i = 0; i < tagMapping.catalystEntityMapping.length; i++) {
                delete tagMapping.catalystEntityMapping[i]._id;
            }
            tagMappingsList.push(tagMapping);
        }
    });

    tagMappingsListObject.tagMappings = tagMappingsList;

    return callback(null, tagMappingsList);
};

providerService.createTagMappingObject = function createTagMappingObject(tag, callback) {
    var tagMappingObject = {
            'tagName': tag.name,
            'tagValues': tag.values ? tag.values.sort(function (a, b) {
                            return a.toLowerCase().localeCompare(b.toLowerCase());
                        }) : [],
            'catalystEntityType': tag.catalystEntityType?tag.catalystEntityType : null,
            'catalystEntityMapping': tag.catalystEntityMapping?tag.catalystEntityMapping : []
    };
    for (var i = 0; i < tagMappingObject.catalystEntityMapping.length; i++) {
        delete tagMappingObject.catalystEntityMapping[i]._id;
    }

    return callback(null, tagMappingObject);
};