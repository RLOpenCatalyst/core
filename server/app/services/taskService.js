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
var botOld = require('_pr/model/bots/1.0/botOld.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var TaskHistory = require('_pr/model/classes/tasks/taskHistory');
var instancesDao = require('_pr/model/classes/instance/instance');
var auditTrailService = require('_pr/services/auditTrailService');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var async = require('async');
var crontab = require('node-crontab');

const errorType = 'taskService';

var taskService = module.exports = {};

taskService.getChefTasksByOrgBgProjectAndEnvId = function getChefTasksByOrgBgProjectAndEnvId(jsonData, callback) {
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
            callback(null, chefTasks);
        }
    });
};

taskService.getAllServiceDeliveryTask = function getAllServiceDeliveryTask(queryObj, callback) {
    if(queryObj.serviceDeliveryCheck === true && queryObj.actionStatus && queryObj.actionStatus !== null) {
        var query = {
            auditType: 'BOTOLD',
            actionStatus: queryObj.actionStatus,
            auditCategory: 'Task',
            isDeleted:false
        };
        var taskIds = [];
        async.waterfall([
            function (next) {
                auditTrail.getAuditTrails(query, next);
            },
            function (auditTrailList, next) {
                var results = [];
                if (auditTrailList.length > 0) {
                    for (var i = 0; i < auditTrailList.length; i++) {
                        if (taskIds.indexOf(auditTrailList[i].auditId) < 0) {
                            results.push(auditTrailList[i].auditId);
                            taskIds.push(auditTrailList[i].auditId);
                        } else {
                            results.push(auditTrailList[i].auditId);
                        }
                    }
                    if (results.length === auditTrailList.length) {
                        next(null, taskIds);
                    }
                } else {
                    next(null, auditTrailList);
                }
            },
            function (taskIdList, next) {
                if(taskIdList.length > 0) {
                    taskDao.getTaskByIds(taskIdList, next);
                }else{
                    next(null, taskIdList);
                }
            }
        ], function (err, results) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, results);
            return;
        })
    }else if(queryObj.serviceDeliveryCheck === true){
        taskDao.getAllServiceDeliveryTask(queryObj.serviceDeliveryCheck, function(err, tasks) {
            if (err) {
                callback({
                    code: 500,
                    errMessage: "Task fetch failed."
                },null);
                return;
            }
            callback(null, tasks);
            return;
        });
    }else{
        callback(null, []);
        return;
    }
};

taskService.deleteServiceDeliveryTask = function deleteServiceDeliveryTask(taskId, callback) {
    async.waterfall([
        function (next) {
            taskDao.removeServiceDeliveryTask(taskId, next);
        },
        function (deleteTaskCheck, next) {
            auditTrail.softRemoveAuditTrails(taskId,next);
        }
    ],function (err, results) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, results);
        return;
    });
};

