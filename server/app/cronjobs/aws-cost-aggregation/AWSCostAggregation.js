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
var instanceService = require('_pr/services/instanceService');
var S3 = require('_pr/lib/s3.js');
var AdmZip = require('adm-zip');
var csv2json = require('csv2json');
var json = require('jsonfile');
var fs = require('fs');

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
    var lastModified=100;
    fs.unlinkSync("./rlBilling.zip");
    s3.getObject(params,'time',function(err,updateTime)
    {
        console.log(updateTime);
        var temp = String(updateTime).split(',');
        console.log(temp[1]);
        var changedTime = new Date(temp[1]).getTime();
        console.log(changedTime);
        console.log(lastModified);
        if(lastModified < changedTime)
        {
            console.log('inside download file');
            s3.getObject(params,'file',function(err,status)
            {
                console.log(status);
                if(status == true)
                {
                    var zip = new AdmZip("./rlBilling.zip");
                    console.log(__dirname);
                    zip.extractAllTo(__dirname, true);
                    console.log('\n finished');
                    var newJsonFile = fs.createWriteStream('./data.json');
                    fs.createReadStream(csvFile).pipe(csv2json({ })).pipe(newJsonFile);
                    newJsonFile.on('finish',function()
                    {
                        console.log('done');
                        json.readFile('./data.json',function(err,jsonArray) {
                            if (err) console.log(err);
                            else {
                                var length = jsonArray.length;
                                console.log(length);
                            }
                        })
                    })
                }
            });
        }
    })
    /*async.waterfall([
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
                                                    aggregateInstanceCost(instances.managed, callback);
                                                },
                                                assigned: function(callback) {
                                                    aggregateInstanceCost(instances.unmanaged, callback);
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
        });*/
}

function callBackReturn(data,callback){
    callback(null,data);
};












