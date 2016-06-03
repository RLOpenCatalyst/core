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

var mongoose = require('mongoose');
var logger = require('_pr/logger')(module);
var Schema = mongoose.Schema;

var s3Schema = new Schema({
    orgId: {
        type: String,
        required: true,
        trim: true,
    },
    providerId: {
        type: String,
        required: false,
        trim: true
    },
    providerType: {
        type: String,
        required: false,
        trim: true
    },
    bucketName: {
        type: String,
        required: true,
        trim: true
    },
    bucketCreatedOn:{
        type:Date,
        default:Date.now
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
    tags:[Schema.Types.Mixed],
    usage:Schema.Types.Mixed
});

s3Schema.statics.saveAWSS3BucketData = function(bucketData, callback) {
    var bucket = new awsS3(bucketData);
    bucket.save(function(err, data) {
        if (err) {
            logger.error("saveAWSS3BucketData Failed", err, data);
            return;
        }
        callback(null,data);
    });
};

s3Schema.statics.getAWSS3BucketData = function(bucketName, callback) {
    awsS3.find({
        bucketName: bucketName
    }, function(err, data) {
        if (err) {
            logger.error("Failed to getAWSS3BucketData", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

s3Schema.statics.getAWSS3Buckets = function(callback) {
    awsS3.find({}, function(err, data) {
        if (err) {
            logger.error("Failed to getAWSS3Buckets", err);
            callback(err, null);
            return;
        }
        callback(null, data);
    });
};

s3Schema.statics.updateAWSS3BucketData = function(bucketData, callback) {
    awsS3.update({
        bucketName: bucketData.bucketName
    }, {
        $set: {
            bucketSize: bucketData.bucketSize
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            logger.error("Failed to updateAWSS3BucketData", err);
            callback(err, null);
        }
        callback(null, data);
    });
};

s3Schema.statics.updateS3Usage = function(bucketName, usage, callback) {
    awsS3.update({
        bucketName: bucketName
    }, {
        $set: {
            usage: usage
        }
    }, {
        upsert: false
    }, function(err, data) {
        if (err) {
            return callback(err, null);
        } else {
            callback(null, data);
        }
    });
};

var awsS3 = mongoose.model('s3Data', s3Schema);
module.exports = awsS3;
