
var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var BaseAuditTrail = require('./base-audit-trail');
var AuditTrail = require('./audit-trail');

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
            unique: true,
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

var InstanceAuditTrail = AuditTrail.discriminator('instanceAuditTrail', InstanceAuditTrailSchema);
module.exports = InstanceAuditTrail;

