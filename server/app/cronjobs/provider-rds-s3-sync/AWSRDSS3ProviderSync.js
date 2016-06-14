
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var resourceService = require('_pr/services/resourceService');
var s3Model = require('_pr/model/resources/s3-resource');
var rdsModel = require('_pr/model/resources/rds-resource');
var orgName='';

var AWSRDSS3ProviderSync = Object.create(CatalystCronJob);
AWSRDSS3ProviderSync.interval = '*/2 * * * *';
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
    logger.debug("S3/RDS Data Fetching started");
    async.waterfall([
        function(next){
            async.parallel({
                s3: function(callback) {
                    resourceService.getBucketsInfo(provider,orgName,callback);
                },
                rds: function(callback) {
                    resourceService.getRDSInstancesInfo(provider,orgName,callback);
                }
            }, function(err, results){
                if(err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        },
        function(awsServices,next){
            async.parallel({
                s3: function(callback) {
                    saveS3Data(awsServices.s3,callback);
                },
                rds: function(callback) {
                    saveRDSData(awsServices.rds,callback);
                }
            }, function(err, results){
                if(err) {
                    next(err);
                } else {
                    next(null, results);
                }
            });
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return;
        }else{
            logger.debug("S3/RDS Data Successfully Added");
        }
    })
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
