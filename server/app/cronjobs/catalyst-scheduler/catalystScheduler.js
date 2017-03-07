var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var botsDao = require('_pr/model/bots/1.0/bots.js');
var schedulerService = require('_pr/services/schedulerService');
var async = require('async');
var cronTab = require('node-crontab');
var catalystSync = module.exports = {};

catalystSync.executeScheduledInstances = function executeScheduledInstances() {
    logger.debug("Instance Scheduler is started. ");
    instancesDao.getScheduledInstances(function(err, instances) {
        if (err) {
            logger.error("Failed to fetch Instance: ", err);
            return;
        }
        if (instances && instances.length) {
            logger.debug("Schedule Instance length>>"+instances.length);
            var resultList =[];
            for (var i = 0; i < instances.length; i++) {
                (function(instance) {
                    if(instance.cronJobIds && instance.cronJobIds.length > 0){
                        var cronJobCheck = cancelOldCronJobs(instance.cronJobIds)
                        if(cronJobCheck){
                            resultList.push(function(callback){schedulerService.executeSchedulerForInstances(instance,callback);});
                        }
                    }else {
                        resultList.push(function (callback) {
                            schedulerService.executeSchedulerForInstances(instance, callback);
                        });
                    }
                    if(resultList.length === instances.length){
                        logger.debug("Schedule Instance length for Scheduler Start>>"+resultList.length);
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

catalystSync.executeParallelScheduledTasks = function executeParallelScheduledTasks() {
    taskDao.getScheduledTasks('PARALLEL',function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch tasks: ", err);
            return;
        }
        if (tasks && tasks.length) {
            var parallelTaskList=[];
            for (var i = 0; i < tasks.length; i++) {
                (function(task) {
                    if(task.cronJobId && task.cronJobId !== null){
                        cronTab.cancelJob(task.cronJobId);
                    }
                    parallelTaskList.push(function(callback){schedulerService.executeParallelScheduledTasks(task,callback);});
                    if(parallelTaskList.length === tasks.length){
                        if(parallelTaskList.length > 0) {
                            async.parallel(parallelTaskList, function (err, results) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }
                                logger.debug("Task Scheduler Completed for Parallel");
                                return;
                            })
                        }else{
                            logger.debug("There is no Parallel scheduled Task right now.");
                            return;
                        }
                    }
                })(tasks[i]);
            }
        }else{
            logger.debug("There is no Parallel scheduled Task right now.");
            return;
        }
    });
}


catalystSync.executeSerialScheduledTasks = function executeSerialScheduledTasks() {
    taskDao.getScheduledTasks('SERIAL',function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch tasks: ", err);
            return;
        }
        if (tasks && tasks.length) {
            var serialTaskList=[];
            for (var i = 0; i < tasks.length; i++) {
                (function(task) {
                    if(task.cronJobId && task.cronJobId !== null){
                        cronTab.cancelJob(task.cronJobId);
                    }
                    if(serialTaskList.length ===0) {
                        serialTaskList.push(function (next) {schedulerService.executeSerialScheduledTasks(task, next);
                        });
                    }else{
                        serialTaskList.push(function (cronJobId,next) {
                            cronTab.cancelJob(cronJobId);
                            schedulerService.executeSerialScheduledTasks(task, next);
                        });
                    }
                    if(serialTaskList.length === tasks.length){
                        if(serialTaskList.length > 0) {
                            async.waterfall(serialTaskList, function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }
                                cronTab.cancelJob(data);
                                logger.debug("Serial Task Scheduler Completed");
                                var catalystScheduler = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
                                catalystScheduler.executeSerialScheduledTasks();
                                return;
                            })
                        }else{
                            logger.debug("There is no Serial scheduled Task right now.");
                            return;
                        }
                    }
                })(tasks[i]);
            }
        }else{
            logger.debug("There is no Serial scheduled Task right now.");
            return;
        }
    });
}

catalystSync.executeScheduledBots = function executeScheduledBots() {
    botsDao.getScheduledBots(function(err, bots) {
        if (err) {
            logger.error("Failed to fetch bots: ", err);
            return;
        }
        if (bots && bots.length) {
            var botsList=[];
            for (var i = 0; i < bots.length; i++) {
                (function(bot) {
                    if(bot.cronJobId && bot.cronJobId !== null){
                        cronTab.cancelJob(bot.cronJobId);
                    }
                    botsList.push(function(callback){schedulerService.executeScheduledBots(bot,callback);});
                    if(botsList.length === bots.length){
                        if(botsList.length > 0) {
                            async.parallel(botsList, function (err, results) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }
                                logger.debug("Bots Scheduler Completed");
                                return;
                            })
                        }else{
                            logger.debug("There is no scheduled Bots right now.");
                            return;
                        }
                    }
                })(bots[i]);
            }
        }else{
            logger.debug("There is no scheduled Bots right now.");
            return;
        }
    });
}

function cancelOldCronJobs(ids){
    if(ids.length > 0){
        var count = 0;
        for(var i = 0; i < ids.length; i++){
            (function(id){
                count++;
                cronTab.cancelJob(id);
            })(ids[i]);
        }
        if(count === ids.length){
            return true;
        }
    }else{
        return true;
    }
}