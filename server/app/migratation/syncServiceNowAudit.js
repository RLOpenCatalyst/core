"use strict";
const async = require('async');
var logger = require('_pr/logger')(module);
var mongodbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var auditTrailService = require('_pr/services/auditTrailService.js');

auditTrail.getAuditTrails({ 'auditTrailConfig.serviceNowTicketRefObj.ticketNo': { $exists: true } }, (error, data) => {
    if (error) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        async.each(data, (element, callback) => {
            logger.info('Processing record with audit id:' + element._id);
            auditTrailService.syncCatalystWithServiceNow(element._id, callback);
        }, (err) => {
            if (err)
                logger.error(err.message || err);
            logger.info('Audit-Trail synced with ServiceNow data');
            process.exit();
        })
    }
})
