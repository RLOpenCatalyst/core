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
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var async = require('async');
var appConfig = require('_pr/config');
var instancesModel = require('_pr/model/classes/instance/instance');
var unManagedInstancesModel = require('_pr/model/unmanaged-instance');
var awsCostDao = require('_pr/model/aws-cost-aggregate');
var instanceService = require('_pr/services/instanceService');
var S3 = require('_pr/lib/s3.js');
var AdmZip = require('adm-zip');
var csv2json = require('csv2json');
var json = require('jsonfile');
var fs = require('fs');
var lastModified=100;

var AggregateAWSCost = Object.create(CatalystCronJob);
AggregateAWSCost.interval = '*/5 * * * *';
AggregateAWSCost.execute = aggregateAWSCost;

module.exports = AggregateAWSCost;

function aggregateAWSCost() {
    var s3Config = appConfig.aws.s3;
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = '0' + month;
    }
    var accountNumber = s3Config.accountNumber;
    var fullKey = accountNumber + s3Config.keyName + year + "-" + month + ".csv.zip";
    var csvFile = "./" + accountNumber + s3Config.keyName + year + "-" + month + ".csv";
    var s3 = new S3(s3Config);
    var params = {
        Bucket: s3Config.bucketName,
        Key: fullKey
    };
    async.waterfall([
        function (next) {
            s3.getObject(params, 'time', next);
        },
        function (updateTime, next) {
            var temp = String(updateTime).split(',');
            var changedTime = new Date(temp[1]).getTime();
            if (lastModified < changedTime) {
                s3.getObject(params, 'file', next);
            } else {
                next(null, updateTime);
            }
        },
        function (status, next) {
            if (status) {
                var zip = new AdmZip("./rlBilling.zip");
                zip.extractAllTo(__dirname, true);
                var newJsonFile = fs.createWriteStream('./data.json');
                fs.createReadStream(__dirname + '/' + csvFile).pipe(csv2json({})).pipe(newJsonFile);
                newJsonFile.on('finish', function () {
                    json.readFile('./data.json', function (err, awsCosts) {
                        if (err) {
                            logger.error(err);
                            return;
                        } else {
                            async.forEach(awsCosts, function (awsCost, next) {
                                awsCost.ResourceId
                            })
                        }
                    })
                })
            } else {
                next(null, status);
            }
        },
        function (next) {
            MasterUtils.getAllActiveOrg(next);
        },
        function (orgs, next) {
            if(orgs.length > 0) {
                getInstancesList(orgs, next);
            }else{
                next(null,orgs);
            }
        }
    ], function (err, result) {

    })
}
function saveAndUpdateAwsCostCsvData(awsAggregateCostData){
    async.waterfall([
        function(next){
            awsCostDao.createAWSCostByCSV(awsAggregateCostData,next);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            return;
        }
    })
}

function getProvidersList(orgs,next){
    var count=0;
    async.forEach(orgs, function (organization, next) {
        count++;
        async.waterfall([
            function (next) {
                AWSProvider.getAWSProvidersByOrgId(organization._id, next);
            }],
            function (err, result) {
                if(err){
                    logger.error(err);
                    return;
                }else{
                    if(count === orgs.length){
                        next(null,result);
                    }
             }
        })
    });
}

function getInstanceList(providers,next){
    var count=0;
    var instanceIds=[];
    async.forEach(providers, function (provider, next) {
        count++;
        async.waterfall([
            function (next) {
                instanceService.getTrackedInstancesForProvider(provider, next);
            },
            function (provider, instances, next) {
                if (instances.managed.length === 0 && instances.unmanaged.length === 0) {
                    next(null,instanceIds);
                } else {
                    if(instances.managed.length > 0){
                        for(var i = 0; i < instances.managed.length; i++){
                            instanceIds.push(instances.managed[i].platformId);
                        }
                    }
                    if(instances.unmanaged.length > 0){
                        for(var i = 0; i < instances.unmanaged.length; i++){
                            instanceIds.push(instances.unmanaged[i].platformId);
                        }
                    }

                }
            }],
            function (err, results) {
                if (err) {
                    logger.error(err);
                    return;
                }else{
                    if(providers.length === count){
                        next(null,results);
                    }
                }
            })
    })
}














