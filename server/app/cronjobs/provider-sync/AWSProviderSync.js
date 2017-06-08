
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var s3Model = require('_pr/model/resources/s3-resource');
var ec2Model = require('_pr/model/resources/instance-resource');
var rdsModel = require('_pr/model/resources/rds-resource');
var resourceModel = require('_pr/model/resources/resources');
var tagsModel = require('_pr/model/tags');
var instancesDao = require('_pr/model/classes/instance/instance');
var instanceService = require('_pr/services/instanceService');
var commonService = require('_pr/services/commonService');
var noticeService = require('_pr/services/noticeService.js');
var serviceMapService = require('_pr/services/serviceMapService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var chefDao = require('_pr/model/dao/chefDao.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');



var AWSRDSS3ProviderSync = Object.create(CatalystCronJob);
AWSRDSS3ProviderSync.execute = awsRDSS3ProviderSync;

module.exports = AWSRDSS3ProviderSync;

function awsRDSS3ProviderSync() {
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
                                    awsRDSS3ProviderSyncForProvider(provider,org.orgname)
                                })(providers[j]);
                            }
                            if(count ===providers.length){
                                return;
                            }
                        }else{
                            logger.info("Please configure Provider in Organization " +org.orgname+" for EC2/S3/RDS Provider Sync");
                            return;
                        }
                    });
                })(orgs[i]);
            }
        }else{
            logger.info("Please configure Organization for EC2/S3/RDS Provider Sync");
            return;
        }
    });
}

function awsRDSS3ProviderSyncForProvider(provider,orgName) {
    logger.info("EC2/S3/RDS Data Fetching started for Provider "+provider.providerName);
    async.waterfall([
        function (next) {
            async.parallel({
                ec2: function (callback) {
                    resourceService.getEC2InstancesInfo(provider,orgName, callback);
                },
                s3: function (callback) {
                    resourceService.getBucketsInfo(provider,orgName, callback);
                },
                rds: function (callback) {
                    resourceService.getRDSInstancesInfo(provider,orgName, callback);
                }
            }, function (err, results) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        },
        function (resources, next) {
            async.parallel({
                ec2: function (callback) {
                    saveEC2Data(resources.ec2,provider, callback);
                },
                s3: function (callback) {
                    saveS3Data(resources.s3, callback);
                },
                rds: function (callback) {
                    saveRDSData(resources.rds, callback);
                },
                ec2Delete: function (callback) {
                    deleteEC2ResourceData(resources.ec2, provider._id, callback);
                },
                s3Delete: function (callback) {
                    deleteS3ResourceData(resources.s3, provider._id, callback);
                },
                rdsDelete: function (callback) {
                    deleteRDSResourceData(resources.rds, provider._id, callback);
                }
            }, function (err, results) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        },
        function(resourcesDetails,next) {
            async.parallel({
                serviceSync: function (callback) {
                    serviceMapSync(callback);
                },
                saeSync: function (callback) {
                    saeSync(callback);
                },
                tagMapping: function (callback) {
                    resourceTagMapping(provider,callback);
                }
            }, function (err, results) {
                if (err) {
                    next(err,null);
                } else {
                    next(null, results);
                }
            })
        }],function (err, results) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.info("EC2/S3/RDS Data Successfully ended for Provider "+provider.providerName);
            return;
        }
    });
};
function saveS3Data(s3Info, callback) {
    if(s3Info.length === 0) {
        return callback(null, s3Info);
    }else {
        var count = 0;
        for (var i = 0; i < s3Info.length; i++) {
            (function (s3) {
                var queryObj = {
                    'masterDetails.orgId':s3.masterDetails.orgId,
                    'providerDetails.id':s3.providerDetails.id,
                    'resourceDetails.bucketName':s3.resourceDetails.bucketName
                }
                s3Model.getS3BucketData(queryObj, function (err, responseBucketData) {
                    if (err) {
                        logger.error("Error in getting Instance : ",s3.resourceDetails.bucketName);
                        count++;
                        if (count === s3Info.length) {
                            callback(null, s3Info);
                        }
                    }else if (responseBucketData.length > 0) {
                        delete s3.category;
                        s3Model.updateS3BucketData(responseBucketData[0]._id,s3, function (err, bucketUpdatedData) {
                            if (err) {
                                logger.error("Error in updating S3 Bucket : ",s3.resourceDetails.bucketName);
                            }
                            count++;
                            if (count === s3Info.length) {
                                callback(null, s3Info);
                            }
                        });
                    } else {
                        s3.createdOn = new Date().getTime();
                        s3Model.createNew(s3, function (err, bucketSavedData) {
                            if (err) {
                                logger.error("Error in creating S3 Bucket : ",s3.resourceDetails.bucketName);
                            }
                            count++;
                            if (count === s3Info.length) {
                                callback(null, s3Info);
                            }
                        });
                    }
                })
            })(s3Info[i]);
        }
    }
}

