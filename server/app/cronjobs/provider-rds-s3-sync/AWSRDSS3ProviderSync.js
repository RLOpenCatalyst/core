
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var s3Model = require('_pr/model/resources/s3-resource');
var rdsModel = require('_pr/model/resources/rds-resource');
var resourceModel = require('_pr/model/resources/resources');
var tagsModel = require('_pr/model/tags');


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
                            logger.info("Please configure Provider in Organization " +org.orgname+" for S3/RDS Provider Sync");
                            return;
                        }
                    });
                })(orgs[i]);
            }
        }else{
            logger.info("Please configure Organization for S3/RDS Provider Sync");
            return;
        }
    });
}

function awsRDSS3ProviderSyncForProvider(provider,orgName) {
    logger.info("S3/RDS Data Fetching started for Provider "+provider.providerName);
    async.waterfall([
        function (next) {
            async.parallel({
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
                s3: function (callback) {
                    saveS3Data(resources.s3, callback);
                },
                rds: function (callback) {
                    saveRDSData(resources.rds, callback);
                },
                s3Delete: function (callback) {
                    deleteResourceData(resources.s3, provider._id, 'S3', callback);
                },
                rdsDelete: function (callback) {
                    deleteResourceData(resources.rds, provider._id, 'RDS', callback);
                }
            }, function (err, results) {
                if (err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        },
        function(resourcesDetails,next){
            resourceModel.getAllUnassignedResources(provider._id,next);
        },
        function(resources,next){
            tagMappingForResources(resources,provider,next);
        }
    ], function (err, results) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.info("S3/RDS Data Successfully Added for Provider "+provider.providerName);
            return;
        }
    });
};
function saveS3Data(s3Info, callback) {
    var results = [];
    if(s3Info.length == 0)
        return callback(null, results);
    for(var i = 0; i < s3Info.length; i++) {
        (function(s3) {
            s3Model.getS3BucketData(s3,function(err,responseBucketData){
                if(err) {
                    callback(err,null);
                }
                if(responseBucketData.length === 0){
                    s3Model.createNew(s3,function(err, bucketSavedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(bucketSavedData);
                        }
                        if(results.length === s3Info.length) {
                            callback(null, results);
                        }
                    });
                }else{
                    s3Model.updateS3BucketData(s3,function(err, bucketUpdatedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(bucketUpdatedData);
                        }
                        if(results.length === s3Info.length) {
                            callback(null, results);
                        }
                    });
                }
            })
        })(s3Info[i]);
    };
};

function saveRDSData(rdsInfo, callback) {
    var results = [];
    if(rdsInfo.length == 0)
        return callback(null, results);
    for(var i = 0; i < rdsInfo.length; i++) {
        (function(rds) {
            rdsModel.getRDSData(rds,function(err,responseRDSData){
                if(err) {
                    callback(err,null);
                }
                if(responseRDSData.length === 0){
                    rdsModel.createNew(rds,function(err, rdsSavedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(rdsSavedData);
                        }
                        if(results.length === rdsInfo.length) {
                            callback(null, results);
                        }
                    });
                }else{
                    rdsModel.updateRDSData(rds,function(err, rdsUpdatedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(rdsUpdatedData);
                        }
                        if(results.length === rdsInfo.length) {
                            callback(null, results);
                        }
                    });
                }
            })
        })(rdsInfo[i]);
    };
}

