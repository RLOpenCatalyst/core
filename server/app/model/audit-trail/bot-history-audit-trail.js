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

const logger = require('_pr/logger')(module);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const botHistoryAuditTrailSchema = new Schema ({
    botId: {
        type: String
    },
    actionLogId: {
        type: String,
        required: true
    },
    botRunId: {
        type: String,
        required: true
    },
    botExecutorName: {
        type: String
    },
    input: {
        type : Schema.Types.Mixed,
        default : null
    },
    output: {
        type : Schema.Types.Mixed,
        default : null
    },
    createdOn: {
        type: Number,
        required: true,
        default: Date.now()
    },
    lastUpdateOn: {
        type: Number,
        required: true,
        default: Date.now()
    }
})

botHistoryAuditTrailSchema.index({ actionLogId: 1, createdOn:1 }, { unique: true });

botHistoryAuditTrailSchema.statics.addBotHistoryAudit = function (auditObj, callback) {
    let audit = new this(auditObj);
    audit.save(callback);
};

botHistoryAuditTrailSchema.statics.insertBotHistoryAudit = function (auditList, callback) {
    let auditListDB = auditList.map((auditObj) => {
        let audit = new this(auditObj);
        audit.createdOn = Date.now();
        audit.lastUpdateOn = Date.now();
        return audit;
    });
    this.insertMany(auditListDB, callback);
};

botHistoryAuditTrailSchema.statics.findByQuery = function (query, project, options, callback) {
    return this.find(query, project, options, callback);
};

botHistoryAuditTrailSchema.statics.findOneByQuery = function (query, project, options, callback) {
    return this.findOne(query, project, options, callback);
};

const botHistoryAuditTrail = mongoose.model('botHistoryAuditTrail', botHistoryAuditTrailSchema);
module.exports = botHistoryAuditTrail;
