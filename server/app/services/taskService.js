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

var configmgmtDao = require('../model/d4dmasters/configmgmt.js');
var Jenkins = require('../lib/jenkins');
var Tasks = require('../model/classes/tasks/tasks.js');
var Application = require('../model/classes/application/application');
var instancesDao = require('../model/classes/instance/instance');
var TaskHistory = require('../model/classes/tasks/taskHistory');
var logger = require('_pr/logger')(module);
var async = require("async");

const errorType = 'task';

var taskService = module.exports = {};

taskService.executeTask = function executeTask(taskId, user, hostProtocol, choiceParam, appData, callback) {
    Tasks.getTaskById(req.params.taskId, function(err, task) {

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
            task.execute(req.session.user.cn, req.protocol + '://' + req.get('host'), choiceParam, appData, blueprintIds, task.envId, function(err, taskRes, historyData) {
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
        }else{
        	callback(404,null);
        }
    });
}
