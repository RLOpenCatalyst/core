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
var logger = require('_pr/logger')(module);
var Cryptography = require('_pr/lib/utils/cryptography');
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var instanceService = require('_pr/services/instanceService');
var S3 = require('_pr/lib/s3.js');
var AdmZip = require('adm-zip');
var csv2json = require('csv2json');
var json = require('jsonfile');
var fs = require('fs');

var AWS = require('aws-sdk');

var AggregateAWSCost = Object.create(CatalystCronJob);
AggregateAWSCost.interval = '* * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    async.waterfall([
        function(next){
            MasterUtils.getAllActiveOrg(next);
        },
        function(orgs,next){
            async.forEach(orgs,function(organization,next){
                async.waterfall([
                    function(next){
                        AWSProvider.getAWSProvidersByOrgId(organization._id,next);
                    },
                    function(providers,next){
                        if(providers.length > 0){
                            async.forEach(providers,function(provider,next){
                                async.waterfall([
                                    function(next){
                                        instanceService.getTrackedInstancesForProvider(provider, next);
                                    },
                                    function(provider, instances,next){
                                        if(instances.managed.length === 0 && instances.unmanaged.length === 0){
                                            callBackReturn(providers,next);
                                        }else{
                                            async.parallel({
                                                managed: function(callback) {
                                                    calculateAWSInstanceCostForProvider(provider,instances.managed, callback);
                                                },
                                                assigned: function(callback) {
                                                    calculateAWSInstanceCostForProvider(provider,instances.unmanaged, callback);
                                                }
                                            }, function(err, results){
                                                if(err) {
                                                    next(err);
                                                } else {
                                                    next(null, results);
                                                }
                                            });
                                        }
                                    }],
                                    function(err,results){
                                        if(err){
                                            logger.error(err);
                                            return;
                                        }
                                    })
                            })
                        }else{
                            callBackReturn(providers,next);
                        }
                    }],
                    function (err, results) {
                        if(err){
                            logger.error(err);
                            return;
                        }
                    });
            });
        }],
        function (err, results) {
            if(err){
                logger.error(err);
                return;
            }
        });
}

function callBackReturn(data,callback){
    callback(null,data);
};
function calculateAWSInstanceCostForProvider(provider,instances,next){
    if(instances.length == 0) {
        next(null, []);
    }
    var s3Config;
    if (provider.isDefault) {
        amazonConfig = {
            "isDefault": true
        };
    } else {
        var s3 = appConfig.aws.s3;
        s3Config = {
            "access_key": s3.accessKey,
            "secret_key": s3.secretKey,
            "region":s3.region,
            "accountNumber":s3.accountNumber,
            "keyName":s3.keyName,
            "bucket":s3.bucketName
        };
    }
    for(var i = 0; i < instances.length; i++) {
        (function (instance) {
            if (instance.providerData) {
                aggregateInstanceCost(s3Config,'time',next);
            }
        })(instances[i]);
    }
}
function aggregateInstanceCost(s3Config,key,next) {
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    var lastModified = 100;
    var accountNumber = s3Config.accountNumber;
    var fullKey = accountNumber + s3Config.keyName + year + "-" + month + ".csv.zip";
    var csvFile = "./" + accountNumber + s3Config.keyName + year + "-" + month + ".csv";
    var s3 = new S3(s3Config);
    var params = {
        Bucket: s3Config.bucket,
        Key: fullKey
    };
    if (key === 'time') {
        s3.getObject(params, function (err, data) {
            if (err) {
                console.log("last updated error \n" + err);
                return;
            } else {
                var temp = String(data.LastModified).split(',');
                var changedTime = new Date(temp[1]).getTime();
                console.log(changedTime);
                if (lastModified < changedTime) {
                    var file = fs.createWriteStream('billingrl.zip');
                    s3.getObject(params).createReadStream().pipe(file);
                    file.on('finish', function () {
                        next(null, true);
                    });
                }
            }
        });
    }
}









