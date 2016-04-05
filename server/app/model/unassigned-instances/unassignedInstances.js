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

UnassignedInstancesSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var unassignedInstance = new self(data);
    unassignedInstance.save(function(err, data) {
        if (err) {
            logger.error('unable to save unmanaged instance', err);
            return callback(err);
        } else {
            return callback(null, unassignedInstance);
        }
    });
};

UnassignedInstancesSchema.statics.getByProviderId = function getByProviderId(providerId, callback) {
    this.find(
        {'providerId': providerId},
        function(err, instances) {
            if (err) {
                logger.error("Failed getByOrgProviderId (%s)", opts, err);
                return callback(err, null);
            } else {
                return callback(null, instances);
            }
        }
    );
};

UnassignedInstancesSchema.statics.updateInstance = function updateInstance(params, fields ,callBack) {
    this.update({
        "platformId": instanceId,
    }, {
        $set: {tags:data}
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

UnassignedInstancesSchema.statics.getInstanceTagByOrgProviderId = function getInstanceTagByOrgProviderId(opts,callback) {
    this.find({"orgId": opts.orgId,
        "providerId": opts.providerId
    },{tags:1, _id:0}, function(err, instancesTag) {
        if (err) {
            logger.error("Failed getInstanceTagByOrgProviderId (%s)", opts, err);
            callback(err, null);
            return;
        }
        console.log(instancesTag);
        callback(null, instancesTag);

    });
};

UnassignedInstancesSchema.statics.getInstanceTagByProviderId = function(providerIds, callback) {
    if (!(providerIds && providerIds.length)) {
        process.nextTick(function() {
            callback({
                message: "Invalid providerId"
            });
        });
        return;
    }
    var queryObj = {};
    queryObj._id = {
        $in: providerIds
    }
    this.find(queryObj, function(err, instances) {
        if (err) {
            logger.error("Failed getInstanceTagByProviderId (%s)", err);
            callback(err, null);
            return;
        }

        callback(null, instances);

    }).limit(jsonData.record_Limit).skip(jsonData.record_Skip).sort({state:1});
};

UnassignedInstancesSchema.statics.getByIds = function(providerIds, callback) {
    if (!(providerIds && providerIds.length)) {
        process.nextTick(function() {
            callback(null, []);
        });
        return;
    }
    var queryObj = {};
    queryObj._id = {
        $in: providerIds
    }

    this.find(queryObj, function(err, instances) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, instances);
    });
};

var UnassignedInstances = mongoose.model('unassignedInstances', UnassignedInstancesSchema);
module.exports = UnassignedInstances;
