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
var fs = require('fs');
var appConfig = require('_pr/config');

if (process.env.http_proxy) {
    aws.config.update({
        httpOptions: {
            proxy: process.env.http_proxy
        }
    });
}

var S3 = function(awsSettings) {

    var that = this;
    var params = new Object();

    if (typeof awsSettings.region !== undefined) {
        params.region = awsSettings.region;
    }
    if (typeof awsSettings.access_key !== undefined && typeof awsSettings.secret_key !== undefined) {
        params.accessKeyId = awsSettings.access_key;
        params.secretAccessKey = awsSettings.secret_key;
    }
    var s3 = new aws.S3(params);

    this.getObject = function(params,key, callback) {
        if(key==='time') {
            s3.getObject(params, function (err, data) {
                if (err) {
                    logger.debug("Got getObject info with error: ", err);
                    callback(err, null);
                    return;
                }
                callback(null, data.LastModified);
            });
        }else if(key === 'file'){
            var path=appConfig.aws.s3BucketDownloadFileLocation;
            var fileName=appConfig.aws.s3BucketFileName;
            var file = fs.createWriteStream(path+fileName);
            var fileStream = s3.getObject(params).createReadStream();
            fileStream.pipe(file);
            file.on('finish',function(){
                callback(null,true);
            });
        }

    };

    this.getBucketList = function(callback) {
        s3.listBuckets(function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            } else {
                callback(null,data);
            };
        });
    };

    this.getBucketSize = function(bucketName,callback) {
        var bucketSize = 0;
        var count = 0;
        s3.listObjects({Bucket:bucketName},function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            } else {
                if(data.Contents.length === 0){
                     callback(null, 0);
                }else {
                    for (var i = 0; i < data.Contents.length; i++) {
                        count++;
                        bucketSize += data.Contents[i].Size;
                        if (data.Contents.length === count) {
                            callback(null, bucketSize / 1048576);
                        }
                    }
                }
            };
        });
    };

    this.getBucketTag = function(bucketName,callback){
        s3.getBucketTagging({Bucket:bucketName}, function(err, data) {
            if (err){
                callback(null,{});
            }else{
                var tags = data.TagSet;
                var tagObj={};
                if(tags.length > 0){
                    for(var i = 0; i < tags.length; i++){
                        tagObj[tags[i].Key] = tags[i].Value;
                        if(i === tags.length-1){
                            callback(null,tagObj);
                        }
                    }
                }else{
                    callback(null,{});
                }
            }
        });
    };

    this.addBucketTag = function(bucketName,tags,callback){
        var tagsArray = [];
        for(var key in tags) {
            if(key !== '_schema') {
                tagsArray.push({
                    Key: key,
                    Value: tags[key]
                });
            }
        }
        var params = {
            Bucket: bucketName,
            Tagging: {
                TagSet: tagsArray
            }
        };
        s3.putBucketTagging(params, function(err, data) {
            if (err){
                console.log(err);
                console.log(err.stack);
                logger.error(err, err.stack);
                callback(err,null);
            }else{
                callback(null, data);
            };
        });
    };

    this.removeBucketTag = function(params,callback){
        s3.deleteBucketTagging(params, function(err, data) {
            if (err){
                logger.error(err, err.stack);
                callback(err,null);
            }else{
                callback(null, data);
            };
        });
    }
}

module.exports = S3;