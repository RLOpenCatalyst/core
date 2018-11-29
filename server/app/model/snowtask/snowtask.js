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


var Client = require('node-rest-client').Client;
var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var request = require('request');
var ObjectId = require('mongoose').Types.ObjectId;

var SNOWTaskSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        trim: true
    },
    sys_updated_by: {
        type: String,
        required: true,
        trim: true,
    },
    sys_created_by: {
        type: String,
        required: true,
        trim: true
    },
    short_description: {
        type: String,
        required: true,
        trim: true,
    },
    sys_class_name: {
        type: String,
        required: true,
        trim: true
    },
    sys_id: {
        type: String,
        required: true,
        trim: true,
    },
    assigned_to: {
        type: String,
        required: false,
        trim: true,
    }
});
    


SNOWTaskSchema.statics.createNew = function(groupObj, callback){
    console.log("+++++++++++++++++++++"+JSON.stringify(groupObj));
    return this.insertMany(groupObj, callback);
}


var SNOWTask = mongoose.model('SnowTask', SNOWTaskSchema);
module.exports = SNOWTask;
