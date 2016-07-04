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
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: String,
    providerData: Schema.Types.Mixed,
    projectTag: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    environmentTag: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    platformId: String,
    ip: {
        type: String,
        index: true,
        trim: true
    },
    os: String,
    state: String,
    tags: Schema.Types.Mixed
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

UnassignedInstancesSchema.statics.getByProviderIdAndPlatformId = function getByProviderIdAndPlatformId(providerId, platformId, callback) {
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

UnassignedInstancesSchema.statics.getUnAssignedInstancesByProviderId = function getByProviderId(providerId, callback) {
    var params = {
        providerId: providerId
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

UnassignedInstancesSchema.statics.updateInstanceStatus = function updateInstanceStatus(instance,callback) {
    this.update({
        "platformId": instance.platformId,
    }, {
        $set: {
            state:instance.state
        }
    }, function(err, data) {
        if (err) {
            logger.error("Failed to update Unassigned Instance status data", err);
            callback(err,null);
            return;
        }
        callback(null, data);
    });
};

UnassignedInstancesSchema.statics.deleteByPlatformAndProviderId = function deleteByPlatformAndProviderId(providerId, platformId, callback) {
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

var UnassignedInstances = mongoose.model('unassignedInstances', UnassignedInstancesSchema);
module.exports = UnassignedInstances;
