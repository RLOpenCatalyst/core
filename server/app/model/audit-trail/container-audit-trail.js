var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var BaseAuditTrail = require('./base-audit-trail.js');
var AuditTrail = require('./audit-trail.js');
var ObjectId = require('mongoose').Types.ObjectId;

var ContainerAuditTrailSchema = new BaseAuditTrail({
    auditTrailConfig: {
        instanceIP: {
            type: String,
            trim:true
        },
        platformId: {
            type: String,
            trim:true
        },
        name: {
            type: String,
            trim:true
        },
        image:{
            type: String,
            trim:true
        },
        imageId:{
            type: String,
            trim:true
        },
        platform:{
            type: String,
            trim:true
        },
        os:{
            type: String,
            trim:true
        }
    }
});

ContainerAuditTrailSchema.statics.createNew = function(auditTrail,callback){
    var containerAuditTrail = new ContainerAuditTrail(auditTrail);
    containerAuditTrail.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return;
        }
        callback(null,data);
    });
};

ContainerAuditTrailSchema.statics.updateContainerAuditTrail = function(auditId,auditTrailObj,callback){
    ContainerAuditTrail.update({_id:new ObjectId(auditId)},{$set:auditTrailObj},{upsert:false}, function(err, updateAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateAuditTrail);
    });
};

var ContainerAuditTrail = AuditTrail.discriminator('containerAuditTrail', ContainerAuditTrailSchema);
module.exports = ContainerAuditTrail;


