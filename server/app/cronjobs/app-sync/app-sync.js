var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var async = require('async');
var instancesDao = require('_pr/model/classes/instance/instance');
var Client = require('node-rest-client').Client;
var parser = require('xml2json');
require('events').EventEmitter.defaultMaxListeners = Infinity;

var AppSync = Object.create(CatalystCronJob);
AppSync.interval = '*/1 * * * *';
AppSync.execute = appSync;

module.exports = AppSync;

function appSync() {
    instancesDao.listInstances(function(err, instances) {
        if (err) {
            logger.error("Failed to fetch instances: ", err);
            return;
        }
        if (instances && instances.length) {
            for (var i = 0; i < instances.length; i++) {
                (function(i) {
                    if (instances[i] && instances[i].instanceState === "running" && instances[i].appInfo && instances[i].appInfo.length) {
                        for (var j = 0; j < instances[i].appInfo.length; j++) {
                            (function(j) {
                                var appInfo = instances[i].appInfo[j];
                                if (appInfo && appInfo.appURL) {
                                    logger.debug("appInfo.appURL: ", appInfo.appURL);


                                    var client = new Client();

                                    // direct way 
                                    var reqSubmit = client.get(appInfo.appURL, function(data, response) {
                                        var appInfoObj = {
                                            name: appInfo.name,
                                            version: appInfo.version,
                                            status: "Running",
                                            appURL: appInfo.appURL
                                        };
                                        instancesDao.updateAppInfo(instances[i].instanceIP, appInfoObj, function(err, data1) {
                                            if (err) {
                                                logger.debug("Error: ", err);
                                            }
                                            logger.debug("data: ", JSON.stringify(data1));
                                        });
                                    });


                                    /*client = new Client();
                                    client.registerMethod("jsonMethod", appInfo.appURL, "GET");
                                    var reqSubmit = client.methods.jsonMethod(function(data, response) {
                                        var appInfoObj = {
                                            name: appInfo.name,
                                            version: appInfo.version,
                                            status: "success",
                                            appURL: appInfo.appURL
                                        };
                                        instancesDao.updateAppInfo(instances[i].instanceIP, appInfoObj, function(err, data1) {
                                            if (err) {
                                                logger.debug("Error: ", err);
                                            }
                                            logger.debug("data: ", JSON.stringify(data1));
                                        });
                                    });*/

                                    // Handling Exception for get req.
                                    reqSubmit.on('error', function(err) {
                                        logger.debug('Something went wrong on req!!', err.request.options);

                                        var appInfoObj = {
                                            name: appInfo.name,
                                            version: appInfo.version,
                                            status: "Not Running",
                                            appURL: appInfo.appURL
                                        };
                                        instancesDao.updateAppInfo(instances[i].instanceIP, appInfoObj, function(err, data1) {
                                            if (err) {
                                                logger.debug("Error: ", err);
                                            }
                                            logger.debug("data: ", JSON.stringify(data1));
                                        });
                                    });
                                }
                            })(j);
                        }
                    }
                })(i);
            }
        }
    });
}
