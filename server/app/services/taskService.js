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

const errorType = 'taskService';

var taskService = module.exports = {};

taskService.getChefTasksByOrgBgProjectAndEnvId = function getChefTasksByOrgBgProjectAndEnvId(jsonData, callback) {
    jsonData["taskType"] = { $in: ["chef", "composite"] };
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
            var chefTaskList = [];
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
            }
        }
    })
};

taskService.executeTask = function executeTask(taskId, user, hostProtocol, choiceParam, appData, callback) {
    taskDao.getTaskById(taskId, function(err, task) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (task) {
            var blueprintIds = [];
            if (task.blueprintIds && task.blueprintIds.length) {
                blueprintIds = task.blueprintIds
            }
            task.execute(user, hostProtocol, choiceParam, appData, blueprintIds, task.envId, function(err, taskRes, historyData) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                    return;
                }
                if (historyData) {
                    taskRes.historyId = historyData.id;
                }
                logger.debug("taskRes::::: ", JSON.stringify(taskRes));
                callback(null, taskRes);
            });
        } else {
            callback(404, null);
        }
    });
};
