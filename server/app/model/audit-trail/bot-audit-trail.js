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
var BaseAuditTrail = require('./base-audit-trail.js');
var AuditTrail = require('./audit-trail.js');
var Schema = mongoose.Schema;
var ObjectId = require('mongoose').Types.ObjectId;

var BotAuditTrailSchema = new BaseAuditTrail({
    auditTrailConfig: {
        nodeIds: {
            type: [String],
            trim:true
        },
        executionType:{
            type: String,
            trim:true
        },
        name: {
            type: String,
            trim:true
        },
        type: {
            type: String,
            trim:true
        },
        description:{
            type: String,
            trim:true
        },
        category:{
            type: String,
            trim:true
        },
        jenkinsBuildNumber:{
            type: Number
        },
        jenkinsJobName:{
            type: String,
            trim:true
        },
        jobResultURL:{
            type: [String],
            trim:true
        },
        manualExecutionTime:{
            type: Number,
            required: false
        },
        nodeIdsWithActionLog:[Schema.Types.Mixed]
    }
});

BotAuditTrailSchema.statics.createNew = function(auditTrail,callback){
    var botAuditTrail = new BotAuditTrail(auditTrail);
    botAuditTrail.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return;
        }
        callback(null,data);
    });
}
BotAuditTrailSchema.statics.updateBotAuditTrail = function(auditId,auditTrailObj,callback){
    BotAuditTrail.update({_id:new ObjectId(auditId)},{$set:auditTrailObj},{upsert:false}, function(err, updateAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateAuditTrail);
    });
};
BotAuditTrailSchema.statics.updateBotAuditTrailByActionLogId = function(actionLogId,auditTrailObj,callback){
    BotAuditTrail.update({actionLogId:actionLogId},{$set:auditTrailObj},{upsert:false}, function(err, updateAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateAuditTrail);
    });
};

var BotAuditTrail = AuditTrail.discriminator('botAuditTrail', BotAuditTrailSchema);
module.exports = BotAuditTrail;
