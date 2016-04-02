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
            callback(err);
        } else if(!provider) {
            var err = new Error('Provider not found');
            err.status = 404;
            callback(err);
        } else {
            callback(null, provider);
        }
    });
};

providerService.checkIfTagExists = function checkIfTagExists(providerId, tagId, callback) {
    AWSProvider.getTagByNameAndProviderId(providerId, function(err, provider) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            callback(err);
        } else if(!provider) {
            var err = new Error('Provider not found');
            err.status = 404;
            callback(err);
        } else {
            callback(null, provider);
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
            callback(null, tags);
        }
    });
};

providerService.getTagByNameAndProvider = function getTagByNameAndProvider(provider, tagName, callback) {
    var params = {
        'providerId': provider._id,
        'name': tagName
    };
    tags.getTagByNameAndProviderId(params, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            callback(err);
        }else {
            callback(null, tag);
        }
    });
};

providerService.updateTag = function updateTag(provider, tagDetails, callback) {
    if(!('name' in tagDetails) || !('description' in tagDetails)) {
        var err = new Error('Malformed Request');
        err.status = 400;
        callback(err);
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
            callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            callback(err);
        }else {
            var tag = {
                'name': tagDetails.name,
                'description': tagDetails.description
            }
            callback(null, tag);
        }
    });
};

providerService.deleteTag = function deleteTag(provider, tagName, callback) {

    var params = {
        'providerId': provider._id,
        'name': tagName
    };

    tags.deleteTag(params, function(err, tag) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            callback(err);
        } else if(!tag) {
            var err = new Error('Tag not found');
            err.status = 404;
            callback(err);
        }else {
            // @TODO response to be decided
            callback(null, {});
        }
    });
}

providerService.createTagsList = function createTagsList(tags, callback) {
    var tagsList = [];
    tags.forEach(function(tag) {
        tagsList.push({
            'name': tag.name,
            'description': tag.description?tag.description:null
        });
    });

    callback(null, tagsList);
};

providerService.createTagObject = function createTagObject(tag, callback) {
    var tagObject = {
        'name': tag.name,
        'description': tag.description?tag.description:null
    }
    callback(null, tagObject);
}