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
var errorResponses = require('./error_responses.js');
var Tasks = require('../model/classes/tasks/tasks.js');
var Application = require('../model/classes/application/application');
var instancesDao = require('../model/classes/instance/instance');
var TaskHistory = require('../model/classes/tasks/taskHistory');
var logger = require('_pr/logger')(module);

module.exports.setRoutes = function(app, sessionVerification) {
    app.all('/tasks/*', sessionVerification);

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
        Tasks.listTasks(function(err, tasks) {
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
        var choiceParam = req.body.choiceParam;
        logger.debug("Choice Param::: ", choiceParam);
        var nexusData = req.body.nexusData;
        logger.debug("nexusData: ", JSON.stringify(nexusData));
        Tasks.getTaskById(req.params.taskId, function(err, task) {

            if (err) {
                logger.error(err);
                res.status(500).send(errorResponses.db.error);
                return;
            }
            var blueprintIds = [];
            if(task.blueprintIds && task.blueprintIds.length){
                blueprintIds = task.blueprintIds
            }
            task.execute(req.session.user.cn, req.protocol + '://' + req.get('host'), choiceParam, nexusData,blueprintIds,task.envId, function(err, taskRes, historyData) {
                if (err) {
                    logger.error(err);
                    res.status(500).send(err);
                    return;
                }
                if (historyData) {
                    taskRes.historyId = historyData.id;
                }
                logger.debug("taskRes::::: ",JSON.stringify(taskRes));
                res.send(taskRes);
            });
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
                                if (job) {
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
                                if (jobResult.length > 0) {

                                    for (var x = 0; x < jobResult.length; x++) {
                                        (function(x) {
                                            count++;
                                            var resultUrl = [];
                                            if (historyResult.indexOf(jobResult[x]) === -1) {
                                                for (var i = 0; i < task.jobResultURLPattern.length; i++) {
                                                    var urlPattern = task.jobResultURLPattern[i];
                                                    resultUrl.push(urlPattern.replace("$buildNumber", jobResult[x]));
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
                                if (job) {
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
                                if (jobResult) {

                                    for (var x = 0; x < jobResult.length; x++) {
                                        (function(x) {
                                            var resultUrl = [];
                                            for (var i = 0; i < task.jobResultURLPattern.length; i++) {
                                                var urlPattern = task.jobResultURLPattern[i];
                                                resultUrl.push(urlPattern.replace("$buildNumber", jobResult[x]));
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
                res.send(200, history);

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

    app.get('/tasks', function(req, res) {
        logger.debug("Enter get() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/tasks", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
        Tasks.getTasksByOrgBgProjectAndEnvId(req.query.orgId, req.query.bgId, req.query.projectId, req.query.envId, function(err, data) {
            if (err) {
                res.send(500);
                return;
            }
            res.send(data);
        });
        logger.debug("Exit get() for /organizations/%s/businessgroups/%s/projects/%s/environments/%s/tasks", req.params.orgId, req.params.bgId, req.params.projectId, req.params.envId);
    });

    app.post('/tasks/:taskId/update', function(req, res) {
        var taskData = req.body.taskData;

        Tasks.updateTaskById(req.params.taskId, taskData, function(err, updateCount) {
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
