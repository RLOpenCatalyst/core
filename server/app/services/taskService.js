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
var instancesDao = require('_pr/model/classes/instance/instance');
var crontab = require('node-crontab');

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
                blueprintIds = task.blueprintIds;
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
            var error1 = new Error('Task Not Found.');
            error1.status = 404;
            return callback(error1, null);
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
        if (histories && histories.docs && histories.docs.length) {
            for (var i = 0; i < histories.docs.length; i++) {
                (function(i) {
                    if (histories.docs[i] && histories.docs[i].taskType == "jenkins") {
                        histories.docs[i] = JSON.parse(JSON.stringify(histories.docs[i]));
                        histories.docs[i].jenkinsLog = "/jenkins/" + histories.docs[i].jenkinsServerId + "/jobs/" + histories.docs[i].jobName + "/builds/" + histories.docs[i].buildNumber + "/output";
                    } else if (histories.docs[i] && histories.docs[i].taskType == "chef") {
                        for (var p = 0; p < histories.docs[i].executionResults.length; p++) {
                            (function(p) {
                                instancesDao.getInstanceById(histories.docs[i].executionResults[p].instanceId, function(err, instance) {
                                    if (err) {
                                        logger.error("Failed to fetch instance: ", err);
                                    }
                                    if (instance && instance.length) {
                                        histories.docs[i].executionResults[p].instanceName = instance[0].name;
                                    }
                                });
                            })(p);
                        }
                        if (histories.docs[i] && histories.docs[i].blueprintExecutionResults && histories.docs[i].blueprintExecutionResults.length) {
                            instancesDao.getInstanceById(histories.docs[i].blueprintExecutionResults[0].result[0].instanceId, function(err, instance) {
                                if (err) {
                                    logger.error("Failed to fetch instance: ", err);
                                }
                                if (instance && instance.length) {
                                    histories.docs[i].blueprintExecutionResults[0].result[0].instanceName = instance[0].name;
                                    histories.docs[i].blueprintExecutionResults[0].result[0].actionId = histories.docs[i].blueprintExecutionResults[0].result[0].actionLogId;
                                    histories.docs[i].executionResults = histories.docs[i].blueprintExecutionResults[0].result;
                                }
                            });
                        }
                    }
                    if (histories.docs[i] && histories.docs[i].taskType == "composite") {
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
                                                histories.docs[i].executionResults.push(data);
                                            } else {
                                                if (data.blueprintExecutionResults && data.blueprintExecutionResults.length) {
                                                    data.blueprintExecutionResults[0].result[0].actionId = data.blueprintExecutionResults[0].result[0].actionLogId;
                                                    data.executionResults = data.blueprintExecutionResults[0].result;

                                                }
                                                var c = 0;
                                                for (var k = 0; k < data.executionResults.length; k++) {
                                                    (function(k) {
                                                        instancesDao.getInstanceById(data.executionResults[k].instanceId, function(err, instance) {
                                                            c++;
                                                            if (err) {
                                                                logger.error("Failed to fetch instance: ", err);
                                                            }
                                                            if (instance && instance.length) {
                                                                data.executionResults[k].instanceName = instance[0].name;
                                                                //histories.docs[i].executionResults.push(data);
                                                            }
                                                            if (data.executionResults.length == c) {
                                                                histories.docs[i].executionResults.push(data);
                                                            }
                                                        });
                                                    })(k);
                                                }
                                            }
                                        }
                                        //if (histories.docs[i] && histories.docs[i].executionResults)
                                        //histories.docs[i].executionResults.push(data);
                                    });
                                })(j);
                            }
                        }
                    }
                    count++;

                    if (count == histories.docs.length) {
                        setTimeout(function() {
                            return callback(null, histories);
                        }, 2000);
                    }
                })(i);
            }
        } else {
            return callback(null, histories);
        }
    });
};


taskService.executeScheduleJob = function executeScheduleJob(task) {
    logger.debug("Task cron::::: ", task.cron);
    if (task.cronEndedOn && task.cronEndedOn === new Date().getTime()) {
        crontab.cancelJob(task.cronJobId);
    } else {
        crontab.cancelJob(task.cronJobId);
        var jobId = crontab.scheduleJob(task.cron, function() {
            taskService.executeTask(task._id, task.userName, "", "", "", function(err, historyData) {
                if (err === 404) {
                    logger.error("Task not found.", err);
                } else if (err) {
                    logger.error("Failed to execute task.", err);
                }
                logger.debug("Task Execution Success: ", task.name);
            });
            taskDao.updateCronJobId(task._id, jobId, function(err, updatedData) {
                if (err) {
                    logger.error("Failed to update task: ", err);
                }
            });
        });
    }
}
