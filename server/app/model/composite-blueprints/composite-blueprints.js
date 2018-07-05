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
var util = require('util');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');
var logger = require('_pr/logger')(module);

//@TODO Unique validation for name to be added
//@TODO Get methods to be consolidated
var CompositeBlueprintSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    organizationId: {
        type: String,
        required: true,
        trim: false
    },
    businessGroupId: {
        type: String,
        required: true,
        trim: false
    },
    projectId: {
        type: String,
        required: true,
        trim: false
    },
    cloudProviderType:{
        type: String,
        required: false,
        trim: false
    },
    blueprints: [{
        type: Schema.Types.Mixed,
        _id: false
    }],
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    }
});

CompositeBlueprintSchema.plugin(mongoosePaginate);

CompositeBlueprintSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var compositeBlueprint = new self(data);
    compositeBlueprint.save(function (err, data) {
        if (err) {
            return callback(err);
        } else {
            return callback(null, compositeBlueprint);
        }
    });
};

CompositeBlueprintSchema.statics.getById = function getById(compositeBlueprintId, callback) {
    this.find(
        {'_id': compositeBlueprintId, 'isDeleted': false },
        function(err, compositeBlueprints) {
            if (err) {
                return callback(err, null);
            } else if(compositeBlueprints && compositeBlueprints.length > 0) {
                return callback(null, compositeBlueprints[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

CompositeBlueprintSchema.statics.countByQuery = function countByQuery(query, callback) {
    query.isDeleted = false;

    this.count(
        query,
        function(err, resultCount) {
            if (err) {
                return callback(err, null);
            } else {
                return callback(null, resultCount);
            }
        }
    );
};

CompositeBlueprintSchema.statics.getAll = function getAll(filter, callback) {
    filter.queryObj.isDeleted = false;

    this.paginate(filter.queryObj, filter.options,
        function(err, compositeBlueprints) {
            if (err) {
                logger.error(err);
                return callback(err);
            } else {
                return callback(null, compositeBlueprints);
            }
        }
    );
};

CompositeBlueprintSchema.statics.deleteById = function deleteById(compositeBlueprintId, callback) {
    this.update(
        {'_id': compositeBlueprintId},
        { $set: {isDeleted: true} },
        function(err, compositeBlueprint) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    )
};

CompositeBlueprintSchema.statics.deleteAll = function deleteAll(compositeBlueprintIds, callback) {
    this.update(
        {'_id': {$in: compositeBlueprintIds}},
        { $set: {isDeleted: true}},
        {multi: true},
        function(err, compositeBlueprintIds) {
            if(err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, true);
            }
        }
    )
};

CompositeBlueprintSchema.statics.updateById
    = function updateById(compositeBlueprintId, fields, callback) {
    this.update(
        {_id: compositeBlueprintId},
        fields,
        function(err, result) {
            if (err) {
                return callback(err, null);
            } else if(result.ok == 1 && result.n == 1)  {
                return callback(null, true);
            }
        }
    );
};

CompositeBlueprintSchema.statics.getCompositeBlueprintByOrgBgProject
    = function getCompositeBlueprintByOrgBgProject(query, callback) {
    query.queryObj.isDeleted = false;
    this.paginate(query.queryObj, query.options, function(err, compositeBlueprints) {
        if (err) {
            logger.error("Failed to getCompositeBlueprintByOrgBgProject", err);
            callback(err, null);
            return;
        }
        callback(null, compositeBlueprints);
    });
};

var CompositeBlueprints = mongoose.model('compositeBlueprints', CompositeBlueprintSchema);
module.exports = CompositeBlueprints;