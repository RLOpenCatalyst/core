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
var ObjectId = require('mongoose').Types.ObjectId;
var mongoosePaginate = require('mongoose-paginate');

var AuditTrailSchema = new BaseAuditTrail();
AuditTrailSchema.plugin(mongoosePaginate);

AuditTrailSchema.statics.getAuditTrailList = function(auditTrailQuery,callback){
    auditTrailQuery.queryObj.isDeleted = false;
    AuditTrail.paginate(auditTrailQuery.queryObj, auditTrailQuery.options, function(err, auditTrailList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, auditTrailList);
    });
};

AuditTrailSchema.statics.getAuditTrails = function(queryObj,callback){
    AuditTrail.find(queryObj, function(err, auditTrailList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, auditTrailList);
    });
};
AuditTrailSchema.statics.getAuditTrailsCount = function (queryObj, callback) {
    AuditTrail.count(queryObj, function (err, auditTrailCount) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, auditTrailCount);
    });
};

AuditTrailSchema.statics.getAuditTrailsById = function(auditTrailId,callback){
    AuditTrail.find({_id:new ObjectId(auditTrailId)}, function(err, auditTrailList) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, auditTrailList);
    });
};

AuditTrailSchema.statics.removeAuditTrails = function(queryObj,callback){
    AuditTrail.remove(queryObj, function(err, deleteAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, deleteAuditTrail);
    });
};

AuditTrailSchema.statics.updateAuditTrails = function(auditId,queryObj,callback){
    AuditTrail.update({_id:new ObjectId(auditId)},{$set:queryObj},{multi:true}, function(err, updatedAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updatedAuditTrail);
    });
};

AuditTrailSchema.statics.softRemoveAuditTrails = function(auditId,callback){
    AuditTrail.update({auditId:auditId},{$set:{isDeleted:true}},{multi:true}, function(err, sortDeleteAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, sortDeleteAuditTrail);
    });
};

AuditTrailSchema.statics.updateSoftRemoveAuditTrails = function(auditId,callback){
    AuditTrail.update({auditId:auditId},{$set:{isDeleted:false}},{multi:true}, function(err, sortDeleteAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, sortDeleteAuditTrail);
    });
};

var AuditTrail = mongoose.model('auditTrails', AuditTrailSchema);
module.exports = AuditTrail;

