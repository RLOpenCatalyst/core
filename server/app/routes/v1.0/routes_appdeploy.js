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
var AppDeploy = require('_pr/model/app-deploy/app-deploy');
var errorResponses = require('./error_responses');
var AppData = require('_pr/model/app-deploy/app-data');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var async = require('async');
var appDeployService = require('_pr/services/appDeployService');
var appDeployValidator = require('_pr/validators/appDeployValidator');
var validate = require('express-validation');
var taskService = require('_pr/services/taskService.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/app-deploy*', sessionVerificationFunc);

    // Get all AppDeploy
    app.get('/app-deploy', function(req, res) {
        AppDeploy.getAppDeploy(function(err, appDeployes) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (appDeployes) {
                res.status(200).send(appDeployes);
                return;
            }
        });
    });

    // Create AppDeploy
    app.post('/app-deploy', function(req, res) {
        logger.debug("Got appDeploy data: ", JSON.stringify(req.body.appDeployData));
        var appDeployData = req.body.appDeployData;
        var instanceIp = appDeployData.applicationNodeIP.trim().split(" ")[0];
        instancesDao.getInstanceByIP(instanceIp, function(err, instance) {
            if (err) {
                logger.error("Failed to fetch instance: ", err);
                res.status(500).send("Failed to fetch instance.");
                return;
            }
            if (instance.length) {
                var anInstance = instance[0];
                appDeployData['projectId'] = anInstance.projectId;
                if(typeof appDeployData.hostName ==='undefined' || appDeployData.hostName === '' || appDeployData.hostName === null || appDeployData.hostName ==='null'){
                    appDeployData.hostName = anInstance.hostName;
                }
                AppDeploy.createNew(appDeployData, function(err, appDeploy) {
                    if (err) {
                        res.status(500).send(errorResponses.db.error);
                        return;
                    }
                    if (appDeploy) {
                        if (appDeployData.containerId && !appDeployData.containerId === "" && !appDeployData.containerId === "NA") {
                            var appData = {
                                "projectId": anInstance.projectId,
                                "envId": appDeployData.envId,
                                "appName": appDeployData.applicationName,
                                "version": appDeployData.applicationVersion
                            };
                            AppData.createNewOrUpdate(appData, function(err, data) {
                                if (err) {
                                    logger.debug("Failed to create or update app-data: ", err);
                                }
                                if (data) {
                                    logger.debug("Created or Updated app-data successfully: ", data);
                                }
                            });
                        }
                        res.status(200).send(appDeploy);
                        return;
                    }
                });
            } else {
                res.status(404).send("Project not found for instanceip.");
                return;
            }
        });
    });

    // Get AppDeploy w.r.t. appName and env
    app.get('/app-deploy/env/:envId/project/:projectId/list', function(req, res) {
        logger.debug("/app-deploy/env/:envId/list called...");
        masterUtil.getAppDataWithDeployList(req.params.envId, req.params.projectId, function(err, appDeploy) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (appDeploy.length) {
                res.status(200).send(appDeploy);
                return;
            } else {
                res.send([]);
                return;
            }
        });
    });

    // Create or update AppData
    app.post('/app-deploy/data/create', function(req, res) {
        AppData.createNewOrUpdate(req.body.appData, function(err, appData) {
            if (err) {
                res.status(500).send("Failed to get appData.");
                return;
            }
            if (appData) {
                res.status(200).send(appData);
                return;
            }
        });
    });

    // Get all AppData by name
    app.get('/app-deploy/data/node/:nodeIp/project/:projectId/env/:envName', function(req, res) {
        AppData.getAppDataByIpAndProjectAndEnv(req.params.nodeIp, req.params.projectId, req.params.envName, function(err, appDatas) {
            if (err) {
                res.status(500).send("Please add app name.");
                return;
            }
            if (appDatas) {
                res.status(200).send(appDatas);
                return;
            }
        });
    });


    // Get respective Logs
    app.get('/app-deploy/:appId/logs', function(req, res) {
        logger.debug("Logs api called...");
        AppDeploy.getAppDeployById(req.params.appId, function(err, appDeploy) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (!appDeploy) {
                res.status(404).send("appDeploy not found!");
                return;
            }
            AppDeploy.getAppDeployLogById(req.params.appId, function(err, logs) {
                if (err) {
                    res.status(500).send(errorResponses.db.error);
                    return;
                }
                if (logs) {
                    res.status(200).send(logs);
                    return;
                } else {
                    res.status(404).send("Logs not available.");
                    return;
                }
            });
        });
    });

    // Get AppDeploy w.r.t. env
    app.get('/app-deploy/env/:envId', function(req, res) {
        logger.debug("Filtered by env called..");
        AppDeploy.getAppDeployByEnvId(req.params.envId, function(err, appDeploy) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (appDeploy) {
                res.status(200).send(appDeploy);
                return;
            } else {
                res.send([]);
                return;
            }
        });
    });

    // Get AppDeploy w.r.t. projectId
    app.get('/app-deploy/project/:projectId/list', function(req, res) {
        logger.debug("Filtered by projectId called..");
        masterUtil.getAppDeployListForProject(req.params.projectId, function(err, appDeploy) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (appDeploy) {
                res.status(200).send(appDeploy);
                return;
            } else {
                res.send([]);
                return;
            }
        });
    });


    app.get('/app-deploy/project/:projectId/appDeployList', validate(appDeployValidator.get), getAppDeployList);

    function getAppDeployList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    apiUtil.paginationRequest(req.query, 'appDeploy', next);
                },
                function(paginationReq, next) {
                    paginationReq['projectId'] = req.params.projectId;
                    appDeployService.getAppDeployListByProjectId(paginationReq, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send({ code: 500, errMessage: err });
                else
                    return res.status(200).send(results);
            });
    };

    app.get('/app-deploy/project/:projectId/pipeLineViewList', validate(appDeployValidator.get), getPipeLineViewList);

    function getPipeLineViewList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    apiUtil.paginationRequest(req.query, 'appDeploy', next);
                },
                function(paginationReq, next) {
                    paginationReq['projectId'] = req.params.projectId;
                    appDeployService.getPipeLineViewListByProjectId(paginationReq, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send({ code: 500, errMessage: err });
                else
                    return res.status(200).send(results);
            });
    };

    app.get('/app-deploy/project/:projectId/env/:envName/appDeployInstanceList',validate(appDeployValidator.appDeploy), getAppDeployHistoryForPipeLineList);

    function getAppDeployHistoryForPipeLineList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    appDeployService.getAppDeployHistoryListByProjectIdEnvNameAppNameVersion(req.params.projectId, req.params.envName, req.query.appName, req.query.version, next);
                }
            ],
            function(err, results) {
                if (err) {
                    return res.status(500).send({ code: 500, errMessage: err });
                } else {
                    return res.status(200).send(results);
                }
            }
        );

    }


    app.get('/app-deploy/project/:projectId/env/:envName/appDeployHistoryList', validate(appDeployValidator.appDeploy), getAppDeployHistoryList);

    function getAppDeployHistoryList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [
                function(next) {
                    apiUtil.paginationRequest(req.query, 'appDeploy', next);
                },
                function(paginationReq, next) {
                    paginationReq['projectId'] = req.params.projectId;
                    paginationReq['envId'] = req.params.envName;
                    paginationReq['id'] = 'appDeploy';
                    reqData = paginationReq;
                    appDeployService.getAppDeployHistoryListByProjectId(paginationReq, next);
                },
                function(appDeployHistoryData, next) {
                    apiUtil.paginationResponse(appDeployHistoryData, reqData, next);
                }

            ],
            function(err, results) {
                if (err)
                    next(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/app-deploy/nexus/:nexusId/project/:projectId/nexusRepositoryList', validate(appDeployValidator.serverList), getNexusRepositoryList);

    function getNexusRepositoryList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    appDeployService.getNexusRepositoryList(req.params.nexusId, req.params.projectId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    return res.status(500).send({ code: 500, errMessage: err });
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.get('/app-deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifactList', validate(appDeployValidator.artifactList), getArtifactList);

    function getArtifactList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    appDeployService.getNexusArtifactList(req.params.nexusId, req.params.repoName, req.params.groupId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    return res.status(500).send({ code: 500, errMessage: err });
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.get('/app-deploy/nexus/:nexusId/repositories/:repoName/group/:groupId/artifact/:artifactId/versionList', validate(appDeployValidator.artifactList), getVersionList);

    function getVersionList(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    appDeployService.getNexusArtifactVersionList(req.params.nexusId, req.params.repoName, req.params.groupId, req.params.artifactId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    return res.status(500).send({ code: 500, errMessage: err });
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }


    // Get  appData by Project and Env
    app.get('/app-deploy/project/:projectId/env/:envId/application/:appName', function(req, res) {
        logger.debug("version= ", req.query.version);
        AppDeploy.getAppDeployByProjectAndEnv(req.params.projectId, req.params.envId, req.params.appName, req.query.version, function(err, appData) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(appData);
            return;
        });
    });

    // Get  appData by Project and repository
    app.get('/app-deploy/project/:projectId/repository/:appName', function(req, res) {
       // logger.debug("version= ", req.query.version);
        AppData.getAppDataByProjectAndRepo(req.params.projectId, req.params.appName,function(err, appData) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(appData);
            return;
        });
    });

    //New App Deploy
    app.post('/app-deploy/new', function(req, res, next) {
        var isUpgrade = false;
        var user = req.session.user.cn;
        var hostProtocol = req.protocol + '://' + req.get('host');
        var taskId = req.body.task.taskId;
        var choiceParam = req.body.choiceParam;
        async.waterfall(
            [
                function(next) {
                    appDeployService.appDeployOrUpgrade(req.body, isUpgrade, next);
                },
                function(appData, next) {
                    taskService.executeTask(taskId, user, hostProtocol, choiceParam, appData,null,null, next);
                },
                function(historyData, next) {
                    var taskRes = {
                        "taskId": taskId,
                        "taskType": historyData.taskType,
                        "historyId": historyData.historyId
                    };
                    next(null, taskRes);
                }
            ],
            function(err, resData) {
                if (err) {
                    next(err);
                } else {
                    return res.send(resData);
                }
            }
        );
    });

    //Upgrade App Deploy
    app.put('/app-deploy/upgrade', function(req, res, next) {
        var isUpgrade = true;
        var user = req.session.user.cn;
        var hostProtocol = req.protocol + '://' + req.get('host');
        var taskId = req.body.task.taskId;
        var choiceParam = req.body.choiceParam;
        async.waterfall(
            [
                function(next) {
                    appDeployService.appDeployOrUpgrade(req.body, isUpgrade, next);
                },
                function(appData, next) {
                    taskService.executeTask(taskId, user, hostProtocol, choiceParam, appData,null,null, next);
                },
                function(historyData, next) {
                    var taskRes = {
                        "taskId": taskId,
                        "taskType": historyData.taskType,
                        "historyId": historyData.historyId
                    };
                    next(null, taskRes);
                }
            ],
            function(err, resData) {
                if (err) {
                    next(err);
                } else {
                    return res.send(resData);
                }
            }
        );
    });

    //Promote Application
    app.put('/app-deploy/promote', function(req, res, next) {
        var user = req.session.user.cn;
        var hostProtocol = req.protocol + '://' + req.get('host');
        var taskId = req.body.task.taskId;
        var choiceParam = req.body.choiceParam;
        async.waterfall(
            [
                function(next) {
                    appDeployService.promoteApp(req.body, next);
                },
                function(appData, next) {
                    taskService.executeTask(taskId, user, hostProtocol, choiceParam, appData,null,null, next);
                },
                function(historyData, next) {
                    var taskRes = {
                        "taskId": taskId,
                        "taskType": historyData.taskType,
                        "historyId": historyData.historyId
                    };
                    next(null, taskRes);
                }
            ],
            function(err, resData) {
                if (err) {
                    next(err);
                } else {
                    return res.send(resData);
                }
            }
        );
    });
}
