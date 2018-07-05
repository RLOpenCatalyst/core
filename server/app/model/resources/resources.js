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
var BaseResources = require('./base-resources');
var ObjectId = require('mongoose').Types.ObjectId;
var mongoosePaginate = require('mongoose-paginate');

var ResourceSchema = new BaseResources();
ResourceSchema.plugin(mongoosePaginate);

ResourceSchema.statics.getResourcesByProviderResourceType = function(providerId,resourceType,callback) {
    var queryObj={};
    queryObj['providerDetails.id'] =providerId;
    queryObj['resourceType']=resourceType;
    queryObj['isDeleted']=false;
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getResourcesByProviderResourceType", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.getResourcesByProviderId = function(providerId,callback) {
    var queryObj={};
    queryObj['providerDetails.id'] =providerId;
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getResourcesByProviderId", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.getResourceById = function(resourceId,callback) {
    Resources.findById(resourceId, function(err, data) {
        if (err) {
            logger.error("Failed to getResourceById", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.getResources = function(queryObj,callback) {
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getResources", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.deleteResourcesByResourceType = function(resourceType,callback) {
    Resources.update({
        resourceType: resourceType
    }, {
        $set: {
            isDeleted: true
        }
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

ResourceSchema.statics.deleteResourcesById = function(resourceId,callback) {
    Resources.update({
        _id: new ObjectId(resourceId)
    }, {
        $set: {
            isDeleted: true
        }
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

ResourceSchema.statics.removeResourceById = function(resourceId,callback) {
    Resources.remove({
        _id: new ObjectId(resourceId)
    }, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

ResourceSchema.statics.removeResourcesByProviderId = function(providerId,callback) {
    var queryObj={};
    queryObj['providerDetails.id'] =providerId;
    Resources.remove(queryObj, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};


ResourceSchema.statics.updateResourceUsage = function(resourceId, usage, callback) {
    Resources.update({
        _id: new ObjectId(resourceId)
    }, {
        $set: {
            usage: usage
        }
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

ResourceSchema.statics.updateResourceCost = function(resourceId, cost, callback) {
    Resources.update({
        _id: new ObjectId(resourceId)
    }, {
        $set: {
            cost: cost
        }
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

ResourceSchema.statics.updateResourceTag = function(params, fields, callback) {
    Resources.update(params, fields, function(err, data) {
        if (err) {
            logger.error("Failed to update unassigned resource data", err);
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

ResourceSchema.statics.getResourcesWithPagination=function(dataBaseQueryObj,callback){
    dataBaseQueryObj.queryObj.isDeleted = false;
    Resources.paginate(dataBaseQueryObj.queryObj, dataBaseQueryObj.options, function(err, data) {
        if (err) {
            logger.error("Failed to getResourcesWithPagination", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.updateResourcesForAssigned =  function(resourceId,masterDetails,callback){
    Resources.update({
        _id: new ObjectId(resourceId)
    }, {
        $set: {
            category: 'assigned',
            masterDetails:masterDetails
        }
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

ResourceSchema.statics.updateResourceMasterDetails =  function(resourceId,masterDetails,callback){
    Resources.update({
        _id: new ObjectId(resourceId)
    }, {
        $set:masterDetails
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

ResourceSchema.statics.getAllResourcesByCategory=function(providerId,category,callback){
    var queryObj={};
    queryObj['providerDetails.id'] =providerId;
    queryObj['category'] =category;
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getAllResourcesByCategory", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

var Resources = mongoose.model('resources', ResourceSchema);
module.exports = Resources;

