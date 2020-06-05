/*
 Copyright [2016] [Relevance Lab]

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var logger = require('_pr/logger')(module);

const errorType = 'schedulerService';
var Client = require('node-rest-client').Client;
var client = new Client();
var request = require('request');
var auditQueue = require('_pr/config/global-data.js');
var noticeService = require('_pr/services/noticeService.js');


var schedulerService = module.exports = {};
var cronTab = require('node-crontab');
var instancesDao = require('_pr/model/classes/instance/instance');
var taskDao = require('_pr/model/classes/tasks/tasks.js');
var async = require('async');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var EC2 = require('_pr/lib/ec2.js');
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var appConfig = require('_pr/config');
var Cryptography = require('../lib/utils/cryptography');
var vmWareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var digitalOceanProvider = require('_pr/model/classes/masters/cloudprovider/digitalOceanProvider.js');
var digitalocean = require('_pr/lib/utils/digitalOceanUtil.js')
var vmWare = require('_pr/lib/vmware');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var azureCloud = require('_pr/lib/azure');
var fs = require('fs');
var providerService = require('_pr/services/providerService.js');
var taskService = require('_pr/services/taskService.js');
var botOldService = require('_pr/services/botOldService.js');
var botService = require('_pr/services/botService.js');
var gcpProviderModel = require('_pr/model/v2.0/providers/gcp-providers');
var GCP = require('_pr/lib/gcp.js');
var crontab = require('node-crontab');
var botOld = require('_pr/model/bots/1.0/botOld.js');
var botDao = require('_pr/model/bots/1.1/bot.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var auditTrailService = require('_pr/services/auditTrailService.js');
var botEngineTimeOut = appConfig.botEngineTimeOut || 180;
var botAuditTrail = require('_pr/model/audit-trail/bot-audit-trail.js');
var CMDBConfig = require('_pr/model/servicenow/servicenow.js');
var emailService = require('./emailService');
var apiUtil = require('_pr/lib/utils/apiUtil.js');


schedulerService.executeSchedulerForInstances = function executeSchedulerForInstances(instance,callback) {
    logger.debug("Instance Scheduler is started for Instance. "+instance.platformId);
    logger.debug("Instance current state is  "+instance.instanceState);
    var catUser = 'system';
    if(instance.catUser){
        catUser = instance.catUser;
    }
    async.parallel({
        instanceStart : function(callback){
            var resultList = [];
            for (var i = 0; i < instance.instanceStartScheduler.length; i++) {
                (function(interval){
                    resultList.push(function(callback){createCronJob(interval.cronPattern,instance._id,catUser,'Start',callback)});
                })(instance.instanceStartScheduler[i])
            }
            if(resultList.length === instance.instanceStartScheduler.length) {
                async.parallel(resultList, function (err, results) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    }
                    callback(null, results);
                    return;
                })
            }
        },
        instanceStop : function(callback){
            var resultList = [];
            for (var j = 0; j < instance.instanceStopScheduler.length; j++) {
                (function(interval){
                    resultList.push(function(callback){createCronJob(interval.cronPattern,instance._id,catUser,'Stop',callback)});
                })(instance.instanceStopScheduler[j]);
            }
            if(resultList.length === instance.instanceStopScheduler.length){
                async.parallel(resultList, function (err, results) {
                    if (err) {
                        logger.error(err);
                        callback(err, null);
                        return;
                    }
                    callback(null, results);
                    return;
                })
            }
        }
    },function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })
}

schedulerService.executeParallelScheduledTasks = function executeParallelScheduledTasks(task,callback) {
    logger.debug("Task Scheduler is started for Parallel Task. "+task.name);
    var currentDate = new Date().getTime();
    if(currentDate >= task.taskScheduler.cronEndOn){
        crontab.cancelJob(task.cronJobId);
        taskDao.updateTaskScheduler(task._id,function(err, updatedData) {
            if (err) {
                logger.error("Failed to update Task Scheduler: ", err);
                callback(err,null);
                return;
            }
            logger.debug("Scheduler is ended on for Task. "+task.name);
            callback(null,updatedData);
            return;
        });
    }else{
        var cronJobId = cronTab.scheduleJob(task.taskScheduler.cronPattern, function () {
            taskDao.updateCronJobIdByTaskId(task._id,cronJobId,function(err,data){
                if(err){
                    logger.error("Error in updating cron job Ids. "+err);
                }
            })
            taskService.executeTask(task._id, "system", "undefined", "undefined", "undefined","undefined","undefined",function(err, historyData) {
                if (err === 404) {
                    logger.error("Task not found.", err);
                    return;
                } else if (err) {
                    logger.error("Failed to execute task.", err);
                    return;
                }
                logger.debug("Task Execution Success: ", task.name);
                return;
            });
        });
    }
}

schedulerService.getExecutorAuditTrailDetails = function getExecutorAuditTrailDetails(auditList,url,callback) {
    var options = {
        url: url + "/bot/audit",
        headers: {
            'Content-Type': 'application/json',
            'charset': 'utf-8'
        },
        json: true,
        body: auditList
    };
    request.post(options, function (err, res, body) {
        if (err) {
            callback(err, null);
            return;
        } else if (res.statusCode === 200 && body.length > 0) {
            var count = 0;
            body.forEach(function(auditTrailDetail){
                var auditData = auditQueue.getAuditDetails("remoteAuditId",auditTrailDetail.bot_run_id);
                if((auditData !== null || auditData !== 'undefined' || typeof auditData !== 'undefined') && (auditTrailDetail.state === 'terminated' || auditTrailDetail.state === 'failed')) {
                    var timestampEnded = new Date().getTime();
                    count++;
                    if (auditTrailDetail.log !== '...' || auditTrailDetail.log !== '') {
                        var logList = auditTrailDetail.log.split("\n");
                        logList.forEach(function (log) {
                            if(log !== null && log !== '') {
                                logsDao.insertLog({
                                    referenceId: auditData.logRefId,
                                    err: auditTrailDetail.state === 'terminated' ? false : true,
                                    log: log,
                                    timestamp: timestampEnded
                                });
                            }
                        })
                    }
                    logsDao.insertLog({
                        referenceId: auditData.logRefId,
                        err: auditTrailDetail.state === 'terminated' ? false : true,
                        log: auditTrailDetail.status.text,
                        timestamp: timestampEnded
                    });
                    if (auditData.env === 'local') {
                        logsDao.insertLog({
                            referenceId: auditData.logRefId,
                            err: auditTrailDetail.state === 'terminated' ? false : true,
                            log: auditTrailDetail.state === 'terminated' ? auditData.botId + ' BOT execution is success on ' + auditData.env : auditData.botId + ' BOT execution is failed on ' + auditData.env,
                            timestamp: timestampEnded
                        });
                    } else {
                        logsDao.insertLog({
                            referenceId: auditData.logRefId,
                            err: auditTrailDetail.state === 'terminated' ? false : true,
                            log: auditTrailDetail.state === 'terminated' ? auditData.botId + ' BOT execution is success on Node ' + auditData.instanceIP : auditData.botId + ' BOT execution is failed on Node ' + auditData.instanceIP,
                            timestamp: timestampEnded
                        });
                    }
                    var resultTaskExecution = {
                        "actionStatus": auditTrailDetail.state === 'terminated' ? 'success' : 'failed',
                        "status": auditTrailDetail.state === 'terminated' ? 'success' : 'failed',
                        "endedOn": timestampEnded,
                        "actionLogId": auditData.auditId
                    };
                    if (auditData.env === 'local') {
                        auditQueue.popAudit('auditId', auditData.auditId);
                        auditTrailService.updateAuditTrail('BOT', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                            if (err) {
                                logger.error("Failed to create or update bots Log: ", err);
                            }
                            botOldService.updateSavedTimePerBots(auditData.bot_id, 'BOT', function (err, data) {
                                if (err) {
                                    logger.error("Failed to update bots saved Time: ", err);
                                }
                                emailService.sendEmail('BOT Execution failed on local');
                                noticeService.notice(auditData.userName, {
                                    title: "BOT Execution",
                                    body: auditTrailDetail.state === 'terminated' ? auditTrailDetail.status.text : "BOT Execution is failed on local"
                                }, auditTrailDetail.state === 'terminated' ? 'success' : 'error', function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                            });
                        });
                    } else {
                        auditQueue.popAudit('remoteAuditId', auditData.remoteAuditId);
                        var auditId = auditQueue.getAuditDetails('auditId', auditData.auditId);
                        if (auditId === null || auditId === 'undefined' || typeof auditId === 'undefined') {
                            logsDao.insertLog({
                                referenceId: auditData.logRefId,
                                err: auditTrailDetail.state === 'terminated' ? false : true,
                                log: auditTrailDetail.state === 'terminated' ? auditData.botId + 'BOT Execution is success on Remote' : 'BOT Execution is failed on Remote',
                                timestamp: timestampEnded
                            });
                            auditTrailService.updateAuditTrail('BOT', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                                if (err) {
                                    logger.error("Failed to create or update bots Log: ", err);
                                }
                                botOldService.updateSavedTimePerBots(auditData.bot_id, 'BOT', function (err, data) {
                                    if (err) {
                                        logger.error("Failed to update bots saved Time: ", err);
                                    }
                                    if (!auditTrailDetail.state === 'terminated')
                                        emailService.sendEmail("BOT Execution failed on Remote");
                                    noticeService.notice(auditData.userName, {
                                        title: "BOT Execution",
                                        body: auditTrailDetail.state === 'terminated' ? "BOT Execution is success on Remote" : "BOT Execution is failed on Remote"
                                    }, auditTrailDetail.state === 'terminated' ? 'success' : 'error', function (err, data) {
                                        if (err) {
                                            logger.error("Error in Notification Service, ", err);
                                        }
                                    });
                                });

                            });
                        }
                        instancesDao.updateActionLog(auditData.logRefId[0], auditData.logRefId[1], false, timestampEnded);
                        auditData.instanceLog.endedOn = timestampEnded;
                        auditData.instanceLog.actionStatus = auditTrailDetail.state === 'terminated' ? 'success' : 'failed';
                        auditData.instanceLog.logs = {
                            err: auditTrailDetail.state === 'terminated' ? false : true,
                            log: auditTrailDetail.state === 'terminated' ? auditData.botId + ' BOT execution is success on Node ' + auditData.instanceIP : auditData.botId + ' BOT execution is failed on Node ' + auditData.instanceIP,
                            timestamp: new Date().getTime()
                        };
                        instanceLogModel.createOrUpdate(auditData.logRefId[1], auditData.logRefId[0], auditData.instanceLog, function (err, logData) {
                            if (err) {
                                logger.error("Failed to create or update instanceLog: ", err);
                            }
                            if(!auditTrailDetail.state === 'terminated')
                                emailService.sendEmail( "BOT Execution failed on Node " + auditData.instanceIP);
                            noticeService.notice(auditData.userName, {
                                title: "BOT Execution",
                                body: auditTrailDetail.state === 'terminated' ? auditTrailDetail.status.text : "BOT Execution is failed on Node " + auditData.instanceIP
                            }, auditTrailDetail.state === 'terminated' ? 'success' : 'error', function (err, data) {
                                if (err) {
                                    logger.error("Error in Notification Service, ", err);
                                }
                            });
                        });
                    }
                    if(count ===body.length){
                        callback(null,null);
                    }
                }
                else if((auditData !== null || auditData !== 'undefined' || typeof auditData !== 'undefined') && (auditTrailDetail.state === 'active' )) {
                    var timestampEnded = new Date().getTime();
                    count++;
                    console.log(auditData.retryCount);
                    if (auditData.retryCount === botEngineTimeOut) {
                        logsDao.insertLog({
                            referenceId: auditData.logRefId,
                            err: auditTrailDetail.state === 'terminated' ? false : true,
                            log: "BOT Execution is failed on local(Time-out)",
                            timestamp: timestampEnded
                        });
                        var resultTaskExecution = {
                            "actionStatus": 'failed',
                            "status": 'failed',
                            "endedOn": timestampEnded,
                            "actionLogId": auditData.auditId
                        };
                        if (auditData.env === 'local') {
                            auditQueue.popAudit('auditId', auditData.auditId);
                            auditTrailService.updateAuditTrail('BOT', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                                if (err) {
                                    logger.error("Failed to create or update bots Log: ", err);
                                }
                                botOldService.updateSavedTimePerBots(auditData.bot_id, 'BOT', function (err, data) {
                                    if (err) {
                                        logger.error("Failed to update bots saved Time: ", err);
                                    }
                                    updateServiceNow(auditData.bot_id, auditData.auditId, function (err, successData) {
                                        if (err) logger.error("Error in Service Now update");
                                        else logger.info("Service Now ticket updated successfully");
                                        emailService.sendEmail('BOT Execution failed on local(Time-out)');
                                        noticeService.notice(auditData.userName, {
                                            title: "BOT Execution",
                                            body: "BOT Execution is failed on local(Time-out)"
                                        }, 'error', function (err, data) {
                                            if (err) {
                                                logger.error("Error in Notification Service, ", err);
                                            }
                                        });
                                    });
                                });
                            });
                        } else {
                            auditQueue.popAudit('remoteAuditId', auditData.remoteAuditId);
                            var auditId = auditQueue.getAuditDetails('auditId', auditData.auditId);
                            if (auditId === null || auditId === 'undefined' || typeof auditId === 'undefined') {
                                logsDao.insertLog({
                                    referenceId: auditData.logRefId,
                                    err: true,
                                    log: 'BOT Execution is failed on Remote(Time-out)',
                                    timestamp: timestampEnded
                                });
                                auditTrailService.updateAuditTrail('BOT', auditData.auditTrailId, resultTaskExecution, function (err, data) {
                                    if (err) {
                                        logger.error("Failed to create or update bots Log: ", err);
                                    }
                                    botOldService.updateSavedTimePerBots(auditData.bot_id, 'BOT', function (err, data) {
                                        if (err) {
                                            logger.error("Failed to update bots saved Time: ", err);
                                        }
                                        emailService.sendEmail('BOT Execution failed on Remote(Time-out)');
                                        noticeService.notice(auditData.userName, {
                                            title: 'BOT Execution',
                                            body: 'BOT Execution is failed on Remote(Time-out)'
                                        }, 'error', function (err, data) {
                                            if (err) {
                                                logger.error("Error in Notification Service, ", err);
                                            }
                                        });
                                    });

                                });
                            }
                            instancesDao.updateActionLog(auditData.logRefId[0], auditData.logRefId[1], false, timestampEnded);
                            auditData.instanceLog.endedOn = timestampEnded;
                            auditData.instanceLog.actionStatus = 'failed';
                            auditData.instanceLog.logs = {
                                err: true,
                                log: 'BOT Execution is failed on Remote(Time-out)',
                                timestamp: new Date().getTime()
                            };
                            instanceLogModel.createOrUpdate(auditData.logRefId[1], auditData.logRefId[0], auditData.instanceLog, function (err, logData) {
                                if (err) {
                                    logger.error("Failed to create or update instanceLog: ", err);
                                }
                                emailService.sendEmail('BOT Execution is failed on Remote(Time-out)');
                                noticeService.notice(auditData.userName, {
                                    title: "BOT Execution",
                                    body: 'BOT Execution is failed on Remote(Time-out)'
                                }, 'error', function (err, data) {
                                    if (err) {
                                        logger.error("Error in Notification Service, ", err);
                                    }
                                });
                            });
                        }
                    }else{
                        auditQueue.incRetryCount('auditId', auditData.auditId);
                    }
                    if(count ===body.length){
                        callback(null,null);
                    }
                } else{
                    count++;
                    if(count ===body.length){
                        callback(null,null);
                    }
                }
            });
        } else {
            logger.debug('Bot Server is not responding');
            emailService.sendEmail('Bot Server is not responding :' + options.url + ' - ' + res.statusCode);
            callback('Error in Bot Engine Server', null);
            return;
        }
    });
}



schedulerService.executeNewScheduledBots = function executeNewScheduledBots(bots,callback) {
    var currentDate = new Date().getTime();
    if(bots.isScheduled === false && bots.cronJobId){        
        crontab.cancelJob(bots.cronJobId);        
         logger.debug("Bots Scheduler has ended for - "+bots.name);
        callback(null,null);    
    }else if(currentDate >= bots.scheduler.cronEndOn && bots.isScheduled === true){
        crontab.cancelJob(bots.cronJobId);
        botDao.updateBotsScheduler(bots._id,function(err, updatedData) {
            if (err) {
                logger.error("Failed to update Bots Scheduler: ", err);
                callback(err,null);
                return;
            }
            logger.debug("Scheduler has ended on for New Bots. "+bots.name);
            callback(null,updatedData);
            return;
        });
    }else{
        logger.debug("New Bots Scheduler has started for - "+bots.name);
        logger.info('bots.scheduler.cronPattern',JSON.stringify(bots.scheduler.cronPattern));
        var cronJobId = cronTab.scheduleJob(bots.scheduler.cronPattern, function () {
            botDao.updateCronJobIdByBotId(bots._id,cronJobId,function(err,data){
                if(err){
                    logger.error("Error in updating cron job Ids. "+err);
                }
            });
            //Pre-condition check before execution. Alternative logic
            var skip = false;
            if(bots.scheduler.cronFrequency === "Weekly" && bots.scheduler.cronAlternateExecute){
                var tod = new Date();
                //check for repeat every for odd and even weeks
                if(bots.scheduler.cronRepeatEvery == 1){
                    if(apiUtil.getWeekNumber(tod) % 2 == 0) //runs for odd
                        skip = true;
                }else{
                    if(apiUtil.getWeekNumber(tod) % 2 != 0) //runs for even
                        skip = true;
                }

            }
            if(!skip){
                var reqBody = {};
                reqBody.category = bots.type;
                reqBody.data = bots.params.data;
                botService.executeBots(bots.id, reqBody, 'system', 'bots-console', true, function (err, historyData) {
                    if (err) {
                        logger.error("Failed to execute New Bots.", err);
                        return;
                    }
                    else {
                        logger.debug("New Bots Execution Success for - ", bots.name);
                        return;
                    }
                });
            }
            else{
                logger.info("Skipped ")
            }
        });
        logger.info('cronJobId',cronJobId);
    }
}

schedulerService.executeScheduledBots = function executeScheduledBots(bots,callback) {
    logger.debug("Bots Scheduler is started for - "+bots.botName);
    var currentDate = new Date().getTime();
    if(currentDate >= bots.botScheduler.cronEndOn){
        crontab.cancelJob(bots.cronJobId);
        botOld.updateBotsScheduler(bots._id,function(err, updatedData) {
            if (err) {
                logger.error("Failed to update Bots Scheduler: ", err);
                callback(err,null);
                return;
            }
            logger.debug("Scheduler is ended on for Bots. "+bots.botName);
            callback(null,updatedData);
            return;
        });
    }else{
        var cronJobId = cronTab.scheduleJob(bots.botScheduler.cronPattern, function () {
            logger.info(JSON.stringify(bots));
            botOld.updateCronJobIdByBotId(bots._id,cronJobId,function(err,data){
                if(err){
                    logger.error("Error in updating cron job Ids. "+err);
                }
            })
            if(bots.botLinkedCategory === 'Blueprint') {
                botOldService.executeBots(bots.botId, bots.runTimeParams, function (err, historyData) {
                    if (err) {
                        logger.error("Failed to execute Bots.", err);
                        return;
                    }
                    logger.debug("Bots Execution Success for - ", bots.botName);
                    return;
                });
            }else{
                botOldService.executeBots(bots.botId,null,function (err, historyData) {
                    if (err) {
                        logger.error("Failed to execute Bots.", err);
                        return;
                    }
                    logger.debug("Bots Execution Success for - ", bots.botName);
                    return;
                });
            }
        });
    }
}

schedulerService.executeSerialScheduledTasks = function executeSerialScheduledTasks(task,callback) {
    logger.debug("Task Scheduler is started for Serial Task. "+task.name);
    var currentDate = new Date().getTime();
    if(currentDate >= task.taskScheduler.cronEndOn){
        crontab.cancelJob(task.cronJobId);
        taskDao.updateTaskScheduler(task._id,function(err, updatedData) {
            if (err) {
                logger.error("Failed to update Task Scheduler: ", err);
                callback(err,null);
                return;
            }
            logger.debug("Scheduler is ended on for Task. "+task.name);
            callback(null,updatedData);
            return;
        });
    }else{
        var cronJobId = cronTab.scheduleJob(task.taskScheduler.cronPattern, function () {
            taskDao.updateCronJobIdByTaskId(task._id,cronJobId,function(err,data){
                if(err){
                    logger.error("Error in updating cron job Ids. "+err);
                }
            })
            taskService.executeTask(task._id, "system", "undefined", "undefined", "undefined","undefined","undefined",function(err, historyData) {
                if (err === 404) {
                    logger.error("Task not found.", err);
                    callback(err,null);
                    return;
                } else if (err) {
                    logger.error("Failed to execute task.", err);
                    callback(err,null);
                    return;
                }
                logger.debug("Task Execution Success: ", task.name);
                callback(null,cronJobId);
                return;
            });
        });
    }
}

schedulerService.startStopInstance = function startStopInstance(instanceId, catUser, action, callback) {
    logger.debug(action + " is Starting");
    async.waterfall([
        function(next) {
            instancesDao.getInstanceById(instanceId, next);
        },
        function(instanceDetails,next) {
            var currentDate = new Date().getTime();
            if(instanceDetails.length > 0) {
                logger.info("Found instance with id", instanceId)
                if(instanceDetails[0].instanceState === 'terminated') {
                    callback({
                       errCode:201,
                        errMsg:"Instance is already in "+instanceDetails[0].instanceState+" state. So no need to do any action."
                    })
                } else if (instanceDetails[0].isScheduled && instanceDetails[0].isScheduled === true && currentDate > instanceDetails[0].schedulerEndOn) {
                    instancesDao.updateInstanceScheduler(instanceDetails[0]._id,function(err, updatedData) {
                        if (err) {
                            logger.error("Failed to update Instance Scheduler: ", err);
                            next(err,null)
                        }
                        logger.debug("Scheduler is ended on for Instance. "+instanceDetails[0].platformId);
                        next(null,updatedData);
                    })
                } else if(!instanceDetails[0].providerId) {
                    var error = new Error("Provider is not associated with Instance.");
                    error.status = 500;
                    next(error, null)
                } else {
                    startStopManagedInstance(instanceDetails[0], catUser, action, next);
                }
            } else {
                logger.info("Could not Found instance with id", instanceId)
                next({message: "No instance found with id" + instanceId}, null)
            }
        }
    ],function(err,results) {
        if(err) {
            logger.error(err);
            callback(err,null);
        } else {
            logger.debug(action+ " is Completed");
            callback(null,results)
        }
    })
}

function createCronJob(cronPattern,instanceId,catUser,action,callback){
    var schedulerService = require('_pr/services/schedulerService');
    logger,info('cron pattern',cronPattern);
    var cronJobId = cronTab.scheduleJob(cronPattern, function () {
        instancesDao.updateCronJobIdByInstanceId(instanceId,cronJobId,function(err,data){
            if(err){
                logger.error("Error in updating cron job Ids. "+err);
            }
        })
        schedulerService.startStopInstance(instanceId, catUser, action, function (err, data) {
            if (err) {
                callback(err, null);
            }
            callback(null, cronJobId);
        });
    });
}

function startStopManagedInstance(instance,catUser,action,callback){
    var actionStartLog = '',actionCompleteLog='',actionFailedLog='',vmWareAction='',instanceState='',actionLog = null;
    var timestampStarted = new Date().getTime();
    if(instanceState !== '' && instanceState === instance.instanceState){
        callback({
            errCode:201,
            errMsg:"Instance is already in "+instanceState+" state. So no need to do same action again"
        })
        return;
    }else if(action === 'Start'){
        actionStartLog = 'Instance Starting';
        actionCompleteLog = 'Instance Started';
        actionFailedLog='Unable to start instance';
        vmWareAction='poweron';
        instanceState='running';
        actionLog = instancesDao.insertStartActionLog(instance._id, catUser, timestampStarted);
    }else if(action === 'Stop'){
        actionStartLog = 'Instance Stopping';
        actionCompleteLog = 'Instance Stopped';
        actionFailedLog='Unable to stop instance';
        vmWareAction='poweroff';
        instanceState='stopped';
        actionLog = instancesDao.insertStopActionLog(instance._id, catUser, timestampStarted);
    }else{
        logger.debug("Action is not matched for corresponding operation. "+action);
        callback(null,null);
    }
    var instanceLog = {
        actionId: "",
        instanceId: instance._id,
        orgName: instance.orgName,
        bgName: instance.bgName,
        projectName: instance.projectName,
        envName: instance.environmentName,
        status: instance.instanceState,
        actionStatus: "pending",
        platformId: instance.platformId,
        blueprintName: instance.blueprintData.blueprintName,
        data: instance.runlist,
        platform: instance.hardware.platform,
        os: instance.hardware.os,
        size: instance.instanceType,
        user: catUser,
        createdOn: new Date().getTime(),
        startedOn: new Date().getTime(),
        providerType: instance.providerType,
        action: action,
        logs: []
    };
    var logReferenceIds = [instance._id];
    if (actionLog !== null) {
        logReferenceIds.push(actionLog._id);
    }
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: false,
        log: actionStartLog,
        timestamp: timestampStarted
    });
    instanceLog.actionId = actionLog._id;
    instanceLog.logs = {
        err: false,
        log: actionStartLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(actionLog._id, instance._id, instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
        }
    });
    if(instance.providerType === 'aws') {
        AWSProvider.getAWSProviderById(instance.providerId, function (err, providerData) {
            if (err) {
                logger.error(err);
                var error = new Error("Unable to find Provider.");
                error.status = 500;
                callback(error, null);
                return;
            }
            function getRegion(callback) {
                if (instance.providerData && instance.providerData.region) {
                    process.nextTick(function () {
                        callback(null, instance.providerData.region);
                    });
                } else {
                    AWSKeyPair.getAWSKeyPairByProviderId(providerData._id, function (err, keyPair) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        //Fix for additional regions added for provider - Vinod
                        var foundRegion = false;
                        for(var p = 0; p < keyPair.length; p++){
                            if(keyPair[p].region == instance.region){
                                foundRegion = true;
                                callback(null, keyPair[p].region);

                            }
                        }
                        if(!foundRegion) //to support old flow.
                            callback(null, keyPair[0].region);
                    });
                }
            }

            getRegion(function (err, region) {
                if (err) {
                    var error = new Error("Error while fetching Keypair.");
                    error.status = 500;
                    callback(error, null);
                    return;
                }
                var ec2;
                if (providerData.isDefault) {
                    ec2 = new EC2({
                        "isDefault": true,
                        "region": region
                    });
                } else {
                    var cryptoConfig = appConfig.cryptoSettings;
                    var cryptography = new Cryptography(cryptoConfig.algorithm,
                        cryptoConfig.password);
                    var decryptedAccessKey = cryptography.decryptText(providerData.accessKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    var decryptedSecretKey = cryptography.decryptText(providerData.secretKey,
                        cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
                    ec2 = new EC2({
                        "access_key": decryptedAccessKey,
                        "secret_key": decryptedSecretKey,
                        "region": region
                    });
                }
                if (action === 'Start') {
                    ec2.startInstance([instance.platformId], function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            ec2.describeInstances([instance.platformId], function (err, instanceData) {
                                if (err) {
                                    logger.error("Hit some error: ", err);
                                    return callback(err, null);
                                }
                                if (instanceData.Reservations.length && instanceData.Reservations[0].Instances.length) {
                                    logger.debug("ip =>", instanceData.Reservations[0].Instances[0].PublicIpAddress);
                                    instancesDao.updateInstanceIp(instance._id, instanceData.Reservations[0].Instances[0].PublicIpAddress, function (err, updateCount) {
                                        if (err) {
                                            logger.error("update instance ip err ==>", err);
                                            return callback(err, null);
                                        }
                                        logger.debug('instance ip updated');
                                        logger.debug("Exit get() for /instances/%s/startInstance", instance._id);
                                        callback(null, {
                                            instanceCurrentState: state,
                                            actionLogId: actionLog._id
                                        });
                                        return;
                                    });
                                }
                            });
                        })
                    });
                } else {
                    ec2.stopInstance([instance.platformId], function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            callback(null, {
                                instanceCurrentState: state,
                                actionLogId: actionLog._id
                            });
                            return;
                        })
                    });
                }
            });
        });
    }else if(instance.providerType === 'vmware'){
        vmWareProvider.getvmwareProviderById(instance.providerId, function (err, providerdata) {
            var timestampStarted = new Date().getTime();
            var actionLog = instancesDao.insertStartActionLog(instance._id, catUser, timestampStarted);
            var logReferenceIds = [instance._id];
            if (actionLog) {
                logReferenceIds.push(actionLog._id);
            }
            var vmWareConfig = {
                host: '',
                username: '',
                password: '',
                dc: '',
                serviceHost: ''
            };
            if (providerdata) {
                vmWareConfig.host = providerdata.host;
                vmWareConfig.username = providerdata.username;
                vmWareConfig.password = providerdata.password;
                vmWareConfig.dc = providerdata.dc;
                vmWareConfig.serviceHost = appConfig.vmware.serviceHost;
            } else {
                vmWareConfig = null;
            }
            if (vmWareConfig) {
                var vmWare = new vmWare(vmWareConfig);
                vmWare.startstopVM(vmWareConfig.serviceHost, instance.platformId, vmWareAction, function (err, vmdata) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    } else {
                        checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            callback(null, {
                                instanceCurrentState: instanceState,
                                actionLogId: actionLog._id
                            });
                            return;
                        });
                    }
                });
            }
        })
    }else if(instance.providerType === 'azure'){
        azureProvider.getAzureCloudProviderById(instance.providerId, function (err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ', err);
                callback(err,null);
                return;
            }
            providerdata = JSON.parse(providerdata);
            var pemFile = appConfig.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
            var keyFile = appConfig.instancePemFilesDir + providerdata._id + providerdata.keyFileName;
            logger.debug("pemFile path:", pemFile);
            logger.debug("keyFile path:", pemFile);
            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
            var uniqueVal = uuid.v4().split('-')[0];
            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';
            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function (err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    callback(err,null);
                    return;
                }
                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function (err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        callback(err,null);
                        return;
                    }
                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile
                    };
                    var azureCloud = new azureCloud(options);
                    if(action === 'Start') {
                        azureCloud.startVM(instance.chefNodeName, function (err, currentState) {
                            if (err) {
                                checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                    callback(err, null);
                                    return;
                                })
                            }
                            checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                }
                                callback(null, {
                                    instanceCurrentState: instanceState,
                                    actionLogId: actionLog._id
                                });
                                fs.unlink(decryptedPemFile, function (err) {
                                    logger.debug("Deleting decryptedPemFile..");
                                    if (err) {
                                        logger.error("Error in deleting decryptedPemFile..");
                                    }
                                    fs.unlink(decryptedKeyFile, function (err) {
                                        logger.debug("Deleting decryptedKeyFile ..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedKeyFile..");
                                        }
                                    });
                                });
                                return;
                            })
                        });
                    }else{
                        azureCloud.shutDownVM(instance.chefNodeName, function (err, currentState) {
                            if (err) {
                                checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                    callback(err, null);
                                    return;
                                });
                            }
                            checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                                if (err) {
                                    callback(err, null);
                                    return;
                                }
                                callback(null, {
                                    instanceCurrentState: instanceState,
                                    actionLogId: actionLog._id
                                });
                                fs.unlink(decryptedPemFile, function (err) {
                                    logger.debug("Deleting decryptedPemFile..");
                                    if (err) {
                                        logger.error("Error in deleting decryptedPemFile..");
                                    }
                                    fs.unlink(decryptedKeyFile, function (err) {
                                        logger.debug("Deleting decryptedKeyFile ..");
                                        if (err) {
                                            logger.error("Error in deleting decryptedKeyFile..");
                                        }
                                    });
                                });
                                return;
                            });
                        });
                    }
                });
            });
        })
    }else if(instance.providerType === 'gcp'){
        providerService.getProvider(instance.providerId, function (err, provider) {
            if (err) {
                var error = new Error("Error while fetching Provider.");
                error.status = 500;
                callback(error, null);
                return;
            }
            var gcpProvider = new gcpProviderModel(provider);
            // Get file from provider decode it and save, after use delete file
            // Decode file content with base64 and save.
            var base64Decoded = new Buffer(gcpProvider.providerDetails.keyFile, 'base64').toString();
            fs.writeFile('/tmp/' + provider.id + '.json', base64Decoded);
            var params = {
                "projectId": gcpProvider.providerDetails.projectId,
                "keyFilename": '/tmp/' + provider.id + '.json'
            }
            var gcp = new GCP(params);
            var gcpParam = {
                "zone": data[0].zone,
                "name": data[0].name
            }
            if(action === 'Start') {
                gcp.startVM(gcpParam, function (err, vmResponse) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    }
                    checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        instancesDao.updateInstanceIp(instance._id, vmResponse.ip, function (err, updateCount) {
                            if (err) {
                                logger.error("update instance ip err ==>", err);
                                return callback(err, null);
                            }
                            logger.debug('instance ip upadated');
                        });
                        callback(null, {
                            instanceCurrentState: instanceState,
                            actionLogId: actionLog._id
                        });
                        fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                            if (err) {
                                logger.error("Unable to delete json file.");
                            }
                        });
                        return;
                    });
                });
            }else{
                gcp.stopVM(gcpParam, function (err, vmResponse) {
                    if (err) {
                        checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                            callback(err, null);
                            return;
                        });
                    }
                    checkSuccessInstanceAction(logReferenceIds, instanceState, instanceLog, actionCompleteLog, function (err, successData) {
                        if (err) {
                            callback(err, null);
                            return;
                        }
                        instancesDao.updateInstanceIp(instance._id, vmResponse.ip, function (err, updateCount) {
                            if (err) {
                                logger.error("update instance ip err ==>", err);
                                return callback(err, null);
                            }
                            logger.debug('instance ip upadated');
                        });
                        callback(null, {
                            instanceCurrentState: instanceState,
                            actionLogId: actionLog._id
                        });
                        fs.unlink('/tmp/' + provider.id + '.json', function (err) {
                            if (err) {
                                logger.error("Unable to delete json file.");
                            }
                        });
                        return;
                    });
                });
            }
        });
    }else if(instance.providerType === 'digitalocean'){
        digitalOceanProvider.getDigitalOceanProviderById(instance.providerId, function (err, providerdata) {
            logger.info("Inside Digital ocean start/stop")
            var timestampStarted = new Date().getTime();
            var actionLog = instancesDao.insertStartActionLog(instance._id, catUser, timestampStarted);
            var logReferenceIds = [instance._id];
            if (actionLog) {
                logReferenceIds.push(actionLog._id);
            }
            var digitalOceanConfig = {
                token: ''
            };
            if (providerdata) {
                digitalOceanConfig.token = providerdata.token;
                //vmWareConfig.serviceHost = appConfig.vmware.serviceHost;
            } else {
                digitalOceanConfig = null;
            }
            if (digitalOceanConfig) {
                if (action === 'Start') {
                    logger.info("Inside digital ocean start")
                    digitalocean.startDigitalOcean([instance.platformId], digitalOceanConfig.token, function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            logger.debug("Exit get() for /instances/%s/startInstance", instance._id);
                                callback(null, {
                                            instanceCurrentState: state,
                                            actionLogId: actionLog._id
                                        });
                                        return;
                        })
                    });
                } else {
                    logger.info("Inside digital ocean stop")
                    digitalocean.stopDigitalOcean([instance.platformId], digitalOceanConfig.token, function (err, state) {
                        if (err) {
                            checkFailedInstanceAction(logReferenceIds, instanceLog, actionFailedLog, function (err) {
                                callback(err, null);
                                return;
                            })
                        }
                        checkSuccessInstanceAction(logReferenceIds, state, instanceLog, actionCompleteLog, function (err, successData) {
                            if (err) {
                                callback(err, null)
                            } else {
                                callback(null, {instanceCurrentState: state, actionLogId: actionLog._id})
                            }
                        })
                    })
                }
            }
        })
    }
    else{
        checkFailedInstanceAction(logReferenceIds,instanceLog,actionFailedLog,function(err){
            callback(err, null);
            return;
        });
    }
}

function checkFailedInstanceAction(logReferenceIds,instanceLog,actionFailedLog,callback) {
    var timestampEnded = new Date().getTime();
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: true,
        log: actionFailedLog,
        timestamp: timestampEnded
    });
    instancesDao.updateActionLog(logReferenceIds[0], logReferenceIds[1], false, timestampEnded);
    instanceLog.endedOn = new Date().getTime();
    instanceLog.actionId = logReferenceIds[1];
    instanceLog.actionStatus = "failed";
    instanceLog.logs = {
        err: true,
        log: actionFailedLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(logReferenceIds[1], logReferenceIds[0], instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
        }
    });
    var error = new Error({
        actionLogId: logReferenceIds[1]
    });
    error.status = 500;
    callback(error, null);
    return;
}

function checkSuccessInstanceAction(logReferenceIds,instanceState,instanceLog,actionCompleteLog,callback){
    instancesDao.updateInstanceState(logReferenceIds[0], instanceState, function (err, updateCount) {
        if (err) {
            logger.error("update instance state err ==>", err);
            return callback(err, null);
        }
        logger.debug('instance state upadated');
    });
    var timestampEnded = new Date().getTime()
    logsDao.insertLog({
        referenceId: logReferenceIds,
        err: false,
        log: actionCompleteLog,
        timestamp: timestampEnded
    });
    instancesDao.updateActionLog(logReferenceIds[0], logReferenceIds[1], true, timestampEnded);
    instanceLog.endedOn = new Date().getTime();
    instanceLog.status = instanceState;
    instanceLog.actionStatus = "success";
    instanceLog.logs = {
        err: false,
        log: actionCompleteLog,
        timestamp: new Date().getTime()
    };
    instanceLogModel.createOrUpdate(logReferenceIds[1], logReferenceIds[0], instanceLog, function (err, logData) {
        if (err) {
            logger.error("Failed to create or update instanceLog: ", err);
            callback(err,null);
        }
        callback(null,logData);
    });
}


schedulerService.testUpdateServiceNow = function testUpdateServiceNow(ticketno,configname,callback){
    CMDBConfig.findOne({
        configname: configname
    }, function(err, data) {
        if(err || data == null) callback('Can not find service now config details', null);
        else {
            var snowticketupdate = function(tablename, callback){
                var url = "https://" + data.servicenowusername + ':' + data.servicenowpassword + '@' + data.url.substring(8, data.url.length) +"/api/now/v1/table/" + tablename + "/"+ ticketno + "?sysparam_exclude_ref_link=true";
                var postData = {
                    work_notes: 'BOT failed to create account. A&C team please investigate.'
                }
                var options = {
                    url: url,
                    headers: {
                        'Content-Type': 'application/json',
                        'charset': 'utf-8'
                    },
                    json: true,
                    body: postData
                };
                request.put(options, function (err, res) {
                    if(err )
                    {

                        callback(err, null);
                    }
                    else {
                        if(res.statusCode == 200) {
                            logger.info('Service Now ticket updated successfully');
                            callback(null,res);
                        }

                        else {
                            logger.info('Some error occurred during service now ticket update');
                            callback(null,res);
                        }
                    }
                });
            }
            snowticketupdate("incident", function(err,res){
                    if(err){
                        callback(err,null);
                    }
                    else {
                        if(res.statusCode == 200){
                            callback(null,res);
                        }
                        else{
                            if(res.body.error){
                                if(res.body.error.message.indexOf('No Record found') >= 0){
                                    logger.info('No Record found in incident for ' + ticketno);
                                    //attempt to update next table
                                    snowticketupdate("sc_task",function(err,res){
                                        if(err){
                                            callback(err,null);
                                        }
                                        else {
                                            if (res.statusCode == 200) {
                                                callback(null,res);
                                            }
                                            else{
                                                logger.info('No Record found in task for ' + ticketno);
                                                callback(res.body.error,null);

                                            }
                                        }
                                    })
                                }
                            }

                          //  if(res.)
                        }
                    }
            });
        }
    });
}

function updateServiceNow(botInstanceId, actionLogId, callback) {
    var obj = {
        auditType: 'BOT',
        isDeleted: false,
        auditId: botInstanceId,
        actionLogId: actionLogId
    }
    botAuditTrail.find(obj, function (err, auditTrailData) {
        if(err) callback(err, null)
        else {
            if(auditTrailData.length == 0) {
                logger.info('No audit data found');
                callback(null, auditTrailData);
            } else if(auditTrailData[0].auditTrailConfig && auditTrailData[0].auditTrailConfig.serviceNowTicketRefObj && auditTrailData[0].auditTrailConfig.serviceNowTicketRefObj.ticketNo && auditTrailData[0].auditTrailConfig.serviceNowTicketRefObj.configName) {
                CMDBConfig.findOne({
                    configname: auditTrailData[0].auditTrailConfig.serviceNowTicketRefObj.configName
                }, function(err, data) {
                    if(err || data == null) callback('Can not find service now config details', null);
                    else {
                        var snowticketupdate = function(tablename, callback){
                            var url = "https://" + data.servicenowusername + ':' + data.servicenowpassword + '@' + data.url.substring(8, data.url.length) +"/api/now/v1/table/" + tablename + "/"+ ticketno + "?sysparam_exclude_ref_link=true";
                            var postData = {
                                work_notes: 'BOT failed to create account. A&C team please investigate.'
                            }
                            var options = {
                                url: url,
                                headers: {
                                    'Content-Type': 'application/json',
                                    'charset': 'utf-8'
                                },
                                json: true,
                                body: postData
                            };
                            request.put(options, function (err, res) {
                                if(err )
                                {

                                    callback(err, null);
                                }
                                else {
                                    if(res.statusCode == 200) {
                                        logger.info('Service Now ticket updated successfully');
                                        callback(null,res);
                                    }

                                    else {
                                        logger.info('Some error occurred during service now ticket update');
                                        callback(null,res);
                                    }
                                }
                            });
                        }
                        snowticketupdate("incident", function(err,res){
                            if(err){
                                callback(err,null);
                            }
                            else {
                                if(res.statusCode == 200){
                                    callback(null,res);
                                }
                                else{
                                    if(res.body.error){
                                        if(res.body.error.message.indexOf('No Record found') >= 0){
                                            logger.info('No Record found in incident for ' + ticketno);
                                            //attempt to update next table
                                            snowticketupdate("sc_task",function(err,res){
                                                if(err){
                                                    callback(err,null);
                                                }
                                                else {
                                                    if (res.statusCode == 200) {
                                                        callback(null,res);
                                                    }
                                                    else{
                                                        logger.info('No Record found in task for ' + ticketno);
                                                        callback(res.body.error,null);

                                                    }
                                                }
                                            })
                                        }
                                    }

                                    //  if(res.)
                                }
                            }
                        });
                    }
                });
            } else {
                logger.info('No service now ticket available for bot instance');
                callback(null, '');
            }
        }
    })
}




