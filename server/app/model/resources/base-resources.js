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
var util = require('util');
var Schema = mongoose.Schema;

var AWSResourcesSchema = function AWSResources() {
    Schema.apply(this, arguments);
    this.add({
        masterDetails: {
            orgId: {
                type: String,
                required: false,
                trim: true
            },
            orgName: {
                type: String,
                required: false,
                trim: true
            },
            bgId: {
                type: String,
                required: false,
                trim: true
            },
            bgName: {
                type: String,
                required: false,
                trim: true
            },
            projectName: {
                type: String,
                required: false,
                trim: true
            },
            projectId: {
                type: String,
                required: false,
                trim: true
            },
            envId: {
                type: String,
                required: false,
                trim: true
            },
            envName: {
                type: String,
                required: false,
                trim: true
            }
        },
        providerDetails: {
            id: {
                type: String,
                required: false,
                trim: true
            },
            type: {
                type: String,
                required: false,
                trim: true
            },
            region: Schema.Types.Mixed,
            keyPairId:{
                type: String,
                required: false,
                trim: true
            },
            keyPairName:{
                type: String,
                required: false,
                trim: true
            }
        },
        chefServerDetails: {
            id: String,
            nodeName: String,
            run_list: [{
                type: String,
                trim: true
            }],
            attributes: [{
                name: String,
                jsonObj: {}
            }]
        },
        blueprintDetails: {
            id: {
                type: String,
                required: false,
                trim: true
            },
            name:{
                type: String,
                required: false,
                trim: true
            },
            templateName: {
                type: String,
                required: false,
                trim: true
            },
            templateType:{
                type: String,
                required: false,
                trim: true
            }
        },
        resourceType:{
            type: String,
            required: false,
            trim: true
        },
        category:{
            type: String,
            required: false,
            trim: true
        },
        createdOn:{
            type:Number,
            default:Date.now
        },
        stackName:{
            type: String,
            required: false,
            trim: true
        },
        tags:Schema.Types.Mixed,
        usage:Schema.Types.Mixed,
        cost:Schema.Types.Mixed,
        createdOn:{
            type:Number,
            default:Date.now(),
            required:false
        },
        monitor: {
            type: Schema.Types.Mixed,
            required: false,
            default: null
        },
        tagServer: {
            type: String,
            required: false,
            trim: true
        },
        isScheduled: {
            type: Boolean,
            required: false,
            default: false
        },
        startScheduler: [{
            cronPattern: {
                type: String,
                required: false,
                trim: true
            },
            cronTime: {
                type: String,
                required: false,
                trim: true
            },
            cronDays: {
                type: [String],
                required: false
            }
        }],
        stopScheduler: [{
            cronPattern: {
                type: String,
                required: false,
                trim: true
            },
            cronTime: {
                type: String,
                required: false,
                trim: true
            },
            cronDays: {
                type: [String],
                required: false
            }
        }],
        schedulerStartOn: {
            type: Number,
            required: false,
            trim: true
        },
        schedulerEndOn: {
            type: Number,
            required: false,
            trim: true
        },
        interval:[Schema.Types.Mixed],
        cronJobIds: {
            type: [String],
            required: false,
            trim: true
        },
        user:{
            type: String,
            required: false,
            trim: true
        },
        isDeleted:{
            type:Boolean,
            default:false
        },
        serverDeletedCheck:{
            type:Boolean,
            default:false
        }
    });
};
util.inherits(AWSResourcesSchema, Schema);

module.exports = AWSResourcesSchema;