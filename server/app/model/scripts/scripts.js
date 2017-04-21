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
var mongoosePaginate = require('mongoose-paginate');


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
        id: {
            type: String,
            required: false,
            trim: true
        },
        name: {
            type: String,
            required: false,
            trim: true
        }
    },
    fileId:{
        type:String,
        required:true,
        trim:true
    },
    isParametrized:{
        type:Boolean,
        required:false,
        default:false
    },
    noOfParams:{
        type:Number,
        required:false,
        default:0
    },
    createdOn:{
        type:Number,
        required:false,
        default:Date.now()
    }
});
ScriptSchema.plugin(mongoosePaginate);

ScriptSchema.statics.getScripts = function(query,callback) {
    this.paginate(query.queryObj, query.options,
        function(err, scripts) {
        if (err) {
            callback(err, null);
        }else{
            callback(null,scripts);
        }
    });
};

ScriptSchema.statics.createNew = function(scriptData, callback) {
    var script = new this(scriptData);
    script.save(function(err, scripts) {
        if (err) {
            callback(err, null);
        }else{
            callback(null, scripts);
        }
    });
};

ScriptSchema.statics.updateScript = function(scriptData, callback) {
    this.update({
        "_id": new ObjectId(scriptData.scriptId)
    }, {
        $set: {
            "name": scriptData.name,
            "description": scriptData.description,
            "fileId": scriptData.fileId,
            "isParametrized":scriptData.isParametrized,
            "noOfParams":scriptData.noOfParams
        },
    },{
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            callback(err,null);
        }
        callback(null,updateCount);
    });
};

ScriptSchema.statics.getScriptById = function(scriptId,callback) {
    this.find({
        "_id": new ObjectId(scriptId)
    }, function(err, scripts) {
        if (err) {
            callback(err, null);
        }else{
            callback(null, scripts);
        }
    });
};

ScriptSchema.statics.getScriptByIds = function(scriptIds,callback) {
    var queryObj = {};
    if (scriptIds && scriptIds.length) {
        queryObj._id = {
            $in: scriptIds
        };
    }
    this.find(queryObj, function(err, scripts) {
        if (err) {
            logger.error("Failed to getScriptByIds :: ", scriptIds, err);
            callback(err, null);
            return;
        }
        callback(null, scripts);
    });
};

ScriptSchema.statics.removeScriptById = function(scriptId, callback) {
    this.remove({
        "_id":  new ObjectId(scriptId)
    }, function(err, scripts) {
        if (err) {
            callback(err, null);
        }else{
            callback(null, scripts);
        }
    });
};

ScriptSchema.statics.getScriptByType = function(scriptType, callback) {
    this.find({
        "type": scriptType
    }, function(err, scripts) {
        if (err) {
            callback(err, null);
        }else{
            callback(null, scripts);
        }
    });
};

var Script = mongoose.model("script", ScriptSchema);
module.exports = Script;