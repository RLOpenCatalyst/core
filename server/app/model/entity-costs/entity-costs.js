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

// @TODO Date field types to be revised
var EntityCostsSchema = new Schema({
    entity: {
        id: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            trim: true
        }
    },
    parentEntity: {
        id: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            trim: true
        }
    },
    costs: Schema.Types.Mixed,
    startTime: {
        type: Number,
        required: true
    },
    endTime: {
        type: Number,
        required: true
    },
    lastUpdateTime: {
        type: Number,
        required: false
    },
    interval: {
        type: Number,
        required: false
    },
    period: {
        type: String,
        required: true
    }
})

EntityCostsSchema.index({'entity.id': 1, 'entity.type': 1, 'parentEntity.id': 1, 'startTime': 1,
    'period': 1}, {'unique': true})

EntityCostsSchema.statics.saveEntityCost = function saveEntityCost(entityCostData, callback) {
    var entityCosts = new EntityCosts(entityCostData)
    entityCosts.save(function(err, data) {
        if (err) {
            callback(err)
        } else {
            callback(null, data)
        }
    })
}

// @TODO To be improved
EntityCostsSchema.statics.getEntityCost = function getEntityCost(query, callback) {
    this.aggregate([
            { $match: {$and: query }},
            {
                $sort: {
                    startTime: 1
                }
            }
        ],
        function(err, entityCosts) {
            if(err) {
                logger.error(err)
                return callback(err, null);
            } else if(entityCosts.length > 0) {
                return callback(null, entityCosts)
            } else {
                return callback(null, null)
            }
        }
    )
}

EntityCostsSchema.statics.upsertEntityCost = function upsertEntityCost(entityCostData, callback) {
    query = {
        'entity.id': entityCostData.entity.id,
        'entity.type': entityCostData.entity.type,
        'parentEntity.id': entityCostData.parentEntity.id,
        'startTime': entityCostData.startTime,
        'period': entityCostData.period
    }
    this.findOneAndUpdate(query, entityCostData, {upsert:true},
        function(err, result){
            if (err) {
                callback(null)
            } else {
                callback(null, result)
            }
    });
}

EntityCostsSchema.statics.deleteEntityCost = function deleteEntityCost(parentEntityId, startTime, period, callback) {
    var query = {
        'parentEntity.id': parentEntityId,
        'startTime': startTime,
        'period': period
    };

    this.find(query).remove(function(err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result)
        }
    })
}

EntityCostsSchema.statics.removeEntityCostByProviderId = function removeEntityCostByProviderId(providerId, callback) {
    var query = {
        'entity.id': providerId,
        'entity.type':'provider'
    };
    this.find(query).remove(function(err, result) {
        if (err) {
            callback(err)
        } else {
            callback(null, result)
        }
    })
}
var EntityCosts = mongoose.model('EntityCosts', EntityCostsSchema)
module.exports = EntityCosts