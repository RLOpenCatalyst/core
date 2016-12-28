
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

AWSRDSS3ProviderSync.execute()

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
    if(s3Info.length === 0) {
        return callback(null, results);
    }else {
        for (var i = 0; i < s3Info.length; i++) {
            (function (s3) {
                s3Model.getS3BucketData(s3, function (err, responseBucketData) {
                    if (err) {
                        callback(err, null);
                    }
                    if (responseBucketData.length === 0) {
                        s3Model.createNew(s3, function (err, bucketSavedData) {
                            if (err) {
                                callback(err, null);
                            } else {
                                results.push(bucketSavedData);
                            }
                            if (results.length === s3Info.length) {
                                callback(null, results);
                            }
                        });
                    } else {
                        s3Model.updateS3BucketData(s3, function (err, bucketUpdatedData) {
                            if (err) {
                                callback(err, null);
                            } else {
                                results.push(bucketUpdatedData);
                            }
                            if (results.length === s3Info.length) {
                                callback(null, results);
                            }
                        });
                    }
                })
            })(s3Info[i]);
        }
    }
}

function saveRDSData(rdsInfo, callback) {
    var results = [];
    if(rdsInfo.length === 0) {
        return callback(null, results);
    }else {
        for (var i = 0; i < rdsInfo.length; i++) {
            (function (rds) {
                rdsModel.getRDSData(rds, function (err, responseRDSData) {
                    if (err) {
                        callback(err, null);
                    }
                    if (responseRDSData.length === 0) {
                        rdsModel.createNew(rds, function (err, rdsSavedData) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                results.push(rdsSavedData);
                            }
                            if (results.length === rdsInfo.length) {
                                callback(null, results);
                                return;
                            }
                        });
                    } else {
                        rdsModel.updateRDSData(rds, function (err, rdsUpdatedData) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else {
                                results.push(rdsUpdatedData);
                            }
                            if (results.length === rdsInfo.length) {
                                callback(null, results);
                                return;
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
                                        next(err);
                                    } else {
                                        count++;
                                        if (count === s3Data.length) {
                                            next(null, data);
                                        }
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
                                        next(err);
                                    } else {
                                        count++;
                                        if (count === rdsData.length) {
                                            next(null, data);
                                        }
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
                    next(null, dbNames);
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
                }else if (('catalystEntityType' in tagDetails[i]) && tagDetails[i].catalystEntityType == 'businessGroup') {
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
                    if ((bgTag !== null || projectTag !== null || environmentTag !== null)
                        && (resources[j].isDeleted === false)){

                        if(bgTag !== null && bgTag.name in resources[j].tags) {
                            var bgEntityMappings = Object.keys(bgTag.catalystEntityMapping).map(
                                function(k){return bgTag.catalystEntityMapping[k]});

                            for (var y = 0; y < bgEntityMappings.length; y++) {
                                if ((resources[j].tags[bgTag.name] !== '') && ('tagValues' in bgEntityMappings[y])
                                    && (bgEntityMappings[y].tagValues.indexOf(resources[j].tags[bgTag.name])
                                    >= 0)) {
                                    catalystBgId = bgEntityMappings[y].catalystEntityId;
                                    catalystBgName = bgEntityMappings[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if(projectTag !== null && projectTag.name in resources[j].tags) {
                            var projectEntityMappings = Object.keys(projectTag.catalystEntityMapping).map(
                                function(k){return projectTag.catalystEntityMapping[k]});

                            for (var y = 0; y < projectEntityMappings.length; y++) {
                                if ((resources[j].tags[bgTag.name] !== '') && ('tagValues' in projectEntityMappings[y])
                                    && (projectEntityMappings[y].tagValues.indexOf(resources[j].tags[projectTag.name])
                                    >= 0)) {
                                    catalystProjectId = projectEntityMappings[y].catalystEntityId;
                                    catalystProjectName = projectEntityMappings[y].catalystEntityName;
                                    break;
                                }
                            }
                        }
                        if(environmentTag !== null && environmentTag.name in resources[j].tags) {
                            var environmentEntityMappings = Object.keys(environmentTag.catalystEntityMapping).map(
                                function(k){return environmentTag.catalystEntityMapping[k]});

                            for (var y = 0; y < environmentTag.catalystEntityMapping.length; y++) {
                                if ((resources[j].tags[bgTag.name] !== '')
                                    && ('tagValues' in environmentEntityMappings[y])
                                    && (environmentEntityMappings[y].tagValues.indexOf(
                                        resources[j].tags[environmentTag.name]) >= 0)) {
                                    catalystEnvironmentId = environmentEntityMappings[y].catalystEntityId;
                                    catalystEnvironmentName = environmentEntityMappings[y].catalystEntityName;
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

function bucketNameList(s3Info,callback){
    var bucketNames=[];
    for(var i = 0; i < s3Info.length; i++){
        bucketNames.push(s3Info[i].resourceDetails.bucketName);
        if(bucketNames.length === s3Info.length){
            callback(null,bucketNames);
        }
    }
}

function rdsDBResourceIdList(rdsInfo,callback){
    var rdsDBResourceIds=[];
    for(var i = 0; i < rdsInfo.length; i++){
        rdsDBResourceIds.push(rdsInfo[i].resourceDetails.dbiResourceId);
        if(rdsDBResourceIds.length === rdsInfo.length){
            callback(null,rdsDBResourceIds);
        }
    }
}