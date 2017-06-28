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
var ObjectId = require('mongoose').Types.ObjectId;
var Schema = mongoose.Schema;

var InstanceResourcesSchema = new BaseResourcesSchema({
    resourceDetails: {
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
    }
});

InstanceResourcesSchema.statics.createNew = function(instanceData,callback){
    var instanceResource = new instanceResources(instanceData);
    console.log(JSON.stringify(instanceResource));
    instanceResource.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return callback(err,null);
        }else{
            console.log(data._id);
            return callback(null,data);
        }
    });
};

InstanceResourcesSchema.statics.updateInstanceData = function(instanceId,instanceData,callback){
    instanceResources.update({_id:new ObjectId(instanceId)}, {$set: instanceData}, {multi: true},
        function(err, data) {
        if (err) {
            logger.error("Failed to updateInstanceData", err);
            callback(err, null);
        }
        callback(null, data);
    });
};

InstanceResourcesSchema.statics.getInstanceData = function(filterBy,callback){
    instanceResources.find(filterBy,
        function(err, data) {
            if (err) {
                logger.error("Failed to updateInstanceData", err);
                callback(err, null);
            }
            callback(null, data);
        });
};


var instanceResources = Resources.discriminator('ec2', InstanceResourcesSchema);
module.exports = instanceResources;
