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
    referenceId: [String],
    err: Boolean,
    log: String,
    timestamp: Number
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

    this.getLogsByReferenceId = function(referenceId, timestamp, callback) {
        logger.debug("Enter getLogsByReferenceId ", referenceId, timestamp);
        var queryObj = {
            referenceId: {
                $in: [referenceId]
            }
        }

        if (timestamp) {

            queryObj.timestamp = {
                "$gt": timestamp
            };
        }

        Logs.find(queryObj, function(err, data) {
            if (err) {
                logger.debug("Failed to getLogsByReferenceId ", referenceId, timestamp, err);
                callback(err, null);
                return;
            }
            logger.debug("Exit getLogsByReferenceId ", referenceId, timestamp);
            callback(null, data);
        });

    }

    this.getLogsByReferenceIdAndTimestamp = function(referenceId, timestampStarted, timestampEnded, callback) {
        var queryObj = {
            referenceId: {
                $in: [referenceId]
            }
        }
        if (timestampStarted) {
            queryObj.timestamp = {
                "$gt": timestampStarted
            };
            if (timestampEnded) {
                queryObj.timestamp.$lte = timestampEnded
            }
        }
        Logs.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, data);
        });

    }

    this.getLogsByActionId = function(referenceId, callback) {
        logger.debug("Enter getLogsByReferenceId ", referenceId);
        var queryObj = {
            referenceId: {
                $in: [referenceId]
            }
        }

        Logs.find(queryObj, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }

            callback(null, data);
        });

    }
}


module.exports = new LogsDao();