taskService.executeTask = function executeTask(taskId, user, hostProtocol, choiceParam, appData, paramOptions, botTagServer, callback) {
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
            if (task.taskType.CHEF_TASK) {
                paramOptions = paramOptions.attributes;
            } else if (task.taskType.SCRIPT_TASK) {
                paramOptions = paramOptions.scriptDetails;
            }
            var blueprintIds = [];
            if (task.blueprintIds && task.blueprintIds.length) {
                blueprintIds = task.blueprintIds;
            }
            task.botParams = paramOptions;
            task.botTagServer = botTagServer;
            var auditTrailId = null;
            var taskExecutionCount = 0;
            if(task.executionCount){
                taskExecutionCount = task.executionCount + 1
            }else{
                taskExecutionCount = 1;
            }
            if(task.serviceDeliveryCheck === true){
                var actionObj={
                    auditType:'BOTOLD',
                    auditCategory:'Task',
                    status:'running',
                    action:'BOTs Task Execution',
                    actionStatus:'running',
                    catUser:user
                };
                var auditTrailObj = {
                    nodeIds:task.taskConfig.nodeIds,
                    name:task.name,
                    type:task.botType,
                    description:task.shortDesc,
                    category:task.botCategory,
                    executionType:task.taskType,
                    manualExecutionTime:task.manualExecutionTime,
                    nodeIdsWithActionLog:[]
                };
                botOld.getBotsById(task._id,function(err,data){
                    if(err){
                        logger.error(err);
                    }else if(data.length > 0){
                        var currentDate = new Date().getTime();
                        if(((data[0].isBotScheduled === false || (data[0].botScheduler.cronEndOn && currentDate >= data[0].botScheduler.cronEndOn)) ||
                            (data[0].isBotScheduled === true && data[0].botScheduler.cronEndOn && currentDate >= data[0].botScheduler.cronEndOn) ||
                            (task.isTaskScheduled === true && task.taskScheduler.cronEndOn && currentDate >= task.taskScheduler.cronEndOn)) && user === 'system'){
                            crontab.cancelJob(data[0].cronJobId);
                            botOld.updateBotsScheduler(data[0]._id,function(err, updatedData) {
                                if (err) {
                                    logger.error("Failed to update Bots Scheduler: ", err);
                                    callback(err,null);
                                    return;
                                }
                                logger.debug("Scheduler is ended on for Bots. "+data[0].botName);
                                callback(null,updatedData);
                                return;
                            });
                            crontab.cancelJob(task.cronJobId);
                            taskDao.updateTaskScheduler(task._id,function(err, updatedData) {
                                if (err) {
                                    logger.error("Failed to update Task Scheduler: ", err);
                                    callback(err,null);
                                    return;
                                }
                                logger.debug("Scheduler is ended on for Task. "+task.name);
                                callback(null,updatedData);
                                return;
                            });
                        }else {
                            var botExecutionCount = data[0].executionCount + 1;
                            taskDao.updateTaskExecutionCount(task._id,taskExecutionCount,function(err,data){
                                if(err){
                                    logger.error("Error while updating Task Execution Count");
                                }
                            });
                            var botUpdateObj = {
                                executionCount:botExecutionCount,
                                lastRunTime:new Date().getTime()
                            }
                            botOld.updateBotsDetail(task._id, botUpdateObj, function (err, data) {
                                if (err) {
                                    logger.error("Error while updating Bot Execution Count");
                                }
                            });
                        }
                    }else{
                        logger.debug("There is no BOTs data present in DB");
                    }
                });
                auditTrailService.insertAuditTrail(task,auditTrailObj,actionObj,function(err,data) {
                    if (err) {
                        logger.error(err);
                    }
                    auditTrailId = data._id;
                    task.execute(user, hostProtocol, choiceParam, appData, blueprintIds, task.envId, auditTrailId, function (err, taskRes, historyData) {
                        if (err) {
                            var error = new Error('Failed to execute task.');
                            error.status = 500;
                            return callback(error, null);
                        }
                        if (historyData) {
                            taskRes.historyId = historyData.id;
                        }
                        auditTrailService.updateAuditTrail('BOTOLD',auditTrailId,{auditHistoryId:historyData.id},function(err,auditTrail){
                            if (err) {
                                logger.error("Failed to create or update bots Log: ", err);
                            }
                        });
                        callback(null, taskRes);
                        return;
                    });
                });
            }else{
                if((task.isTaskScheduled === false || (task.isTaskScheduled === true && task.taskScheduler.cronEndOn && currentDate >= task.taskScheduler.cronEndOn)) && user === 'system') {
                    crontab.cancelJob(task.cronJobId);
                    taskDao.updateTaskScheduler(task._id, function (err, updatedData) {
                        if (err) {
                            logger.error("Failed to update Task Scheduler: ", err);
                            callback(err, null);
                            return;
                        }
                        logger.debug("Scheduler is ended on for Task. " + task.name);
                        callback(null, updatedData);
                        return;
                    });
                }else {
                    taskDao.updateTaskExecutionCount(task._id, taskExecutionCount, function (err, data) {
                        if (err) {
                            logger.error("Error while updating Task Execution Count");
                        }
                    });
                    task.execute(user, hostProtocol, choiceParam, appData, blueprintIds, task.envId, auditTrailId, function (err, taskRes, historyData) {
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
                }
            }

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
                    } else if (histories.docs[i] && histories.docs[i].taskType == "script") {
                        for (var p1 = 0; p1 < histories.docs[i].nodeIdsWithActionLog.length; p1++) {
                            (function(p1) {
                                instancesDao.getInstanceById(histories.docs[i].nodeIdsWithActionLog[p1].nodeId, function(err, instance) {
                                    if (err) {
                                        logger.error("Failed to fetch instance: ", err);
                                    }
                                    var obj = {
                                        "executionId": histories.docs[i].nodeIdsWithActionLog[p1].actionLogId,
                                        "actionId": histories.docs[i].nodeIdsWithActionLog[p1].actionLogId,
                                        "status": histories.docs[i].status,
                                        "instanceId": histories.docs[i].nodeIdsWithActionLog[p1].nodeId
                                    };
                                    var instanceName = "";
                                    if (instance && instance.length) {
                                        obj['instanceName'] = instance[0].name;
                                    }
                                    histories.docs[i].executionResults.push(obj);
                                });
                            })(p1);
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