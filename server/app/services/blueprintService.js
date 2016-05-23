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
var MasterUtils = require('_pr/lib/utils/masterUtil.js');

var networkProfileService = require('_pr/services/networkProfileService.js');
var vmImageDao = require('_pr/model/classes/masters/vmImage.js');



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
        //@TODO Model should return single object
        if (blueprint && blueprint.length) {
            return callback(null, blueprint[0]);
        } else {
            var error = new Error("Blueprint not found.");
            error.status = 404;
            return callback(error, null);
        }

    });
};

blueprintService.getAllBlueprints = function getAllBlueprints(orgIds, callback) {
    blueprintModel.getAllByOrgs(orgIds, function(err, blueprints) {
        if (err) {
            logger.error(err);
            var err = new Error('Internal Server Error');
            err.status = 500;
            callback(err);
        } else {
            callback(null, blueprints);
        }
    });
};

blueprintService.checkBlueprintAccess = function checkBlueprintAccess(orgs, blueprintId, callback) {
    blueprintService.getBlueprintById(blueprintId, function(err, blueprint) {
        if(err) {
            return callback(err);
        }

        var authorized = orgs.reduce(function(a, b) {
            if(b == blueprint.organizationId)
                return true || a;
            else
                return false || a;
        }, false);

        if(!authorized) {
            var err = new Error('Forbidden');
            err.status = 403;
            return callback(err);
        } else {
            return callback(null, blueprint);
        }
    });
};

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


blueprintService.getParentBlueprintCount = function getParentBlueprintCount(parentId, callback) {
    blueprintModel.countByParentId(parentId, function(err, count) {
        if (err) {
            err.status = 500;
            return callback(err, null);
        }

        return callback(null, count);
    });
};

blueprintService.getParentBlueprintCount = function getParentBlueprintCount(parentId, callback) {
    blueprintModel.countByParentId(parentId, function(err, count) {
        if (err) {
            err.status = 500;
            return callback(err, null);
        }

        return callback(null, count);
    });
};

blueprintService.getTemplateById = function getTemplateById(templateId, callback) {
    MasterUtils.getTemplateById(templateId, function(err, templates) {
        if (err) {
            err.status = 500;
            return callback(err);
        }
        console.log('templates ==>', templateId, templates)
        if (templates && templates.length) {
            callback(null, templates[0]);
        } else {
            var err = new Error("Template not found");
            err.status = 400;
            return callback(err);
        }

    });
};

blueprintService.populateBlueprintRelatedData = function populateBlueprintRelatedData(blueprintData, entity, callback) {
    var self = this;
    async.parallel({
        networkProfile: function(callback) {
            if (entity.networkProfileId) {
                networkProfileService.getNetworkProfileById(entity.networkProfileId, callback)
            } else {
                callback(null);
            }
        },
        vmImage: function(callback) {
            if (entity.vmImageId) {
                vmImageDao.getImageById(entity.vmImageId, callback);
            } else {
                callback(null);
            }
        },
        template: function(callback) {
            if (entity.templateId) {
                self.getTemplateById(entity.templateId, callback);
            } else {
                callback(null);
            }
        }
    }, function(err, results) {
        if (err) {
            if (!err.status) {
                err = new Error('Internal Server Error');
                err.status = 500;
            }
            callback(err);
        } else {

            if (results.networkProfile) {
                blueprintData.networkProfile = results.networkProfile;
            }

            if (results.vmImage) {
                blueprintData.vmImage = {
                    name: results.vmImage.name,
                    vmImageId: results.vmImage.imageIdentifier,
                    osType: results.vmImage.osType,
                    osName: results.vmImage.osName,
                    userName: results.vmImage.userName,
                    password: results.vmImage.password,
                };
            }

            if (results.template) {
                var runListArray = results.template.templatescookbooks.split(',');
                blueprintData.runList = [];
                for (var i = 0; i < runListArray.length; i++) {
                    blueprintData.runList.push({
                        name: runListArray[i]
                    });
                }
            }

            callback(null, blueprintData);
        }
    });
};


blueprintService.createBlueprintResponseObject = function createBlueprintResponseObject(blueprint, callback) {
    var providerResponseObject = {
        id: blueprint._id,
        name: blueprint.name,
        version: blueprint.version,
        organization: blueprint.organization,
        businessGroup: blueprint.businessGroup,
        project: blueprint.project,
        networkProfile: blueprint.networkProfile,
        vmImage: blueprint.vmImage,
        runList: blueprint.runList,
        applications: blueprint.applications,
        applicationUrls: blueprint.applicationUrls,
        blueprints: blueprint.blueprints,
        childBlueprintIds: blueprint.childBlueprintIds,
        parentBlueprintId: blueprint.parentBlueprintId
    };

    callback(null, providerResponseObject);
};

blueprintService.createBlueprintResponseList = function createBlueprintResponseList(blueprints, callback) {
    var blueprintsList = [];

    if (blueprints.length == 0)
        return callback(null, {});

    for (var i = 0; i < blueprints.length; i++) {
        (function(blueprint) {
            // @TODO Improve call to self
            blueprintService.createBlueprintResponseObject(blueprint,
                function(err, formattedBlueprint) {
                    if (err) {
                        return callback(err);
                    } else {
                        blueprintsList.push(formattedBlueprint);
                    }

                    if (blueprintsList.length == blueprints.length) {
                        var blueprintsListObj = {
                            blueprints: blueprintsList
                        }
                        return callback(null, blueprintsListObj);
                    }
                });
        })(blueprints[i]);
    }

};

blueprintService.deleteBlueprint = function deleteBlueprint(blueprintId, callback) {
    blueprintModel.deleteById(blueprintId, function(err, blueprint) {
        if(err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if(!blueprint) {
            var err = new Error('Blueprint not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};