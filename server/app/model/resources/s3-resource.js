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
var mongoose = require('mongoose');
var BaseResourcesSchema = require('./base-resources');
var Resources = require('./resources');


var S3ResourcesSchema = new BaseResourcesSchema({
    resourceDetails: {
        bucketName: {
            type: String,
            required: true,
            trim: true
        },
        bucketSize: {
            type: Number,
            required: false,
            trim: true
        },
        bucketOwnerName:{
            type:String,
            required:false,
            trim:true
        },
        bucketOwnerID:{
            type:String,
            required:false,
            trim:true
        },
        bucketCreatedOn:{
            type:Number,
            required:false,
        },
        bucketSizeUnit:{
            type:String,
            required:false,
            trim:true
        }
    }
});

S3ResourcesSchema.statics.createNew = function(s3Data,callback){
    var s3Resource = new S3Resources(s3Data);
    s3Resource.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return;
        }
        callback(null,data);
    });
};

S3ResourcesSchema.statics.updateS3BucketData = function(s3Data,callback){
    var queryObj={};
    queryObj['providerDetails.id'] = s3Data.providerDetails.id;
    queryObj['resourceType'] = s3Data.resourceType;
    queryObj['resourceDetails.bucketName'] = s3Data.resourceDetails.bucketName;
    S3Resources.update(queryObj, {
        $set: {
            resourceDetails: s3Data.resourceDetails,
            tags: s3Data.tags
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to updateS3BucketData", err);
            callback(err, null);
        }
        callback(null, data);
    });
};

S3ResourcesSchema.statics.getS3BucketData = function(s3Data,callback){
    var queryObj={};
    queryObj['providerDetails.id'] = s3Data.providerDetails.id;
    queryObj['resourceType'] = s3Data.resourceType;
    queryObj['resourceDetails.bucketName'] = s3Data.resourceDetails.bucketName;
    queryObj['isDeleted']=false;
    S3Resources.find(queryObj, function(err, data) {
        if (err) {
            logger.error("Failed to getS3BucketData", err);
            callback(err, null);
        }
        callback(null, data);
    });
};


var S3Resources = Resources.discriminator('s3Resources', S3ResourcesSchema);
module.exports = S3Resources;
