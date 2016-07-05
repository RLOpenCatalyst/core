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
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');

// File which contains Track DB schema and DAO methods. 

var Schema = mongoose.Schema;

var ScriptSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    orgDetails: {
        name: {
            type: String,
            required: false
        },
        id: {
            type: String,
            required: true,
            trim: true
        }
    },
    filePath: {
        type: String,
        required: false
    },
    scriptCreatedOn: {
        type: Date,
        default: Date.now
    }
});

// Get all Script information.
ScriptSchema.statics.getScripts = function(callback) {
    this.find(function(err, scripts) {
        if (err) {
            logger.debug("Got error while fetching Script: ", err);
            callback(err, null);
        }
        if (scripts) {
            logger.debug("Got Script: ", JSON.stringify(scripts));
            callback(null, scripts);
        }
    });
};

// Save all Script informations.
ScriptSchema.statics.createNew = function(scriptData, callback) {
    var script = new this(scriptData);
    script.save(function(err, scripts) {
        if (err) {
            logger.debug("Got error while creating Script: ", err);
            callback(err, null);
        }
        if (scripts) {
            logger.debug("Creating Script: ", JSON.stringify(scripts));
            callback(null, scripts);
        }
    });
};

// Update all Script informations.
ScriptSchema.statics.updateScript = function(scriptId, scriptData, callback) {

    logger.debug("Update Script" , JSON.stringify(scriptData));
    this.update({
        "_id": new ObjectId(scriptId)
    }, {
        $set: {
            "name": scriptData.name,
            "description": scriptData.description,
            "filePath": scriptData.filePath
        }
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Got error while creating scripts: ", err);
            callback(err, null);
        }
        logger.debug("updated data",JSON.stringify(scriptData));
        callback(null, updateCount);

    });
};

// Get all Script informations.
ScriptSchema.statics.getScriptById = function(scriptId, callback) {
    this.find({
        "_id": new ObjectId(scriptId)
    }, function(err, scripts) {
        if (err) {
            logger.debug("Got error while fetching Scripts: ", err);
            callback(err, null);
            return;
        }
        if (scripts) {
            logger.debug("Got Script: ", JSON.stringify(scripts[0]));
            callback(null, scripts[0]);
        }
    });
};

// Remove Script informations.
ScriptSchema.statics.removeScripts = function(scriptId, callback) {
    this.remove({
        "_id": scriptId
    }, function(err, scripts) {
        if (err) {
            logger.debug("Got error while removing Scripts: ", err);
            callback(err, null);
        }
        if (scripts) {
            logger.debug("Remove Success....");
            callback(null, scripts);
        }
    });
};

//find entry by type.
ScriptSchema.statics.getScriptByType = function(scriptType, callback) {
    this.find({
        "type": scriptType
    }, function(err, scripts) {
        if (err) {
            logger.debug("Got error while fetching Script: ", err);
            callback(err, null);
            return;
        }
        if (scripts) {
            callback(null, scripts);
        }
    });
};

var Script = mongoose.model("script", ScriptSchema);
module.exports = Script;