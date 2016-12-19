
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
var bots = require('_pr/model/bots/bots.js');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var taskService =  require('_pr/services/taskService.js');
var tasks =  require('_pr/model/classes/tasks/tasks.js');
var auditTrailService =  require('_pr/services/auditTrailService.js');
var blueprintService =  require('_pr/services/blueprintService.js');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');

const errorType = 'botsService';

var botsService = module.exports = {};

botsService.createOrUpdateBots = function createOrUpdateBots(botsDetail,linkedCategory,linkedSubCategory,callback) {
    logger.debug("In createOrUpdateBots....");
    var botsObj = {
        botId: botsDetail._id,
        botName:botsDetail.name,
        botType: botsDetail.botType,
        botCategory: botsDetail.botCategory,
        botDesc: botsDetail.shortDesc,
        masterDetails:{
            orgId: botsDetail.orgId,
            orgName: botsDetail.orgName,
            bgId: botsDetail.bgId,
            bgName: botsDetail.bgName,
            projectId: botsDetail.projectId,
            projectName: botsDetail.projectName,
            envId: botsDetail.envId ? botsDetail.envId : null,
            envName: botsDetail.envName?botsDetail.envName: null
        },
        botConfig:botsDetail.taskConfig ? botsDetail.taskConfig : null,
        botLinkedCategory: linkedCategory,
        botLinkedSubCategory:linkedSubCategory,
        manualExecutionTime:botsDetail.manualExecutionTime,
        createdOn: new Date().getTime()
    };
    bots.getBotsById(botsDetail._id,function(err,data){
        if(err){
            callback(err,null);
            return;
        }else if(data.length === 0){
            bots.createNew(botsObj, function (err, saveBotsData) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                    return;
                }
                callback(null, saveBotsData);
                return;
            })
        }else{
            botsObj.isDeleted = false;
            bots.updateBotsDetail(botsObj.botId,botsObj,function(err,updateBotsData){
                if(err){
                    logger.error(err);
                    callback(err,null);
                    return;
                }
                auditTrailService.updateSoftRemoveAuditTrailById(botsObj.botId,function(err,data){
                    if(err){
                        logger.error("Error in updating soft audit Trails");
                    }
                })
                callback(null,updateBotsData);
                return;
            });
        }
    });
}

botsService.updateBotsScheduler = function updateBotsScheduler(botId,botObj,callback) {
    if(botObj.botScheduler  && botObj.botScheduler !== null && Object.keys(botObj.botScheduler).length !== 0) {
        botObj.botScheduler = apiUtil.createCronJobPattern(botObj.botScheduler);
    }
    bots.updateBotsDetail(botId,botObj,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else {
            bots.getBotsById(botId, function (err, botsData) {
                if (err) {
                    logger.error(err);
                } else if(botsData.length > 0){
                    if (botsData[0].isBotScheduled === true) {
                        var catalystSync = require('_pr/cronjobs/catalyst-scheduler/catalystScheduler.js');
                        catalystSync.executeScheduledBots();
                        if(botsData[0].botLinkedCategory === 'Task'){
                            tasks.getTaskById(botId,function(err,task){
                                if(err){
                                    logger.error("Error in fetching Task details",err);
                                }else if(task.isTaskScheduled === true){
                                    tasks.updateTaskScheduler(botId,function(err,updateData){
                                        if(err){
                                            logger.error("Error in Updating Task details",err);
                                        }
                                    });
                                    if(task.cronJobId && task.cronJobId !== null){
                                        var cronTab = require('node-crontab');
                                        cronTab.cancelJob(task.cronJobId);
                                    }
                                }
                            });
                        }
                    } else if (botsData[0].cronJobId && botsData[0].cronJobId !== null) {
                        var cronTab = require('node-crontab');
                        cronTab.cancelJob(botsData[0].cronJobId);
                    } else {
                        logger.debug("There is no cron job associated with Bot ");
                    }
                } else{
                    logger.debug("There is no Bots ");
                }
            });
            callback(null, data);
            return;
        }
    });
}

