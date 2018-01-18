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

var instanceResourceSchema = new Schema({
    _id:false,
    platformId: {
        type: String,
        required: true,
        trim: true
    },
    publicIp: {
        type: String,
        required: false,
        trim: true
    },
    privateIp:{
        type:String,
        required:false,
        trim:true
    },
    os:{
        type:String,
        required:false,
        trim:true
    },
    type:{
        type:String,
        required:false,
        trim:true
    },
    launchTime:{
        type:Number,
        required:false
    },
    state:{
        type:String,
        required:false,
        trim:true
    },
    hostName:{
        type:String,
        required:false,
        trim:true
    },
    subnetId: {
        type: String,
        required: false,
        trim: true
    },
    amiId: {
        type: String,
        required: false,
        trim: true
    },
    vpcId: {
        type: String,
        required: false,
        trim: true
    },
    bootStrapState:{
        type: String,
        required: false,
        trim: true
    },
    credentials:Schema.Types.Mixed,
    route53HostedParams:[Schema.Types.Mixed],
    hardware:Schema.Types.Mixed,
    dockerEngineState: {
        type: String,
        required: false,
        trim: true
    }
});

instanceResourceSchema.statics.createNew = function(instanceData){
    var self = this;
    var instanceResources = new self(instanceData);
    return instanceResources;
};



var instanceResources = mongoose.model('instanceResources', instanceResourceSchema);
module.exports = instanceResources;
