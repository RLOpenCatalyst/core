
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var awsService = require('_pr/services/awsService');
var S3 = require('_pr/lib/s3.js');
var Cryptography = require('_pr/lib/utils/cryptography');

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
        function(bucketData,next){
            awsService.getS3BucketsMetrics(provider,bucketData.Buckets,next);
        },
        function(bucketMetrics,next){
            saveResourceUsageMetrics(bucketMetrics,next);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return;
        }else{
            logger.debug("Done");
        }
    })
};
function saveResourceUsageMetrics (resourceMetrics, next) {
    var results = [];
    if(resourceMetrics.length == 0)
        return next(null, results);

    for(var i = 0; i < resourceMetrics.length; i++) {
        (function(j) {
            resourceMetricsModel.createNew(resourceMetrics[j],
                function(err, resourceMetricsObj) {
                    if(err)
                        next(err);
                    else
                        results.push(resourceMetricsObj);
                    if(results.length == resourceMetrics.length)
                        next(null, results);
                }
            );
        })(i);
    };
}
