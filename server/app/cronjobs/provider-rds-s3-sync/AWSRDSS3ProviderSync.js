
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var awsService = require('_pr/services/awsService');
var awsS3 = require('_pr/model/aws-s3');

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
    AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
        if(err) {
            logger.error(err);
        } else {
            awsRDSS3ProviderSyncForProvider.apply(awsRDSS3ProviderSyncForProvider, providers);
        }
    });
}

function awsRDSS3ProviderSyncForProvider(provider) {
    async.waterfall([
        function(next){
            awsService.getBucketsInfo(provider,next);
        },
        function(bucketsInfo,next){
            saveBucketData(bucketsInfo,next);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return;
        }else{
            logger.debug("Bucket Data Successfully Added");
        }
    })
};
function saveBucketData(bucketsInfo, callback) {
    var results = [];
    if(bucketsInfo.length == 0)
        return callback(null, results);
    for(var i = 0; i < bucketsInfo.length; i++) {
        (function(bucket) {
            awsS3.getAWSS3BucketData(bucket.bucketName,function(err,responseBucketData){
                if(err) {
                    callback(err,null);
                }
                if(responseBucketData.length === 0){
                    awsS3.saveAWSS3BucketData(bucket,function(err, bucketSavedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(bucketSavedData);
                        }
                        if(results.length === bucketsInfo.length) {
                            callback(null, results);
                        }
                    });
                }else{
                    awsS3.updateAWSS3BucketData(bucket,function(err, bucketUpdatedData) {
                        if(err) {
                            callback(err,null);
                        } else {
                            results.push(bucketUpdatedData);
                        }
                        if(results.length === bucketsInfo.length) {
                            callback(null, results);
                        }
                    });
                }
            })
        })(bucketsInfo[i]);
    };
}
