
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var s3Model = require('_pr/model/resources/s3-resource');
var rdsModel = require('_pr/model/resources/rds-resource');
var resourceModel = require('_pr/model/resources/resources');
var orgName='';

var AWSRDSS3ProviderSync = Object.create(CatalystCronJob);
AWSRDSS3ProviderSync.interval = '* * * * *';
AWSRDSS3ProviderSync.execute = awsRDSS3ProviderSync;

module.exports = AWSRDSS3ProviderSync;

function awsRDSS3ProviderSync() {
    MasterUtils.getAllActiveOrg(function(err, orgs) {
        if(err) {
            logger.error(err);
        } else {
            awsRDSS3ProviderSyncForProvidersOfOrg.apply(awsRDSS3ProviderSyncForProvidersOfOrg, orgs);
        }
    });
}

function awsRDSS3ProviderSyncForProvidersOfOrg(org) {
    orgName =org.orgname;
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            awsRDSS3ProviderSyncForProvider.apply(awsRDSS3ProviderSyncForProvider, providers);
        }
    });
}

function awsRDSS3ProviderSyncForProvider(provider) {
    logger.info("S3/RDS Data Fetching started");
    if(provider._id) {
        async.waterfall([
            function (next) {
                async.parallel({
                    s3: function (callback) {
                        resourceService.getBucketsInfo(provider, orgName, callback);
                    },
                    rds: function (callback) {
                        resourceService.getRDSInstancesInfo(provider, orgName, callback);
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
            }
        ], function (err, results) {
            if (err) {
                logger.error(err);
                return;
            } else {
                logger.info("S3/RDS Data Successfully Added");
            }
        })
    }else{
        logger.info("Please configure Provider for S3/RDS Resources");
    }
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
