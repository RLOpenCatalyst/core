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
var nexus = require('../lib/nexus.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var appDeploy = require('_pr/model/app-deploy/app-deploy');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var taskService = require('_pr/services/taskService.js');
var AppData = require('_pr/model/app-deploy/app-data');
var uuid = require('node-uuid');

const errorType = 'appDeploy';

var appDeployService = module.exports = {};

appDeployService.getNexusRepositoryList = function getNexusRepositoryList(nexusId, projectId, callback) {
    nexus.getNexusRepositories(nexusId, function(err, repositories) {
        if (err) {
            logger.debug("Failed to fetch  Nexus Repository");
            callback(err, null);
            return;
        }
        if (repositories.length === 0) {
            logger.debug("There is no Nexus Server configured.");
            callback(null, []);
            return;
        } else {
            repositories = JSON.parse(repositories);
            var repoData = repositories.repositories.data['repositories-item'];
            masterUtil.getParticularProject(projectId, function(err, aProject) {
                if (err) {
                    logger.debug("Failed to fetch  Project");
                    callback(err, null);
                    return;
                }
                if (aProject.length === 0) {
                    logger.debug("There is no Project configured.");
                    callback(null, []);
                    return;
                } else {
                    var nexusRepositories = [];
                    var aNexusRepo = {};
                    if (aProject[0].repositories) {
                        var repositories = aProject[0].repositories.nexus;
                        if (repositories.length) {
                            for (var x = 0; x < repositories.length; x++) {
                                for (var i = 0; i < repoData.length; i++) {
                                    if (repositories[x] === repoData[i].name) {
                                        aNexusRepo['name'] = repoData[i].name;
                                        aNexusRepo['resourceURI'] = repoData[i].resourceURI;
                                        aNexusRepo['id'] = repoData[i].id;
                                    }
                                }
                                nexusRepositories.push(aNexusRepo);
                                aNexusRepo = {};
                            }
                        }
                        callback(null, nexusRepositories);
                        return;
                    }
                }

            });
        }
    });
};
appDeployService.getNexusArtifactList = function getNexusArtifactList(nexusId, repoName, groupId, callback) {
    nexus.getNexusArtifact(nexusId, repoName, groupId, function(err, artifacts) {
        if (err) {
            logger.debug("Error while fetching nexus artifact.");
            callback(err, null);
            return;
        }
        if (artifacts.length === 0) {
            logger.debug("There is no Nexus Server Artifacts configured.");
            callback(null, []);
            return;
        } else {
            var repoList = [];
            var uniqueArtifacts = [];
            var checker;
            for (var i = 0; i < artifacts.length; i++) {
                (function(aArtifact) {
                    var repoObj = {};
                    repoObj['resourceURI'] = artifacts[i].resourceURI;
                    repoObj['version'] = artifacts[i].version;
                    repoObj['artifactId'] = artifacts[i].artifactId;
                    repoList.push(repoObj);
                    if (!checker || compareObject(checker, aArtifact) != 0) {
                        checker = aArtifact;
                        uniqueArtifacts.push(checker);
                    }
                })(artifacts[i]);
            }
            callback(null, uniqueArtifacts);
        }
    });
};

function compareObject(a, b) {
    if (a.artifactId === b.artifactId) {
        return 0;
    } else {
        return 1;
    }
};
appDeployService.getAppDeployListByProjectId = function getAppDeployListByProjectId(jsonData, callback) {
    masterUtil.getParticularProject(jsonData.projectId, function(err, project) {
        if (err) {
            logger.debug("Failed to fetch  Project");
            callback(err, null);
            return;
        }
        if (project.length === 0) {
            logger.debug("There is no Project configured.");
            callback(null, []);
            return;
        } else {
            appDeploy.getDistinctAppDeployAppNameVersionByProjectId(jsonData, function(err, appDeployResults) {
                if (err) {
                    logger.debug("Failed to fetch App Deploy Versions");
                    callback(err, null);
                    return;
                }
                var appDeployList = [];
                var appDeployObj = {};
                var environments = project[0].environmentname.split(",");
                var distinctAppDeployAppNameVersion = appDeployResults.data;
                if (distinctAppDeployAppNameVersion.length > 0) {
                    for (var i = 0; i < distinctAppDeployAppNameVersion.length; i++) {
                        (function(appNameVersion) {
                            appDeploy.getLatestAppDeployListByProjectIdAppNameVersionId(jsonData.projectId, appNameVersion, function(err, appDeploys) {
                                if (err) {
                                    logger.debug("Failed to fetch App Deploy");
                                    callback(err, null);
                                    return;
                                }
                                if (appDeploys.length === 0) {
                                    logger.debug("There is no App Deploy configured.");
                                    callback(null, []);
                                    return;
                                }
                                appDeployObj['appName'] = {
                                    "name": appDeploys[0].applicationName,
                                    "version": appDeploys[0].applicationVersion
                                };
                                for (var k = 0; k < appDeploys.length; k++) {
                                    (function(appDeploy) {
                                        appDeployObj[appDeploy.envName] = {
                                            "id": appDeploy.id,
                                            "applicationInstanceName": appDeploy.applicationInstanceName,
                                            "applicationNodeIP": appDeploy.applicationNodeIP,
                                            "applicationLastDeploy": appDeploy.lastAppDeployDate,
                                            "applicationStatus": appDeploy.applicationStatus,
                                            "applicationType": appDeploy.applicationType,
                                            "containerId": appDeploy.containerId,
                                            "hostName": appDeploy.hostName,
                                            "isApproved": appDeploy.isApproved
                                        }
                                    })(appDeploys[k]);
                                }
                                for (var l = 0; l < environments.length; l++) {
                                    if (!appDeployObj[environments[l]]) {
                                        appDeployObj[environments[l]] = {};
                                    }
                                }
                                appDeployList.push(appDeployObj);
                                if (distinctAppDeployAppNameVersion.length === appDeployList.length) {
                                    var response = {};
                                    response[jsonData.id] = appDeployList.sort(function(a, b) {
                                        return a.applicationInstanceName - b.applicationInstanceName });
                                    response['metaData'] = {
                                        totalRecords: appDeployResults.totalRecords,
                                        pageSize: jsonData.pageSize,
                                        page: jsonData.page,
                                        totalPages: Math.ceil(appDeployResults.totalRecords / jsonData.pageSize),
                                        sortBy: Object.keys(jsonData.sortBy)[0],
                                        sortOrder: jsonData.sortBy ? (jsonData[Object.keys(jsonData.sortBy)] == 1 ? 'asc' : "desc") : '',
                                    };
                                    callback(null, response);
                                }
                                appDeployObj = {};
                            })
                        })(distinctAppDeployAppNameVersion[i]);
                    }
                } else {
                    var response = {};
                    response[jsonData.id] = [];
                    response['metaData'] = {
                        totalRecords: appDeployResults.totalRecords,
                        pageSize: jsonData.pageSize,
                        page: jsonData.page,
                        totalPages: Math.ceil(appDeployResults.totalRecords / jsonData.pageSize),
                        sortBy: Object.keys(jsonData.sortBy)[0],
                        sortOrder: jsonData.sortBy ? (jsonData[Object.keys(jsonData.sortBy)] == 1 ? 'asc' : "desc") : '',
                    };
                    logger.debug("There is no App Deploy Versions configured.");
                    callback(null, response);
                    return;
                }
            });
        }
    });

};

appDeployService.getAppDeployHistoryListByProjectIdEnvNameAppNameVersion = function getAppDeployHistoryListByProjectIdEnvNameAppNameVersion(projectId, envName, appName, version, callback) {
    appDeploy.getAppDeployHistoryListByProjectIdEnvNameAppNameVersion(projectId, envName, appName, version, function(err, appDeployHistoryList) {
        if (err) {
            logger.debug("Error while fetching App Deploy History via projectId,envName,appName and appDeployVersion");
            callback(err, null);
            return;
        }
        callback(null, appDeployHistoryList);
    })

};

appDeployService.getNexusArtifactVersionList = function getNexusArtifactVersionList(nexusId, repoName, groupId, artifactId, callback) {
    nexus.getNexusArtifactVersions(nexusId, repoName, groupId, artifactId, function(err, versions) {
        if (err) {
            logger.debug("Error while fetching nexus artifact Version.");
            callback(err, null);
            return;
        }
        if (versions.length === 0) {
            logger.debug("There is no Nexus Server Versions configured.");
            callback(null, []);
            return;
        }
        callback(null, versions.metadata.versioning[0].versions[0].version);
    });
};

appDeployService.getAppDeployHistoryListByProjectId = function getAppDeployHistoryListByProjectId(jsonData, callback) {
    jsonData['searchColumns'] = ['envId', 'applicationVersion'];
    apiUtil.databaseUtil(jsonData, function(err, databaseCall) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);

        } else {
            appDeploy.getAppDeployHistoryListByProjectId(databaseCall.queryObj, databaseCall.options, function(err, appDeployHistoryData) {
                if (err) {
                    var err = new Error('Internal server error');
                    err.status = 500;
                    return callback(err);
                } else {
                    return callback(null, appDeployHistoryData);
                }
            });
        }
    });
};

