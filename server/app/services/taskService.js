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
    })
};

taskService.executeTask = function executeTask(taskId, user, hostProtocol, choiceParam, appData, callback) {
    if (appData) {
        appData['taskId'] = taskId;
    }
    taskDao.getTaskById(taskId, function(err, task) {
        if (err) {
            var err = new Error('Failed to fetch Task.');
            err.status = 500;
            return callback(err, null);
        }
        if (task) {
            var blueprintIds = [];
            if (task.blueprintIds && task.blueprintIds.length) {
                blueprintIds = task.blueprintIds
            }
            task.execute(user, hostProtocol, choiceParam, appData, blueprintIds, task.envId, function(err, taskRes, historyData) {
                if (err) {
                    var err = new Error('Failed to execute task.');
                    err.status = 500;
                    return callback(err, null);
                }
                if (historyData) {
                    taskRes.historyId = historyData.id;
                }
                logger.debug("taskRes::::: ", JSON.stringify(taskRes));
                callback(null, taskRes);
                return;
            });
        } else {
            var err = new Error('Task Not Found.');
            err.status = 404;
            return callback(err, null);
        }
    });
};

taskService.taskList = function taskList(callback) {
    taskDao.listTasks(function(err, tasks) {
        if (err) {
            res.status(500).send(errorResponses.db.error);
            return;
        }
        var tList = [];
        var instanceIds =[];
        if (tasks && tasks.length) {
            for (var i = 0; i < tasks.length; i++) {
                d4dModelNew.d4dModelMastersProjects.find({
                    rowid: tasks[i].projectId,
                    id: '4'
                }, function(err, projectData) {
                    if (err) {
                        logger.debug("getProjectsById: " + err);
                        return callback(err, null);
                    }
                    if (projectData && projectData.length) {
                        tasks[i]['orgName'] = projectData[0].orgname[0];
                        tasks[i]['bgName'] = projectData[0].productgroupname;
                        tasks[i]['projectName'] = projectData[0].projectname;
                        d4dModelNew.d4dModelMastersEnvironments.find({
                            rowid: tasks[i].envId,
                            id: '3'
                        }, function(err, envData) {
                            if (err) {
                                logger.debug("getEnvById: " + err);
                                return callback(err, null);
                            }
                            if (envData && envData.length) {
                                tasks[i]['envName'] = envData[0].environmentname;
                                if (tasks[i].taskConfig && tasks[i].taskConfig.nodeIds && tasks[i].taskConfig.nodeIds.length) {
                                    instancesDao.getInstances(tasks[i].taskConfig.nodeIds,function(err,instances){
                                        if(err){
                                            logger.error("Error while fetching instance: ",err);
                                        }
                                        if(instances && instances.length){
                                            for(var j=0; j< instances.length; j++){
                                                instanceIds.push(instances[j].platformId);
                                            }
                                        }
                                    })
                                }else{
                                    return callback()
                                }
                                /*TaskHistory.getHistoryByTaskId(tasks[i]._id, function(err, tHistory) {
                                    if (err) {
                                        logger.error("Failed to fetch History for a task: ", err);
                                        return callback(err, null);
                                    }
                                    if (tHistory && tHistory.length) {
                                        tasks[i]['status'] = tHistory[0].status;
                                        tasks[i]['startTime'] = tHistory[0].timestampStarted;
                                        tasks[i]['endTime'] = tHistory[0].timestampEnded;
                                    }
                                })*/
                            } else {
                                return callback(null, []);
                            }
                        });
                    } else {
                        return callback(null, []);
                    }
                });
            }
        } else {
            return callback(null, tList);
        }
    });
};
