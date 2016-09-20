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
    cost: {
        type: Number,
        required: true
    },
    organisationId: {
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
    platformDetails: {
        instanceId: {
            type: String,
            required: true,
            trim: true
        },
        service: {
            type: String,
            required: true,
            trim: true
        },
        region: {
            type: String,
            required: true,
            trim: true
        },
        zone: {
            type: String,
            required: false,
            trim: true
        }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    interval: {
        type: Number,
        required: true
    },
    lastUpdateTime: {
        type: Date,
        required: true
    }
});

var ResourceCosts = mongoose.model('ResourceCost', ResourceCostsSchema);
module.exports = ResourceCosts;