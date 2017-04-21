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


var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Jenkins = require('_pr/lib/jenkins');
var errorResponses = require('./error_responses.js');
var Tasks = require('_pr/model/classes/tasks/tasks.js');
var Application = require('_pr/model/classes/application/application');
var instancesDao = require('_pr/model/classes/instance/instance');
var TaskHistory = require('_pr/model/classes/tasks/taskHistory');
var logger = require('_pr/logger')(module);
var taskService = require('_pr/services/taskService.js')
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var schedulerService = require('_pr/services/schedulerService');
var catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
var botsService = require('_pr/services/botsService.js');
var auditTrailService = require('_pr/services/auditTrailService.js');
var cronTab = require('node-crontab');

var appConfig = require('_pr/config');
var uuid = require('node-uuid');



module.exports.setRoutes = function(app, sessionVerification) {
    app.all('/tasks/*', sessionVerification);

    app.delete('/tasks/serviceDelivery/:taskId', function(req, res) {
        taskService.deleteServiceDeliveryTask(req.params.taskId, function(err, data) {
            if (err) {
                logger.error("Failed to delete service delivery Task", err);
                res.send(500, errorResponses.db.error);
                return;
            }
            res.send(200, {
                message: "deleted"
            });
        });
    });

    app.get('/tasks/history/list/all', function(req, res) {
        TaskHistory.listHistory(function(err, tHistories) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.send(tHistories);
        });
    });

    app.get('/tasks/list/all', function(req, res) {
        Tasks.listTasks(null, function(err, tasks) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.send(tasks);
        });
    });

    app.all('/tasks/:taskId/*', function(req, res, next) {
        Tasks.getTaskById(req.params.taskId, function(err, task) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (task) {
                if (task.taskType === 'jenkins') {
                    configmgmtDao.getJenkinsDataFromId(task.taskConfig.jenkinsServerId, function(err, jenkinsData) {
                        if (err) {
                            logger.error('jenkins list fetch error', err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        } else {
                            if (!(jenkinsData && jenkinsData.length)) {
                                res.send(404, errorResponses.jenkins.notFound);
                                return;
                            }
                            req.CATALYST = {
                                jenkins: jenkinsData[0]
                            };
                            next();
                        }
                    });
                } else {
                    next();
                    return;
                }
            } else {
                res.send(404);
                return;
            }
        });
    });


    app.post('/tasks/:taskId/run', function(req, res) {
        var taskId = req.params.taskId;
        var user = req.session.user.cn;
        var hostProtocol = req.protocol + '://' + req.get('host');
        var choiceParam = req.body.choiceParam;
        var appData = req.body.appData;
        var scriptParams = req.body.scriptParams;
        var cookbookAttributes = req.body.cookbookAttributes;
        var botTagServer = req.body.tagServer;

        var paramOptions = {
            cookbookAttributes: cookbookAttributes,
            scriptParams: scriptParams
        };

        if (paramOptions.scriptParams && paramOptions.scriptParams.length) {
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var encryptedParams = [];
            for (var i = 0; i < paramOptions.scriptParams.length; i++) {
                var encryptedText = cryptography.encryptText(paramOptions.scriptParams[i], cryptoConfig.encryptionEncoding,
                    cryptoConfig.decryptionEncoding);
                encryptedParams.push(encryptedText);
            }
            paramOptions.scriptParams = encryptedParams;
        }

        taskService.executeTask(taskId, user, hostProtocol, choiceParam, appData, paramOptions, botTagServer, function(err, historyData) {
            if (err === 404) {
                res.status(404).send("Task not found.");
                return;
            } else if (err) {
                logger.error("Failed to execute task.", err);
                res.status(500).send(err);
                return;
            }
            logger.debug("Returned historyData: ", JSON.stringify(historyData));
            historyData['taskId'] = taskId;
            res.status(200).send(historyData);
        });
    });

    app.delete('/tasks/:taskId', function(req, res) {
        Application.getBuildsByTaskId(req.params.taskId, function(err, builds) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (builds && builds.length) {
                res.send(409, {
                    message: "An Application is using this task"
                });
                return;
            } else {
                instancesDao.removeTaskIdFromAllInstances(req.params.taskId, function(err, deleteCount) {
                    if (err) {
                        logger.error(err);
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    Tasks.removeTaskById(req.params.taskId, function(err, deleteCount) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (deleteCount) {
                            TaskHistory.removeByTaskId(req.params.taskId, function(err, removed) {
                                if (err) {
                                    logger.error("Failed to remove history: ", err);
                                }
                            });
                            botsService.removeBotsById(req.params.taskId,function(err,botsData){
                                if(err){
                                    logger.error("Failed to delete Bots ", err);
                                }
                            });
                            auditTrailService.removeAuditTrailById(req.params.taskId,function(err,auditTrailData){
                                if(err){
                                    logger.error("Failed to delete Audit Trail ", err);
                                }
                            });
                            res.send({
                                deleteCount: deleteCount
                            });
                        } else {
                            res.send(400);
                        }
                    });
                })
            }
        })

    });

    app.get('/tasks/:taskId', function(req, res) {
        Tasks.getTaskById(req.params.taskId, function(err, data) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (data) {
                res.send(data);
            } else {
                res.send(404);
            }
        });
    });

    app.get('/tasks/:taskId/history', function(req, res) {
        Tasks.getTaskById(req.params.taskId, function(err, task) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (task) {
                var flag = false;
                logger.debug("autoSyncFlag: ", typeof task.taskConfig.autoSyncFlag);
                if (task.taskConfig.autoSyncFlag === "true" || task.taskConfig.autoSyncFlag === true) {
                    flag = true;
                }
                if (task.taskType === 'jenkins' && flag) {
                    var jenkinsData = req.CATALYST.jenkins;
                    var jenkins = new Jenkins({
                        url: jenkinsData.jenkinsurl,
                        username: jenkinsData.jenkinsusername,
                        password: jenkinsData.jenkinspassword
                    });
                    logger.debug("Inside flag true");
                    TaskHistory.getLast100HistoriesByTaskId(req.params.taskId, function(err, histories) {
                        if (err) {
                            logger.debug(errorResponses.db.error);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        var historyResult = [];
                        var jobResult = [];
                        if (histories.length > 0) {
                            var jobInfo = [];
                            for (var i = 0; i < histories.length; i++) {
                                historyResult.push(histories[i].buildNumber);
                            }
                            jenkins.getDepthJobInfo(task.taskConfig.jobName, function(err, job) {
                                if (err) {
                                    logger.error('jenkins jobs fetch error', err);

                                }
                                if (job && job.builds && job.builds.length) {
                                    for (var j = 0; j < job.builds.length; j++) {
                                        var actualTimeStamp = new Date(job.builds[j].timestamp).setMilliseconds(job.builds[j].duration);
                                        var jobDetails = {
                                            "result": job.builds[j].result,
                                            "timestampEnded": actualTimeStamp,
                                            "timestampStarted": job.builds[j].timestamp
                                        };
                                        jobResult.push(job.builds[j].number);
                                        jobInfo.push(jobDetails);
                                    }
                                }
                                var count = 0;
                                if (jobResult && jobResult.length > 0) {
                                    for (var x = 0; x < jobResult.length; x++) {
                                        (function(x) {
                                            count++;
                                            var resultUrl = [];
                                            if (historyResult.indexOf(jobResult[x]) === -1) {
                                                if (task && task.jobResultURLPattern && task.jobResultURLPattern.length) {
                                                    for (var i = 0; i < task.jobResultURLPattern.length; i++) {
                                                        var urlPattern = task.jobResultURLPattern[i];
                                                        resultUrl.push(urlPattern.replace("$buildNumber", jobResult[x]));
                                                    }
                                                }
                                                var hData = {
                                                    "taskId": req.params.taskId,
                                                    "taskType": "jenkins",
                                                    "user": req.session.user.cn,
                                                    "jenkinsServerId": task.taskConfig.jenkinsServerId,
                                                    "jobName": task.taskConfig.jobName,
                                                    "status": jobInfo[x].result,
                                                    "timestampStarted": jobInfo[x].timestampStarted,
                                                    "buildNumber": jobResult[x],
                                                    "__v": 1,
                                                    "timestampEnded": jobInfo[x].timestampEnded,
                                                    "executionResults": [],
                                                    "nodeIdsWithActionLog": [],
                                                    "nodeIds": [],
                                                    "runlist": [],
                                                    "jobResultURL": resultUrl

                                                };

                                                TaskHistory.createNew(hData, function(err, taskHistoryEntry) {
                                                    if (err) {
                                                        logger.error("Unable to make task history entry", err);
                                                        return;
                                                    }
                                                    logger.debug("Task history created: ", count + " " + jobResult.length);
                                                    if (count === jobResult.length) {
                                                        task.getHistory(function(err, tHistories) {
                                                            if (err) {
                                                                res.status(500).send(errorResponses.db.error);
                                                                return;
                                                            }
                                                            res.send(tHistories);
                                                            return;
                                                        });
                                                    }
                                                });
                                            } else {
                                                if (count === jobResult.length) {
                                                    task.getHistory(function(err, tHistories) {
                                                        if (err) {
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        }
                                                        res.send(tHistories);
                                                        return;
                                                    });
                                                }
                                            }
                                        })(x);
                                    }
                                } else {
                                    task.getHistory(function(err, tHistories) {
                                        if (err) {
                                            res.status(500).send(errorResponses.db.error);
                                            return;
                                        }
                                        res.send(tHistories);
                                        return;
                                    });
                                }

                            });
                        } else {

                            var jobResult = [];
                            var jobInfo = [];
                            jenkins.getDepthJobInfo(task.taskConfig.jobName, function(err, job) {
                                if (err) {
                                    logger.error('jenkins jobs fetch error', err);

                                }
                                if (job && job.builds && job.builds.length) {
                                    for (var j = 0; j < job.builds.length; j++) {
                                        var actualTimeStamp = new Date(job.builds[j].timestamp).setMilliseconds(job.builds[j].duration);
                                        var jobDetails = {
                                            "result": job.builds[j].result,
                                            "timestampEnded": actualTimeStamp,
                                            "timestampStarted": job.builds[j].timestamp
                                        };
                                        jobResult.push(job.builds[j].number);
                                        jobInfo.push(jobDetails);
                                    }
                                }
                                var count1 = 0;
                                if (jobResult && jobResult.length) {
                                    for (var x = 0; x < jobResult.length; x++) {
                                        (function(x) {
                                            var resultUrl = [];
                                            if (task && task.jobResultURLPattern && task.jobResultURLPattern.length) {
                                                for (var i = 0; i < task.jobResultURLPattern.length; i++) {
                                                    var urlPattern = task.jobResultURLPattern[i];
                                                    resultUrl.push(urlPattern.replace("$buildNumber", jobResult[x]));
                                                }
                                            }
                                            var hData = {
                                                "taskId": req.params.taskId,
                                                "taskType": "jenkins",
                                                "user": req.session.user.cn,
                                                "jenkinsServerId": task.taskConfig.jenkinsServerId,
                                                "jobName": task.taskConfig.jobName,
                                                "status": jobInfo[x].result,
                                                "timestampStarted": jobInfo[x].timestampStarted,
                                                "buildNumber": jobResult[x],
                                                "__v": 1,
                                                "timestampEnded": jobInfo[x].timestampEnded,
                                                "executionResults": [],
                                                "nodeIdsWithActionLog": [],
                                                "nodeIds": [],
                                                "runlist": [],
                                                "jobResultURL": resultUrl

                                            };
                                            TaskHistory.createNew(hData, function(err, taskHistoryEntry) {
                                                count1++;
                                                if (err) {
                                                    logger.error("Unable to make task history entry", err);
                                                    return;
                                                }
                                                logger.debug("Task history created ", count1 + " " + jobResult.length);
                                                if (count1 === jobResult.length) {
                                                    task.getHistory(function(err, tHistories) {
                                                        if (err) {
                                                            res.status(500).send(errorResponses.db.error);
                                                            return;
                                                        }
                                                        res.send(tHistories);
                                                        return;
                                                    });
                                                }
                                            });
                                        })(x);
                                    }
                                }

                            });
                        }
                    });
                } else {
                    logger.debug("Else part...");
                    task.getHistory(function(err, tHistories) {
                        if (err) {
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        res.send(tHistories);
                    });
                }
            } else {
                res.send(404);
            }
        });
    });

    app.get('/tasks/:taskId/history/:historyId', function(req, res) {

        Tasks.getTaskById(req.params.taskId, function(err, task) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!task) {
                res.send(404, {
                    message: "task does not exist"
                });
                return;
            }

            task.getHistoryById(req.params.historyId, function(err, history) {
                if (err) {
                    res.status(500).send({
                        message: "Server Behaved Unexpectedly"
                    });
                    return;
                }
                if(history.nodeIds && history.nodeIds.length && history.nodeIdsWithActionLog && history.nodeIdsWithActionLog.length){
                    var nodes = [];
                    var count=0;
                    for(var i=0; i< history.nodeIds.length; i++){
                        for(var j=0; j<history.nodeIdsWithActionLog.length; j++){
                            if(history.nodeIds[i] == history.nodeIdsWithActionLog[j].nodeId){
                                nodes.push(history.nodeIdsWithActionLog[j]);
                            }
                        }
                        count++;
                    }
                    if(count === history.nodeIds.length){
                        history.nodeIdsWithActionLog = nodes;
                        return res.send(200, history);
                    }
                }
                return res.send(200, history);
            });
        });
    });

    app.post('/tasks', function(req, res) {
        Tasks.getTaskByIds(req.body.taskIds, function(err, data) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (data) {
                res.send(data);
            } else {
                res.send(404);
            }
        });
    });

    app.get('/tasks', getTaskList);

    function getTaskList(req, res, next) {
        var reqData = {};
        if(req.query.page) {
            async.waterfall(
                [
                    function (next) {
                        apiUtil.paginationRequest(req.query, 'tasks', next);
                    },
                    function (paginationReq, next) {
                        paginationReq['searchColumns'] = ['name', 'orgName', 'bgName', 'projectName', 'envName'];
                        reqData = paginationReq;
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function (queryObj, next) {
                        Tasks.listTasks(queryObj, next);
                    },
                    function (tasks, next) {
                        apiUtil.paginationResponse(tasks, reqData, next);
                    }
                ],
                function (err, results) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        return res.status(200).send(results);
                    }
                });
        }else{
            var queryObj = {
                serviceDeliveryCheck : req.query.serviceDeliveryCheck === "true" ? true:false,
                actionStatus:req.query.actionStatus
            }
            taskService.getAllServiceDeliveryTask(queryObj, function(err,data){
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.status(200).send(data);
                }
            })
        }
    }

    app.post('/tasks/:taskId/update', function(req, res) {
        var taskData = req.body.taskData;
        if(taskData.taskScheduler  && taskData.taskScheduler !== null && Object.keys(taskData.taskScheduler).length !== 0) {
            taskData.taskScheduler = apiUtil.createCronJobPattern(taskData.taskScheduler);
            taskData.isTaskScheduled = true;
        }else{
            taskData.isTaskScheduled = false;
        }
        if(taskData.manualExecutionTime && taskData.manualExecutionTime !== null){
            taskData.manualExecutionTime = parseInt(taskData.manualExecutionTime);
        }else{
            taskData.manualExecutionTime = 10;
        }
        if (taskData.taskType === 'script') {
            Tasks.getTaskById(req.params.taskId, function(err, scriptTask) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                encryptedParam(taskData.scriptDetails,scriptTask.taskConfig.scriptDetails,function(err, encryptedParam) {
                    if (err) {
                        logger.error(err);
                        res.status(500).send("Failed to encrypted script parameters: ", err);
                        return;
                    } else {
                        taskData.scriptDetails = encryptedParam;
                        Tasks.updateTaskById(req.params.taskId, taskData, function(err, updateCount) {
                            if (err) {
                                logger.error(err);
                                res.status(500).send(errorResponses.db.error);
                                return;
                            }
                            if (updateCount) {
                                if(taskData.isTaskScheduled === true){
                                    if(taskData.executionOrder === 'PARALLEL'){
                                        catalystSync.executeParallelScheduledTasks();
                                    }else{
                                        catalystSync.executeSerialScheduledTasks();
                                    }
                                }else if(scriptTask.cronJobId && scriptTask.cronJobId !== null){
                                    cronTab.cancelJob(scriptTask.cronJobId);
                                }else{
                                    logger.debug("There is no cron job associated with Task ");
                                }
                                if(taskData.serviceDeliveryCheck === true) {
                                    Tasks.getTaskById(req.params.taskId, function (err, task) {
                                        if (err) {
                                            logger.error(err);
                                        } else {
                                            botsService.createOrUpdateBots(task, 'Task', task.taskType, function (err, data) {
                                                if (err) {
                                                    logger.error("Error in creating bots entry." + err);
                                                }
                                            });
                                        }
                                    });
                                }else{
                                    botsService.removeSoftBotsById(req.params.taskId, function (err, data) {
                                        if (err) {
                                            logger.error("Error in updating bots entry." + err);
                                        }
                                    });
                                }
                                res.send({
                                    updateCount: updateCount
                                });
                            } else {
                                res.send(400);
                            }
                        });
                    }
                })
            });
        } else {
            if(taskData.taskType === 'jenkins'){
                taskData.executionOrder= 'PARALLEL';
            }
            Tasks.updateTaskById(req.params.taskId, taskData, function(err, updateCount) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                if (updateCount) {
                    Tasks.getTaskById(req.params.taskId, function (err, task) {
                        if (err) {
                            logger.error(err);
                        }
                        if (task.isTaskScheduled === true) {
                            if (taskData.executionOrder === 'PARALLEL') {
                                catalystSync.executeParallelScheduledTasks();
                            } else {
                                catalystSync.executeSerialScheduledTasks();
                            }
                        }else if(task.cronJobId && task.cronJobId !== null){
                            cronTab.cancelJob(task.cronJobId);
                        }else{
                            logger.debug("There is no cron job associated with Task ");
                        }
                        if (task.serviceDeliveryCheck === true) {
                            botsService.createOrUpdateBots(task, 'Task', task.taskType, function (err, data) {
                                if (err) {
                                    logger.error("Error in creating bots entry." + err);
                                }
                            });
                        }
                    })
                    res.send({
                        updateCount: updateCount
                    });
                } else {
                    res.send(400);
                }
            });
        }
    });

    app.post('/tasks/:taskId/resultUrl/remove', function(req, res) {
        Tasks.getTaskById(req.params.taskId, function(err, data) {
            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (data) {
                logger.debug("result URL: ", req.body.resultURL);
                var result = data.taskConfig.jobResultURL;
                var index = result.indexOf(req.body.resultURL);
                if (index != -1) {
                    result.splice(index, 1);
                    logger.debug("Updated JobResultURL: ", JSON.stringify(result));
                    var tConfig = data.taskConfig;
                    tConfig.jobResultURL = result;
                    Tasks.updateJobUrl(req.params.taskId, tConfig, function(err, updateCount) {
                        if (err) {
                            logger.error(err);
                            res.status(500).send(errorResponses.db.error);
                            return;
                        }
                        if (updateCount) {
                            res.send({
                                updateCount: updateCount
                            });
                        } else {
                            res.send(400);
                        }
                    });
                }
            } else {
                res.send(404);
            }
        });

    });


};

