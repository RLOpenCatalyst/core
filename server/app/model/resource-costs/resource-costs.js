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

var mongoose = require('mongoose')
require('mongoose-double')(mongoose)
var logger = require('_pr/logger')(module)

var SchemaTypes = mongoose.Schema.Types
var Schema = mongoose.Schema

// @TODO Date field types to be revised
var ResourceCostsSchema = new Schema({
    cost: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'Dollar',
        required: true
    },
    organizationId: {
        type: String,
        required: true,
        trim: true
    },
    providerId: {
        type: String,
        required: true,
        trim: true
    },
    providerType: {
        type: String,
        required: true,
        trim: true
    },
    businessGroupId: {
        type: String,
        required: true,
        default: 'Unassigned',
        trim: true
    },
    projectId: {
        type: String,
        required: true,
        default: 'Unassigned',
        trim: true
    },
    environmentId: {
        type: String,
        required: true,
        default: 'Unassigned',
        trim: true
    },
    resourceId: {
        type: String,
        required: false,
        trim: true
    },
    billIntervalId: {
        type: String,
        required: true,
        trim: true
    },
    billLineItemId: {
        type: Number,
        required: false,
        trim: true
    },
    platformDetails: {
        instanceId: {
            type: String,
            required: false,
            trim: true
        },
        serviceId: {
            type: String,
            required: true,
            default: 'Other',
            trim: true
        },
        billRecordId: {
            type: String,
            required: false,
            trim: true
        },
        serviceName: {
            type: String,
            required: true,
            trim: true
        },
        usageType: {
            type: String,
            required: false,
            trim: true
        },
        region: {
            type: String,
            required: false,
            trim: true
        },
        zone: {
            type: String,
            required: false,
            trim: true
        }
    },
    startTime: {
        type: Number,
        required: true
    },
    endTime: {
        type: Number,
        required: true
    },
    interval: {
        type: Number,
        required: true
    },
    lastUpdateTime: {
        type: Number,
        required: true
    }
})

ResourceCostsSchema.index({'platformDetails.serviceId' : 1})

ResourceCostsSchema.statics.save = function save(resourceCostData, callback) {
    var resourceCosts = new ResourceCosts(resourceCostData)
    resourceCosts.save(function(err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result)
        }
    })
}

ResourceCostsSchema.statics.remove
    = function remove(organizationId, providerId, billIntervalId, callback) {
    var query = {
        organizationId: organizationId,
        providerId: providerId,
        billIntervalId: billIntervalId
    }

    this.find(query).remove(function(err, result) {
        if (err) {
            callback(err,null);
        } else {
            callback(null, result)
        }
    })
}

ResourceCostsSchema.statics.removeResourceCostByProviderId = function removeResourceCostByProviderId(providerId, callback) {
    var query = {
        providerId: providerId
    }
    this.find(query).remove(function(err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result)
        }
    })
};

ResourceCostsSchema.statics.upsert = function upsert(resourceCostData, callback) {
    var query = {
        organizationId: resourceCostData.organizationId,
        providerId: resourceCostData.providerId,
        startTime: resourceCostData.startTime,
        billIntervalId: resourceCostData.billIntervalId,
        billLineItemId: resourceCostData.billLineItemId,
        interval: resourceCostData.interval
    }

    this.findOneAndUpdate(query, resourceCostData, {upsert: true},
        function(err, result){
            if (err) {
                callback(null)
            } else {
                callback(null, result)
            }
        })
}

var ResourceCosts = mongoose.model('ResourceCosts', ResourceCostsSchema)
module.exports = ResourceCosts