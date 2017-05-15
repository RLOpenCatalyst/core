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
var ObjectId = require('mongoose').Types.ObjectId;
var logger = require('_pr/logger')(module);

var Schema = mongoose.Schema;
var LogSchema = new Schema({
    instanceId: {
        type:String,
        required:false,
        trim:true
    },
    instanceRefId: {
        type:String,
        required:false,
        trim:true
    },
    botId: {
        type:String,
        required:false,
        trim:true
    },
    botRefId: {
        type:String,
        required:false,
        trim:true
    },
    err: {
        type:Boolean,
        default:false,
        trim:true
    },
    log: {
        type:String,
        required:true,
        trim:true
    },
    timestamp: {
        type:Number,
        required:false,
        default:Date.now()
    }
});
var Logs = mongoose.model('logs', LogSchema);
var LogsDao = function() {
    this.insertLog = function(logData, callback) {
        var log = new Logs(logData);
        log.save(function(err, data) {
            if (err) {
                logger.error("Failed to insertLog", err);
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (typeof callback === 'function') {
                callback(null, data);
            }
        });
    };

    this.removeLogsDetails = function(queryObj, callback) {
        Logs.remove(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, data);
            return;
        });
    }

    this.getLogsDetails = function(queryObj, callback) {
        Logs.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, data);
            return;
        });
    }
}


module.exports = new LogsDao();