botsService.getBotsList = function getBotsList(botsQuery,actionStatus,callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'bots', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['botName', 'botType', 'botCategory', 'botLinkedCategory','botLinkedSubCategory', 'masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            if(actionStatus !== null){
                var query = {
                    auditType: 'BOTs',
                    actionStatus: actionStatus,
                    auditCategory: 'Task'
                };
                var botsIds = [];
                auditTrail.getAuditTrails(query, function(err,botsAudits){
                    if(err){
                        next(err,null);
                    }else if (botsAudits.length > 0) {
                        var results = [];
                        for (var i = 0; i < botsAudits.length; i++) {
                            if (botsIds.indexOf(botsAudits[i].auditId) < 0) {
                                botsIds.push(botsAudits[i].auditId);
                                results.push(botsAudits[i].auditId);
                            } else {
                                results.push(botsAudits[i].auditId);
                            }
                        }
                        if (results.length === botsAudits.length) {
                            queryObj.queryObj.botId = {$in:botsIds};
                            bots.getBotsList(queryObj, next);
                        }
                    } else {
                        queryObj.queryObj.botId = null;
                        bots.getBotsList(queryObj, next);
                    }
                });
            }else{
                bots.getBotsList(queryObj, next);
            }
        },
        function(auditTrailList, next) {
            apiUtil.paginationResponse(auditTrailList, reqData, next);
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results)
        return;
    });
}

botsService.removeSoftBotsById = function removeSoftBotsById(botId,callback){
    async.waterfall([
        function(next){
            bots.getBotsById(botId,next);
        },
        function(botDetails,next){
            if(botDetails.length > 0){
                async.parallel({
                    bot:function(callback){
                        if(botDetails[0].botLinkedCategory === 'Task'){
                            taskService.deleteServiceDeliveryTask(botId, callback);
                        }else{
                            blueprintService.deleteServiceDeliveryBlueprint(botId,callback)
                        }
                    },
                    services: function(callback){
                        bots.removeSoftBotsById(botId,callback);
                    }
                },function(err,results){
                    if(err){
                        next(err,null);
                    }else{
                        next(null,results);
                    }
                })
            }else{
                next({errCode:400, errMsg:"Bots is not exist in DB"},null)
            }
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    });
}
botsService.removeBotsById = function removeBotsById(botId,callback){
    bots.removeBotsById(botId,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    });
}

botsService.getBotsHistory = function getBotsHistory(botId,callback){
    auditTrailService.getBotsAuditTrailHistory(botId,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    });
}

botsService.getPerticularBotsHistory = function getPerticularBotsHistory(botId,historyId,callback){
    async.waterfall([
        function(next){
            bots.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0){
                var query={
                    auditType:'BOTs',
                    auditId:botId,
                    auditHistoryId:historyId
                };
                auditTrail.getAuditTrails(query,next);
            }else{
                next({errCode:400, errMsg:"Bots is not exist in DB"},null)
            }
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    });
}

botsService.executeBots = function executeBots(botId,reqBody,callback){
    async.waterfall([
        function(next){
            bots.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0){
                if(bots[0].botLinkedCategory === 'Task'){
                    taskService.executeTask(botId,reqBody.userName ? reqBody.userName : 'system',reqBody.hostProtocol ? reqBody.hostProtocol : 'undefined',
                        reqBody.choiceParam ? reqBody.choiceParam : 'undefined',reqBody.appData ? reqBody.appData : 'undefined',reqBody.paramOptions ? reqBody.paramOptions : 'undefined',
                        reqBody.tagServer ? reqBody.tagServer : 'undefined', callback);
                }else{
                    blueprintService.launch(botId,reqBody,callback)
                }
            }else{
                next({errCode:400, errMsg:"Bots is not exist in DB"},null)
            }
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    });
}



