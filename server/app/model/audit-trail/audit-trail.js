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
var BaseAuditTrail = require('./base-audit-trail');
var mongoosePaginate = require('mongoose-paginate');

var auditTrailSchema = new BaseAuditTrail();
auditTrailSchema.plugin(mongoosePaginate);

auditTrailSchema.statics.insertAuditTrail = function(auditTrailData, callback) {
    console.log("Durgesh");
    if (auditTrailData.auditType === 'BOTs' && auditTrailData.auditTrailConfig) {
        auditTrailData.auditTrailConfig = botAuditTrail.createNew(auditTrailData.auditTrailConfig);
    } else if (auditTrailData.auditType === 'Instances' && auditTrailData.auditTrailConfig) {
        auditTrailData.auditTrailConfig = instanceAuditTrail.createNew(auditTrailData.auditTrailConfig);
    } else if (auditTrailData.auditType === 'Containers' && auditTrailData.auditTrailConfig) {
        auditTrailData.auditTrailConfig = containerAuditTrail.createNew(auditTrailData.auditTrailConfig);
    } else {
        process.nextTick(function() {
            callback({
                message: "Invalid Audit Trail Type. "
            }, null);
        });
        return;
    }
    var auditTrail = new auditTrail(auditTrailData);
    auditTrail.save(function(err, auditTrail) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        callback(null, auditTrail);
        return;
    });
};

auditTrailSchema.statics.getAuditTrailList = function(auditTrailQuery,callback){
    auditTrail.paginate(auditTrailQuery.queryObj, auditTrailQuery.options, function(err, auditTrailList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, auditTrailList);
    });
};

auditTrailSchema.statics.updateAuditTrail = function(queryObj,auditObj,callback){
    auditTrail.update(queryObj,{$set:auditObj},{upsert:false}, function(err, updateAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateAuditTrail);
    });
};

var auditTrail = mongoose.model('auditTrail', auditTrailSchema);
module.exports = new auditTrail();
