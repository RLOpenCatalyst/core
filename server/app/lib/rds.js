/*
 Copyright [2016] [Relevance Lab]
 loLicensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */


var aws = require('aws-sdk');
var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');

if (process.env.http_proxy) {
    aws.config.update({
        httpOptions: {
            proxy: process.env.http_proxy
        }
    });
}

var RDS = function(awsSettings) {

    var that = this;
    var params = new Object();

    if (typeof awsSettings.region !== undefined) {
        params.region = awsSettings.region;
    }
    if (typeof awsSettings.access_key !== undefined && typeof awsSettings.secret_key !== undefined) {
        params.accessKeyId = awsSettings.access_key;
        params.secretAccessKey = awsSettings.secret_key;
    }
    var rds = new aws.RDS(params);

    this.getRDSDBInstances = function(callback){
        rds.describeDBInstances(function(err, data) {
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            } else{
                callback(null,data.DBInstances);
                return;
            }
        });
    };

    this.getRDSDBInstanceTag = function(params,callback){
        rds.listTagsForResource(params, function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            } else{
                var rdsTag={};
                if(data.TagList.length === 0){
                    callback(null,rdsTag);
                }else {
                    var count = 0;
                    for(var i = 0; i < data.TagList.length; i++){
                        count++;
                        rdsTag[data.TagList[i].Key] = data.TagList[i].Value;
                        if(data.TagList.length === count){
                            callback(null, rdsTag);
                        }
                    }
                }
            }
        });
    };

    this.addRDSDBInstanceTag = function(dbName,tags,callback){
        var tagsArray = [];
        for(var key in tags) {
            tagsArray.push({
                Key: key,
                Value: tags[key]
            });
        }
        var params = {
            ResourceName: 'arn:aws:rds:us-west-1:'+appConfig.aws.s3AccountNumber+':db:'+dbName,
            Tags: tagsArray
        };
        rds.addTagsToResource(params, function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            }else{
                callback(null, data);
            };
        });
    };

    this.removeRDSDBInstanceTag =  function(params,callback){
        rds.removeTagsFromResource(params, function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            }else{
                callback(null, data);
            };
        });
    }
}

module.exports = RDS;