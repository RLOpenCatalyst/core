
var logger = require('_pr/logger')(module);
var CatalystCronJob = require('_pr/cronjobs/CatalystCronJob');
var async = require('async');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var taskHistory = require('_pr/model/classes/tasks/taskHistory.js');
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
        botNewSync  : function(callback){
            var query={
                auditType:'BOTsNew',
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




