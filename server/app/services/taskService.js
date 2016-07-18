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
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var TaskHistory = require('_pr/model/classes/tasks/taskHistory');

const errorType = 'taskService';

var taskService = module.exports = {};

taskService.getChefTasksByOrgBgProjectAndEnvId = function getChefTasksByOrgBgProjectAndEnvId(jsonData, callback) {
    //jsonData["taskType"] = { $in: ["chef", "composite"] };
    jsonData["taskType"] = "chef";
    taskDao.getChefTasksByOrgBgProjectAndEnvId(jsonData, function(err, chefTasks) {
        if (err) {
            logger.debug("Failed to fetch  Chef Tasks");
            callback(err, null);
            return;
        }
        if (chefTasks.length === 0) {
            logger.debug("There is no chef Tasks Configured");
            callback(null, []);
            return;
        } else {
            /*var chefTaskList = [];
            var count = 0;
            var compositeObj = {};
            for (var i = 0; i < chefTasks.length; i++) {
                (function(aTask) {
                    if (aTask.taskType === 'chef') {
                        count++;
                        chefTaskList.push(aTask);
                    } else {
                        taskDao.getDistinctTaskTypeByIds(aTask.taskConfig.assignTasks,function(err,distinctTaskType){
                            if(err){
                               logger.debug("Failed to fetch  Distinct Tasks");
                               callback(err,null);
                               return;
                            }
                            count++;
                            if (distinctTaskType.length === 0)
                                logger.debug("There is no composite Tasks Configured");
                            if (distinctTaskType.length === 1 && distinctTaskType[0] === 'chef')
                                chefTaskList.push(aTask);
                            else
                                logger.debug("There is composite Tasks Configured with chef and others also");
                            if (chefTasks.length === count) {
                                callback(null, chefTaskList);
                                return;
                            }
                        });
                    }
                    if (chefTasks.length === count) {
                        callback(null, chefTaskList);
                        return;
                    }
                })(chefTasks[i]);
            }*/
            callback(null, chefTasks);
        }
    });
};

taskService.executeTask = function executeTask(taskId, user, hostProtocol, choiceParam, appData, callback) {
    if (appData) {
        appData['taskId'] = taskId;
    }
    taskDao.getTaskById(taskId, function(err, task) {
        if (err) {
            var error = new Error('Failed to fetch Task.');
            error.status = 500;
            return callback(error, null);
        }
        if (task) {
            var blueprintIds = [];
            if (task.blueprintIds && task.blueprintIds.length) {
                blueprintIds = task.blueprintIds
            }
            task.execute(user, hostProtocol, choiceParam, appData, blueprintIds, task.envId, function(err, taskRes, historyData) {
                if (err) {
                    var error = new Error('Failed to execute task.');
                    error.status = 500;
                    return callback(error, null);
                }
                if (historyData) {
                    taskRes.historyId = historyData.id;
                }
                callback(null, taskRes);
                return;
            });
        } else {
            var error = new Error('Task Not Found.');
            error.status = 404;
            return callback(error, null);
        }
    });
};



taskService.getTaskActionList = function getTaskActionList(jsonData, callback) {
    TaskHistory.listHistoryWithPagination(jsonData, function(err, histories) {
        if (err) {
            logger.error("Failed to fetch TaskActions: ", err);
            return callback(err, null);
        }
        var count = 0;
        var totalRecord = 0;
        if (histories && histories.docs && histories.docs.length) {
            for (var i = 0; i < histories.docs.length; i++) {
                (function(i) {
                    if (histories.docs[i] && histories.docs[i].taskType == "jenkins") {
                        histories.docs[i] = JSON.parse(JSON.stringify(histories.docs[i]));
                        histories.docs[i].jenkinsLog = "/jenkins/" + histories.docs[i].jenkinsServerId + "/jobs/" + histories.docs[i].jobName + "/builds/" + histories.docs[i].buildNumber + "/output";
                    }
                    if (histories.docs[i] && histories.docs[i].taskType == "composite") {
                        totalRecord = totalRecord + histories.docs[i].taskHistoryIds.length;
                        if (histories.docs[i].taskHistoryIds && histories.docs[i].taskHistoryIds.length) {
                            for (var j = 0; j < histories.docs[i].taskHistoryIds.length; j++) {
                                (function(j) {
                                    TaskHistory.getHistoryByTaskIdAndHistoryId(histories.docs[i].taskHistoryIds[j].taskId, histories.docs[i].taskHistoryIds[j].historyId, function(err, data) {
                                        if (err) {
                                            logger.error("Failed to fetch history: ", err);
                                        }
                                        if (data) {
                                            if (data.taskType == "jenkins") {
                                                data = JSON.parse(JSON.stringify(data));
                                                data.jenkinsLog = "/jenkins/" + data.jenkinsServerId + "/jobs/" + data.jobName + "/builds/" + data.buildNumber + "/output";
                                            }
                                        }
                                        if (histories.docs[i] && histories.docs[i].executionResults)
                                            histories.docs[i].executionResults.push(data);
                                    });
                                    for (var x = 0; x < histories.docs.length; x++) {
                                        (function(x) {
                                            if (histories.docs[x]) {
                                                if (histories.docs[i].taskHistoryIds[j].historyId == histories.docs[x]._id) {
                                                    delete histories.docs[x];
                                                }
                                            }
                                        })(x);
                                    }
                                })(j);
                            }
                        }
                    }
                    count++;

                    if (count == histories.docs.length) {
                        setTimeout(function() {
                            histories.docs = histories.docs.filter(function(e) {
                                return !!e;
                            });
                            histories.total = histories.total - totalRecord;
                            return callback(null, histories);
                        }, 200);
                    }
                })(i);
            }
        } else {
            return callback(null, histories);
        }
    });
};
