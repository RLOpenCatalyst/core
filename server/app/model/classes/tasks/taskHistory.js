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
var schemaValidator = require('_pr/model/dao/schema-validator');
var mongoosePaginate = require('mongoose-paginate');
var apiUtils = require('_pr/lib/utils/apiUtil.js');

var Schema = mongoose.Schema;

var taskHistorySchema = new Schema({
    taskId: String,
    taskType: String,
    runlist: [String],
    nodeIds: [String],
    nodeIdsWithActionLog: [{
        nodeId: String,
        actionLogId: String
    }],
    attributes: Schema.Types.Mixed,
    jenkinsServerId: String,
    jobName: String,
    buildNumber: Number,
    previousBuildNumber: Number,
    status: String,
    user: String,
    timestampStarted: Number,
    timestampEnded: Number,
    jobResultURL: [String],
    executionResults: [Schema.Types.Mixed],
    assignedTaskIds: [String],
    taskHistoryIds: [{
        taskId: String,
        historyId: String
    }],
    blueprintExecutionResults: Schema.Types.Mixed,
    orgName: String,
    bgName: String,
    projectName: String,
    envName: String,
    taskName: String,
    manualExecutionTime: {
        type: Number,
        required: false
    }
});

taskHistorySchema.plugin(mongoosePaginate);
//var TaskHistories = mongoose.model('taskHistory', taskHistorySchema);

taskHistorySchema.method.update = function(status, timestampEnded, callback) {
    var self = this;
    var taskHistory = new self(historyData);

    taskHistory.save(function(err, tHistory) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tHistory);
    });
};

taskHistorySchema.statics.createNew = function(historyData, callback) {
    var self = this;
    var taskHistory = new self(historyData);

    taskHistory.save(function(err, tHistory) {
        logger.debug('saving task history ==>');
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tHistory);
    });
};

taskHistorySchema.statics.getHistoryByTaskId = function(taskId, callback) {
    this.find({
        taskId: taskId
    }).sort({
        "buildNumber": 'desc'
    }).exec(function(err, tHistories) {
        if (err) {
            logger.debug('err', err);
            callback(err, null);
            return;
        }
        callback(null, tHistories);
    });
};

taskHistorySchema.statics.getHistoryByTaskIdAndHistoryId = function(taskId, historyId, callback) {
    this.find({
        taskId: taskId,
        _id: new ObjectId(historyId)
    }, function(err, tHistories) {
        if (err) {
            callback(err, null);
            return;
        }
        if (tHistories.length) {
            callback(null, tHistories[0]);
        } else {
            callback(null, null);
        }
    });
};


taskHistorySchema.statics.getLast100HistoriesByTaskId = function(taskId, callback) {

    this.find({
        taskId: taskId
    }, function(err, tHistories) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tHistories);
    }).sort({
        buildNumber: -1
    }).limit(100);
};

taskHistorySchema.statics.listHistory = function(callback) {
    this.find(function(err, tHistories) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tHistories);
    });
};

taskHistorySchema.statics.listHistoryWithPagination = function(jsonData, callback) {
    if (jsonData && jsonData.pageSize) {
        jsonData['searchColumns'] = ['taskName', 'status', 'orgName', 'bgName', 'projectName', 'envName'];
        apiUtils.databaseUtil(jsonData, function(err, databaseCall) {
            if (err) {
                var err = new Error('Internal server error');
                err.status = 500;
                return callback(err);
            } else {
                databaseCall.queryObj.$or =[{taskType:'jenkins',orgName:{$ne:null}},{taskType:'chef'},{taskType:'composite'},{taskType:'script'},{taskType:'puppet'}];
                TaskHistory.paginate(databaseCall.queryObj, databaseCall.options, function(err, taskActions) {
                    if (err) {
                        logger.error(err);
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err);
                    }
                    return callback(null, taskActions);
                });
            }
        });

    } else {
        TaskHistory.find(function(err, data) {
            if (err) {
                logger.error("Failed to task actions :: ", err);
                callback(err, null);
                return;
            }
            return callback(null, data);
        });
    }
};

taskHistorySchema.statics.removeByTaskId = function(taskId, callback) {
    var queryObj = {
        taskId: taskId
    }

    this.remove(queryObj, function(err, data) {
        if (err) {
            logger.debug("Failed to remove ", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};
taskHistorySchema.statics.updateHistory = function updateHistory(hId, historyData, callback) {
    var self = this;
    var setData = {};
    var keys = Object.keys(historyData);
    for (var i = 0; i < keys.length; i++) {
        setData[keys[i]] = historyData[keys[i]];
    }

    self.update({
        _id: new ObjectId(hId)
    }, {
        $set: {
            orgName: historyData.orgName,
            bgName: historyData.bgName,
            projectName: historyData.projectName,
            envName: historyData.envName,
            taskName: historyData.taskName,
        }
    }, {
        upsert: false
    }, function(err, updatedData) {
        if (err) {
            logger.debug("Failed to update: ", err);
            callback(err, null);
            return;
        }
        callback(null, updatedData);
        return;
    });
};

taskHistorySchema.statics.getTaskHistory = function getTaskHistory(query,callback) {
    this.find(query,function(err, tHistories) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, tHistories);
    });
};

taskHistorySchema.statics.updateRunningTaskHistory = function updateRunningTaskHistory(taskHistoryId,queryObj,callback){
    TaskHistory.update({_id:new ObjectId(taskHistoryId)},{$set:queryObj},{multi:true}, function(err, updatedTaskHistory) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updatedTaskHistory);
    });
};

var TaskHistory = mongoose.model('taskHistory', taskHistorySchema);

module.exports = TaskHistory;
