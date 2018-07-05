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
    organizationId: {
        type: String,
        required: false,
        trim: true
    },
    businessGroupId: {
        type: String,
        required: false,
        trim: true
    },
    projectId: {
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
        networkDetails: {
            type: Schema.Types.Mixed,
            _id: false
        },
        _id: false
    },
    softwareTemplate: {
        type: Schema.Types.Mixed,
        _id: false
    },
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
        },
        _id: false
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
    chefServerId: {
        type: String,
        required: false,
        trim: true
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
        repoDetails: {
            type: Schema.Types.Mixed,
            _id: false
        },
        _id: false
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
        },
        _id: false
    }],
    runList: [{
        name: {
            type: String,
            required: false
        },
        attributes: [{
            type: Schema.Types.Mixed,
            _id: false
        }],
        _id: false,
    }],
    blueprints: [{
        type: Schema.Types.Mixed,
        _id: false
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
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
    logger.debug("BlueprintId: ", blueprintId);
    this.find({
        _id: blueprintId
    }, function(err, data) {
        if (err) {
            logger.error("got error while fetching Blueprint: ", err);
            return callback(err);
        }
        callback(null, data);
    });
};

BlueprintSchema.statics.countByParentId = function countByParentId(blueprintId, callback) {

    this.count({
        parentBlueprintId: blueprintId
    }, function(err, count) {
        if (err) {
            logger.error("got error while counting Blueprints: ", err);
            return callback(err);
        }
        callback(null, count);
    });
};

BlueprintSchema.statics.getAllByOrgs = function getAllByOrgs(orgIds, callback) {
    this.find({
        isDeleted: false,
        organizationId: {
            $in: orgIds
        }
    }, function(err, blueprints) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, blueprints);
        }

    });
};

BlueprintSchema.statics.deleteById = function deleteById(blueprintId, callback) {
    this.update(
        {'_id': blueprintId},
        { $set: {isDeleted: true} },
        function(err, blueprint) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    )
};

var Blueprint = mongoose.model('Blueprint', BlueprintSchema);
module.exports = Blueprint;