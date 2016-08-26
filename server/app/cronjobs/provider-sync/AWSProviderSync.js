
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var instanceService = require('_pr/services/instanceService');
var tagsModel = require('_pr/model/tags');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var instancesDao = require('_pr/model/classes/instance/instance');
var assignedInstancesDao = require('_pr/model/unmanaged-instance');


var AWSProviderSync = Object.create(CatalystCronJob);
AWSProviderSync.execute = awsProviderSync;

module.exports = AWSProviderSync;

function awsProviderSync() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        }else if(orgs.length > 0){
            for(var i = 0; i < orgs.length; i++){
                (function(org){
                    AWSProvider.getAWSProvidersByOrgId(org.rowid, function(err, providers) {
                        if(err) {
                            logger.error(err);
                            return;
                        } else if(providers.length > 0){
                            var count = 0;
                            for(var j = 0; j < providers.length; j++){
                                (function(provider){
                                    count++;
                                    awsProviderSyncForProvider(provider,org.orgname)
                                })(providers[j]);
                            }
                            if(count ===providers.length){
                                return;
                            }
                        }else{
                            logger.info("Please configure Provider in Organization " +org.orgname+" for EC2 Provider Sync");
                            return;
                        }
                    });
                })(orgs[i]);
            }
        }else{
            logger.info("Please configure Organization for EC2 Provider Sync");
            return;
        }
    });
}

function awsProviderSyncForProvider(provider,orgName) {
    logger.info("EC2 Data Fetching started for Provider "+provider.providerName);
    async.waterfall([
        function (next) {
            resourceService.getEC2InstancesInfo(provider,orgName, next);
        },
        function (instances, next) {
            saveEC2Data(instances, next);
        },
        function(instanceSaveData,next){
            unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id,next);
        },
        function(unassignedInstances,next){
            tagMappingForInstances(unassignedInstances,provider,next);
        },
        function(assignedInstances,next){
            saveAssignedInstances(assignedInstances,next);
        }
    ],function (err, results) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.info("EC2 Data Successfully Added for Provider "+provider.providerName);
            return;
        }
    });
};

