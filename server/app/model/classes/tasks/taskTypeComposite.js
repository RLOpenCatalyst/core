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
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;

var taskTypeSchema = require('./taskTypeSchema');
var TaskHistory = require('./taskHistory');



var compositeTaskSchema = taskTypeSchema.extend({
    assignTasks: [String],
    executionOrder: String
});

// Instance Method :- run composite task

compositeTaskSchema.methods.execute = function(userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    var that = this;
    if (that.executionOrder === "SERIAL") {
        serialExecution(that, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete);
    } else {
        parallelExecution(that, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete);
    }
};

function serialExecution(that, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    var Tasks;
    var taskHistory = new TaskHistory();
    if (!Tasks) {
        Tasks = require('_pr/model/classes/tasks/tasks.js');
    }
    Tasks.getTaskByIds(that.assignTasks, function(err, tasks) {
        if (err) {
            if (typeof onExecute === 'function') {
                onExecute(err, null);
            }
            return;
        }

        if (typeof onExecute === 'function') {
            onExecute(null, null, taskHistory);
        }


        task = [];
        var assignTask = that.assignTasks;
        for (var i = 0; i < assignTask.length; i++) {
            for (var j = 0; j < tasks.length; j++) {
                logger.debug("matched...... ", tasks[j].id);
                if (assignTask[i] === tasks[j].id) {
                    task.push(tasks[j]);
                }
            }
        }
        count12 = 0;

        logger.debug('tasks length', task.length);
        var trackHistory = [];

        function executeTasks(count1) {
            task[count1].execute(userName, baseUrl, choiceParam, nexusData, task[count1].blueprintIds, envId, function(err, taskExecuteData, history) {
                logger.debug("Calling...");
                if (err) {
                    logger.error(err);
                    return;
                }
                setTimeout(function() {
                    for (var t = 0; t < assignTask.length; t++) {
                        (function(t) {
                            TaskHistory.getHistoryByTaskIdAndHistoryId(assignTask[t], history.id, function(err, data) {
                                if (err) {
                                    logger.error("Got error to fetch data: ", err);
                                }
                                if (data) {
                                    var taskHistoryIds = {
                                        taskId: assignTask[t],
                                        historyId: history.id
                                    };
                                    TaskHistory.updateTaskHistoryIds(taskHistory._id, taskHistoryIds, function(err, updatedData) {
                                        logger.debug('save callled => ', JSON.stringify(err), JSON.stringify(updatedData));
                                    });
                                }
                            });
                        })(t);
                    }
                }, 2000);

                /*for (var t = 0; t < assignTask.length; t++) {
                    if (trackHistory.indexOf(assignTask[t]) === -1 && trackHistory.indexOf(history.id) === -1) {
                        trackHistory.push(assignTask[t]);
                        trackHistory.push(history.id);
                        var taskHistoryIds = {
                            taskId: assignTask[t],
                            historyId: history.id
                        };
                        TaskHistory.updateTaskHistoryIds(taskHistory._id, taskHistoryIds, function(err, updatedData) {
                            logger.debug('save callled => ', JSON.stringify(err), JSON.stringify(updatedData));
                        });
                    }
                }*/
            }, function(err, status) {
                if (err) {
                    if (typeof onComplete === 'function') {
                        onComplete(null, 1);
                    }
                    return;
                }
                count12++;
                logger.debug("count: ", count12);
                if (count12 < tasks.length) {
                    if (status === 0) {
                        executeTasks(count12);
                    } else {
                        onComplete(null, 1);
                    }
                } else {
                    logger.debug("Firing onComplete: ", status);
                    if (status === 0) {
                        onComplete(null, 0);
                    } else {
                        logger.debug('firing failure');
                        onComplete(null, 1);
                    }
                }

            });
        }

        executeTasks(count12);
    });
    logger.debug(this.assignTasks);

};

function parallelExecution(that, userName, baseUrl, choiceParam, nexusData, blueprintIds, envId, onExecute, onComplete) {
    logger.debug("parallelExecution:");
    var Tasks;
    var taskHistory = new TaskHistory();
    if (!Tasks) {
        Tasks = require('_pr/model/classes/tasks/tasks.js');
    }
    var assignTask = that.assignTasks;
    Tasks.getTaskByIds(assignTask, function(err, tasks) {
        if (err) {
            if (typeof onExecute === 'function') {
                onExecute(err, null);
            }
            return;
        }

        if (typeof onExecute === 'function') {
            onExecute(null, null, taskHistory);
        }


        taskList = [];
        logger.debug("assignTask: ", JSON.stringify(tasks));
        for (var i = 0; i < assignTask.length; i++) {
            for (var j = 0; j < tasks.length; j++) {
                logger.debug("matched...... ", tasks[j].id);
                if (assignTask[i] === tasks[j].id) {
                    taskList.push(tasks[j]);
                }
            }
        }
        count = 0;
        var trackHistory = [];
        logger.debug('tasks length', taskList.length);
        for (var t = 0; t < taskList.length; t++) {
            (function(t) {
                taskList[t].execute(userName, baseUrl, choiceParam, nexusData, taskList[t].blueprintIds, envId, function(err, taskExecuteData, history) {
                    logger.debug("Calling...");
                    if (err) {
                        onComplete(null, 1);
                        logger.error("error: " + err);
                        return;
                    }
                    for (var t = 0; t < assignTask.length; t++) {
                        if (trackHistory.indexOf(assignTask[t]) === -1 && trackHistory.indexOf(history.id) === -1) {
                            trackHistory.push(taskList[t].id);
                            trackHistory.push(history.id);
                            var taskHistoryIds = {
                                taskId: taskList[t].id,
                                historyId: history.id
                            };
                            TaskHistory.updateTaskHistoryIds(taskHistory._id, taskHistoryIds, function(err, updatedData) {
                                logger.debug('save callled ==>', JSON.stringify(err), JSON.stringify(updatedData));
                            });
                        }
                    }
                }, function(err, status) {
                    logger.debug("error: ", err);
                    logger.debug("status: ", status);
                    if (err) {
                        logger.error("error: ", err);
                        if (typeof onComplete === 'function') {
                            onComplete(null, 1);
                        }
                        return;
                    }
                    if (status === 0) {
                        onComplete(null, 0);
                    } else {
                        logger.debug('firing failure');
                        onComplete(null, 1);
                    }
                });
            })(t);
        }
    });
};

var CompositeTask = mongoose.model('compositeTask', compositeTaskSchema);

module.exports = CompositeTask;
