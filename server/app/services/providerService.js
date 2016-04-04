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

var tags = require('_pr/model/tags/tags.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var logger = require('_pr/logger')(module);

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

providerService.getTagsByProvider = function getTagsByProvider(provider, callback) {
    tags.getTagsByProviderId(provider._id, function(err, tags) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            callback(err);
        } else {
            return callback(null, tags);
        }
    });
};

providerService.getTagByNameAndProvider = function getTagByNameAndProvider(providerId, tagName, callback) {
    var params = {
        'providerId': providerId,
        'name': tagName
    };
    tags.getTag(params, function(err, tag) {
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
    tags.getTag(params, function(err, tag) {
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
}

/*providerService.prepareTagMappings = function prepareTagMappings(provider, tagMappings, callback) {
    var tagNames = [];
    var tagMappingsObject = {};

    for(var i = 0; i < tagMappings.length; i++) {
        if(!('name' in tagMappings[i]) || !(name in tagMappings[i])) {
            var err = new Error('Malformed Request');
            err.status = 400;
            return callback(err);
        } else {
            tagNames.push(tagMappings[i].name);
            tagMappingsObject[tagMappings[i].name] = tagMappings[i].catalystEntityType;
        }
    }

    tags.getTagsByNames(tagsNames, function(err, tags){
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(tags.length < tagNames.lenght) {
            var err = new Error('Tag not found');
            err.status = 404;
            return callback(err);
        } else {
            for(var i = 0; i < tags.lenght; i++) {
                tags[i].catalystEntityType = tagMappingsObject[tags[i].name];
            }
            return callback(null, tags);
        }
    });
}*/

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

    tags.updateTag(params, fields, function(err, tag) {
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


providerService.updateTagMapping = function updateTagMapping(providerId, tagMapping, callback) {
    if(!('name' in tagMapping) || !('catalystEntityType' in tagMapping)) {
        var err = new Error('Malformed Request');
        err.status = 400;
        return callback(err);
    }

    var params = {
        'providerId': providerId,
        'name': tagMapping.name
    };
    var fields = {
        'catalystEntityType': tagMapping.catalystEntityType
    };

    tags.updateTag(params, fields, function(err, tag) {
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
                'name': tagMapping.name
            }
            return callback(null, tag);
        }
    });
}

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
    tags.updateTag(params, fields, function(err, tag) {
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

}

providerService.deleteTag = function deleteTag(provider, tagName, callback) {
    var params = {
        'providerId': provider._id,
        'name': tagName
    };

    tags.deleteTag(params, function(err, tag) {
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
}

providerService.deleteTagMapping = function deleteTagMapping(providerId, catalystEntityType, callback) {
    var params = {
        'providerId': providerId,
        'catalystEntityType': catalystEntityType
    };
    var fields = {
        'catalystEntityMapping': [],
        'catalystEntityType': null
    }

    tags.updateTag(params, fields, function(err, tag) {
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
}

/*providerService.deleteCatalystEntityMapping
    = function deleteCatalystEntityMapping(tag, catalystEntityMapping, callback) {
}*/

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
}

providerService.createTagMappingList = function createTagMappingList(tags, callback) {
    var tagMappingsListObject = {};
    var tagMappingsList = [];
    tags.forEach(function(tag) {
        tagMappingsList.push({
            'name': tag.name,
            'values': tag.values?tag.values:[],
            'description': tag.description?tag.description:null,
            'catalystEntityType': tag.catalystEntityType?tag.catalystEntityType:null,
            'catalystEntityMapping': tag.catalystEntityMapping?tag.catalystEntityMapping:[]
        });
    });
    tagMappingsListObject.tagMappings = tagMappingsList;

    return callback(null, tagsMappingList);
}

providerService.createTagMappingObject = function createTagMappingObject(tag, callback) {
    var tagMappingObject = {
            'name': tag.name,
            'values': tag.values?tag.values:[],
            'description': tag.description?tag.description:null,
            'catalystEntityType': tag.catalystEntityType?tag.catalystEntityType:null,
            'catalystEntityMapping': tag.catalystEntityMapping?tag.catalystEntityMapping:[]
    };

    return callback(null, tagMappingObject);
}

/*
providerService.createCatalystEntityMappingObject
    = function createCatalystEntityMappingObject(tag, catalystEntityType, callback) {
}*/