function saveEC2Data(ec2Info,provider, callback) {
    if(ec2Info.length === 0) {
        return callback(null, ec2Info);
    }else {
        var count = 0;
        for (var i = 0; i < ec2Info.length; i++) {
            (function (ec2) {
                instancesDao.getInstancesByProviderIdOrgIdAndPlatformId(ec2.masterDetails.orgId, ec2.providerDetails.id, ec2.resourceDetails.platformId, function (err, managedInstances) {
                    if (err) {
                        logger.error(err);
                    }
                    if (managedInstances.length > 0) {
                        instanceService.instanceSyncWithAWS(managedInstances[0]._id, ec2, provider, function (err, updateInstanceData) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    }
                    var queryObj = {
                        'masterDetails.orgId': ec2.masterDetails.orgId,
                        'providerDetails.id': ec2.providerDetails.id,
                        'resourceDetails.platformId': ec2.resourceDetails.platformId
                    }
                    ec2Model.getInstanceData(queryObj, function (err, responseInstanceData) {
                        if (err) {
                            logger.error("Error in getting Instance : ", ec2.resourceDetails.platformId);
                            count++;
                            if (count === ec2Info.length) {
                                callback(null, ec2Info);
                            }
                        } else if (responseInstanceData.length > 0) {
                            delete ec2.category;
                            ec2Model.updateInstanceData(responseInstanceData._id, ec2, function (err, instanceUpdatedData) {
                                if (err) {
                                    logger.error("Error in updating Instance : ", ec2.resourceDetails.platformId);
                                }
                                count++;
                                if (count === ec2Info.length) {
                                    callback(null, ec2Info);
                                }
                            });
                        } else {
                            ec2.createdOn = new Date().getTime();
                            ec2Model.createNew(ec2, function (err, instanceSavedData) {
                                if (err) {
                                    logger.error("Error in creating Instance : ", ec2.resourceDetails.platformId);
                                }
                                count++;
                                if (count === ec2Info.length) {
                                    callback(null, ec2Info);
                                }
                            });
                        }
                    })
                })
            })(ec2Info[i]);
        }
    }
}

function saveRDSData(rdsInfo, callback) {
    if(rdsInfo.length === 0) {
        return callback(null, rdsInfo);
    }else {
        var count = 0;
        for (var i = 0; i < rdsInfo.length; i++) {
            (function (rds) {
                var queryObj = {
                    'masterDetails.orgId':rds.masterDetails.orgId,
                    'providerDetails.id':rds.providerDetails.id,
                    'resourceDetails.dbiResourceId':rds.resourceDetails.dbiResourceId
                }
                rdsModel.getRDSData(queryObj, function (err, responseRDSData) {
                    if (err) {
                        logger.error("Error in getting RDS DBName : ",rds.resourceDetails.dbiResourceId);
                        count++;
                        if (count === rdsInfo.length) {
                            callback(null, rdsInfo);
                        }
                    }
                    if (responseRDSData.length > 0) {
                        delete rds.category;
                        rdsModel.updateRDSData(responseRDSData[0]._id,rds, function (err, rdsUpdatedData) {
                            if (err) {
                                logger.error("Error in updating RDS DBName : ",rds.resourceDetails.dbiResourceId);
                            }
                            count++;
                            if (count === rdsInfo.length) {
                                callback(null, rdsInfo);
                            }
                        });
                    } else {
                        rds.createdOn = new Date().getTime();
                        rdsModel.createNew(rds, function (err, rdsSavedData) {
                            if (err) {
                                logger.error("Error in creating RDS DBName : ",rds.resourceDetails.dbiResourceId);
                            }
                            count++;
                            if (count === rdsInfo.length) {
                                callback(null, rdsInfo);
                            }
                        });
                    }
                })
            })(rdsInfo[i]);
        }
    }
}

function deleteS3ResourceData(s3Info,providerId, callback) {
    if(s3Info.length === 0){
        resourceModel.deleteResourcesByResourceType('S3', function (err, data) {
            if (err) {
                callback(err,null);
                return;
            } else {
                callback(null,s3Info);
                return;
            }
        });
    }else {
        async.waterfall([
            function (next) {
                bucketNameList(s3Info, next);
            },
            function (bucketNames, next) {
                resourceModel.getResourcesByProviderResourceType(providerId, 'S3', function (err, s3data) {
                    if (err) {
                        next(err);
                    } else {
                        next(null, s3data, bucketNames);
                    }
                });
            },
            function (s3Data, bucketNames, next) {
                if (s3Data.length > 0) {
                    var count = 0;
                    for (var i = 0; i < s3Data.length; i++) {
                        (function (s3) {
                            if (bucketNames.indexOf(s3.resourceDetails.bucketName) === -1) {
                                resourceModel.deleteResourcesById(s3._id, function (err, data) {
                                    if (err) {
                                        logger.error("Error in deleting S3 Bucket :",s3.resourceDetails.bucketName)
                                    }
                                    count++;
                                    if (count === ec2data.length) {
                                        next(null, ec2data);
                                    }
                                })
                            } else {
                                count++;
                                if (count === s3Data.length) {
                                    next(null, []);
                                }
                            }
                        })(s3Data[i]);
                    }
                } else {
                    next(null, bucketNames);
                }
            }], function (err, results) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, results);
            return;
        })
    }
}

