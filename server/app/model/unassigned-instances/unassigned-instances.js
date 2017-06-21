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

var UnassignedInstancesSchema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
    },
    orgName: {
        type: String,
        required: true,
        trim: true,
    },
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: String,
    providerData: Schema.Types.Mixed,
    platformId: String,
    ip: {
        type: String,
        index: true,
        trim: true
    },
    os: String,
    state: String,
    isDeleted:{
        type:Boolean,
        default:false,
        required:false
    },
    tags: Schema.Types.Mixed,
    usage: Schema.Types.Mixed,
    cost: Schema.Types.Mixed,
    subnetId: {
        type: String,
        required: false,
        trim: true
    },
    vpcId: {
        type: String,
        required: false,
        trim: true
    },
    privateIpAddress: {
        type: String,
        required: false,
        trim: true
    },
    hostName: {
        type: String,
        required: false,
        trim: true
    }
});
UnassignedInstancesSchema.plugin(mongoosePaginate);
UnassignedInstancesSchema.index({platformId: 1, providerId: 1}, {unique: true});

UnassignedInstancesSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var unassignedInstance = new self(data);
    unassignedInstance.save(function(err, instance) {
        if (err) {
            logger.error("Failed to create unassigned instance", err);
            if (typeof callback == 'function') {
                callback(err, null);
            }
            return;
        } else if (typeof callback == 'function') {
            return callback(null, instance);
        }
    });
};


UnassignedInstancesSchema.statics.getByProviderId = function getByProviderId(databaseReq, callback) {
    databaseReq.queryObj.isDeleted = false;
    this.paginate(databaseReq.queryObj, databaseReq.options, function (err, instances) {
        if (err) {
            logger.error("Failed getByProviderId (%s)", err);
            callback(err, null);
            return;
        }
        callback(null, instances);
    });
};


UnassignedInstancesSchema.statics.getById = function getByProviderId(instanceId, callback) {
    this.findById(instanceId,
        function(err, instance) {
            if (err) {
                logger.error("Failed to get instance ", instanceId, err);
                return callback(err);
            } else {
                return callback(null, instance);
            }
        }
    );
};

UnassignedInstancesSchema.statics.getAllByIds = function getByProviderId(instanceIds, callback) {
    var params = {
        '_id': {$in: instanceIds}
    };

    this.find(params,function(err, instances) {
        if (err) {
            logger.error("Could not get instances");
            return callback(err, null);
        } else if(instances.length > 0) {
            return callback(null, instances[0]);
        } else {
            return callback(null, null);
        }
    });
};

UnassignedInstancesSchema.statics.getByProviderIdAndPlatformId
    = function getByProviderIdAndPlatformId(providerId, platformId, callback) {
    var params = {
        'providerId': providerId,
        'platformId': platformId
    };
    this.find(params,
        function(err, instances) {
            if (err) {
                logger.error("Could not get instance for ", providerId, platformId, err);
                return callback(err, null);
            } else if(instances.length > 0) {
                return callback(null, instances[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

UnassignedInstancesSchema.statics.getUnAssignedInstancesByProviderId
    = function getUnAssignedInstancesByProviderId(providerId, callback) {
    var params = {
        providerId: providerId,
        isDeleted:false
    };
    this.find(params, function (err, instances) {
        if (err) {
            logger.error("Failed getUnAssignedInstancesByProviderId (%s)", err);
            callback(err, null);
            return;
        }
        callback(null, instances);
    });
};

UnassignedInstancesSchema.statics.updateInstance = function updateInstance(params, fields ,callback) {
    this.update(params, fields,
        function(err, data) {
            if (err) {
                logger.error("Failed to update unassigned instance data", err);
                if (typeof callback == 'function') {
                    callback(err, null);
                }
                return;
            } else if(data && (data.ok == 1)) {
                return callback(null, data);
            }
        });
};

UnassignedInstancesSchema.statics.updateInstanceStatus = function updateInstanceStatus(instanceId,instance,callback) {
    var updateObj={};
    updateObj['state'] = instance.state;
    if(instance.state === 'terminated' || instance.state === 'shutting-down'){
        updateObj['isDeleted'] = true;
    }else{
        updateObj['isDeleted'] = false;
        updateObj['subnetId']= instance.subnetId;
        updateObj['ip'] = instance.ip;
        updateObj['vpcId'] = instance.vpcId;
        updateObj['hostName'] = instance.hostName;
        updateObj['privateIpAddress'] = instance.privateIpAddress;
        updateObj['tags'] = instance.tags;
    }
    UnassignedInstances.update({
        "_id": ObjectId(instanceId)
    },{
        $set: updateObj
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update Unassigned Instance status data", err);
            callback(err,null);
            return;
        }
        callback(null, data);
    });
};

UnassignedInstancesSchema.statics.deleteByPlatformAndProviderId
    = function deleteByPlatformAndProviderId(providerId, platformId, callback) {
    this.remove({
        providerId: providerId,
        platformId: platformId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to delete instance (%s)", platformId, err);
            if (typeof callback == 'function') {
                callback(err, null);
            }
            return;
        }
        if (typeof callback == 'function') {
            callback(null, data);
        }
    });
};

UnassignedInstancesSchema.statics.removeInstancesByProviderId = function(providerId,callback) {
    var queryObj={};
    queryObj['providerId'] =providerId;
    this.remove(queryObj, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

UnassignedInstancesSchema.statics.updateUsage = function updateUsage(instanceId, usage, callBack) {
    this.update({
        _id: new ObjectId(instanceId)
    }, {
        $set: {usage: usage}
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update Unmanaged Instance data", err);
            if (typeof callBack == 'function') {
                callBack(err, null);
            }
            return;
        }
        if (typeof callBack == 'function') {
            callBack(null, data);
        }
    });
};

UnassignedInstancesSchema.statics.updateInstanceCost = function(instanceCostData, callback) {
    this.update({
        platformId: instanceCostData.resourceId
    }, {
        $set: {
            cost: instanceCostData.cost
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

UnassignedInstancesSchema.statics.removeInstanceById = function(instanceId,callback) {
    this.remove({
        _id: new ObjectId(instanceId)
    }, function (err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

UnassignedInstancesSchema.statics.getAllTerminatedInstances = function(orgId,callback) {
    this.find({"orgId":orgId,"state":"terminated"}, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

UnassignedInstancesSchema.statics.getInstancesByProviderIdOrgIdAndPlatformId = function getInstancesByProviderIdOrgIdAndPlatformId(orgId,providerId, platformId, callback) {
    var params = {
        'orgId': orgId,
        'providerId': providerId,
        'platformId': platformId
    };
    this.find(params,
        function(err, instances) {
            if (err) {
                logger.error("Could not get instance for ",orgId, providerId, platformId, err);
                return callback(err, null);
            } else if(instances.length > 0) {
                return callback(null, instances);
            } else {
                return callback(null, []);
            }
        }
    );
};
UnassignedInstancesSchema.statics.removeTerminatedInstanceById = function(instanceId, callback) {
    this.update({
        "_id": ObjectId(instanceId)
    }, {
        $set: {
            isDeleted: true,
            state: 'terminated'
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to removeTerminatedInstanceById (%s)", instanceId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

UnassignedInstancesSchema.statics.getAll = function getAll(query, callback) {
    //query.queryObj.isDeleted =  false;
    this.paginate(query.queryObj, query.options,
        function(err, instances) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, instances);
            }
        }
    );
};

var UnassignedInstances = mongoose.model('unassignedInstances', UnassignedInstancesSchema);
module.exports = UnassignedInstances;
