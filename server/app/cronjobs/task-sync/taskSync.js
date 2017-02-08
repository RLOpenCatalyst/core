
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var async = require('async');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var taskHistory = require('_pr/model/classes/tasks/taskHistory.js');
var botsDao = require('_pr/model/bots/1.0/bots.js');
var TaskSync = Object.create(CatalystCronJob);
TaskSync.interval = '*/2 * * * *';
TaskSync.execute = taskSync;

module.exports = TaskSync;

function taskSync(){
    logger.debug("Task Sync is started");
    async.parallel({
        botSync  : function(callback){
            var query={
                auditType:'BOTs',
                actionStatus:'running',
                isDeleted:false
            };
            executeTaskSyncForBotHistory(query,callback);
        },
        taskSync : function(callback){
            var query={
                status:'running'
            };
            executeTaskSyncForTaskHistory(query,callback);
        },
        savedTimeSync : function(callback){
            addSavedTimePerBots(callback);
        }

    },function(err,results){
        if(err){
            logger.error("There are some error in Task Sync.",err);
            return;
        }else{
            logger.debug("Task Sync is successfully ended");
            return;
        }

    })
}

function executeTaskSyncForBotHistory(query,callback){
    async.waterfall([
        function(next){
            auditTrail.getAuditTrails(query,next);
        },
        function(runningAuditTrailList,next){
            if(runningAuditTrailList.length > 0){
                var count = 0;
                for(var i = 0; i < runningAuditTrailList.length; i++){
                    (function(runningBot){
                        var currentDate = new Date();
                        var startBotTime = new Date(runningBot.startedOn);
                        if(getMinutesDiff(startBotTime,currentDate) > 20){
                            count++;
                            var queryObj = {
                                actionStatus:'failed',
                                status:'failed',
                                endedOn : new Date().getTime()
                            }
                            auditTrail.updateAuditTrails(runningBot._id,queryObj,function(err,updatedData){
                                if(err){
                                    logger.error(err);
                                }else if(count === runningAuditTrailList.length){
                                        next(null,runningAuditTrailList);
                                }else{
                                    logger.debug("BOTs Sync is going on");
                                }
                            })
                            
                        }else{
                            count++;
                            if(count === runningAuditTrailList.length) {
                                next(null, runningAuditTrailList);
                            }
                        }
                    })(runningAuditTrailList[i]);
                }

            }else{
                logger.info("There is no BOTs in running state currently.")
                next(null,runningAuditTrailList);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
}

function executeTaskSyncForTaskHistory(query,callback){
    async.waterfall([
        function(next){
            taskHistory.getTaskHistory(query,next);
        },
        function(runningTaskHistoryList,next){
            if(runningTaskHistoryList.length > 0){
                var count = 0;
                for(var i = 0; i < runningTaskHistoryList.length; i++){
                    (function(runningTask){
                        var currentDate = new Date();
                        var startBotTime = new Date(runningTask.timestampStarted);
                        if(getMinutesDiff(startBotTime,currentDate) > 20){
                            count++;
                            var queryObj = {
                                status:'failed',
                                timestampEnded : new Date().getTime()
                            }
                            taskHistory.updateRunningTaskHistory(runningTask._id,queryObj,function(err,updatedData){
                                if(err){
                                    logger.error(err);
                                }else if(count === runningTaskHistoryList.length){
                                    next(null,runningTaskHistoryList);
                                }else{
                                    logger.debug("Task Sync is going on");
                                }
                            })

                        }else{
                            count++;
                            if(count === runningTaskHistoryList.length) {
                                next(null, runningTaskHistoryList);
                            }
                        }
                    })(runningTaskHistoryList[i]);
                }

            }else{
                logger.info("There is no Task in running state currently.")
                next(null,runningTaskHistoryList);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
}

function getMinutesDiff(date1,date2){
    var diff =(date2.getTime() - date1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(Math.round(diff));
}

function getExecutionTime(endTime, startTime) {
    var executionTimeInMS = endTime - startTime;
    var totalSeconds = Math.floor(executionTimeInMS / 1000);
    return totalSeconds;
}

function addSavedTimePerBots(callback) {
    var query = {
        isDeleted:false
    }
    botsDao.getAllBots(query,function(err,botList){
        if(err){
            callback(err,null);
            return;
        }else if(botList.length > 0){
            var count = 0;
            for(var i = 0; i<botList.length;i++){
                (function(bots){
                    var query = {
                        auditType: 'BOTs',
                        actionStatus: 'success',
                        isDeleted: false,
                        auditId: bots.botId
                    };
                    auditTrail.getAuditTrails(query, function (err, botAuditTrail) {
                        if (err) {
                            logger.error("Error in Fetching Audit Trail.", err);
                            callback(err, null);
                        }
                        if (botAuditTrail.length > 0) {
                            var totalTimeInSeconds = 0;
                            for (var m = 0; m < botAuditTrail.length; m++) {
                                if (botAuditTrail[m].endedOn && botAuditTrail[m].endedOn !== null
                                    && botAuditTrail[m].auditTrailConfig.manualExecutionTime && botAuditTrail[m].auditTrailConfig.manualExecutionTime !== null) {
                                    var executionTime = getExecutionTime(botAuditTrail[m].endedOn, botAuditTrail[m].startedOn);
                                    totalTimeInSeconds = totalTimeInSeconds + ((botAuditTrail[m].auditTrailConfig.manualExecutionTime * 60) - executionTime);
                                }
                            }
                            var totalTimeInMinutes = Math.round(totalTimeInSeconds/60);
                            var result = {
                                hours:Math.floor(totalTimeInMinutes / 60),
                                minutes:totalTimeInMinutes % 60
                            }
                            botsDao.updateBotsDetail(bots.botId,{savedTime:result},function(err,data){
                                if(err){
                                    logger.error(err);
                                }
                                count++;
                                if(count === botList.length){
                                    callback(null,botList);
                                    return;
                                }
                            })
                        } else {
                            count++;
                            if(count === botList.length){
                                callback(null,botList);
                                return;
                            }
                        }
                    });
                })(botList[i]);
            }
        }else{
            logger.debug("There is no BOTs for Saved Time Implementation.");
            callback(null,botList);
        }
    })
}


