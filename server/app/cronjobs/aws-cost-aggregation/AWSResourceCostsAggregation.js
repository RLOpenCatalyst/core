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

var logger = require('_pr/logger')(module)
var async = require('async')
var appConfig = require('_pr/config')
var Cryptography = require('_pr/lib/utils/cryptography')
var S3 = require('_pr/lib/s3.js')
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js')
var MasterUtils = require('_pr/lib/utils/masterUtil.js')
var resourceService = require('_pr/services/resourceService')
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob')
var AWSConfig = require('./AWSConfig.js')
var dateUtil = require('_pr/lib/utils/dateUtil')

var AWSResourceCostsAggregation = Object.create(CatalystCronJob)
// AWSResourceCostsAggregation.interval = '0 */1 * * *'
AWSResourceCostsAggregation.interval = '* * * * *'

var date = new Date()
// current time - cron interval
AWSResourceCostsAggregation.previousCronRunTime = dateUtil.getDateInUTC(date.setHours(date.getHours() - 1))
AWSResourceCostsAggregation.fullKey = appConfig.aws.s3AccountNumber
    + appConfig.aws.s3CSVFileName + date.getFullYear() + "-" + '0'+ date.getMonth() + ".csv.zip";
AWSResourceCostsAggregation.execute = aggregateAWSResourceCosts
AWSResourceCostsAggregation.aggregateAWSCostForProvider = aggregateAWSCostForProvider
AWSResourceCostsAggregation.downloadUpdatedCSVFile = downloadUpdatedCSVFile
AWSResourceCostsAggregation.updateResourceCosts = updateResourceCosts

module.exports = AWSResourceCostsAggregation

function aggregateAWSResourceCosts() {
    async.waterfall([
        function(next) {
            MasterUtils.getAllActiveOrg(next)
        },
        function(orgs, next) {
            // Gets providers for all orgs in the list
            AWSProvider.getAWSProvidersForOrg(orgs, next)
        },
        function(providers, next) {
            async.forEach(providers, AWSResourceCostsAggregation.aggregateAWSCostForProvider, next)
        }
    ], function(err, results) {
        if (err) {
            logger.error(err)
        } else {

        }
    })
}

function aggregateAWSCostForProvider(provider, callback) {
    async.waterfall([
        /*function(next) {
            resourceService.getAllResourcesForProvider(provider, next)
        },*/
        function(next) {
            // console.log(AWSResourceCostsAggregation.previousCronRunTime)
            AWSResourceCostsAggregation.downloadUpdatedCSVFile(provider)
        },
        function(downloadedCSVPath, next) {
            AWSResourceCostsAggregation.updateResourceCosts(provider, downloadedCSVPath, next)
        },
    ], function(err, result) {
        if (err) {
            callback(err)
        } else if(result) {
            logger.info('Cost aggregation complete for provider ' + provider._id)
            // callback pending
        }
    })
}

function downloadUpdatedCSVFile(provider, callback) {
    var cryptoConfig = appConfig.cryptoSettings
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password)
    var decryptedAccessKey = cryptography.decryptText(provider.accessKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding)
    var decryptedSecretKey = cryptography.decryptText(provider.secretKey,
        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding)
    var s3Config = {
        access_key: decryptedAccessKey,
        secret_key: decryptedSecretKey,
        region: 'us-east-1'
    }
    var s3 = new S3(s3Config);
    var params = {
        Bucket: provider.s3BucketName,
        Key: AWSResourceCostsAggregation.fullKey
    }

    async.waterfall([
        function(next) {
            s3.getObject(params, 'time', next)
        },
        function(lastBillUpdateTime, next) {
            //@TODO Last update time to be updated from db
            if(AWSResourceCostsAggregation.previousCronRunTime <  lastBillUpdateTime) {
                s3.getObject(params, 'file', next)
            } else {
                next(false)
            }
        },
        function(billDownloaded, next) {
            if(billDownloaded) {
                var downloadedCSVPath = appConfig.aws.s3BucketDownloadFileLocation
                    + appConfig.aws.s3BucketFileName
                var zip = new AdmZip(downloadedCSVPath)
                zip.extractAllTo(path, true);
                next(null, downloadedCSVPath)
            } else {
                next(null, null)
            }
        }
    ],
    function(err, downloadedCSVPath) {
        if(err) {
            logger.error(err)
            callback(new Error('Error in cost aggregation for provider ' + provider._id))
        } else {
            callback(null, downloadedCSVPath)
        }
    })
}

function updateResourceCosts(provider, downlaodedCSVPath, callback) {

}

