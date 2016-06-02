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
var ObjectId = require('mongoose').Types.ObjectId;
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
        default:Data.now
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
    }

});

var awsS3 = mongoose.model('s3Data', s3Schema);
module.exports = awsS3;