appDeployService.getPipeLineViewListByProjectId = function getPipeLineViewListByProjectId(jsonData, callback) {
    masterUtil.getParticularProject(jsonData.projectId, function(err, project) {
        if (err) {
            logger.debug("Failed to fetch  Project");
            callback(err, null);
            return;
        }
        if (project.length === 0) {
            logger.debug("There is no Project configured.");
            callback(null, []);
            return;
        } else {
            appDeploy.getDistinctAppDeployApplicationNameByProjectId(jsonData, function(err, distinctAppDeployApplicationNames) {
                if (err) {
                    logger.debug("Failed to fetch App Deploy Versions");
                    callback(err, null);
                    return;
                }
                var pipeLineViewList = [];
                var pipeLineViewObj = {};
                var environments = project[0].environmentname.split(",");
                var applicationNames = distinctAppDeployApplicationNames.data;
                if (applicationNames.length > 0) {
                    for (var i = 0; i < applicationNames.length; i++) {
                        (function(appName) {
                            appDeploy.getPipeLineViewListByProjectIdAppName(jsonData.projectId, appName.name, function(err, appDeploys) {
                                if (err) {
                                    logger.debug("Failed to fetch App Deploy");
                                    callback(err, null);
                                    return;
                                };
                                if (appDeploys.length === 0) {
                                    logger.debug("There is no App Deploy configured.");
                                    callback(null, []);
                                    return;
                                };
                                pipeLineViewObj['appName'] = {
                                    "name": appDeploys[0].applicationName,
                                };
                                for (var k = 0; k < appDeploys.length; k++) {
                                    (function(appDeploy) {
                                        pipeLineViewObj[appDeploy.envName] = {
                                            "id": appDeploy.id,
                                            "version": appDeploy.applicationVersion,
                                            "applicationInstanceName": appDeploy.applicationInstanceName,
                                            "applicationNodeIP": appDeploy.applicationNodeIP,
                                            "applicationLastDeploy": appDeploy.lastAppDeployDate,
                                            "applicationStatus": appDeploy.applicationStatus,
                                            "applicationType": appDeploy.applicationType,
                                            "containerId": appDeploy.containerId,
                                            "hostName": appDeploy.hostName,
                                            "isApproved": appDeploy.isApproved
                                        }
                                    })(appDeploys[k]);
                                }
                                for (var l = 0; l < environments.length; l++) {
                                    if (!pipeLineViewObj[environments[l]]) {
                                        pipeLineViewObj[environments[l]] = {};
                                    }
                                }
                                pipeLineViewList.push(pipeLineViewObj);
                                if (pipeLineViewList.length === applicationNames.length) {
                                    var response = {};
                                    response['pipeLineView'] = pipeLineViewList.sort(function(a, b) {
                                        return a - b });
                                    response['metaData'] = {
                                        totalRecords: distinctAppDeployApplicationNames.totalRecords,
                                        pageSize: jsonData.pageSize,
                                        page: jsonData.page,
                                        totalPages: Math.ceil(distinctAppDeployApplicationNames.totalRecords / jsonData.pageSize),
                                        sortBy: Object.keys(jsonData.sortBy)[0],
                                        sortOrder: jsonData.sortBy ? (jsonData[Object.keys(jsonData.sortBy)] == 1 ? 'asc' : "desc") : '',
                                    };
                                    callback(null, response);
                                }
                                pipeLineViewObj = {};
                            });
                        })(applicationNames[i]);
                    }
                } else {
                    var response = {};
                    response['pipeLineView'] = [];
                    response['metaData'] = {
                        totalRecords: distinctAppDeployApplicationNames.totalRecords,
                        pageSize: jsonData.pageSize,
                        page: jsonData.page,
                        totalPages: Math.ceil(distinctAppDeployApplicationNames.totalRecords / jsonData.pageSize),
                        sortBy: Object.keys(jsonData.sortBy)[0],
                        sortOrder: jsonData.sortBy ? (jsonData[Object.keys(jsonData.sortBy)] == 1 ? 'asc' : "desc") : '',
                    };
                    logger.debug("There is no App Deploy Versions configured.");
                    callback(null, response);
                    return;
                }
            });
        }
    });

};

