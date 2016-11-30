var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var schedulerService = require('_pr/services/schedulerService');
var async = require('async');
var cronTab = require('node-crontab');
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
                    if(instance.cronJobIds && instance.cronJobIds !== null){
                        cronTab.cancelJobIds(instance.cronJobIds);
                    }
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

catalystSync.executeParallelScheduledTasks = function executeParallelScheduledTasks() {
    taskDao.getScheduledTasks(function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch tasks: ", err);
            return;
        }
        if (tasks && tasks.length) {
            var resultList =[],parallelTaskList=[];
            for (var i = 0; i < tasks.length; i++) {
                (function(task) {
                    if(task.cronJobId && task.cronJobId !== null){
                        cronTab.cancelJob(task.cronJobId);
                    }
                    if(task.executionOrder === 'PARALLEL'){
                        resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                        parallelTaskList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                    }else{
                        resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                    }
                    if(resultList.length === tasks.length){
                        async.parallel(parallelTaskList,function(err,results){
                            if(err){
                                logger.error(err);
                                return;
                            }
                            logger.debug("Task Scheduler Completed for Parallel");
                            return;
                        })
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
    taskDao.getScheduledTasks(function(err, tasks) {
        if (err) {
            logger.error("Failed to fetch tasks: ", err);
            return;
        }
        if (tasks && tasks.length) {
            var resultList =[],serialTaskList=[];
            for (var i = 0; i < tasks.length; i++) {
                (function(task) {
                    if(task.cronJobId && task.cronJobId !== null){
                        cronTab.cancelJob(task.cronJobId);
                    }
                    if(task.executionOrder === 'SERIAL'){
                        resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                        if(serialTaskList.length ===0) {
                            serialTaskList.push(function (next) {
                                schedulerService.executeSchedulerForTasks(task, next);
                            });
                        }else{
                            serialTaskList.push(function (cronJobId,next) {
                                cronTab.cancelJob(cronJobId);
                                schedulerService.executeSchedulerForTasks(task, next);
                            });
                        }
                        resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                    }else{
                        resultList.push(function(callback){schedulerService.executeSchedulerForTasks(task,callback);});
                    }
                    if(resultList.length === tasks.length){
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