function encryptedParam(paramDetails,existingParams, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var count = 0;
    var encryptedList = [];
    for (var i = 0; i < paramDetails.length; i++) {
        (function (paramDetail) {
            if (paramDetail.scriptParameters.length > 0) {
                count++;
                for (var j = 0; j < paramDetail.scriptParameters.length; j++) {
                    (function (scriptParameter) {
                        if(scriptParameter.paramType ==='Restricted' && scriptParameter.paramVal ===''){
                            if(paramDetails.length === existingParams.length && paramDetail.scriptId ===existingParams[i].scriptId) {
                                encryptedList.push({
                                    paramVal: existingParams[i].scriptParameters[j].paramVal,
                                    paramDesc: scriptParameter.paramDesc,
                                    paramType: scriptParameter.paramType
                                });
                            }else{
                                for(var k = 0; k < existingParams.length; k++){
                                    if(paramDetail.scriptId === existingParams[k].scriptId){
                                        encryptedList.push({
                                            paramVal: existingParams[k].scriptParameters[j].paramVal,
                                            paramDesc: scriptParameter.paramDesc,
                                            paramType: scriptParameter.paramType
                                        });
                                    }
                                }
                            }
                        }else {
                            var encryptedText = cryptography.encryptText(scriptParameter.paramVal, cryptoConfig.encryptionEncoding,
                                cryptoConfig.decryptionEncoding);
                            encryptedList.push({
                                paramVal: encryptedText,
                                paramDesc: scriptParameter.paramDesc,
                                paramType: scriptParameter.paramType
                            });
                        }
                        if (encryptedList.length === paramDetail.scriptParameters.length) {
                            paramDetail.scriptParameters = encryptedList;
                            encryptedList = [];
                        }
                    })(paramDetail.scriptParameters[j]);
                }
            } else {
                count++;
            }
            if (count === paramDetails.length) {
                callback(null, paramDetails);
                return;
            }
        })(paramDetails[i]);
    }
}