var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var instanceService = require('_pr/services/instanceService');

var instanceSync = module.exports = {};

instanceSync.executeScheduledInstances = function executeScheduledInstances() {
    instancesDao.getScheduledInstances(function(err, instances) {
        if (err) {
            logger.error("Failed to fetch Instance: ", err);
            return;
        }
        //logger.debug("instances:   ", JSON.stringify(instances));
        if (instances && instances.length) {
            for (var i = 0; i < instances.length; i++) {
                (function(i) {
                       instanceService.executeScheduleJob([instances[i]]);
                })(i);
            }
        }else{
            logger.debug("There is no scheduled Instance right now.");
        }
    });
}