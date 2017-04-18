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
        masterDetails: Schema.Types.Mixed,
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
        isDeleted:{
            type:Boolean,
            default:false
        }
    });
};
util.inherits(AWSResourcesSchema, Schema);

module.exports = AWSResourcesSchema;