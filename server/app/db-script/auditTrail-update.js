

var logger = require('_pr/logger')(module);
var mongodbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var botOld = require('_pr/model/bots/1.0/botOld.js');
var botOldService = require('_pr/services/botOldService.js');

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


botOld.getAllBots({isDeleted:false}, function(err, bots) {
    if (err) {
        logger.error("Failed to fetch Bots: ", err);
        process.exit();
    }
    if (bots && bots.length) {
        var count = 0;
        for (var i = 0; i < bots.length; i++) {
            (function(bot) {
                botOldService.updateSavedTimePerBots(bot.botId,'BOTOLD',function(err,data){
                    if(err){
                        logger.error("Error in updating BOTs Saved Time. ",err);
                    }
                    count++;
                    if(count === botOld.length){
                        logger.debug("All BOTs updated.");
                        process.exit();
                    }
                })
            })(bots[i]);
        }
    } else {
        logger.debug("No BOTs to update.");
        process.exit();
    }
});
