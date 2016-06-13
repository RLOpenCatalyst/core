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
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getResourcesByProviderResourceType", err);
            callback(err, null);
            return;
        }
        callback(null, data);
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

ResourceSchema.statics.getResources=function(dataBaseQueryObj,callback){
    Resources.paginate(dataBaseQueryObj.queryObj, dataBaseQueryObj.options, function(err, data) {
        if (err) {
            logger.error("Failed to getResources", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

var Resources = mongoose.model('resources', ResourceSchema);
module.exports = Resources;

