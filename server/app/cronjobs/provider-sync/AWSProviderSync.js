
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
var logsDao = require('_pr/model/dao/logsdao.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var Docker = require('_pr/model/docker.js');


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
            saveEC2Data(instances,provider, next);
        },
        function(instances,next){
            async.parallel({
                instanceSync: function(callback){
                    instanceSyncWithAWS(instances,provider._id,callback);
                },
                assignedInstance: function(callback){
                    async.waterfall([
                        function(next){
                            unassignedInstancesModel.getUnAssignedInstancesByProviderId(provider._id,next)
                        },
                        function(unassignedInstances,next){
                            tagMappingForInstances(unassignedInstances,provider,next);
                        }
                    ],function(err,results){
                        if(err){
                            callback(err,null);
                        }
                        callback(null,results);
                    })
                }
            },function(err,results){
                if(err){
                    next(err,null);
                }
                next(null,results);
            });
        },
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

function saveEC2Data(ec2Info,provider, callback){
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
                    instanceService.instanceSyncWithAWS(managedInstances[0]._id,ec2,provider, function(err, updateInstanceData) {
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
        var bgTag = null;
        if(tagDetails.length > 0) {
            for (var i = 0; i < tagDetails.length; i++) {
                if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'project') {
                    projectTag = tagDetails[i];
                }else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'environment') {
                    environmentTag = tagDetails[i];
                }else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'bgName') {
                    bgTag = tagDetails[i];
                }
            }
        }else{
            next(null,tagDetails);
        }
        if(instances.length > 0) {
            var managedInstanceList = [];
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    var catalystProjectId = null;
                    var catalystProjectName = null;
                    var catalystEnvironmentId = null;
                    var catalystEnvironmentName = null;
                    var catalystBgId = null;
                    var catalystBgName = null;
                    if(instance.tags && environmentTag !== null && (instance.isDeleted === false)) {
                        managedInstanceList.push(instance);
                        if (bgTag !== null && bgTag.name in instance.tags) {
                            for (var y = 0; y < bgTag.catalystEntityMapping.length; y++) {
                                if (bgTag.catalystEntityMapping[y].tagValue !== '' && instance.tags[bgTag.name] !== '' &&
                                    bgTag.catalystEntityMapping[y].tagValue === instance.tags[bgTag.name]) {
                                    catalystBgId = bgTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystBgName = bgTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if (projectTag !== null && projectTag.name in instance.tags) {
                            for (var y = 0; y < projectTag.catalystEntityMapping.length; y++) {
                                if (projectTag.catalystEntityMapping[y].tagValue !== '' && instance.tags[projectTag.name] !== '' &&
                                    projectTag.catalystEntityMapping[y].tagValue === instance.tags[projectTag.name]) {
                                    catalystProjectId = projectTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystProjectName = projectTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if (environmentTag !== null && environmentTag.name in instance.tags) {
                            for (var y = 0; y < environmentTag.catalystEntityMapping.length; y++) {
                                if (environmentTag.catalystEntityMapping[y].tagValue !== '' && instance.tags[environmentTag.name] !== '' &&
                                    environmentTag.catalystEntityMapping[y].tagValue === instance.tags[environmentTag.name]) {
                                    catalystEnvironmentId = environmentTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystEnvironmentName = environmentTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if (catalystEnvironmentId !== null) {
                            var masterDetails = {
                                envId: catalystEnvironmentId,
                                envName: catalystEnvironmentName,
                                bgId: catalystBgId,
                                bgName: catalystBgName,
                                projectId: catalystProjectId,
                                projectName: catalystProjectName
                            }
                            managedInstanceList.push(instance);
                            if (catalystProjectId === null) {
                                masterUtil.getEnvironmentByEnvId(catalystEnvironmentId, function (err, envs) {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        catalystProjectId = envs.projectname_rowid.split(',')[0];
                                        catalystProjectName = envs.projectname.split(',')[0];
                                        if (catalystBgId === null && catalystProjectId !== null) {
                                            masterDetails.projectId = catalystProjectId;
                                            masterDetails.projectName = catalystProjectName;
                                            masterUtil.getProjectByProjectId(catalystProjectId, function (err, projects) {
                                                if (err) {
                                                    logger.error(err);
                                                } else {
                                                    catalystBgId = projects.productgroupname_rowid;
                                                    catalystBgName = projects.productgroupname;
                                                    masterDetails.bgId = catalystBgId;
                                                    masterDetails.bgName = catalystBgName;
                                                    unassignedInstancesModel.removeInstanceById(instance._id, function (err, data) {
                                                        if (err) {
                                                            logger.error(err);
                                                        } else {
                                                            createManagedInstance(instance, masterDetails, function (err, data) {
                                                                if (err) {
                                                                    logger.error(err);
                                                                }
                                                            });
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    }
                                });
                            } else if (catalystBgId === null) {
                                masterUtil.getProjectByProjectId(catalystProjectId, function (err, projects) {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        catalystBgId = projects.productgroupname_rowid;
                                        catalystBgName = projects.productgroupname;
                                        masterDetails.bgId = catalystBgId;
                                        masterDetails.bgName = catalystBgName;
                                        unassignedInstancesModel.removeInstanceById(instance._id, function (err, data) {
                                            if (err) {
                                                logger.error(err);
                                            } else {
                                                createManagedInstance(instance, masterDetails, function (err, data) {
                                                    if (err) {
                                                        logger.error(err);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else {
                                unassignedInstancesModel.removeInstanceById(instance._id, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    } else {
                                        createManagedInstance(instance, masterDetails, function (err, data) {
                                            if (err) {
                                                logger.error(err);
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    }else{
                        managedInstanceList.push(instance);
                    }
                })(instances[i]);
            }
            if(managedInstanceList.length === instances.length){
                next(null,managedInstanceList);
            }
        }else{
            logger.info("Please configure Instances for Tag Mapping");
            next(null,instances);
        }
    });
}

function createManagedInstance(instance,masterDetails,callback){
    if(instance !== null){
        var instanceName = instance.platformId;
        if(instance.tags && instance.tags.Name) {
            instanceName = instance.tags.Name;
        }
        var instanceObj = {
            name: instanceName,
            orgId: instance.orgId,
            orgName: instance.orgName,
            bgId: masterDetails.bgId,
            bgName: masterDetails.bgName,
            projectId: masterDetails.projectId,
            projectName: masterDetails.projectName,
            environmentName: masterDetails.envName,
            envId: masterDetails.envId,
            providerId: instance.providerId,
            providerType: instance.providerType,
            providerData: {
                region: instance.providerData.region
            },
            chefNodeName: instance.platformId,
            runlist: [],
            platformId: instance.platformId,
            appUrls: [],
            instanceIP: instance.ip,
            instanceState: instance.state,
            vpcId: instance.vpcId,
            privateIpAddress: instance.privateIpAddress,
            hostName: instance.hostName,
            bootStrapStatus: 'success',
            hardware: {
                platform: 'unknown',
                platformVersion: 'unknown',
                architecture: 'unknown',
                memory: {
                    total: 'unknown',
                    free: 'unknown',
                },
                os: instance.os
            },
            credentials:{
                username:'ubuntu'
            },
            blueprintData: {
                blueprintName: instance.platformId,
                templateId: "chef_import",
                iconPath: "../private/img/templateicons/chef_import.png"
            }
        }
        instancesDao.createInstance(instanceObj,function(err,data) {
            if (err) {
                logger.error("Failed to create or update instance: ", err);
                callback(err,null);
                return;
            } else {
                var timestampStarted = new Date().getTime();
                var user = instance.catUser ? instance.catUser : 'superadmin';
                var actionLog = instancesDao.insertInstanceStatusActionLog(instance._id, user, instance.state, timestampStarted);
                var logReferenceIds = [instance._id, actionLog._id];
                logsDao.insertLog({
                    referenceId: logReferenceIds,
                    err: false,
                    log: "Instance : "+instance.state,
                    timestamp: timestampStarted
                });
                var instanceLog = {
                    actionId: actionLog._id,
                    instanceId: instance._id,
                    orgName: instance.orgName,
                    bgName: masterDetails.bgName,
                    projectName: masterDetails.projectName,
                    envName: masterDetails.envName,
                    status: instance.state,
                    actionStatus: "success",
                    platformId: instance.platformId,
                    blueprintName: instance.platformId,
                    data: instance.runlist,
                    platform: 'unknown',
                    os: instance.os,
                    size: instance.instanceType,
                    user: user,
                    createdOn: new Date().getTime(),
                    startedOn: new Date().getTime(),
                    providerType: instance.providerType,
                    action: instance.state,
                    logs: []
                };
                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
                    if (err) {
                        logger.error("Failed to create or update instanceLog: ", err);
                        callback(err,null);
                        return;
                    }else{
                        var _docker = new Docker();
                        _docker.checkDockerStatus(instance._id, function(err, retCode) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                                callback(err,null);
                                return;
                            }
                            if (retCode == '0') {
                                instancesDao.updateInstanceDockerStatus(instance._id, "success", '', function(data) {
                                    logger.debug('Instance Docker Status set to Success');
                                    callback(null,data);
                                    return;
                                });
                            }
                        });
                    }
                });
            }
        });
    }else{
        callback(null,instance);
    }
}


function instanceSyncWithAWS(ec2Instances,providerId,callback){
    if(ec2Instances.length > 0){
        var ec2InstanceIds = [];
        for(var i = 0;i < ec2Instances.length;i++){
            ec2InstanceIds.push(ec2Instances[i].platformId);
        }
        if(ec2InstanceIds.length === ec2Instances.length){
            async.parallel({
                instance:function(callback){
                    instancesDao.getInstanceByProviderId(providerId,function(err,instances){
                        if(err){
                            callback(err,null);
                        }else if(instances.length > 0){
                            var instanceCount = 0;
                            for(var j = 0;j < instances.length;j++){
                                (function(instance){
                                   if(ec2InstanceIds.indexOf(instance.platformId) !== -1){
                                       instanceCount++;
                                       if(instanceCount === instances.length){
                                           callback(null,instances);
                                           return;
                                       }
                                   }else{
                                       instancesDao.removeTerminatedInstanceById(instance._id,function(err,data){
                                           if(err){
                                               instanceCount++;
                                               logger.error(err);
                                               return;
                                           }
                                           instanceCount++;
                                           var timestampStarted = new Date().getTime();
                                           var user = instance.catUser ? instance.catUser : 'superadmin';
                                           var actionLog = instancesDao.insertInstanceStatusActionLog(instance._id, user,'terminated', timestampStarted);
                                           var logReferenceIds = [instance._id, actionLog._id];
                                           logsDao.insertLog({
                                               referenceId: logReferenceIds,
                                               err: false,
                                               log: "Instance : terminated",
                                               timestamp: timestampStarted
                                           });
                                           var instanceLog = {
                                               actionId: actionLog._id,
                                               instanceId: instance._id,
                                               orgName: instance.orgName,
                                               bgName: instance.bgName,
                                               projectName: instance.projectName,
                                               envName: instance.environmentName,
                                               status: 'terminated',
                                               actionStatus: "success",
                                               platformId: instance.platformId,
                                               blueprintName: instance.blueprintData.blueprintName,
                                               data: instance.runlist,
                                               platform: instance.hardware.platform,
                                               os: instance.hardware.os,
                                               size: instance.instanceType,
                                               user: user,
                                               createdOn: new Date().getTime(),
                                               startedOn: new Date().getTime(),
                                               providerType: instance.providerType,
                                               action: 'Terminated',
                                               logs: []
                                           };
                                           instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function(err, logData) {
                                               if (err) {
                                                   logger.error("Failed to create or update instanceLog: ", err);
                                               }
                                           });
                                           if(instanceCount === instances.length){
                                               callback(null,instances);
                                               return;
                                           }
                                       })
                                   }
                                    
                                })(instances[j]);
                            }
                        }else{
                            callback(null,instances);
                        }
                    });
                },
                unassignedInstance:function(callback){
                    unassignedInstancesModel.getUnAssignedInstancesByProviderId(providerId,function(err,unAssignedInstances){
                        if(err){
                            callback(err,null);
                        }else if(unAssignedInstances.length > 0){
                            var unAssignedInstanceCount = 0;
                            for(var l = 0;l < unAssignedInstances.length;l++){
                                (function(unAssignedInstance){
                                    if(ec2InstanceIds.indexOf(unAssignedInstance.platformId) !== -1){
                                        unAssignedInstanceCount++;
                                        if(unAssignedInstanceCount === unAssignedInstances.length){
                                            callback(null,unAssignedInstances);
                                            return;
                                        }
                                    }else{
                                        unassignedInstancesModel.removeTerminatedInstanceById(unAssignedInstance._id,function(err,data){
                                            if(err){
                                                unAssignedInstanceCount++;
                                                logger.error(err);
                                                return;
                                            }
                                            unAssignedInstanceCount++;
                                            if(unAssignedInstanceCount === unAssignedInstances.length){
                                                callback(null,unAssignedInstances);
                                                return;
                                            }
                                        })
                                    }

                                })(unAssignedInstances[l]);
                            }
                        }else{
                            callback(null,unAssignedInstances);
                        }
                    });
                }
            },function(err,results){
                if(err){
                    callback(err,null);
                }
                callback(null,results);
            })
        }
    }else{
        callback(null,ec2Instances);
    }

}