function deleteEC2ResourceData(ec2Info,providerId, callback) {
    if (ec2Info.length === 0) {
        resourceModel.deleteResourcesByResourceType('EC2', function (err, data) {
            if (err) {
                callback(err, null);
                return;
            } else {
                callback(null, ec2Info);
                return;
            }
        });
    } else {
        async.waterfall([
            function (next) {
                ec2PlatformIdList(ec2Info, next);
            },
            function (platformIds, next) {
                async.parallel({
                    managed: function (callback) {
                        instancesDao.getInstanceByProviderId(providerId, function (err, instances) {
                            if (err) {
                                callback(err, null);
                            } else if (instances.length > 0) {
                                var instanceCount = 0;
                                for (var j = 0; j < instances.length; j++) {
                                    (function (instance) {
                                        if (platformIds.indexOf(instance.platformId) !== -1) {
                                            instanceCount++;
                                            if (instanceCount === instances.length) {
                                                callback(null, instances);
                                                return;
                                            }
                                        } else {
                                            instancesDao.removeTerminatedInstanceById(instance._id, function (err, data) {
                                                if (err) {
                                                    instanceCount++;
                                                    logger.error(err);
                                                    if (instanceCount === instances.length) {
                                                        callback(null, instances);
                                                        return;
                                                    }
                                                } else {
                                                    instanceCount++;
                                                    var timestampStarted = new Date().getTime();
                                                    var user = instance.catUser ? instance.catUser : 'superadmin';
                                                    var actionLog = instancesDao.insertInstanceStatusActionLog(instance._id, user, 'terminated', timestampStarted);
                                                    logsDao.insertLog({
                                                        instanceId: instance._id,
                                                        instanceRefId: actionLog._id,
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
                                                    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
                                                        if (err) {
                                                            logger.error("Failed to create or update instanceLog: ", err);
                                                        }
                                                    });
                                                    noticeService.notice("system", {
                                                        title: "AWS Instance : terminated",
                                                        body: "AWS Instance " + instance.platformId + " is Terminated."
                                                    }, "success", function (err, data) {
                                                        if (err) {
                                                            logger.error("Error in Notification Service, ", err);
                                                        }
                                                    });
                                                    if (instanceCount === instances.length) {
                                                        callback(null, instances);
                                                        return;
                                                    }
                                                }
                                            })
                                        }

                                    })(instances[j]);
                                }
                            } else {
                                return callback(null, instances);
                            }
                        });
                    },
                    assignedUnassigned: function (callback) {
                        resourceModel.getResourcesByProviderResourceType(providerId, 'EC2', function (err, ec2data) {
                            if (err) {
                                return callback(err, null);
                            } else if (ec2data.length > 0) {
                                var count = 0;
                                for (var i = 0; i < ec2data.length; i++) {
                                    (function (ec2) {
                                        if (platformIds.indexOf(ec2.resourceDetails.platformId) === -1) {
                                            resourceModel.deleteResourcesById(ec2._id, function (err, data) {
                                                if (err) {
                                                    logger.error("Error in deleting EC2 Instance :", ec2.resourceDetails.platformId)
                                                }
                                                count++;
                                                if (count === ec2data.length) {
                                                    return callback(null, ec2data);
                                                }
                                            })
                                        } else {
                                            count++;
                                            if (count === ec2data.length) {
                                                return callback(null, []);
                                            }
                                        }
                                    })(ec2data[i]);
                                }
                            } else {
                                return callback(null, platformIds);
                            }
                        });
                    }
                }, function (err, results) {
                    if (err) {
                        next(err, null);
                    } else {
                        next(null, results);
                    }
                })
            }], function (err, results) {
            if (err) {
                return callback(err, null);
            } else {
                return callback(null, results);
            }
        })
    }
}

function deleteRDSResourceData(rdsInfo,providerId, callback) {
    if(rdsInfo.length === 0){
        resourceModel.deleteResourcesByResourceType('RDS', function (err, data) {
            if (err) {
                callback(err,null);
                return;
            } else {
                callback(null,rdsInfo);
                return;
            }
        });
    }else {
        async.waterfall([
            function (next) {
                rdsDBResourceIdList(rdsInfo, next);
            },
            function (rdsDBResourceIds, next) {
                resourceModel.getResourcesByProviderResourceType(providerId, 'RDS', function (err, rdsData) {
                    if (err) {
                        next(err);
                    } else {
                        next(null, rdsData, rdsDBResourceIds);
                    }
                });
            },
            function (rdsData, rdsDBResourceIds, next) {
                if (rdsData.length > 0) {
                    var count = 0;
                    for (var i = 0; i < rdsData.length; i++) {
                        (function (rds) {
                            if (rdsDBResourceIds.indexOf(rds.resourceDetails.dbiResourceId) === -1) {
                                resourceModel.deleteResourcesById(rds._id, function (err, data) {
                                    if (err) {
                                        logger.error("Error in deleting RDS DBName :",rds.resourceDetails.dbiResourceId)
                                    }
                                    count++;
                                    if (count === ec2data.length) {
                                        next(null, ec2data);
                                    }
                                })
                            } else {
                                count++;
                                if (count === rdsData.length) {
                                    next(null, []);
                                }
                            }
                        })(rdsData[i]);
                    }
                } else {
                    next(null, rdsData);
                }
            }], function (err, results) {
            if (err) {
                callback(err, null);
                return;
            }
            callback(null, results);
            return;
        })
    }
}

