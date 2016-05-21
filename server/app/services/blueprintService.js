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
var GCP = require('_pr/lib/gcp.js');
var blueprintModel = require('_pr/model/v2.0/blueprint/blueprint.js');
var providerService = require('./providerService.js');
var async = require('async');
var instanceService = require('./instanceService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var instancesModel = require('_pr/model/classes/instance/instance');
var fs = require('fs');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var gcpNetworkProfileModel = require('_pr/model/v2.0/network-profile/gcp-network-profiles');
const errorType = 'blueprint';

var blueprintService = module.exports = {};

blueprintService.getBlueprintById = function getBlueprintById(blueprintId, callback) {
    logger.debug("BlueprintId: ", blueprintId);
    blueprintModel.findById(blueprintId, function(err, blueprint) {
        if (err) {
            var error = new Error("Error to get blueprint.");
            error.status = 500;
            return callback(error, null);
        }
        if (blueprint && blueprint.length) {
            return callback(null, blueprint[0]);
        } else {
            var error = new Error("Blueprint not found.");
            error.status = 404;
            return callback(error, null);
        }

    });
}

blueprintService.launchBlueprint = function launchBlueprint(blueprint, reqBody, callback) {
    var networkProfile = new gcpNetworkProfileModel(blueprint.networkProfile);
    if (networkProfile) {
        var providerId = networkProfile.providerId;

        providerService.getProvider(providerId, function(err, provider) {
            if (err) {
                var error = new Error("Error while fetching Provider.");
                error.status = 500;
                return callback(error, null);
            }
            if (provider) {
                switch (networkProfile.type) {
                    case 'GCP':
                        var gcpProvider = new gcpProviderModel(provider);
                        // Get file from provider decode it and save, after use delete file
                        // Decode file content with base64 and save.
                        var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
                        fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded);
                        var params = {
                            "projectId": gcpProvider.providerDetails.projectId,
                            "keyFilename": '/tmp/' + provider.id + '.json'
                        }
                        var gcp = new GCP(params);
                        var launchParams = {
                            "blueprints": blueprint,
                            "networkConfig": networkProfile,
                            "providers": gcpProvider
                        }
                        gcp.createVM(launchParams, function(err, instance) {
                            if (err) {
                                var error = new Error("instance creation failed in GCP.");
                                error.status = 500;
                                return callback(error, null);
                            }
                            var instanceObj = {
                                "blueprint": blueprint,
                                "instance": instance,
                                "provider": gcpProvider,
                                "envId": reqBody.envId
                            }
                            instanceService.createInstance(instanceObj, function(err, instanceData) {
                                if (err) {
                                    logger.debug("Failed to create instance: ", err);
                                    var error = new Error("instance creation failed.");
                                    error.status = 500;
                                    return callback(error, null);
                                }
                                callback(null, instanceData);

                                var timestampStarted = new Date().getTime();
                                logsDao.insertLog({
                                    referenceId: instanceData.id,
                                    err: false,
                                    log: "Starting instance",
                                    timestamp: timestampStarted
                                });
                                instanceData['blueprint'] = blueprint;
                                instanceService.bootstrapInstance(instanceData, function(err, result) {
                                    fs.unlink('/tmp/' + provider.id + '.json');
                                    if (err) {
                                        var error = new Error("Instance bootstrap failed.");
                                        error.status = 500;
                                        return callback(error, null);
                                    }
                                });
                            });
                        });
                        break;
                        defaut: break;
                }
            } else {
                var error = new Error("Provider Not Found.");
                error.status = 404;
                return callback(error, null);
            }
        });




        /*async.waterfall([

    function(next) {
        providerService.getProvider(providerId, next);
    },
    function(provider, next) {
        switch (networkProfile.type) {
            case 'GCP':
                var gcpProvider = new gcpProviderModel(provider);
                //logger.debug("provider.keyFile: ",JSON.stringify(gcpProvider));
                // Get file from provider decode it and save, after use delete file
                // Decode file content with base64 and save.
                var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
                fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded, next);
                var params = {
                    "projectId": gcpProvider.providerDetails.projectId,
                    "keyFilename": '/tmp/' + provider.id + '.json'
                }
                var gcp = new GCP(params);
                var launchParams = {
                    "blueprints": blueprint,
                    "networkConfig": networkProfile,
                    "providers": gcpProvider
                }
                gcp.createVM(launchParams, next);
                break;
                defaut: break;
        }
    },
    function(instance, next) {
        logger.debug("=============== ", JSON.stringify(instance));
        if (!instance) {
            var error = new Error("instance creation failed.");
            error.status = 500;
            return callback(error, null);
        }
        var gcpProvider = new gcpProviderModel(instance.provider);
        var instanceObj = {
            "blueprint": blueprint,
            "instance": instance,
            "provider": gcpProvider,
            "envId": reqBody.envId
        }
        logger.debug("instanceService: ", JSON.stringify(instanceObj));
        instanceService.createInstance(instanceObj, next);
    },
    function(instanceData, next) {
        var timestampStarted = new Date().getTime();
        var actionLog = instancesModel.insertBootstrapActionLog(instanceData.id, instanceData.runlist, instanceData.sessionUser, timestampStarted);
        var logsReferenceIds = [instanceData.id, actionLog._id];
        logsDao.insertLog({
            referenceId: logsReferenceIds,
            err: false,
            log: "Starting instance",
            timestamp: timestampStarted
        });
        instanceService.bootstrapInstance(instanceData, next);
    }
], function(err, results) {
    if (err) {
        logger.error("GCP Blueprint launch failed: " + err);
        callback(err);
    } else {
        // Delete all files after use.
        fs.unlink('/tmp/' + provider.id + '.json');
        callback(null, results);
    }
})
*/
    } else {
        var err = new Error("NetworkProfile not configured in Blueprint.");
        err.status = 404;
        return callback(err, null);
    }
};