function saveEC2Data(ec2Info, callback){
    var count = 0;
    if(ec2Info.length === 0) {
        return callback(null, ec2Info);
    };
    for(var i = 0; i < ec2Info.length; i++) {
        (function(ec2) {
            instancesDao.getInstancesByProviderIdOrgIdAndPlatformId(ec2.orgId,ec2.providerId,ec2.platformId,function(err,managedInstances) {
                if (err) {
                    logger.error(err);
                    count++;
                    return;
                }else if (managedInstances.length > 0) {
                    instanceService.instanceSyncWithAWS(managedInstances[0]._id,ec2, function(err, updateInstanceData) {
                        if (err) {
                            logger.error(err);
                            count++;
                            return;
                        } else {
                            count++;
                            if(count === ec2Info.length){
                                callback(null,ec2Info);
                            }
                        }
                    });
                }else {
                    assignedInstancesDao.getInstancesByProviderIdOrgIdAndPlatformId(ec2.orgId,ec2.providerId,ec2.platformId,function(err,assignedInstances) {
                        if (err) {
                            logger.error(err);
                            count++;
                            return;
                        }else if (assignedInstances.length > 0) {
                            assignedInstancesDao.updateInstanceStatus(assignedInstances[0]._id,ec2, function(err, updateInstanceData) {
                                if (err) {
                                    logger.error(err);
                                    count++;
                                    return;
                                } else {
                                    count++;
                                    if(count === ec2Info.length){
                                        callback(null,ec2Info);
                                    }
                                }
                            });
                        }else {
                            unassignedInstancesModel.getInstancesByProviderIdOrgIdAndPlatformId(ec2.orgId, ec2.providerId, ec2.platformId, function (err, unassignedInstances) {
                                if (err) {
                                    logger.error(err);
                                    count++;
                                    return;
                                }else if (unassignedInstances.length === 0) {
                                    unassignedInstancesModel.createNew(ec2, function (err, saveUnassignedInstance) {
                                        if (err) {
                                            logger.error(err);
                                            count++;
                                            return;
                                        } else {
                                            count++;
                                            if(count === ec2Info.length){
                                                callback(null,ec2Info);
                                            }
                                        }
                                    });
                                }else {
                                    unassignedInstancesModel.updateInstanceStatus(unassignedInstances[0]._id,ec2, function (err, updateInstanceData) {
                                        if (err) {
                                            logger.error(err);
                                            count++;
                                            return;
                                        } else {
                                            count++;
                                            if(count === ec2Info.length){
                                                callback(null,ec2Info);
                                            }
                                        }
                                    });
                                }
                            })
                        }
                    });
                }
            });
        })(ec2Info[i]);
    };
};
function tagMappingForInstances(instances,provider,next){
    tagsModel.getTagsByProviderId(provider._id, function (err, tagDetails) {
        if (err) {
            logger.error("Unable to get tags", err);
            next(err);
        }
        var projectTag = null;
        var environmentTag = null;
        if(tagDetails.length > 0) {
            for (var i = 0; i < tagDetails.length; i++) {
                if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'project') {
                    projectTag = tagDetails[i];
                } else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'environment') {
                    environmentTag = tagDetails[i];
                }
            }
        }else{
            next(null,tagDetails);
        }
        var count = 0;
        var assignedInstanceList = [];
        if(instances.length > 0) {
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    var catalystProjectId = null;
                    var catalystProjectName = null;
                    var catalystEnvironmentId = null;
                    var catalystEnvironmentName = null;
                    var assignmentFound = false;
                    if (projectTag && environmentTag && (instance.isDeleted === false)
                        && (projectTag.name in instance.tags) && (environmentTag.name in instance.tags)) {
                        for (var y = 0; y < projectTag.catalystEntityMapping.length; y++) {
                            if (projectTag.catalystEntityMapping[y].tagValue === instance.projectTag || projectTag.catalystEntityMapping[y].tagValue === instance.tags[projectTag.name]) {
                                catalystProjectId = projectTag.catalystEntityMapping[y].catalystEntityId;
                                catalystProjectName = projectTag.catalystEntityMapping[y].catalystEntityName;
                                break;
                            }
                        }
                        for (var y = 0; y < environmentTag.catalystEntityMapping.length; y++) {
                            if (environmentTag.catalystEntityMapping[y].tagValue === instance.environmentTag || environmentTag.catalystEntityMapping[y].tagValue === instance.tags[environmentTag.name]) {
                                catalystEnvironmentId = environmentTag.catalystEntityMapping[y].catalystEntityId;
                                catalystEnvironmentName = environmentTag.catalystEntityMapping[y].catalystEntityName;
                                break;
                            }
                        }
                        if (catalystProjectId && catalystEnvironmentId) {
                            assignmentFound = true;
                        }
                        if (assignmentFound === true) {
                            unassignedInstancesModel.removeInstanceById(instance._id, function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    count++;
                                    return;
                                }else{
                                    var assignedInstanceObj = {
                                        orgId: instance.orgId,
                                        orgName:instance.orgName,
                                        projectId:catalystProjectId,
                                        projectName:catalystProjectName,
                                        environmentId:catalystEnvironmentId,
                                        environmentName:catalystEnvironmentName,
                                        providerId: instance.providerId,
                                        providerType: instance.providerType,
                                        providerData: instance.providerData,
                                        platformId: instance.platformId,
                                        ip: instance.ip,
                                        os: instance.os,
                                        state: instance.state,
                                        network:instance.network,
                                        tags:instance.tags,
                                        environmentTag:instance.environmentTag,
                                        projectTag:instance.projectTag
                                    }
                                    assignedInstanceList.push(assignedInstanceObj);
                                    assignedInstanceObj = {};
                                    count++;
                                    if(count === instances.length){
                                        next(null, assignedInstanceList);
                                    }else{
                                        return;
                                    }
                                }
                            })
                        } else {
                            count++;
                            if (count === instances.length) {
                                next(null, assignedInstanceList);
                            }
                        }
                    } else {
                        count++;
                        if (count === instances.length) {
                            next(null, assignedInstanceList);
                        }
                    }
                })(instances[i]);
            }
        }else{
            logger.info("Please configure Instances for Tag Mapping");
            next(null,instances);
        }
    });
}

function saveAssignedInstances(assignedInstances,callback){
    if(assignedInstances.length > 0){
        var results=[];
        for(var i = 0; i < assignedInstances.length; i++){
            (function(assignedInstance){
                assignedInstancesDao.createNew(assignedInstance,function(err,data){
                    if(err){
                        logger.error(err);
                        results.push(err);
                        return;
                    }else{
                        results.push(data);
                        if(results.length === assignedInstances.length){
                            callback(null,assignedInstances);
                        }
                    }
                })
            })(assignedInstances[i]);
        }
    }else{
        callback(null,assignedInstances);
    }
}