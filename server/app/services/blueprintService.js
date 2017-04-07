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
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var instanceService = require('./instanceService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var fs = require('fs');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var gcpNetworkProfileModel = require('_pr/model/v2.0/network-profile/gcp-network-profiles');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');

var networkProfileService = require('_pr/services/networkProfileService.js');
var vmImageDao = require('_pr/model/classes/masters/vmImage.js');
var Blueprints = require('_pr/model/blueprint');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var usersDao = require('_pr/model/users.js');
var auditTrailService = require('_pr/services/auditTrailService');
var bots = require('_pr/model/bots/1.0/bots.js');
var botsService = require('_pr/services/botsService.js');
var ObjectId = require('mongoose').Types.ObjectId;
var uuid = require('node-uuid');
var masterUtil = require('_pr/lib/utils/masterUtil.js');


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

blueprintService.deleteServiceDeliveryBlueprint = function deleteServiceDeliveryBlueprint(blueprintId, callback) {
    async.waterfall([
        function (next) {
            Blueprints.removeServiceDeliveryBlueprints(blueprintId, next);
        },
        function (deleteTaskCheck, next) {
            auditTrail.softRemoveAuditTrails(blueprintId,next);
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

blueprintService.copyBlueprint = function copyBlueprint(blueprintId,masterDetails,callback){
    async.waterfall([
        function(next){
            Blueprints.getById(blueprintId,next);
        },
        function(blueprint,next){
            if(blueprint && blueprint !== null){
                blueprint.orgId = masterDetails.orgId;
                blueprint.bgId = masterDetails.bgId;
                blueprint.projectId = masterDetails.projectId;
                blueprint.parentId = blueprint._id;
                if (blueprint.projectId !== masterDetails.projectId) {
                    if (blueprint.nexus) {
                        blueprint.nexus = undefined;
                    }
                    if (blueprint.docker) {
                        blueprint.docker = undefined;
                    }
                }
                blueprint._id = new ObjectId();
                masterDetails.name = blueprint.name;
                Blueprints.getBlueprintData(masterDetails,function(err,data){
                    if(err){
                        next({
                            errCode:400,
                            errMessage:'There is no blueprint present corresponding to ' + blueprintId + ' in catalyst'
                        },null);
                    }else if(data.length > 0){
                        blueprint.name = blueprint.name + '_copy_' + uuid.v4().split('-')[0];
                        Blueprints.saveCopyBlueprint(blueprint, next);
                    }else{
                        Blueprints.saveCopyBlueprint(blueprint, next);
                    }
                })
            }else{
                next({
                    errCode:400,
                    errMessage:'There is no blueprint present corresponding to ' + blueprintId + ' in catalyst'
                },null);
            }
        },
        function(blueprints,next){
            if(blueprints){
                if(blueprints.serviceDeliveryCheck === true){
                    masterUtil.getParticularProject(masterDetails.projectId, function(err, project) {
                        if (err) {
                            logger.error(err);
                            next(null,blueprints);
                        } else if (project.length > 0) {
                            blueprints.orgName = project[0].orgname;
                            blueprints.bgName = project[0].productgroupname;
                            blueprints.projectName = project[0].projectname;
                            botsService.createOrUpdateBots(blueprints, 'Blueprint', blueprints.blueprintType,next);
                        } else {
                            logger.debug("Unable to find Project Information from project id:");
                            next(null,blueprints);
                        }
                    });
                }else{
                    next(null,blueprints);
                }
            }else{
                next({
                    errCode:400,
                    errMessage:'There is no blueprint present corresponding to ' + blueprintId + ' in catalyst'
                },null);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })
}

blueprintService.launch = function launch(blueprintId,reqBody, callback) {
    async.waterfall([
        function (next) {
            usersDao.haspermission(reqBody.userName, reqBody.category, reqBody.permissionTo, null, reqBody.permissionSet,next);
        },
        function (launchPermission, next) {
            if(launchPermission === true){
                Blueprints.getById(blueprintId,next);
            }else{
                logger.debug('No permission to ' + reqBody.permissionTo + ' on ' + reqBody.category);
                next({errCode:401,errMsg:'No permission to ' + reqBody.permissionTo + ' on ' + reqBody.category},null);
            }
        },
        function(blueprint,next){
            if(blueprint){
                var stackName = null,domainName = null,monitorId = null,blueprintLaunchCount = 0;
                if(blueprint.executionCount) {
                    blueprintLaunchCount = blueprint.executionCount + 1;
                }else{
                    blueprintLaunchCount = 1;
                }
                Blueprints.updateBlueprintExecutionCount(blueprint._id,blueprintLaunchCount,function(err,data){
                    if(err){
                        logger.error("Error while updating Blueprint Execution Count");
                    }
                });
                if (blueprint.blueprintType === 'aws_cf' || blueprint.blueprintType === 'azure_arm') {
                    stackName = reqBody.stackName;
                    if (!stackName) {
                        next({errCode:400,errMsg:"Invalid stack name"},null);
                    }
                }
                if(blueprint.domainNameCheck === true) {
                    domainName = reqBody.domainName;
                    if (!domainName) {
                        next({errCode:400,errMsg:"Invalid Domain name"},null);
                    }
                }
                if (reqBody.monitorId && reqBody.monitorId !== null && reqBody.monitorId !== 'null') {
                    monitorId = reqBody.monitorId;
                }
                if(blueprint.serviceDeliveryCheck === true){
                    var actionObj={
                        auditType:'BOTs',
                        auditCategory:'Blueprint',
                        status:'running',
                        action:'BOTs Blueprint Execution',
                        actionStatus:'running',
                        catUser:reqBody.userName
                    };
                    var auditTrailObj = {
                        name:blueprint.name,
                        type:blueprint.botType,
                        description:blueprint.shortDesc,
                        category:blueprint.botCategory,
                        executionType:blueprint.blueprintType,
                        manualExecutionTime:blueprint.manualExecutionTime,
                        nodeIdsWithActionLog:[]
                    };
                    blueprint.envId= reqBody.envId;
                    bots.getBotsById(blueprint._id,function(err,botData){
                        if(err){
                            logger.error(err);
                        }else if(botData.length > 0){
                            var botExecutionCount = botData[0].executionCount + 1;
                            var botUpdateObj = {
                                executionCount:botExecutionCount,
                                lastRunTime:new Date().getTime(),
                                runTimeParams:reqBody
                            }
                            bots.updateBotsDetail(blueprint._id,botUpdateObj,function(err,data){
                                if(err){
                                    logger.error("Error while updating Bots Configuration");
                                }
                            });
                        }else{
                            logger.debug("There is no Bots Data present in DB");
                        }
                    });
                    auditTrailService.insertAuditTrail(blueprint,auditTrailObj,actionObj,function(err,data){
                        if(err){
                            logger.error(err);
                        }
                        var uuid = require('node-uuid');
                        auditTrail.actionId = uuid.v4();
                        blueprint.launch({
                            envId: reqBody.envId,
                            ver: reqBody.version,
                            stackName: stackName,
                            domainName: domainName,
                            sessionUser: reqBody.userName,
                            tagServer: reqBody.tagServer,
                            monitorId: monitorId,
                            auditTrailId: data._id,
                            botId:data.auditId,
                            auditType:data.auditType,
                            actionLogId:auditTrail.actionId
                        },next);
                    });
                }else{
                    blueprint.launch({
                        envId: reqBody.envId,
                        ver: reqBody.version,
                        stackName: stackName,
                        domainName: domainName,
                        sessionUser: reqBody.userName,
                        tagServer: reqBody.tagServer,
                        monitorId: monitorId,
                        auditTrailId: null,
                        botId:null,
                        auditType:null,
                        actionLogId:null
                    },next);
                }
            }else{
                logger.debug("Blueprint Does Not Exist");
                next({errCode:404,errMsg:"Blueprint Does Not Exist"},null);
            }
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

blueprintService.getAllServiceDeliveryBlueprint = function getAllServiceDeliveryBlueprint(queryObj, callback) {
    if(queryObj.serviceDeliveryCheck === true && queryObj.actionStatus && queryObj.actionStatus !== null) {
        var query = {
            auditType: 'BOTs',
            actionStatus: queryObj.actionStatus,
            auditCategory: 'Blueprint'
        };
        var blueprintIds = [];
        async.waterfall([
            function (next) {
                auditTrail.getAuditTrails(query, next);
            },
            function (auditTrailList, next) {
                var results = [];
                if (auditTrailList.length > 0) {
                    for (var i = 0; i < auditTrailList.length; i++) {
                        if (blueprintIds.indexOf(auditTrailList[i].auditId) < 0) {
                            results.push(auditTrailList[i].auditId);
                            blueprintIds.push(auditTrailList[i].auditId);
                        } else {
                            results.push(auditTrailList[i].auditId);
                        }
                    }
                    if (results.length === auditTrailList.length) {
                        next(null, blueprintIds);
                    }
                } else {
                    next(null, auditTrailList);
                }
            },
            function (blueprintIdList, next) {
                if(blueprintIdList.length > 0) {
                    Blueprints.getByIds(blueprintIdList, next);
                }else{
                    next(null, blueprintIdList);
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
        Blueprints.getAllServiceDeliveryBlueprint(queryObj.serviceDeliveryCheck, function(err, blueprints) {
            if (err) {
                callback({
                    code: 500,
                    errMessage: "Blueprint fetch failed."
                },null);
                return;
            }
            callback(null, blueprints);
            return;
        });
    }else{
        callback(null, []);
        return;
    }
};

blueprintService.checkBlueprintAccess = function checkBlueprintAccess(orgs, blueprintId, callback) {
    blueprintService.getBlueprintById(blueprintId, function(err, blueprint) {
        if (err) {
            return callback(err);
        }

        var authorized = orgs.reduce(function(a, b) {
            if (b == blueprint.organizationId)
                return true || a;
            else
                return false || a;
        }, false);

        if (!authorized) {
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
                    case 'gcp':
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


blueprintService.createBlueprintResponseObject = function createBlueprintResponseObject(blueprint) {
    if (blueprint && blueprint.isDeleted) {
        var err = new Error('Blueprint not found.');
        err.status = 404;
        return err;
    }
    var blueprintResponseObject = {
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
        parentBlueprintId: blueprint.parentBlueprintId,
        bootDiskType: blueprint.bootDiskType,
        bootDiskSize: blueprint.bootDiskSize,
        chefServerId: blueprint.chefServerId
    };

    return blueprintResponseObject;

};

blueprintService.createBlueprintResponseList = function createBlueprintResponseList(blueprints, callback) {
    var blueprintsList = [];

    if (blueprints.length == 0)
        return {};

    for (var i = 0; i < blueprints.length; i++) {
        var bpResObj = blueprintService.createBlueprintResponseObject(blueprints[i]);
        blueprintsList.push(bpResObj);
    }
    return {
        blueprints: blueprintsList
    }

};

blueprintService.deleteBlueprint = function deleteBlueprint(blueprintId, callback) {
    blueprintModel.deleteById(blueprintId, function(err, blueprint) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!blueprint) {
            var err = new Error('Blueprint not found');
            err.status = 404;
            return callback(err);
        } else {
            // @TODO response to be decided
            return callback(null, {});
        }
    });
};

blueprintService.getAllBlueprintsWithFilter = function getAllBlueprintsWithFilter(queryParam,callback){
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(queryParam, 'blueprints', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['botName', 'botType', 'botCategory','botDesc', 'botLinkedCategory','botLinkedSubCategory', 'masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            Blueprints.getBlueprintByOrgBgProjectProviderType(queryObj,next);
        },
        function(filterBlueprintList, next) {
            apiUtil.paginationResponse(filterBlueprintList, reqData, next);
        }
    ],function(err, results) {
        if (err){
            callback(err,null);
            return;
        }
        callback(null,results)
        return;
    });
};

blueprintService.getById = function getById(id, callback) {
    logger.debug('finding blueprint by id ===>' + id);
    Blueprints.findById(id, function(err, blueprint) {
        if (err) {
            callback(err, null);
            return;
        }
        if(blueprint){
            var providerData = blueprint.blueprintConfig.cloudProviderData;
            if(providerData && providerData.keyPairId && !providerData.region){
                AWSKeyPair.getAWSKeyPairById(providerData.keyPairId,function(err,keyPairData){
                    if(err){
                        logger.error("Error while fetching keyPair: ",err);
                        return callback(null,blueprint);
                    }
                    if(keyPairData){
                        blueprint.blueprintConfig.cloudProviderData['region'] = keyPairData.region;
                        return callback(null,blueprint);
                    }else{
                        return callback(null,blueprint);
                    }
                });
            }else{
                return callback(null,blueprint);
            }
        }else{
            return callback(404, null);
        }
    });
};