// Contains all business logic to deploy or upgrade application.
appDeployService.appDeployOrUpgrade = function appDeployOrUpgrade(reqBody, isUpgrade, callback) {
    var appData = reqBody.appData;
    var sourceData = reqBody.sourceData;
    var task = reqBody.task;
    var taskId = task.taskId;
    if (sourceData && appData && task) {
        var nexus = sourceData.nexus;
        var docker = sourceData.docker;
        appData['upgrade'] = isUpgrade;
        if (nexus) {
            appData['nexus'] = nexus;
            appData['nexus']['nodeIds'] = task.nodeIds;
            appData['nexus']['taskId'] = taskId;
        }
        if (docker) {
            var containerValue = uuid.v4();
            if (!docker.containerName) {
                docker.containerName = containerValue;
            }

            appData['docker'] = docker;
            appData.docker['nodeIds'] = task.nodeIds;
            appData.docker['taskId'] = taskId;
        }
        AppData.createNewOrUpdate(appData, function(err, savedData) {
            if (err) {
                var err = new Error('Failed to save app-data');
                err.status = 500;
                logger.debug("Failed to save app-data: ", err);
                return callback(err, null);
            }
            logger.debug("Successfully save app-data: ", JSON.stringify(savedData));
            return callback(null, appData);
        });

    } else {
        var err = new Error('Either sourceData or appData or task missing.');
        err.status = 400;
        return callback(err, null);
    }

}