function resourceTagMapping(provider,callback){
    logger.debug("Tag Mapping is started");
    async.waterfall([
        function (next) {
            resourceModel.getAllResourcesByCategory(provider._id, 'unassigned', next);
        },
        function (resources, next) {
            tagMappingSyncForResources(resources, provider, 'unassigned', next);
        },
        function (resources, next) {
            resourceModel.getAllResourcesByCategory(provider._id, 'assigned', next);
        },
        function (assignedResources, next) {
            tagMappingSyncForResources(assignedResources, provider, 'assigned', next);
        }],function (err, data) {
        if (err) {
            logger.error("Error in Tag-Mapping: ",err);
            return callback(err, null);
        } else {
            logger.debug("Tag-Mapping is Done");
            return callback(null, data);
        }
    })
}

function tagMappingSyncForResources(resources,provider,category,next){
    tagsModel.getTagsByProviderId(provider._id, function (err, tagDetails) {
        if (err) {
            logger.error("Unable to get tags", err);
            next(err);
        }
        var projectTag = null;
        var environmentTag = null;
        var bgTag = null;
        if (tagDetails.length > 0) {
            for (var i = 0; i < tagDetails.length; i++) {
                if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'project') {
                    projectTag = tagDetails[i];
                } else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'environment') {
                    environmentTag = tagDetails[i];
                } else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'businessGroup') {
                    bgTag = tagDetails[i];
                }
            }
            var count = 0;
            if (resources.length > 0) {
                for (var j = 0; j < resources.length; j++) {
                    (function (resource) {
                        if (resource.tags) {
                            var catalystProjectId = null;
                            var catalystProjectName = null;
                            var catalystEnvironmentId = null;
                            var catalystEnvironmentName = null;
                            var catalystBgId = null;
                            var catalystBgName = null;

                            if (bgTag !== null && bgTag.name in resource.tags) {
                                var bgEntityMappings = Object.keys(bgTag.catalystEntityMapping).map(
                                    function (k) {
                                        return bgTag.catalystEntityMapping[k]
                                    });

                                for (var y = 0; y < bgEntityMappings.length; y++) {
                                    if ((resource.tags[bgTag.name] !== '') && ('tagValues' in bgEntityMappings[y])
                                        && (bgEntityMappings[y].tagValues.indexOf(resource.tags[bgTag.name])
                                        >= 0)) {
                                        catalystBgId = bgEntityMappings[y].catalystEntityId;
                                        catalystBgName = bgEntityMappings[y].catalystEntityName;
                                        break;
                                    }
                                }
                            }
                            if (projectTag !== null && projectTag.name in resource.tags) {
                                var projectEntityMappings = Object.keys(projectTag.catalystEntityMapping).map(
                                    function (k) {
                                        return projectTag.catalystEntityMapping[k]
                                    });

                                for (var y = 0; y < projectEntityMappings.length; y++) {
                                    if ((resource.tags[projectTag.name] !== '') && ('tagValues' in projectEntityMappings[y])
                                        && (projectEntityMappings[y].tagValues.indexOf(resource.tags[projectTag.name])
                                        >= 0)) {
                                        catalystProjectId = projectEntityMappings[y].catalystEntityId;
                                        catalystProjectName = projectEntityMappings[y].catalystEntityName;
                                        break;
                                    }
                                }
                            }
                            
                            if (environmentTag !== null && environmentTag.name in resource.tags) {
                                
                                var environmentEntityMappings = Object.keys(environmentTag.catalystEntityMapping).map(
                                    function (k) {
                                        return environmentTag.catalystEntityMapping[k]
                                    });
                                 for (var y = 0; y < environmentEntityMappings.length; y++) {
                                    if ((resource.tags[environmentTag.name] !== '')
                                        && ('tagValues' in environmentEntityMappings[y])
                                        && (environmentEntityMappings[y].tagValues.indexOf(
                                            resource.tags[environmentTag.name]) >= 0)) {
                                        catalystEnvironmentId = environmentEntityMappings[y].catalystEntityId;
                                        catalystEnvironmentName = environmentEntityMappings[y].catalystEntityName;
                                        break;
                                    }
                                }
                            }
                            if ((catalystBgId !== null || catalystProjectId !== null || catalystEnvironmentId !== null) && category ==='unassigned') {
                                var masterDetails = {
                                    orgId: resource.masterDetails.orgId,
                                    orgName: resource.masterDetails.orgName,
                                    bgId: catalystBgId,
                                    bgName: catalystBgName,
                                    projectId: catalystProjectId,
                                    projectName: catalystProjectName,
                                    envId: catalystEnvironmentId,
                                    envName: catalystEnvironmentName
                                }
                                resourceModel.updateResourcesForAssigned(resource._id, masterDetails, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    count++;
                                    if (count === resources.length) {
                                        next(null, resources);
                                        return;
                                    }
                                })
                            } else if ((catalystBgId !== null || catalystProjectId !== null || catalystEnvironmentId !== null) && category ==='assigned') {
                                var masterDetails= {
                                    "masterDetails.bgId": catalystBgId,
                                    "masterDetails.bgName": catalystBgName,
                                    "masterDetails.projectId": catalystProjectId,
                                    "masterDetails.projectName": catalystProjectName,
                                    "masterDetails.envId": catalystEnvironmentId,
                                    "masterDetails.envName": catalystEnvironmentName
                                };
                                resourceModel.updateResourceMasterDetails(resource._id,masterDetails,function(err,data){
                                    if(err){
                                        logger.error("Unable to update master details of assigned Resource", err);
                                    }
                                    count++;
                                    if(count === resources.length) {
                                        next(null, resources);
                                        return;
                                    }
                                });
                            } else if(category === 'assigned') {
                                resourceModel.removeResourceById(resource._id,function(err,data){
                                    if(err){
                                        logger.error("Unable to remove assigned Resource", err);
                                    }
                                    count++;
                                    if(count === resources.length) {
                                        next(null, resources);
                                        return;
                                    }
                                });
                            } else {
                                count++;
                                if (count === resources.length) {
                                    next(null, resources);
                                    return;
                                }
                            }
                        }else{
                            count++;
                            if (count === resources.length) {
                                next(null, resources);
                                return;
                            }
                        }
                          
                    })(resources[j]);
                }
            }
        } else if (category === 'assigned') {
            logger.info("There is no Tag Mapping");
            resourceModel.removeResourcesByProviderId(provider._id, function (err, data) {
                if (err) {
                    logger.error("Unable to remove assigned Resource", err);
                    next(err);
                    return;
                } else {
                    logger.info("Please configure Resources for Tag Mapping");
                    next(null, data);
                    return;
                }
            });
        } else {
            logger.info("Please configure Resources for Tag Mapping");
            next(null, resources);
        }
    });
}

