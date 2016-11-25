var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var schedulerService = require('_pr/services/schedulerService');
var async = require('async');

var catalystSync = module.exports = {};

catalystSync.executeScheduledInstances = function executeScheduledInstances() {
    instancesDao.getScheduledInstances(function(err, instances) {
        if (err) {
            logger.error("Failed to fetch Instance: ", err);
            return;
        }
        if (instances && instances.length) {
            var resultList =[];
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    resultList.push(function(callback){schedulerService.executeSchedulerForInstances(instance,callback);});
                    if(resultList.length === instances.length){
                        async.parallel(resultList,function(err,results){
                            if(err){
                                logger.error(err);
                                return;
                            }
                            logger.debug("Instance Scheduler Completed");
                            return;
                        })
                    }
                })(instances[i]);
            }
        }else{
            logger.debug("There is no scheduled Instance right now.");
            return;
        }
    });
}

catalystSync.executeScheduledTasks = function executeScheduledTasks() {
    taskDao.getScheduledTasks(function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch tasks: ", err);
            return;
        }
        if (tasks && tasks.length) {
            var resultList =[];
            for (var i = 0; i < tasks.length; i++) {
                (function(task) {
                    resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                    if(resultList.length === tasks.length){
                        async.parallel(resultList,function(err,results){
                            if(err){
                                logger.error(err);
                                return;
                            }
                            logger.debug("Task Scheduler Completed");
                            return;
                        })
                    }
                })(tasks[i]);
            }
        }else{
            logger.debug("There is no scheduled Task right now.");
            return;
        }
    });
}