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
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    lastUpdateTime: {
        type: Date,
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

var EntityCosts = mongoose.model('EntityCosts', EntityCostsSchema)
module.exports = EntityCosts