function bucketNameList(s3Info,callback){
    var bucketNames=[];
    for(var i = 0; i < s3Info.length; i++){
        bucketNames.push(s3Info[i].resourceDetails.bucketName);
    }
    callback(null,bucketNames);
}

function rdsDBResourceIdList(rdsInfo,callback){
    var rdsDBResourceIds=[];
    for(var i = 0; i < rdsInfo.length; i++){
        rdsDBResourceIds.push(rdsInfo[i].resourceDetails.dbiResourceId);
    }
    callback(null,rdsDBResourceIds);
}

function ec2PlatformIdList(ec2Info,callback){
    var ec2PlatformIds=[];
    for(var i = 0; i < ec2Info.length; i++){
        ec2PlatformIds.push(ec2Info[i].resourceDetails.platformId);
    }
    callback(null,ec2PlatformIds);
}

function serviceMapSync(callback){
    logger.debug("ServiceMap is Started");
    async.waterfall([
        function(next){
            serviceMapService.getLastVersionOfEachService({},next);
        },
        function(services,next){
            if(services.length >0){
                var count = 0;
                for(var i = 0; i < services.length; i++){
                    (function(service) {
                        if(service.state !== 'Deleted') {
                            count++;
                            var keyCount = 0;
                            Object.keys(service.identifiers).forEach(function (key) {
                                if(key ==='aws') {
                                    var identifierCount = 0, resourceList = [], queryObj = {}, instanceStateList = [];
                                    keyCount++;
                                    Object.keys(service.identifiers.aws).forEach(function (key) {
                                        var queryObj = apiUtil.getQueryByKey(key,service.identifiers.aws[key]);
                                        resourceModel.getResources(queryObj, function (err, resource) {
                                            if (err) {
                                                logger.error("Error in fetching Resources for Query:", queryObj, err);
                                            }
                                            if (resource.length > 0) {
                                                identifierCount++;
                                                resource.forEach(function (instance) {
                                                    resourceList.push({
                                                        type:key,
                                                        value:service.identifiers.aws[key],
                                                        result: instance
                                                    });
                                                    instanceStateList.push(instance.resourceDetails.state);
                                                });
                                                if (identifierCount === Object.keys(service.identifiers.aws).length) {
                                                    serviceMapVersion(service, resourceList, instanceStateList);
                                                }
                                                if (count === services.length && keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.aws).length) {
                                                    next(null, resourceList);
                                                }
                                            } else {
                                                identifierCount++;
                                                if (identifierCount === Object.keys(service.identifiers.aws).length) {
                                                    serviceMapVersion(service, resourceList, instanceStateList);
                                                }
                                                if (count === services.length && keyCount === Object.keys(service.identifiers).length &&  identifierCount === Object.keys(service.identifiers.aws).length) {
                                                    next(null, resourceList);
                                                }
                                            }
                                        })
                                    })
                                }else{
                                    var identifierCount = 0, resourceList = [], queryObj = {}, instanceStateList = [];
                                    keyCount++;
                                    Object.keys(service.identifiers.chef).forEach(function (key) {
                                        var queryObj = apiUtil.getQueryByKey(key,service.identifiers.aws[key]);
                                        queryObj['masterDetails.orgId'] = service.masterDetails.orgId;
                                        queryObj['masterDetails.envName'] = service.masterDetails.envName;
                                        queryObj['masterDetails.serverId'] = service.masterDetails.serverId;
                                        chefDao.getChefNodes(queryObj,function(err,chefNodes){
                                            if (err) {
                                                logger.error("Error in fetching Chef Node Details for Query:", queryObj, err);
                                            }else if(chefNodes.length > 0){
                                                var chefNodeCount = 0;
                                                identifierCount++;
                                                chefNodes.forEach(function(chefNode){
                                                    var query ={
                                                        'configDetails.nodeName':chefNode.name,
                                                        $or:[{
                                                            'resourceDetails.publicIp':chefNode.ip},
                                                            {
                                                            'resourceDetails.privateIp':chefNode.ip
                                                        }],
                                                        'resourceDetails.hostName':chefNode.fqdn
                                                    }
                                                    ec2Model.getInstanceData(query,function(err,data){
                                                        if(err){
                                                            logger.error("Error in finding Resource Details for Query : ",query,err);
                                                        }
                                                        if(data.length > 0){
                                                            chefNodeCount++;
                                                            if (identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                                                serviceMapVersion(service, resourceList, instanceStateList);
                                                            }
                                                            if (count === services.length && keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                                                next(null, resourceList);
                                                            }
                                                        }else{
                                                            commonService.syncChefNodeWithResources(chefNode,function(err,resourceData){
                                                                if(err){
                                                                    logger.error("Error in syncing Chef Node with Resources: ",err);
                                                                }
                                                                resourceList.push({
                                                                    type:key,
                                                                    value:service.identifiers.aws[key],
                                                                    result: resourceData
                                                                });
                                                                chefNodeCount++;
                                                                if (identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                                                    serviceMapVersion(service, resourceList, instanceStateList);
                                                                }
                                                                if (count === services.length && keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                                                    next(null, resourceList);
                                                                }
                                                            })
                                                        }
                                                    })
                                                })
                                            }else{
                                                identifierCount++;
                                                if (identifierCount === Object.keys(service.identifiers.chef).length) {
                                                    serviceMapVersion(service, resourceList, instanceStateList);
                                                }
                                                if (count === services.length && keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length) {
                                                    next(null, resourceList);
                                                }
                                            }
                                        })
                                    })
                                }
                            });
                        }else{
                            count++;
                            if (count === services.length) {
                                next(null, services);
                            }
                        }
                    })(services[i]);
                }
            }else{
                next(null,services);
            }
        }
    ],function(err,data){
        if(err){
            callback(err,null);
            return;
        }else{
            logger.debug("ServiceMap is Done");
            callback(null,data);
            return;
        }
    })
}