blueprintService.createNew = function createNew(blueprintData, callback) {
    blueprintModel.createNew(blueprintData, function(err, blueprint) {
        if (err) {
            err.status = 500;
            return callback(err, null);
        }
        return callback(null, blueprint);
    });
};

blueprintService.getCookBookAttributes = function getCookBookAttributes(instance, repoData, callback) {
    var blueprint = instance.blueprint;
    //merging attributes Objects
    var attributeObj = {};
    var objectArray = [];
    var attr = [];
    if (instance.runList && instance.runList.length) {
        for (var j = 0; j < instance.runList.length; j++) {
            (function(j) {
                // Attributes which are configures in blueprint.
                attr = instance.runList[j].attributes;
                if (attr && attr.length) {
                    for (var i = 0; i < attr.length; i++) {
                        objectArray.push(attr[i].jsonObj);
                    }
                }
            })(j);
        }
    }
    // While passing extra attribute to chef cookbook "rlcatalyst" is used as attribute.
    //var temp = new Date().getTime();
    if (blueprint.applications && blueprint.applications.length) {
        if (blueprint.applications[0].repoDetails.repoType === "nexus") {
            var url = blueprint.applications[0].repoDetails.url;
            var repoName = blueprint.applications[0].repoDetails.repoName;
            var groupId = blueprint.applications[0].repoDetails.groupId;
            var artifactId = blueprint.applications[0].repoDetails.artifactId;
            var version = blueprint.applications[0].repoDetails.version;
            objectArray.push({
                "rlcatalyst": {
                    "upgrade": false
                }
            });
            objectArray.push({
                "rlcatalyst": {
                    "applicationNodeIP": instance.instanceIP
                }
            });

            nexus.getNexusArtifactVersions(blueprint.applications[0].repoId, repoName, groupId, artifactId, function(err, data) {
                if (err) {
                    logger.debug("Failed to fetch Repository from Mongo: ", err);
                    objectArray.push({
                        "rlcatalyst": {
                            "nexusUrl": url
                        }
                    });
                    objectArray.push({
                        "rlcatalyst": {
                            "version": version
                        }
                    });
                }

                if (data) {
                    var flag = false;
                    var versions = data.metadata.versioning[0].versions[0].version;
                    var latestVersionIndex = versions.length;
                    var latestVersion = versions[latestVersionIndex - 1];
                    //logger.debug("Got latest catalyst version from nexus: ", latestVersion);

                    nexus.getNexusArtifact(blueprint.applications[0].repoId, repoName, groupId, function(err, artifacts) {
                        if (err) {
                            logger.debug("Failed to get artifacts.");
                            objectArray.push({
                                "rlcatalyst": {
                                    "nexusUrl": url
                                }
                            });
                            objectArray.push({
                                "rlcatalyst": {
                                    "version": version
                                }
                            });
                        } else {
                            if (artifacts.length) {
                                for (var i = 0; i < artifacts.length; i++) {
                                    if (latestVersion === artifacts[i].version && artifactId === artifacts[i].artifactId) {
                                        url = artifacts[i].resourceURI;

                                        objectArray.push({
                                            "rlcatalyst": {
                                                "nexusUrl": url
                                            }
                                        });
                                        objectArray.push({
                                            "rlcatalyst": {
                                                "version": latestVersion
                                            }
                                        });
                                        flag = true;
                                        //logger.debug("latest objectArray::: ", JSON.stringify(objectArray));
                                        break;
                                    }

                                }
                                if (!flag) {
                                    objectArray.push({
                                        "rlcatalyst": {
                                            "nexusUrl": url
                                        }
                                    });
                                    objectArray.push({
                                        "rlcatalyst": {
                                            "version": version
                                        }
                                    });
                                }
                            } else {
                                objectArray.push({
                                    "rlcatalyst": {
                                        "nexusUrl": url
                                    }
                                });
                                objectArray.push({
                                    "rlcatalyst": {
                                        "version": latestVersion
                                    }
                                });
                            }
                        }

                        var actualVersion = "";
                        if (latestVersion) {
                            actualVersion = latestVersion;
                        } else {
                            actualVersion = version;
                        }

                        // Update app-data for promote
                        var nodeIp = [];
                        nodeIp.push(instance.instanceIP);
                        configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
                            if (err) {
                                callback({
                                    message: "Failed to get env name from env id"
                                }, null);
                                return;
                            }
                            if (!envName) {
                                callback({
                                    "message": "Unable to find environment name from environment id"
                                });
                                return;
                            }
                            var appData = {
                                "projectId": instance.projectId,
                                "envId": envName,
                                "appName": artifactId,
                                "version": actualVersion,
                                "nexus": {
                                    "repoURL": url,
                                    "nodeIps": nodeIp
                                }
                            };
                            AppData.createNewOrUpdate(appData, function(err, data) {
                                if (err) {
                                    logger.debug("Failed to create or update app-data: ", err);
                                }
                                if (data) {
                                    logger.debug("Created or Updated app-data successfully: ", data);
                                }
                            });
                        });

                        var attributeObj = utils.mergeObjects(objectArray);
                        callback(null, attributeObj);
                        return;
                    });
                } else {
                    logger.debug("No artifact version found.");
                }

            });
        } else if (blueprint.applications[0].repoDetails.repoType === "docker") {
            if (blueprint.applications[0].repoDetails.containerId) {
                objectArray.push({
                    "rlcatalyst": {
                        "containerId": blueprint.applications[0].repoDetails.containerId
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.containerPort) {
                objectArray.push({
                    "rlcatalyst": {
                        "containerPort": blueprint.applications[0].repoDetails.containerPort
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.image) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerImage": blueprint.applications[0].repoDetails.image
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.hostPort) {
                objectArray.push({
                    "rlcatalyst": {
                        "hostPort": blueprint.applications[0].repoDetails.hostPort
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerUser) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerUser": blueprint.applications[0].repoDetails.dockerUser
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerPassword) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerPassword": blueprint.applications[0].repoDetails.dockerPassword
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.dockerEmailId) {
                objectArray.push({
                    "rlcatalyst": {
                        "dockerEmailId": blueprint.applications[0].repoDetails.dockerEmailId
                    }
                });
            }

            if (blueprint.applications[0].repoDetails.imageTag) {
                objectArray.push({
                    "rlcatalyst": {
                        "imageTag": blueprint.applications[0].repoDetails.imageTag
                    }
                });
            }
            objectArray.push({
                "rlcatalyst": {
                    "upgrade": false
                }
            });

            objectArray.push({
                "rlcatalyst": {
                    "applicationNodeIP": instance.instanceIP
                }
            });
            var attrs = utils.mergeObjects(objectArray);
            // Update app-data for promote
            var nodeIp = [];
            nodeIp.push(instance.instanceIP);
            configmgmtDao.getEnvNameFromEnvId(instance.envId, function(err, envName) {
                if (err) {
                    callback({
                        message: "Failed to get env name from env id"
                    }, null);
                    return;
                }
                if (!envName) {
                    callback({
                        "message": "Unable to find environment name from environment id"
                    });
                    return;
                }
                var actualDocker = [];
                var docker = {
                    "image": blueprint.applications[0].repoDetails.image,
                    "containerId": blueprint.applications[0].repoDetails.containerId,
                    "containerPort": blueprint.applications[0].repoDetails.containerPort,
                    "hostPort": blueprint.applications[0].repoDetails.hostPort,
                    "dockerUser": blueprint.applications[0].repoDetails.dockerUser,
                    "dockerPassword": blueprint.applications[0].repoDetails.dockerPassword,
                    "dockerEmailId": blueprint.applications[0].repoDetails.dockerEmailId,
                    "imageTag": blueprint.applications[0].repoDetails.imageTag,
                    "nodeIp": instance.instanceIP
                };
                actualDocker.push(docker);
                var appData = {
                    "projectId": instance.projectId,
                    "envId": envName,
                    "appName": artifactId,
                    "version": blueprint.applications[0].repoDetails.imageTag,
                    "docker": actualDocker
                };
                AppData.createNewOrUpdate(appData, function(err, data) {
                    if (err) {
                        logger.debug("Failed to create or update app-data: ", err);
                    }
                    if (data) {
                        logger.debug("Created or Updated app-data successfully: ", data);
                    }
                })
            });

            callback(null, attrs);
            return;
        }
    } else {
        var attributeObj = utils.mergeObjects(objectArray);
        callback(null, attributeObj);
        return;
    }
};
