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
var ObjectId = require('mongoose').Types.ObjectId;
var mongoosePaginate = require('mongoose-paginate');
var instanceResource = require('_pr/model/resources/resource-types/instance-resource');
var s3Resource = require('_pr/model/resources/resource-types/s3-resource');
var rdsResource = require('_pr/model/resources/resource-types/rds-resource');
var Schema = mongoose.Schema;

var ResourceSchema = new Schema({
    name: {
        type: String,
        required: false,
        trim: true
    },
    masterDetails: {
        orgId: {
            type: String,
            required: false,
            trim: true
        },
        orgName: {
            type: String,
            required: false,
            trim: true
        },
        bgId: {
            type: String,
            required: false,
            trim: true
        },
        bgName: {
            type: String,
            required: false,
            trim: true
        },
        projectName: {
            type: String,
            required: false,
            trim: true
        },
        projectId: {
            type: String,
            required: false,
            trim: true
        },
        envId: {
            type: String,
            required: false,
            trim: true
        },
        envName: {
            type: String,
            required: false,
            trim: true
        }
    },
    providerDetails: {
        id: {
            type: String,
            required: false,
            trim: true
        },
        type: {
            type: String,
            required: false,
            trim: true
        },
        region: Schema.Types.Mixed,
        keyPairId: {
            type: String,
            required: false,
            trim: true
        },
        keyPairName: {
            type: String,
            required: false,
            trim: true
        }
    },
    configDetails: {
        id: String,
        nodeName: String,
        run_list: [{
            type: String,
            trim: true
        }],
        attributes: [{
            name: String,
            jsonObj: {}
        }]
    },
    blueprintDetails: {
        id: {
            type: String,
            required: false,
            trim: true
        },
        name: {
            type: String,
            required: false,
            trim: true
        },
        templateName: {
            type: String,
            required: false,
            trim: true
        },
        templateType: {
            type: String,
            required: false,
            trim: true
        }
    },
    resourceType: {
        type: String,
        required: false,
        trim: true
    },
    category: {
        type: String,
        required: false,
        trim: true
    },
    createdOn: {
        type: Number,
        default: Date.now
    },
    stackName: {
        type: String,
        required: false,
        trim: true
    },
    tags: Schema.Types.Mixed,
    usage: Schema.Types.Mixed,
    cost: Schema.Types.Mixed,
    resourceDetails: Schema.Types.Mixed,
    createdOn: {
        type: Number,
        default: Date.now(),
        required: false
    },
    monitor: {
        type: Schema.Types.Mixed,
        required: false,
        default: null
    },
    tagServer: {
        type: String,
        required: false,
        trim: true
    },
    isScheduled: {
        type: Boolean,
        required: false,
        default: false
    },
    startScheduler: [{
        cronPattern: {
            type: String,
            required: false,
            trim: true
        },
        cronTime: {
            type: String,
            required: false,
            trim: true
        },
        cronDays: {
            type: [String],
            required: false
        }
    }],
    stopScheduler: [{
        cronPattern: {
            type: String,
            required: false,
            trim: true
        },
        cronTime: {
            type: String,
            required: false,
            trim: true
        },
        cronDays: {
            type: [String],
            required: false
        }
    }],
    schedulerStartOn: {
        type: Number,
        required: false,
        trim: true
    },
    schedulerEndOn: {
        type: Number,
        required: false,
        trim: true
    },
    interval: [Schema.Types.Mixed],
    cronJobIds: {
        type: [String],
        required: false,
        trim: true
    },
    user: {
        type: String,
        required: false,
        trim: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    authentication: {
        type: String,
        required: false,
        trim: true
    },
    cloudFormationId: {
        type: String,
        required: false,
        trim: true
    },
    armId: {
        type: String,
        required: false,
        trim: true
    },
    serverDeletedCheck: {
        type: Boolean
    }
});

ResourceSchema.plugin(mongoosePaginate);

ResourceSchema.statics.createNew = function(resourceObj,callback) {
    var resourceDetails = {};
    if(resourceObj.resourceType === 'EC2' || resourceObj.resourceType === 'Instance'){
        resourceDetails = instanceResource.createNew(resourceObj.resourceDetails);
    }else if(resourceObj.resourceType === 'S3'){
        resourceDetails =s3Resource.createNew(resourceObj.resourceDetails);
    }else if(resourceObj.resourceType === 'RDS'){
        resourceDetails = rdsResource.createNew(resourceObj.resourceDetails);
    }else{
        logger.debug("Invalid Resource Type");
        callback(null,resourceObj);
    }
    resourceObj.resourceDetails = resourceDetails;
    var resource = new Resources(resourceObj);
    resource.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        }else {
            return callback(null, data);
        }
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

ResourceSchema.statics.getResourceByIds = function(resourceIds,callback) {
    if(resourceIds.length > 0){
        var queryObj = {},ids = [];
        resourceIds.forEach(function(id){
            ids.push(new ObjectId(id));
        })
    }else{
        callback(null,resourceIds);
    }
    Resources.find({_id:{$in:ids}}, function(err, data) {
        if (err) {
            logger.error("Failed to getResourceByIds", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

ResourceSchema.statics.updateResource =  function(filterBy,fields,callback){
    Resources.update(filterBy, {
        $set:fields
    }, {
        multi: true
    }, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

ResourceSchema.statics.getResources = function(queryObj,callback) {
    queryObj.isDeleted = false;
    Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getResources", err);
            callback(err, null);
            return;
        }
        return callback(null, data);
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


ResourceSchema.statics.removeResources = function(queryObj,callback) {
    Resources.remove(queryObj, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};


ResourceSchema.statics.updateResourceById = function(resourceId, fields, callback) {
    Resources.update({_id:new ObjectId(resourceId)}, fields, function(err, data) {
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
    dataBaseQueryObj.queryObj['resourceDetails.state'] = {$ne:'terminated'};
    Resources.paginate(dataBaseQueryObj.queryObj, dataBaseQueryObj.options, function(err, data) {
        if (err) {
            logger.error("Failed to getResourcesWithPagination", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};



var Resources = mongoose.model('resources', ResourceSchema);
module.exports = Resources;