function serviceMapVersion(service,resources,instanceStateList){
    var filterResourceList = [];
    async.waterfall([
        function(next){
            if(resources.length > 0){
                resources.forEach(function(node){
                    var count = 0;
                    if(node.result.category !== 'managed') {
                        var queryObj = {
                            'masterDetails.orgId':service.masterDetails.orgId,
                            'masterDetails.orgName':service.masterDetails.orgName,
                            'masterDetails.bgId':service.masterDetails.bgId,
                            'masterDetails.bgName':service.masterDetails.bgName,
                            'masterDetails.projectId':service.masterDetails.projectId,
                            'masterDetails.projectName':service.masterDetails.projectName,
                            'masterDetails.envId':service.masterDetails.envId,
                            'masterDetails.envName':service.masterDetails.envName,
                            'resourceDetails.bootStrapState':'failed',
                            'authentication':'failed',
                            'configDetails.id': service.masterDetails.configId,
                            'configDetails.name': service.masterDetails.configName
                        }
                        instanceStateList.push('authentication_error');
                        ec2Model.updateInstanceData(node.result._id,queryObj,function(err,data){
                            if(err){
                                logger.error("Error in updating Resource Details:",err);
                                count++;
                                if(count === resources.length){
                                    next(null,filterResourceList);
                                }
                            }else{
                                var resourceObj = {
                                    id: node.result._id,
                                    type: node.result.resourceType,
                                    state: node.result.resourceDetails.state,
                                    category: node.result.category,
                                    platformId: node.result.resourceDetails.platformId,
                                    authentication:node.result.authentication,
                                    bootStrapState:node.result.resourceDetails.bootStrapState
                                }
                                if(node.result.resourceDetails.bootStrapState === 'bootStrapping'){
                                    instanceStateList.push('bootStrapping');
                                }
                                resourceObj[node.type] = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                                var findCheck = false;
                                for (var i = 0; i < filterResourceList.length; i++) {
                                    if (JSON.stringify(filterResourceList[i].id) === JSON.stringify(resourceObj.id)) {
                                        var filterObj = filterResourceList[i];
                                        filterObj[node.type] = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                                        filterResourceList.splice(i, 1);
                                        filterResourceList.push(filterObj);
                                        findCheck = true;
                                    }
                                }
                                count++;
                                if (findCheck === false) {
                                    filterResourceList.push(resourceObj);
                                }
                                if(count === resources.length){
                                    next(null,filterResourceList);
                                }
                            }
                        })

                    }else if(service.masterDetails.bgId === node.result.masterDetails.bgId
                            && service.masterDetails.projectId === node.result.masterDetails.projectId
                            && service.masterDetails.envId === node.result.masterDetails.envId
                            && service.masterDetails.configId === node.result.configDetails.id) {
                        var resourceObj = {
                            id: node.result._id,
                            type: node.result.resourceType,
                            state: node.result.resourceDetails.state,
                            category: node.result.category,
                            name: node.result.name,
                            platformId: node.result.resourceDetails.platformId,
                            authentication: node.result.authentication,
                            bootStrapState: node.result.resourceDetails.bootStrapState
                        }
                        if(node.result.resourceDetails.bootStrapState === 'failed'){
                            instanceStateList.push('bootStrap_failed');
                        }
                        resourceObj[node.type] = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                        var findCheck = false;
                        for (var i = 0; i < filterResourceList.length; i++) {
                            if (JSON.stringify(filterResourceList[i].id) === JSON.stringify(resourceObj.id)) {
                                var filterObj = filterResourceList[i];
                                filterObj[node.type] = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                                filterResourceList.splice(i, 1);
                                filterResourceList.push(filterObj);
                                findCheck = true;
                            }
                        }
                        if (findCheck === false) {
                            filterResourceList.push(resourceObj);
                        }
                        count++;
                        if(count === resources.length){
                            next(null,filterResourceList);
                        }
                    }else{
                        logger.debug("Un-Matched Record");
                        count++;
                        if(count === resources.length){
                            next(null,filterResourceList);
                        }
                    }

                });
            }else{
                next(null,resources);
            }
        },
        function(filterObj,next){
            if(service.resources.length === 0){
                instanceStateList.push('initializing');
            }
            var serviceState = getServiceState(instanceStateList);
            if(service.resources.length === filterObj.length && instanceStateList.indexOf('deleted') === -1){
                service.updatedOn = new Date().getTime();
                serviceMapService.updateServiceById(service.id,{state:serviceState,resources:filterObj},function(err,data){
                    if(err){
                        logger.error("Error in updating Service:",err);
                        next(err,null);
                        return;
                    }else{
                        logger.debug("Successfully updated Service");
                        next(null,data);
                        return;
                    }
                })
            }else{
                service.resources = filterObj;
                service.state = serviceState;
                service.version = service.version + 0.1;
                service.createdOn = new Date().getTime();
                delete service._id;
                delete service.id;
                serviceMapService.createNewService(service,function(err,data){
                    if(err){
                        logger.error("Error in updating Service:",err);
                        next(err,null);
                        return;
                    }else{
                        logger.debug("Successfully created Service");
                        next(null,data);
                        return;
                    }
                })
            }
        }

    ],function(err,results){
        if(err){
            logger.error("Error in Server Map Version : ",err);
            return;
        }else{
            logger.debug(" Server Map Version is Done ",err);
            return;
        }
    })

}

