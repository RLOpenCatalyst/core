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

var AuditTrailSchema = function AuditTrail() {
    Schema.apply(this, arguments);
    this.add({
        actionLogId: {
            type: String,
            trim:true
        },
        auditId: {
            type: String,
            trim:true,
            required:true
        },
        auditHistoryId: {
            type: String,
            trim:true,
            required:false
        },
        masterDetails:{
            orgName: {
                type: String,
                trim:true,
                required:false
            },
            orgId: {
                type: String,
                trim:true,
                required:false
            },
            bgName: {
                type: String,
                trim:true,
                required:false
            },
            bgId: {
                type: String,
                trim:true,
                required:false
            },
            projectName: {
                type: String,
                trim:true,
                required:false
            },
            projectId: {
                type: String,
                trim:true,
                required:false
            },
            envName: {
                type: String,
                trim:true,
                required:false
            },
            envId: {
                type: String,
                trim:true,
                required:false
            }
        },
        auditType: {
            type: String,
            trim:true,
            required:false
        },
        auditCategory: {
            type: String,
            trim:true,
            required:false
        },
        user: {
            type: String,
            trim:true,
            required:false
        },
        startedOn: {
            type: Number,
            trim:true,
            required:false
        },
        endedOn: {
            type: Number,
            trim:true,
            required:false
        },
        providerType: {
            type: String,
            trim:true,
            required:false
        },
        action: {
            type: String,
            trim:true,
            required:false
        },
        status: {
            type: String,
            trim:true,
            required:false
        },
        actionStatus: {
            type: String,
            trim:true,
            required:false
        },
        overRunFlag: {
            type: Boolean,
            default:false,
            required:false
        },
        savedTime: {
            hours: {
                type: Number,
                default:0
            },
            minutes: {
                type: Number,
                default:0
            },
            seconds: {
                type: Number,
                default:0
            }
        },
        isDeleted: {
            type: Boolean,
            default:false
        }
    });
};
util.inherits(AuditTrailSchema, Schema);

module.exports = AuditTrailSchema;