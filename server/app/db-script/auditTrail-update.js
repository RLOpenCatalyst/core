

var logger = require('_pr/logger')(module);
var mongodbConnect = require('_pr/lib/mongodb');
var appConfig = require('_pr/config');
var bots = require('_pr/model/bots/1.0/bots.js');
var botService = require('_pr/services/botsService.js');

var dbOptions = {
    host: appConfig.db.host,
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


bots.getAllBots({isDeleted:false}, function(err, bots) {
    if (err) {
        logger.error("Failed to fetch Bots: ", err);
        process.exit();
    }
    if (bots && bots.length) {
        var count = 0;
        for (var i = 0; i < bots.length; i++) {
            (function(bot) {
                botService.updateSavedTimePerBots(bot.botId,function(err,data){
                    if(err){
                        logger.error("Error in updating BOTs Saved Time. ",err);
                    }
                    count++;
                    if(count === bots.length){
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
