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
var BuildHistory = require('./buildHistory');
var Task = require('../../tasks/tasks.js');

var Schema = mongoose.Schema;

var buildSchema = new Schema({
    envId: String,
    taskId: String,
    functionalTestUrl: String,
    performanceTestUrl: String,
    securityTestUrl: String,
    nonFunctionalTestUrl: String,
    unitTestUrl: String,
    codeCoverageTestUrl: String,
    codeAnalysisUrl: String,
    uiPerformaceUrl: String,
    buildHistoryIds: [String],
});


// instance method
// Do a build
buildSchema.methods.execute = function(user, baseUrl, callback) {
    var self = this;
    Task.getTaskById(self.taskId, function(err, task) {
        if (err) {
            logger.error(err);
            res.status(500).send(errorResponses.db.error);
            return;
        }
        var buildHistory;
        var timestampStarted = new Date().getTime();
        task.execute(user, baseUrl, function(err, taskRes) {
            if (err) {
                logger.error(err);
                callback(err, null)
                return;
            }
            logger.debug('creating build history');
            BuildHistory.createNew({
                buildId: self._id,
                jenkinsServerId: taskRes.jenkinsServerId,
                jobName: taskRes.jobName,
                jobNumber: taskRes.buildNumber,
                user: user,
                timestampStarted: timestampStarted,
                status: BuildHistory.BUILD_STATUS.RUNNING
            }, function(err, history) {
                if (err) {
                    logger.error("unable to save build history", err);
                    return;
                }
                buildHistory = history;
                self.buildHistoryIds.push(history._id);
                self.save();
            });
            callback(err, taskRes);
        }, function(err, status) {

            if (buildHistory) {
                buildHistory.timestampEnded = new Date().getTime();
                if (status === 0) {
                    buildHistory.status = BuildHistory.BUILD_STATUS.SUCCESS;
                } else {
                    buildHistory.status = BuildHistory.BUILD_STATUS.FAILED;
                }
                buildHistory.save();
            }
        });
    });
};

buildSchema.methods.getLastBuild = function(callback) {
    if (this.buildHistoryIds && this.buildHistoryIds.length) {
        BuildHistory.getHistoryById(this.buildHistoryIds[this.buildHistoryIds.length - 1], function(err, history) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, history);
        });
    } else {
        callback(null, null);
    }
};

buildSchema.methods.getHistory = function(callback) {
    BuildHistory.getHistoryByBuildId(this._id, function(err, histories) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, histories);
    });
};


// static methods 
buildSchema.statics.getBuildById = function(buildId, callback) {
    this.find({
        "_id": new ObjectId(buildId)
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (data.length) {
            callback(null, data[0]);
        } else {
            callback(null, null);
        }
    });
};

buildSchema.statics.getBuildsByTaskId = function(taskId, callback) {
    this.find({
        "taskId": taskId
    }, function(err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (data.length) {
            callback(null, data);
        } else {
            callback(null, null);
        }
    });
};

var BuildModel = mongoose.model('appBuilds', buildSchema);

module.exports = BuildModel;