function deleteResourceData(resourceInfo,providerId,resourceType, callback) {
    var results = [];
    if(resourceInfo.length === 0){
        resourceModel.deleteResourcesByResourceType(resourceType,function(err,data){
            if(err){
                callback(err,null);
            }else{
                callback(null,data);
            }
        })
    }else if(resourceType === 'S3'){
        resourceModel.getResourcesByProviderResourceType(providerId,resourceType,function(err,s3data){
            if(err){
                callback(err,null);
            }else {
                var count = 0;
                if (s3data.length === 0) {
                    callback(null,[]);
                } else {
                    for (var i = 0; i < s3data.length; i++) {
                        (function (s3) {
                            for (var j = 0; j < resourceInfo.length; j++) {
                                (function (resource) {
                                    if (s3.resourceDetails.bucketName === resource.resourceDetails.bucketName) {
                                        count++;
                                        if (count === resourceInfo.length) {
                                            callback(null, []);
                                        }
                                    } else {
                                        resourceModel.deleteResourcesById(s3._id, function (err, data) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                count++;
                                                if (count === resourceInfo.length) {
                                                    callback(null, data);
                                                }
                                            }
                                        })
                                    }

                                })(resourceInfo[j]);
                            }

                        })(s3data[i]);
                    }
                }
            }
        })
    }else if(resourceType === 'RDS') {
        resourceModel.getResourcesByProviderResourceType(providerId, resourceType, function (err, rdsdata) {
            if (err) {
                callback(err, null);
            } else {
                var count = 0;
                if (rdsdata.length === 0) {
                    callback(null, []);
                } else {
                    for (var i = 0; i < rdsdata.length; i++) {
                        (function (rds) {
                            for (var j = 0; j < resourceInfo.length; j++) {
                                (function (resource) {
                                    if (rds.resourceDetails.dbName === resource.resourceDetails.dbName) {
                                        count++;
                                        if (count === resourceInfo.length) {
                                            callback(null, []);
                                        }
                                    } else {
                                        resourceModel.deleteResourcesById(rds._id, function (err, data) {
                                            if (err) {
                                                callback(err, null);
                                            } else {
                                                count++;
                                                if (count === resourceInfo.length) {
                                                    callback(null, data);
                                                }
                                            }
                                        })
                                    }

                                })(resourceInfo[j]);
                            }

                        })(rdsdata[i]);
                    }
                }
            }
        })
    }

}

function tagMappingForResources(resources,provider,next){
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
        var count = 0;
        if(resources.length > 0) {
            for (var j = 0; j < resources.length; j++) {
                if (resources[j].tags) {
                    var catalystProjectId = null;
                    var catalystProjectName = null;
                    var catalystEnvironmentId = null;
                    var catalystEnvironmentName = null;
                    var catalystBgId = null;
                    var catalystBgName = null;
                    var assignmentFound = false;
                    if ((bgTag !== null || projectTag !== null || environmentTag !== null) && (resources[j].isDeleted === false)){
                        if(bgTag !== null && bgTag.name in resources[j].tags) {
                            for (var y = 0; y < bgTag.catalystEntityMapping.length; y++) {
                                if (bgTag.catalystEntityMapping[y].tagValue !== '' && resources[j].tags[bgTag.name] !== ''
                                    && bgTag.catalystEntityMapping[y].tagValue === resources[j].tags[bgTag.name]) {
                                    catalystBgId = bgTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystBgName = bgTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if(projectTag !== null && projectTag.name in resources[j].tags) {
                            for (var y = 0; y < projectTag.catalystEntityMapping.length; y++) {
                                if (projectTag.catalystEntityMapping[y].tagValue !== '' && resources[j].tags[projectTag.name] !== '' &&
                                    projectTag.catalystEntityMapping[y].tagValue === resources[j].tags[projectTag.name]) {
                                    catalystProjectId = projectTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystProjectName = projectTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if(environmentTag !== null && environmentTag.name in resources[j].tags) {
                            for (var y = 0; y < environmentTag.catalystEntityMapping.length; y++) {
                                if (environmentTag.catalystEntityMapping[y].tagValue !== '' && resources[j].tags[environmentTag.name] !== '' &&
                                    environmentTag.catalystEntityMapping[y].tagValue === resources[j].tags[environmentTag.name]) {
                                    catalystEnvironmentId = environmentTag.catalystEntityMapping[y].catalystEntityId;
                                    catalystEnvironmentName = environmentTag.catalystEntityMapping[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if (catalystBgId !== null || catalystProjectId !== null || catalystEnvironmentId !== null) {
                            assignmentFound = true;
                        }
                        if (assignmentFound === true) {
                            count++;
                            var masterDetails = {
                                orgId: resources[j].masterDetails.orgId,
                                orgName: resources[j].masterDetails.orgName,
                                bgId: catalystBgId,
                                bgName: catalystBgName,
                                projectId: catalystProjectId,
                                projectName: catalystProjectName,
                                envId: catalystEnvironmentId,
                                envName: catalystEnvironmentName
                            }
                            resourceModel.updateResourcesForAssigned(resources[j]._id, masterDetails, function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                } else {
                                    masterDetails = {};
                                }
                            })
                        } else {
                            count++;
                        }
                    } else {
                        count++;
                    }
                    if (count === resources.length) {
                        next(null, resources);
                    }
                }else{
                    count++;
                    if (count === resources.length) {
                        next(null, resources);
                    }
                }
            }
        }else{
            logger.info("Please configure Resources for Tag Mapping");
            next(null,resources);
        }
    });
}