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

var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var BlueprintSchema = new Schema ({
    name: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: Number,
        required: true
    },
    parentBlueprintId : {
        type: String,
        required: false
    },
    childBlueprintIds : {
        type: [String],
        required: false
    },
    organization: {
        id: {
            type: String,
            required: true,
            trim: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    businessGroup: {
        id: {
            type: String,
            required: true,
            trim: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    project: {
        id: {
            type: String,
            required: true,
            trim: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        }
    },
    networkProfile: {
        id: {
            type: String,
            required: true,
            trim: false
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            required: true,
            trim: true
        },
        providerId: {
            type: String,
            required: true,
            trim: true
        },
        networkDetails: Schema.Types.Mixed,
    },
    softwareTemplate: Schema.Types.Mixed,
    vmImage: {
        id: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        vmImageId: {
            type: String,
            required: true,
            trim: true
        }
    },
    machineType: {
        type: String,
        required: true,
        trim: true
    },
    machineType: {
        type: String,
        required: true,
        trim: true
    },
    bootDiskType: {
        type: String,
        required: false,
        trim: true
    },
    bootDiskSize: {
        type: Number,
        required: false
    },
    applications: [{
        repoId: {
            type: String,
            required: true
        },
        repoType: {
            type: String,
            required: true
        },
        repoDetails: Schema.Types.Mixed
    }],
    applicationUrls: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        }
    }],
    runList: [{
        name: {
            type: String,
            required: false
        },
        attributes: [Schema.Types.Mixed]
    }],
    blueprints: [Schema.Types.Mixed]
});

var Blueprint = mongoose.model('Blueprint', BlueprintSchema);
module.exports = Blueprint;