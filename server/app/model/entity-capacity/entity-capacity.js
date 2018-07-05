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
var EntityCapacitySchema = new Schema({
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
    capacity: Schema.Types.Mixed,
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

EntityCapacitySchema.index({'entity.id': 1, 'entity.type': 1, 'parentEntity.id': 1, 'startTime': 1,
    'period': 1}, {'unique': true})

EntityCapacitySchema.statics.saveEntityCost
    = function saveEntityCapacity(entityCapacityData, callback) {
    var entityCapacity = new EntityCapacity(entityCapacityData)
    entityCapacity.save(function(err, data) {
        if (err) {
            callback(err)
        } else {
            callback(null, data)
        }
    })
}

// @TODO To be improved
EntityCapacitySchema.statics.getEntityCapacity = function getEntityCapacity(query, callback) {
    this.aggregate([
            { $match: {$and: query }},
            {
                $sort: {
                    startTime: 1
                }
            }
        ],
        function(err, entityCapacity) {
            if(err) {
                logger.error(err)
                return callback(err, null);
            } else if(entityCapacity.length > 0) {
                return callback(null, entityCapacity)
            } else {
                return callback(null, null)
            }
        }
    )
}

EntityCapacitySchema.statics.upsertEntityCapacity
    = function upsertEntityCost(entityCapacityData, callback) {
    query = {
        'entity.id': entityCapacityData.entity.id,
        'entity.type': entityCapacityData.entity.type,
        'parentEntity.id': entityCapacityData.parentEntity.id,
        'startTime': entityCapacityData.startTime,
        'period': entityCapacityData.period
    }
    this.findOneAndUpdate(query, entityCapacityData, {upsert:true},
        function(err, result){
            if (err) {
                callback(null)
            } else {
                callback(null, result)
            }
    });
}

EntityCapacitySchema.statics.removeEntityCapacityByProviderId = function removeEntityCapacityByProviderId(providerId, callback) {
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

var EntityCapacity = mongoose.model('EntityCapacity', EntityCapacitySchema)
module.exports = EntityCapacity