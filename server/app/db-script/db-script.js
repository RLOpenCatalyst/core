

var logger = require('_pr/logger')(module);
var mongodbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var botOldService = require('_pr/services/botOldService.js');
var async = require('async');
var logsDao = require('_pr/model/dao/logsdao.js');
var botDao = require('_pr/model/bots/1.1/bot.js');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');

var dbOptions = {
    host: process.env.DB_HOST || appConfig.db.host,
    port: appConfig.db.port,
    dbName: appConfig.db.dbName
};
mongodbConnect(dbOptions, function(err) {
    if (err) {
        logger.error("Unable to connect to mongo db >>" + err);
        process.exit();
    } else {
        logger.debug('connected to mongodb - host = %s, port = %s, database = %s', dbOptions.host, dbOptions.port, dbOptions.dbName);
    }
});

async.parallel({
    logsSync: function(callback){
        logsDao.getLogsDetails({},function(err,logs){
            if(err){
                logger.error("Failed to fetch Logs", err);
                callback(err,null);
            }else if(logs.length > 0){
                var count = 0;
                for(var i = 0 ; i < logs.length;i++){
                    (function(logDetail){
                        if(logDetail.referenceId && logDetail.referenceId.length === 3){
                            count++;
                            logsDao.insertLog({
                                instanceId:logDetail.referenceId[0],
                                instanceRefId:logDetail.referenceId[1],
                                botRefId:logDetail.referenceId[2],
                                log:logDetail.log,
                                err:logDetail.err,
                                timestamp:logDetail.timestamp
                            });
                            if(count === logs.length){
                                callback(null,logs.length);
                                return;
                            }
                        }else if(logDetail.referenceId && logDetail.referenceId.length === 2){
                            count++;
                            logsDao.insertLog({
                                instanceId:logDetail.referenceId[0],
                                instanceRefId:logDetail.referenceId[1],
                                botId:logDetail.referenceId[0],
                                botRefId:logDetail.referenceId[1],
                                log:logDetail.log,
                                err:logDetail.err,
                                timestamp:logDetail.timestamp
                            });
                            if(count === logs.length){
                                callback(null,logs.length);
                                return;
                            }
                        }else if(logDetail.referenceId && logDetail.referenceId.length === 1){
                            count++;
                            logsDao.insertLog({
                                instanceId:logDetail.referenceId[0],
                                log:logDetail.log,
                                err:logDetail.err,
                                timestamp:logDetail.timestamp
                            });
                            if(count === logs.length){
                                callback(null,logs.length);
                                return;
                            }
                        }else{
                            count++;
                            if(count === logs.length){
                                callback(null,logs.length);
                                return;
                            }
                        }
                    })(logs[i]);
                }

            }else{
                logger.debug("There is no Logs in DB.");
                callback(null,logs);
            }
        })
    },
    botSync: function(callback){
        botDao.getAllBots({},function(err,bots){
            if(err){
                logger.error("Failed to fetch BOTs", err);
                callback(err,null);
            }else if(bots.length > 0){
                var count = 0;
                for(var i = 0 ; i < bots.length;i++){
                    (function(bot){
                        auditTrail.getAuditTrails({auditId:bot._id}, function (err, auditTrails) {
                            if (err) {
                                logger.error(err);
                                count++;
                                if(count === bots.length){
                                    callback(null,bots.length);
                                    return;
                                }
                            } else if (auditTrails.length > 0) {
                                var auditCount = 0;
                                count++;
                                for(var j = 0 ; j < auditTrails.length;j++) {
                                    (function(audit) {
                        
                                        botOldService.updateSavedTimePerBots(bot._id, audit._id, 'BOT', function (err, botsData) {
                                            if (err) {
                                                logger.error("Error in updating saved time for BOT - " + err);
                                            }
                                            auditCount++;
                                            if(count === bots.length && auditCount === auditTrails.length){
                                                callback(null,bots.length);
                                                return;
                                            }
                                        });
                                    })(auditTrails[j]);
                                }
                            } else {
                                logger.debug("There is no AuditTrails in DB against BOT : "+bot.id);
                                count++;
                                if(count === bots.length){
                                    callback(null,bots.length);
                                    return;
                                }
                            }
                        });
                    })(bots[i]);
                }

            }else{
                logger.debug("There is no BOT in DB.");
                callback(null,bots);
            }
        })
    },
},function(err,results){
    if(err){
        logger.error("Failed to sync BOT and Logs ", err);
        process.exit();
    }else{
        logger.debug("BOT and Logs Sync are Done");
        process.exit();
    }
})

