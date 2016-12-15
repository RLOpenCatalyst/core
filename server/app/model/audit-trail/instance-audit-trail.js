
var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var BaseAuditTrail = require('./base-audit-trail');
var AuditTrail = require('./audit-trail');
var ObjectId = require('mongoose').Types.ObjectId;

var InstanceAuditTrailSchema = new BaseAuditTrail({
    auditTrailConfig: {
        platformId: {
            type: String,
            trim: true
        },
        blueprintName: {
            type: String,
            trim: true
        },
        platform: {
            type: String,
            trim: true
        },
        os: {
            type: String,
            trim: true
        },
        size: {
            type: String,
            trim: true
        }
    }
});

InstanceAuditTrailSchema.statics.createNew = function(auditTrail,callback){
    var instanceAuditTrail = new InstanceAuditTrail(auditTrail);
    instanceAuditTrail.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return;
        }
        callback(null,data);
    });
}

InstanceAuditTrailSchema.statics.updateInstanceAuditTrail = function(auditId,auditTrailObj,callback){
    InstanceAuditTrail.update({_id:new ObjectId(auditId)},{$set:auditTrailObj},{upsert:false}, function(err, updateAuditTrail) {
        if (err) {
            logger.error(err);
            var error = new Error('Internal server error');
            error.status = 500;
            return callback(error);
        }
        return callback(null, updateAuditTrail);
    });
};

var InstanceAuditTrail = AuditTrail.discriminator('instanceAuditTrail', InstanceAuditTrailSchema);
module.exports = InstanceAuditTrail;

