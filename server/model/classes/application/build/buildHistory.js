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
var validate = require('mongoose-validator');
var logger = require('_pr/logger')(module);
var schemaValidator = require('../../../dao/schema-validator');

var Schema = mongoose.Schema;

var buildHistorySchema = new Schema({
    buildId: String,
    jenkinsServerId: String,
    jobName: String,
    jobNumber: String,
    status: String,
    user: String,
    timestampStarted: Number,
    timestampEnded: Number
});

// Do a build
buildHistorySchema.methods.getLogs = function() {

};

buildHistorySchema.methods.updateBuildStatus = function(status, callback) {
    this.status.status = status,
        this.save(function(err, history) {
            if (err) {
                logger.error(err);
                callback(err, null);
                return;
            }
            callback(null, history);
        });
};

buildHistorySchema.statics.BUILD_STATUS = {
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed'
};

// Do a build
buildHistorySchema.statics.createNew = function(historyData, callback) {
    var self = this;
    var buildHistory = new BuildHistory(historyData);

    buildHistory.save(function(err, bHistory) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, bHistory);
    });
};

buildHistorySchema.statics.getHistoryByBuildId = function(buildId, callback) {
    var queryObj = {
        buildId: buildId
    };

    this.find(queryObj, function(err, histories) {
        if (err) {
            logger.error("Failed to getHistoryByBuildId :: ", buildId, err);
            callback(err, null);
            return;
        }
        //logger.debug(data);
        logger.debug("Exit getHistoryByBuildId :: ", buildId);
        callback(null, histories);
    });

};

buildHistorySchema.statics.getHistoryById = function(id, callback) {

    this.findById(id, function(err, history) {
        if (err) {
            logger.error("Failed to getHistoryById :: ", id, err);
            callback(err, null);
            return;
        }
        logger.debug("Exit getHistoryById :: ", id);
        callback(null, history);
    });

};

var BuildHistory = mongoose.model('appBuildHistory', buildHistorySchema);

module.exports = BuildHistory;
