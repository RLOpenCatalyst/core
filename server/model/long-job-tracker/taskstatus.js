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


var taskStatusDao = require('./taskstatusdao');
var logger = require('_pr/logger')(module);

function TaskStatusClass(taskId) {

    this.updateTaskStatus = function(status, callback) {
        var timestampUpdated = new Date().getTime();
        taskStatusDao.updateTaskStatus(taskId, {
            timestampUpdated: timestampUpdated,
            statusObj: {
                timestamp: timestampUpdated,
                status: status
            }
        }, function(err, data) {
            if (err) {
                logger.debug('unable to update taskstatus', err);
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (typeof callback === 'function') {
                callback(null, true);
            }
        });
    };

    this.endTaskStatus = function(successful, status, callback) {
        var timestamp = new Date().getTime();
        var updateObj = {
            timestampUpdated: timestamp,
            timestampEnded: timestamp,
            completed: true,
            successful: successful

        }
        if (status) {
            updateObj.statusObj = {
                timestamp: timestamp,
                status: status
            }
        }
        taskStatusDao.updateTaskStatus(taskId, updateObj, function(err, data) {
            if (err) {
                logger.debug('unable to update taskstatus', err);
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (typeof callback === 'function') {
                callback(null, true);
            }
        });

    };

    this.getStatusByTimestamp = function(timestamp, callback) {

        taskStatusDao.getTaskStatusById(taskId, function(err, taskStatus) {
            if (err) {
                logger.debug('unable to get taskstatus', err);
                if (typeof callback === 'function') {
                    callback(err, null);
                }
                return;
            }
            if (!taskStatus.length) {
                callback(null, null);
                return;
            } else {
                callback(null, taskStatus[0]);
            }

        });

    };

    this.getTaskId = function() {
        return taskId;
    }

}

function createNewTask(callback) {
    taskStatusDao.createTaskStatus({
        timestampStarted: new Date().getTime(),
        completed: false,
        successful: false,
    }, function(err, data) {
        if (err) {
            logger.debug(err);
            callback(err, null);
            return
        }
        logger.debug(data);
        callback(null, new TaskStatusClass(data._id));
    });
}

module.exports.getTaskStatus = function(taskId, callback) {
    if (taskId) {
        callback(null, new TaskStatusClass(taskId));
    } else {
        createNewTask(callback);
    }
};