// Contains all business logic to promote application.
appDeployService.promoteApp = function promoteApp(reqBody, callback) {
    var appData = reqBody.appData;
    var task = reqBody.task;
    var taskId = task.taskId;
    if (appData && task) {
        if (appData.sourceEnv === appData.targetEnv) {
            var err = new Error("Source Env and Target Env can't be same.");
            err.status = 403;
            return callback(err, null);
        }
        AppData.getAppDataByProjectAndEnv(appData.projectId, appData.sourceEnv, appData.appName, appData.version, function(err, appDatas) {
            if (err) {
                var err = new Error("Failed to fetch app-data.");
                err.status = 500;
                return callback(err, null);
            }
            if (appDatas && appDatas.length) {
                var nexus = appDatas[0].nexus;
                var docker = appDatas[0].docker;
                appData['upgrade'] = true;
                if (nexus && nexus.nodeIds.length) {
                    appData['nexus'] = nexus;
                    appData['nexus']['nodeIds'] = task.nodeIds;
                    appData['nexus']['taskId'] = taskId;
                }
                if (docker && docker.nodeIds.length) {
                    appData['docker'] = docker;
                    appData.docker['nodeIds'] = task.nodeIds;
                    appData.docker['taskId'] = taskId;
                }
                var applicationData = {
                    "projectId": appData.projectId,
                    "envName": appData.targetEnv,
                    "appName": appData.appName,
                    "version": appData.version,
                    "nexus": nexus,
                    "docker": docker
                };

                logger.debug("applicationData: ", JSON.stringify(applicationData));
                AppData.createNewOrUpdate(applicationData, function(err, savedData) {
                    if (err) {
                        var err = new Error("Failed to save app-data.");
                        err.status = 500;
                        return callback(err, null);
                    }
                    logger.debug("Successfully save app-data: ", JSON.stringify(savedData));
                    applicationData['promote'] = true;
                    return callback(null, applicationData);
                });

            } else {
                var err = new Error("Something wrong,app-data not found from DB.");
                err.status = 404;
                return callback(err, null);
            }
        });

    } else {
        var err = new Error("Either appData or task missing.");
        err.status = 400;
        return callback(err, null);
    }

}
