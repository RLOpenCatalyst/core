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

var DeployHistorySchema = new Schema({
    applicationId: String,
    appInstanceId: String,
    workflowId: String,
    user: String,
    status: String,
    timestampStarted: Number,
    timestampEnded: Number

});

DeployHistorySchema.statics.DEPLOY_STATUS = {
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed'
};

DeployHistorySchema.methods.updateBuildStatus = function(status, callback) {
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

// Do a build
DeployHistorySchema.statics.createNew = function(historyData, callback) {
    var self = this;
    var deployHistory = new DeployHistory(historyData);

    deployHistory.save(function(err, history) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, history);
    });
};

DeployHistorySchema.statics.getHistoryByAppInstanceId = function(appInstanceId, callback) {
    var queryObj = {
        appInstanceId: appInstanceId
    };

    this.find(queryObj, function(err, histories) {
        if (err) {
            logger.error("Failed to getHistoryByAppInstanceId :: ", appInstanceId, err);
            callback(err, null);
            return;
        }
        logger.debug("Exit getHistoryByAppInstanceId :: ", appInstanceId);
        callback(null, histories);
    });

};

DeployHistorySchema.statics.getHistoryByApplicationId = function(applicationId, callback) {
    var queryObj = {
        applicationId: applicationId
    };

    this.find(queryObj, function(err, histories) {
        if (err) {
            logger.error("Failed to getHistoryByApplicationId :: ", applicationId, err);
            callback(err, null);
            return;
        }
        logger.debug("Exit getHistoryByApplicationId :: ", applicationId);
        callback(null, histories);
    });

};

DeployHistorySchema.statics.getHistoryById = function(id, callback) {
    this.findById(id, function(err, history) {
        if (err) {
            logger.error("Failed to getHistoryById :: ", err);
            callback(err, null);
            return;
        }
        logger.debug("Exit getHistoryById :: ", id);
        callback(null, history);
    });

};

var DeployHistory = mongoose.model('appDeployHistory', DeployHistorySchema);

module.exports = DeployHistory;
