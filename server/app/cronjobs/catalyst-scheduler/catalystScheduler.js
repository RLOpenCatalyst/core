var logger = require('_pr/logger')(module);
var instancesDao = require('_pr/model/classes/instance/instance');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var botsDao = require('_pr/model/bots/1.0/bots.js');
var newBotsDao = require('_pr/model/bots/1.1/botsDao.js');
var schedulerService = require('_pr/services/schedulerService');
var async = require('async');
var cronTab = require('node-crontab');
var request = require('request');
var auditQueue = require('_pr/config/global-data.js');
var botService = require('_pr/services/botsService');
var auditTrailService = require('_pr/services/auditTrailService.js');
var noticeService = require('_pr/services/noticeService.js');
var logsDao = require('_pr/model/dao/logsdao.js');
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


catalystSync.executeNewScheduledBots = function executeNewScheduledBots() {
    newBotsDao.getScheduledBots(function(err, bots) {
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
                    botsList.push(function(callback){schedulerService.executeNewScheduledBots(bot,callback);});
                    if(botsList.length === bots.length){
                        if(botsList.length > 0) {
                            async.parallel(botsList, function (err, results) {
                                if (err) {
                                    logger.error(err);
                                    return;
                                }
                                logger.debug("New Bots Scheduler Completed");
                                return;
                            })
                        }else{
                            logger.debug("There is no scheduled New Bots right now.");
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

catalystSync.getLogdata = function getLogdata(){
    logger.debug("log Data updating.....")
    setInterval( function () {
        var logQueue = auditQueue.getAudit();
        if(logQueue.length > 0){
            var url = logQueue[0].serverUrl;
            async.waterfall([
                function(next){
                    var auditList = [];
                    for(var i=0;i<logQueue.length;i++){
                        auditList.push(logQueue[i].remoteAuditId);
                        if(auditList.count === logQueue.count)
                            next(null,auditList);
                    }
                },
                function(auditList,next) {
                    if(auditList.length){
                        var options = {
                        url: url+"/bot/audit",
                        headers: {
                            'Content-Type': 'application/json',
                            'charset':'utf-8'
                        },
                        json:true,
                        body:auditList
                    };
                    request.post(options, function (err, res, body) {
                        if(err)
                            next(err,null)
                        else {
                            if(res.statusCode === 200){
                                for(var index=0;index<body.length;index++) {
                                    auditData = auditQueue.getAuditDetails(body[index].bot_run_id);
                                    if (body[index].state === 'terminated') {
                                        var timestampEnded = new Date(body[index].finished_at).getTime();
                                        var msg= body[index].status.text
                                        logsDao.insertLog({
                                            referenceId: auditData.logRefId,
                                            err: false,
                                            log: msg,
                                            timestamp: timestampEnded
                                        });
                                        logsDao.insertLog({
                                            referenceId: auditData.logRefId,
                                            err: false,
                                            log: auditData.botId+' BOTs execution success on Local ',
                                            timestamp: timestampEnded
                                        });
                                        if(body[index].log !== '...'||body[index].log !== '') {
                                            logsDao.insertLog({
                                                referenceId: auditData.logRefId,
                                                err: false,
                                                log: body[index].log.replace(/\n/g,"\\n"),
                                                timestamp: timestampEnded
                                            });
                                        }
                                        var resultTaskExecution = {
                                            "actionStatus": 'success',
                                            "status": 'success',
                                            "endedOn": timestampEnded,
                                            "actionLogId": auditData.auditId
                                        };
                                        auditQueue.popAudit(auditData.botId);
                                        auditTrailService.updateAuditTrail('BOTsNew', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                                            if (err) {
                                                logger.error("Failed to create or update bots Log: ", err);
                                            }
                                            logger.debug(auditData.botId+" BOTs Execution Done on Local");
                                            botService.updateSavedTimePerBots(auditData.bot_id, 'BOTsNew', function (err, data) {
                                                if (err) {
                                                    logger.error("Failed to update bots saved Time: ", err);
                                                }
                                                noticeService.notice(auditData.userName, {
                                                    title: "BOTs Execution",
                                                    body: msg
                                                }, "success", function (err, data) {
                                                    if (err) {
                                                        logger.error("Error in Notification Service, ", err);
                                                    }
                                                    next(null)
                                                });
                                            });
                                            
                                        });
                                    } 
                                    else if(body[index].state === 'active'){
                                        continue;
                                    }
                                    else {
                                        var timestampEnded = new Date(body[index].finished_at).getTime();;
                                        logsDao.insertLog({
                                            referenceId: auditData.logRefId,
                                            err: true,
                                            log: auditData.botId+' BOTs execution unsuccess on Local ',
                                            timestamp: timestampEnded
                                        });
                                        if(body[index].log !== '...'||body[index].log !== '') {
                                            logsDao.insertLog({
                                                referenceId: auditData.logRefId,
                                                err: true,
                                                log: body[index].log.replace(/\n/g,"\\n"),
                                                timestamp: timestampEnded
                                            });
                                        }
                                        var resultTaskExecution = {
                                            "actionStatus": 'failed',
                                            "status": 'failed',
                                            "endedOn": timestampEnded,
                                            "actionLogId": auditData.auditId
                                        };
                                        auditQueue.popAudit(auditData.botId);
                                        auditTrailService.updateAuditTrail('BOTsNew', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                                            if (err) {
                                                logger.error("Failed to create or update bots Log: ", err);
                                            }
                                            logger.debug(auditData.botId+" BOTs Execution Done on Local");
                                            botService.updateSavedTimePerBots(auditData.bot_id, 'BOTsNew', function (err, data) {
                                                if (err) {
                                                    logger.error("Failed to update bots saved Time: ", err);
                                                }
                                                noticeService.notice(auditData.userName, {
                                                    title: "BOTs Execution",
                                                    body: auditData.botId+" Failed"
                                                }, "error", function (err, data) {
                                                    if (err) {
                                                        logger.error("Error in Notification Service, ", err);
                                                    }
                                                    next(null)
                                                });
                                            });
                                        });
                                    }
                                }
                            }
                            else {
                                logger.debug('Bot server is not responding')
                                next('Error in server',null);
                            }
                        }
                    });
                    }
                    else
                        next(null,'nothing')
                }
            ],function(err,result){
                if(err)
                    logger.debug('Unable to update audit queue')
            })
        }
    },5000)
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