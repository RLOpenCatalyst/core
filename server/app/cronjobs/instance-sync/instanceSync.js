var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var instanceService = require('_pr/services/instanceService');
var async = require('async');

var instanceSync = module.exports = {};

instanceSync.executeScheduledInstances = function executeScheduledInstances() {
    instancesDao.getScheduledInstances(function(err, instances) {
        if (err) {
            logger.error("Failed to fetch Instance: ", err);
            return;
        }
        if (instances && instances.length) {
            var resultList =[];
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    resultList.push(function(callback){ instanceService.executeScheduleJob(instance,callback);});
                    if(resultList.length === instances.length){
                        async.parallel(resultList,function(err,results){
                            if(err){
                                logger.error(err);
                                return;
                            }
                            logger.debug("Instance Scheduler Results>>"+results);
                            return;
                        })
                    }
                })(instances[i]);
            }
        }else{
            logger.debug("There is no scheduled Instance right now.");
        }
    });
}