function getServiceState(serviceStateList){
    if(serviceStateList.indexOf('authentication_error') !== -1){
        return 'Authentication_Error';
    }else if(serviceStateList.indexOf('bootStrap_failed') !== -1){
        return 'BootStrap_Failed';
    }else if(serviceStateList.indexOf('bootStrapping') !== -1){
        return 'Initializing';
    }else if(serviceStateList.indexOf('running') !== -1){
        return 'Running';
    }else if(serviceStateList.indexOf('stopped') !== -1){
        return 'Stopped';
    }else if(serviceStateList.indexOf('terminated') !== -1){
        return 'Terminated';
    }else if(serviceStateList.indexOf('shutting-down') !== -1){
        return 'Shut-Down';
    }else if(serviceStateList.indexOf('pending') !== -1){
        return 'Pending';
    }else if(serviceStateList.indexOf('deleted') !== -1){
        return 'Deleted';
    }else if(serviceStateList.indexOf('initializing') !== -1){
        return 'Initializing';
    }else{
        return 'Undefined';
    }
}

function saeSync(callback){
    logger.debug("SAE Sync is stared");
    async.waterfall([
        function(next){
            instancesDao.getAllNonTerminatedInstances({isDeleted:false},next);
        },
        function(instances,next){
            if(instances.length > 0){
                async.parallel({
                    instanceSync:function(callback){
                        instanceSync(instances,callback);
                    },
                    resourceSync:function(callback){
                        var count = 0;
                        instances.forEach(function(instance){
                            createOrUpdateResource(instance,function(err,data){
                                if(err){
                                    logger.error("Error in create or Update resources:",err);
                                }
                                count++;
                                if(count === instances.length){
                                    callback(null,instances);
                                }
                            })
                        })
                    }
                },function(err,results){
                    if(err){
                        next(err,null);
                    }else{
                        next(null,results);
                    }
                })
            }else{
                logger.debug("There is no instance present in DB without terminated state");
                next(null,instances);
            }
        }
    ],function(err,results){
        if(err){
            logger.error("There are some error in SAE Sync.",err);
            return callback(err,null);
        }else{
            logger.debug("SAE Sync is Done");
            return callback(null,results);
        }

    })
}

