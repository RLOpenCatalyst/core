var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var BaseAuditTrail = require('./base-audit-trail.js');
var AuditTrail = require('./audit-trail.js');

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
            unique: true,
            trim:true
        },
        Image:{
            type: String,
            trim:true
        },
        ImageId:{
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

ContainerAuditTrailSchema.statics.createNew = function(containerAuditTrail,callback){
    var ContainerAuditTrail = new ContainerAuditTrail(containerAuditTrail);
    ContainerAuditTrail.save(function(err, data) {
        if (err) {
            logger.error("createNew Failed", err, data);
            return;
        }
        callback(null,data);
    });
};

var ContainerAuditTrail = AuditTrail.discriminator('containerAuditTrail', ContainerAuditTrailSchema);
module.exports = ContainerAuditTrail;


