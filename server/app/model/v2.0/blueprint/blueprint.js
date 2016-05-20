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

var BlueprintSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: Number,
        required: true
    },
    parentBlueprintId: {
        type: String,
        required: false
    },
    childBlueprintIds: {
        type: [String],
        required: false
    },
    organization: {
        type: String,
        required: false,
        trim: true
    },
    businessGroup: {
        type: String,
        required: false,
        trim: true
    },
    project: {
        type: String,
        required: false,
        trim: true
    },
    networkProfile: {
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
        name: {
            type: String,
            required: true,
            trim: true
        },
        vmImageId: {
            type: String,
            required: true,
            trim: true
        },
        osType: {
            type: String,
            required: true,
            trim: true
        },
        osName: {
            type: String,
            required: true,
            trim: true
        },
        userName: {
            type: String,
            required: true,
            trim: true
        },
        password: {
            type: String,
            trim: true
        },
        pemFile: {
            type: String,
            trim: true
        }
    },
    machineType: {
        type: String,
        required: true,
        trim: true
    },
    bootDiskType: {
        type: String,
        //required: false,
        trim: true
    },
    bootDiskSize: {
        type: Number,
        //required: false
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

BlueprintSchema.statics.createNew = function createNew(blueprintData, callback) {
    var self = this;
    logger.debug("Got BPData to save: ", JSON.stringify(blueprintData));
    var blueprint = new self(blueprintData);
    blueprint.save(function(err, bp) {
        if (err) {
            logger.error("got error: ", err);
            return callback(err);
        }
        callback(null, bp);
    });
};

BlueprintSchema.statics.findById = function findById(blueprintId, callback) {
    logger.debug("BlueprintId: ",blueprintId);
    this.find({ _id: blueprintId }, function(err, data) {
        if (err) {
            logger.error("got error while fetching Blueprint: ", err);
            return callback(err);
        }
        callback(null, data);
    });
};


var Blueprint = mongoose.model('Blueprint', BlueprintSchema);
module.exports = Blueprint;
