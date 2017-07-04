/*
 Copyright [2017] [Relevance Lab]

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
var Schema = mongoose.Schema;

var s3ResourceSchema = new Schema({
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
});

s3ResourceSchema.statics.createNew = function(s3Data){
    var self = this;
    var s3Resources = new self(s3Data);
    return s3Resources;
};



var s3Resources = mongoose.model('s3Resources', s3ResourceSchema);
module.exports = s3Resources;
