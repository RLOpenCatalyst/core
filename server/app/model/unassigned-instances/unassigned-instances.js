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
    unassignedInstance.save(function(err, instance) {
        if (err) {
            logger.error("Failed to create unassigned instance", err);
            if (typeof callBack == 'function') {
                callBack(err, null);
            }
            return;
        } else if (typeof callBack == 'function') {
            return callBack(null, instance);
        }
    });
};

UnassignedInstancesSchema.statics.getByProviderId = function getByProviderId(providerId, callback) {
    this.find(
        {'providerId': providerId},
        function(err, instances) {
            if (err) {
                logger.error("Failed getByProviderId (%s)", providerId, err);
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
            logger.error("Failed to update unassigned instance data", err);
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

UnassignedInstancesSchema.statics.deleteByPlatformAndProviderId
    = function deleteByPlatformAndProviderId(providerId, platformId, callBack) {
    Instances.remove({
        providerId: providerId,
        platformId: platformId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to delete instance (%s)", platformId, err);
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

var UnassignedInstances = mongoose.model('unassignedInstances', UnassignedInstancesSchema);
module.exports = UnassignedInstances;
