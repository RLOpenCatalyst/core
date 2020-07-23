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
var Schema = mongoose.Schema;

var BotAuditTrailSummarySchema= new Schema ({
    user: {
        type: String,
        required: true
    },
    botID: {
        type: String,
        required: true
    },
    isResolved:{
        type: Boolean
    },
    date: {
        type: Date,
        required: false
    },
    successCount: {
        type: Number,
        default: 0
    },
    failedCount: {
        type: Number,
        default: 0
    },
    runningCount: {
        type: Number,
        default: 0
    },
    timeSaved: {
        type: Number,
        default: 0
    },
    gitHubId: {
        type: String,
        required: true
    }
})

BotAuditTrailSummarySchema.index({ user: 1, botID: 1, date:1}, { unique: true });

var botAuditTrailSummarySchema = mongoose.model('botAuditTrailSummary', BotAuditTrailSummarySchema);

module.exports = botAuditTrailSummarySchema;
