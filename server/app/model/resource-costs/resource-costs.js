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
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;

var ResourceCostsSchema = new Schema({
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: {
        type: String,
        required: false,
        trim: true
    },
    organisationId: {
        type: String,
        required: false,
        trim: true
    },
    projectId:{
        type: String,
        required: false,
        trim: true
    },
    resourceType: {
        type: String,
        required: false,
        trim: true
    },
    resourceId: {
        type: String,
        required: false,
        trim: true
    },
    updatedTime: {
        type: Number,
        required: false
    },
    startTime:{
        type: Number,
        required: false
    },
    endTime:{
        type: Number,
        required: false
    },
    aggregateResourceCost:{
        type:String,
        required:false,
        trim:true
    },
    costMetrics: Schema.Types.Mixed
});

ResourceCostsSchema.statics.saveResourceCost = function(resourceCostData, callback) {
    var resourceCosts = new ResourceCosts(resourceCostData);
    resourceCosts.save(function(err, data) {
        if (err) {
            logger.error("saveResourceCostByCSV Failed", err, resourceCostData);
            return;
        }
        callback(null, data);
    });
};

ResourceCostsSchema.statics.deleteResourceCostByResourceId = function(resourceId, callback) {
    ResourceCosts.remove({
        resourceId: resourceId
    }, function(err, data) {
        if (err) {
            logger.error("Failed to deleteResourceCostByResourceId (%s)", resourceId, err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

var ResourceCosts = mongoose.model('ResourceCost', ResourceCostsSchema);
module.exports = ResourceCosts;