function createOrUpdateResource(instance,callback){
    var resourceObj = {
        name:instance.name,
        category:'managed',
        masterDetails: {
            orgId: instance.orgId,
            orgName: instance.orgName,
            bgId: instance.bgId,
            bgName: instance.bgName,
            projectId: instance.projectId,
            projectName: instance.projectName,
            envId: instance.envId,
            envName: instance.environmentName
        },
        resourceDetails:{
            platformId:instance.platformId,
            vpcId:instance.vpcId?instance.vpcId:null,
            subnetId:instance.subnetId?instance.subnetId:null,
            hostName:instance.hostName?instance.hostName:null,
            publicIp:instance.instanceIP,
            state:instance.instanceState,
            bootStrapState:instance.bootStrapStatus,
            credentials:instance.credentials,
            route53HostedParams:instance.route53HostedParams,
            hardware:instance.hardware
        },
        configDetails:{
            id:instance.chef.serverId,
            nodeName:instance.chef.chefNodeName,
            run_list:instance.runlist,
            attributes:instance.attributes
        },
        blueprintDetails:{
            id:instance.blueprintData.blueprintId ? instance.blueprintData.blueprintId:null,
            name:instance.blueprintData.blueprintName ? instance.blueprintData.blueprintName:null,
            templateName:instance.blueprintData.templateId?instance.blueprintData.templateId:null,
            templateType:instance.blueprintData.templateType?instance.blueprintData.templateType:null
        },
        user:instance.catUser,
        isScheduled:instance.isScheduled,
        cronJobIds:instance.cronJobIds,
        startScheduler:instance.instanceStartScheduler,
        stopScheduler:instance.instanceStopScheduler,
        interval:instance.interval,
        stackName:instance.domainName && instance.domainName!==null?instance.domainName:instance.stackName,
        tagServer:instance.tagServer,
        monitor:instance.monitor,
        cost:instance.cost,
        usage:instance.usage,
        tags:instance.tags,
        isDeleted:instance.isDeleted
    }
    if(instance.schedulerStartOn){
        resourceObj.schedulerStartOn = instance.schedulerStartOn;
    }
    if(instance.schedulerStopOn){
        resourceObj.schedulerStopOn = instance.schedulerStopOn;
    }
    if(instance.source === 'cloud' || instance.source === 'blueprint'){
        resourceObj.providerDetails = {
            id:instance.providerId,
            type:instance.providerType,
            region: {
                region:instance.region && instance.region !== null ? instance.region : instance.providerData.region
            },
            keyPairId:instance.keyPairId
        };
        resourceObj.cost = instance.cost;
        resourceObj.usage = instance.usage;
        resourceObj.tags = instance.tags;
        resourceObj.resourceType='EC2'
    }else {
        resourceObj.resourceType='instance'
    }
    var filterBy={
        'resourceDetails.platformId':instance.platformId,
        'category':'managed',
        'isDeleted':false
    }
    ec2Model.getInstanceData(filterBy,function(err,data){
        if(err){
            logger.error("Error in fetching Resources>>>>:",err);
            return callback(err,null);
        }else if(data.length > 0){
            ec2Model.updateInstanceData(data[0]._id,resourceObj,function(err,data){
                if(err){
                    logger.error("Error in updating Resources>>>>:",err);
                    return callback(err,null);
                }else{
                    return callback(null,data);
                }
            })
        }else{
            resourceObj.createdOn = new Date().getTime();
            ec2Model.createNew(resourceObj,function(err,data){
                if(err){
                    logger.error("Error in creating Resources>>>>:",err);
                    return callback(err,null);
                }else{
                    return callback(null,data);
                }
            })
        }
    })
}

function instanceSync(instances,callback){
    var count = 0,credentials = {};
    instances.forEach(function(instance){
        if(instance.providerId && instance.providerId !== null){
            count++;
            if(count === instances.length){
                return callback(null,instances);
            }
        }else{
            var nodeDetails = {
                nodeIp: instance.instanceIP,
                nodeOs: instance.hardware.os,
                nodeName: instance.platformId
            }
            instance.credentials['source'] = 'executor';
            credentialCryptography.decryptCredential(instance.credentials, function (err, decryptedCredentials) {
                if (decryptedCredentials.fileData) {
                    credentials = {
                        "username": decryptedCredentials.username,
                        "pemFileData": decryptedCredentials.fileData,
                        "pemFileLocation": instance.credentials.pemFileLocation
                    }
                } else {
                    credentials = {
                        "username": decryptedCredentials.username,
                        "password": decryptedCredentials.password
                    }
                }
                commonService.checkNodeCredentials(credentials,nodeDetails,function(err,credentialFlag){
                    if(err){
                        logger.error("Error in checking credentials of a instance : ",instance.platformId,err);
                    }
                    if(credentialFlag === true) {
                        count++;
                        if(count === instances.length){
                            callback(null,instances);
                        }
                    }else{
                        instancesDao.removeTerminatedInstanceById(instance._id, function (err, data) {
                            if (err) {
                                count++;
                                logger.error(err);
                                if (count === instances.length) {
                                    callback(null, instances);
                                    return;
                                }
                            } else {
                                count++;
                                var timestampStarted = new Date().getTime();
                                var user = instance.catUser ? instance.catUser : 'superadmin';
                                var actionLog = instancesDao.insertInstanceStatusActionLog(instance._id, user, 'terminated', timestampStarted);
                                logsDao.insertLog({
                                    instanceId: instance._id,
                                    instanceRefId: actionLog._id,
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
                                instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
                                    if (err) {
                                        logger.error("Failed to create or update instanceLog: ", err);
                                    }
                                });
                                noticeService.notice("system", {
                                    title: "Instance : terminated",
                                    body: "Instance " + instance.platformId + " is Terminated."
                                }, "success", function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                                if (count === instances.length) {
                                    callback(null, instances);
                                    return;
                                }
                            }
                        })
                    }
                })
            });
        }
    })
}
