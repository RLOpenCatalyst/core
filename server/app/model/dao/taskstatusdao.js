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

var TaskStatusSchema = new Schema({
    timestampStarted: Number,
    timestampEnded: Number,
    timestampUpdated: Number,
    completed: Boolean,
    successful: Boolean,
    statusList: [{
        timestamp: Number,
        status: Object
    }]
});

var TaskStatus = mongoose.model('taskstatuses', TaskStatusSchema);

var TaskStatusDao = function() {

    this.getTaskStatusById = function(taskId, callback) {
            logger.debug(taskId);
            TaskStatus.find({
                "_id": new ObjectId(taskId)
            }, function(err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, data);

            });
        },

        this.createTaskStatus = function(taskStatusData, callback) {
            var taskStatus = new TaskStatus(taskStatusData);

            taskStatus.save(function(err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                callback(null, data);
            });
        };

    this.updateTaskStatus = function(taskId, updateData, callback) {
        var updateObj = {
            $set: {},
            $push: {}
        };
        if (updateData.timestampEnded) {
            updateObj.$set.timestampEnded = updateData.timestampEnded;
        }
        if (updateData.timestampUpdated) {
            updateObj.$set.timestampUpdated = updateData.timestampUpdated;
        }
        if (updateData.completed) {
            updateObj.$set.completed = updateData.completed;
        }
        if (updateData.successful) {
            updateObj.$set.successful = updateData.successful;
        }
        if (updateData.statusObj) {
            updateObj.$push.statusList = updateData.statusObj;
        }


        TaskStatus.update({
            "_id": new ObjectId(taskId),
        }, updateObj, {
            upsert: false
        }, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug('updated ==>', data);
            callback(null, data);
        });
    };

    this.getStatusByTimestamp = function(taskId, timestamp, callback) {
        var queryObj = {
            "_id": new ObjectId(taskId),
            "statusList.timestamp": {
                $gt: timestamp
            }
        };

        TaskStatus.find(queryObj, {
            statusList: {
                $elemMatch: {
                    timestamp: {
                        $gt: timestamp
                    }
                }
            }
        }, function(err, data) {
            if (err) {
                callback(err, null);
                return;
            }

            logger.debug('status', data);

            callback(null, data);
        });
    };
};

module.exports = new TaskStatusDao();
