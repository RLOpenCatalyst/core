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
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var resourceMapSchema = new Schema({
    stackName: {
        type: String,
        trim: true,
        required: true
    },
    stackType:{
        type: String,
        trim: true,
        required: true
    },
    stackStatus:{
        type: String,
        trim: true,
        required: true
    },
    resources:[{
        _id: false,
        id:{
            type: String,
            trim: true,
            required: false
        },
        type:{
            type: String,
            trim: true,
            required: false
        }
    }],
    createdOn:{
        type: Number,
        required: false,
        default:Date.now()
    },
});

resourceMapSchema.plugin(mongoosePaginate);

resourceMapSchema.statics.createNew = function createNew(resourceMapObj, callback) {
    var self = this;
    var resourceMap = new self(resourceMapObj);
    resourceMap.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

resourceMapSchema.statics.updatedResourceMap = function updatedResourceMap(stackName,resourceMapObj,callback) {
    resourceMap.update({stackName:stackName,stackStatus:{$nin:["DELETED","ERROR"]}},{$set:resourceMapObj},function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

resourceMapSchema.statics.getResourceMapByStackName = function getResourceMapByStackName(stackName,callback) {
    resourceMap.find({stackName:stackName,stackStatus:{$nin:["DELETED","ERROR"]}},function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

resourceMapSchema.statics.getResourceMapById = function getResourceMapById(resourceMapId,callback) {
    resourceMap.find({_id:new ObjectId(resourceMapId)},function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

resourceMapSchema.statics.getAllResourceMapByFilter = function getAllResourceMapByFilter(filterQueryObj, callback) {
    this.paginate(filterQueryObj.queryObj, filterQueryObj.options,function (err, resourceMapList) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, resourceMapList);
        }
    });
};


var resourceMap = mongoose.model('resourceMap', resourceMapSchema);
module.exports = resourceMap;