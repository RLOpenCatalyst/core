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
var serviceSchema = new Schema({
    masterDetails:{
        orgId:{
            type: String,
            trim: true,
            required: false
        },
        orgName:{
            type: String,
            trim: true,
            required: false
        },
        bgId:{
            type: String,
            trim: true,
            required: false
        },
        bgName:{
            type: String,
            trim: true,
            required: false
        },
        projectId:{
            type: String,
            trim: true,
            required: false
        },
        projectName:{
            type: String,
            trim: true,
            required: false
        },
        envId:{
            type: String,
            trim: true,
            required: false
        },
        envName:{
            type: String,
            trim: true,
            required: false
        },
        configId:{
            type: String,
            trim: true,
            required: false
        },
        configName:{
            type: String,
            trim: true,
            required: false
        },
        monitor:Schema.Types.Mixed
    },
    name: {
        type: String,
        trim: true,
        required: false
    },
    type:{
        type: String,
        trim: true,
        required: false
    },
    desc:{
        type: String,
        trim: true,
        required: false
    },
    state:{
        type: String,
        trim: true,
        required: false
    },
    identifiers:Schema.Types.Mixed,
    resources:[Schema.Types.Mixed],
    ymlFileId:{
        type: String,
        trim: true,
        required: false
    },
    createdOn:{
        type: Number,
        required: false,
        default:Date.now()
    },
    version:{
        type: Number,
        required: false,
        default:1.0
    },
    isDeleted:{
        type: Boolean,
        required: false,
        default:false
    }
});

serviceSchema.plugin(mongoosePaginate);

serviceSchema.statics.createNew = function createNew(servicesObj, callback) {
    var self = this;
    var service = new self(servicesObj);
    service.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};


serviceSchema.statics.updatedServiceById = function updatedServiceById(serviceId,servicesObj,callback) {
    services.update({_id:ObjectId(serviceId)},{$set:servicesObj},{multi:true},function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

serviceSchema.statics.updatedService = function updatedService(filterQuery,servicesObj,callback) {
    services.update(filterQuery,{$set:servicesObj},{multi:true},function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};

serviceSchema.statics.getLastVersionOfEachService = function getLastVersionOfEachService(callback){
    services.aggregate([
            {
                $sort:
                    {
                        version:1
                    }
            },
            {
                $group:
                    {
                        _id:"$name",
                        id: { $last: "$_id" },
                        name: { $last: "$name" },
                        type: { $last: "$type" },
                        state: { $last: "$state" },
                        desc: { $last: "$desc" },
                        resources: { $last: "$resources" },
                        version: { $last: "$version" },
                        masterDetails: { $last: "$masterDetails" },
                        identifiers: { $last: "$identifiers" },
                        createdOn: { $last: "$createdOn" }
                    }
            }],
        function(err, serviceList) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            }else {
                return callback(null, serviceList);
            }
        });
}

serviceSchema.statics.getServices = function getServices(filterBy,callback) {
    filterBy.isDeleted = false;
    filterBy.state = {$ne:'Error'};
    services.find(filterBy,function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, data);
        }
    });
};


serviceSchema.statics.getAllServicesByFilter = function getAllServicesByFilter(filterQueryObj, callback) {
    filterQueryObj.queryObj.isDeleted = false;
    this.paginate(filterQueryObj.queryObj, filterQueryObj.options,function (err, servicesList) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, servicesList);
        }
    });
};

serviceSchema.statics.getServiceById = function getServiceById(serviceId, callback) {
    services.find({_id:ObjectId(serviceId)},function (err, servicesObj) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, servicesObj);
        }
    });
};


serviceSchema.statics.deleteServiceById = function deleteServiceById(serviceId, callback) {
    services.remove({_id:ObjectId(serviceId)},function (err, servicesObj) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, servicesObj);
        }
    });
};



var services = mongoose.model('services', serviceSchema);
module.exports = services;