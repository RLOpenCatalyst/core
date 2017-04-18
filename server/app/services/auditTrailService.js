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
var instanceAuditTrail = require('_pr/model/audit-trail/instance-audit-trail.js');
var botAuditTrail = require('_pr/model/audit-trail/bot-audit-trail.js');
var containerAuditTrail = require('_pr/model/audit-trail/container-audit-trail.js');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var bots = require('_pr/model/bots/1.0/bots.js');
var botsDao = require('_pr/model/bots/1.1/botsDao.js');;

const errorType = 'auditTrailService';

var auditTrailService = module.exports = {};
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var logsDao = require('_pr/model/dao/logsdao.js');


auditTrailService.insertAuditTrail = function insertAuditTrail(auditDetails,auditTrailConfig,actionObj,callback) {
    var auditTrailObj = {
        auditId: auditDetails._id,
        auditType: actionObj.auditType,
        actionLogId:auditTrailConfig.actionLogId?auditTrailConfig.actionLogId:null,
        masterDetails:{
            orgId: auditDetails.orgId,
            orgName: auditDetails.orgName,
            bgId: auditDetails.bgId,
            bgName: auditDetails.bgName,
            projectId: auditDetails.projectId,
            projectName: auditDetails.projectName,
            envId: auditDetails.envId,
            envName: auditDetails.envName?auditDetails.envName:auditDetails.environmentName
        },
        status: actionObj.status,
        auditCategory:actionObj.auditCategory,
        actionStatus: actionObj.actionStatus,
        user: actionObj.catUser,
        startedOn: new Date().getTime(),
        providerType: auditDetails.providerType,
        action: actionObj.action
    };
    if(actionObj.auditType === 'BOTs' || actionObj.auditType === 'BOTsNew'){
        auditTrailObj.auditTrailConfig = auditTrailConfig;
        botAuditTrail.createNew(auditTrailObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(actionObj.auditType === 'Instances'){
        auditTrailObj.auditTrailConfig = auditTrailConfig;
        instanceAuditTrail.createNew(auditTrailObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(actionObj.auditType === 'Containers'){
        auditTrailObj.auditTrailConfig = auditTrailConfig;
        containerAuditTrail.createNew(auditTrailObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else{
        callback({
            message: "Invalid Audit Trail Type. "
        }, null);
    }
}

auditTrailService.updateAuditTrail = function updateAuditTrail(auditType,auditId,auditObj,callback) {
    if(auditType === 'BOTs' || auditType === 'BOTsNew'){
        botAuditTrail.updateBotAuditTrail(auditId,auditObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(auditType === 'Instances'){
        instanceAuditTrail.updateInstanceAuditTrail(auditId,auditObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(auditType === 'Containers'){
        containerAuditTrail.updateContainerAuditTrail(auditId,auditObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else{
        callback({
            message: "Invalid Audit Trail Type. "
        }, null);
    }
}

auditTrailService.getAuditTrailList = function getAuditTrailList(auditTrailQuery,callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(auditTrailQuery, 'auditTrails', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'auditTrailConfig.name','masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            auditTrail.getAuditTrailList(queryObj, next);
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

auditTrailService.getAuditTrailActionLogs = function getAuditTrailActionLogs(actionId,timeStamp,callback){
    if (timeStamp) {
        timeStamp = parseInt(timeStamp);
    }
    logsDao.getLogsByReferenceId(actionId, timeStamp, function(err,actionLogs){
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,actionLogs)
        return;
    });
}

auditTrailService.getBOTsSummary = function getBOTsSummary(queryParam,BOTSchema,callback){
    async.waterfall([
        function(next){
            apiUtil.queryFilterBy(queryParam,next);
        },
        function(filterQuery,next) {
            filterQuery.isDeleted=false;
            if(BOTSchema === 'BOTs') {
                bots.getAllBots(filterQuery, next);
            }else{
                botsDao.getAllBots(filterQuery, next);
            }
        },
        function(botsList,next){
            var auditIds = [];
            for(var i = 0; i < botsList.length; i++) {
                if(BOTSchema === 'BOTs') {
                    auditIds.push(botsList[i].botId);
                }else{
                    auditIds.push(botsList[i]._id);
                }
            }
            async.parallel({
                totalNoOfBots: function(callback){
                            callback(null, botsList.length);
                },
                totalNoOfSuccessBots: function(callback){
                    var query = {
                        auditType: BOTSchema,
                        actionStatus: 'success',
                        isDeleted: false,
                        auditId:{$in:auditIds}
                    };
                    var botsIds = [];
                    auditTrail.getAuditTrails(query, function (err, botsAudits) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else{
                            callback(null, botsAudits.length);
                            return;
                        }
                    });
                },
                /*totalNoOfScheduledBots: function(callback){
                    var scheduleBotsIds = [];
                    if(botsList.length > 0) {
                        for (var j = 0; j < botsList.length; j++) {
                            if(botsList[j].isBotScheduled === true) {
                                scheduleBotsIds.push(botsList[j]._id);
                            }
                        }
                        callback(null,scheduleBotsIds.length);
                    }else{
                        callback(null,scheduleBotsIds.length);
                    }
                },*/
                totalNoOfServiceNowTickets: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'success',
                        isDeleted:false,
                        user:'servicenow'
                    };
                    auditTrail.getAuditTrails(query, function(err,botsAudits){
                        if(err){
                            callback(err,null);
                        }else {
                            callback(null,botsAudits.length);
                        }
                    });
                },
                totalNoOfRunningBots: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'running',
                        isDeleted:false,
                        auditId:{$in:auditIds}
                    };
                    var botsIds = [];
                    auditTrail.getAuditTrails(query, function(err,botsAudits){
                        if(err){
                            callback(err,null);
                        }else if (botsAudits.length > 0) {
                            for (var j = 0; j < botsAudits.length; j++) {
                                if (botsIds.indexOf(botsAudits[j].auditId) === -1) {
                                    botsIds.push(botsAudits[j].auditId);
                                }
                            }
                            callback(null,botsIds.length);
                        } else {
                            callback(null,botsIds.length);
                        }
                    });
                },
                totalSavedTimeForBots: function(callback){
                    var days =0,hours = 0, minutes = 0;
                    if(botsList.length > 0) {
                        for (var k = 0; k < botsList.length; k++) {
                            if(botsList[k].savedTime && botsList[k].savedTime.hours) {
                                hours = hours + botsList[k].savedTime.hours;
                            }
                            if(botsList[k].savedTime && botsList[k].savedTime.minutes){
                                minutes = minutes + botsList[k].savedTime.minutes;
                            }
                        }
                    }
                    if(minutes >= 60){
                        hours = hours + Math.floor(minutes / 60);
                        minutes = minutes % 60;
                    }
                    if(hours >= 24){
                        days = days + Math.floor(hours / 60);
                        hours = minutes % 24
                    }
                    var result = {
                        days:days,
                        hours:hours,
                        minutes:minutes
                    }
                    callback(null,result);
                },
                totalNoOfFailedBots: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'failed',
                        isDeleted:false,
                        auditId:{$in:auditIds}
                    };
                    var botsIds = [];
                    auditTrail.getAuditTrails(query, function(err,botsAudits){
                        if(err){
                            callback(err,null);
                        }else if (botsAudits.length > 0) {
                            for (var j = 0; j < botsAudits.length; j++) {
                                if (botsIds.indexOf(botsAudits[j].auditId) === -1) {
                                    botsIds.push(botsAudits[j].auditId);
                                }
                            }
                            callback(null,botsIds.length);
                        } else {
                            callback(null,botsIds.length);
                        }
                    });
                }

            },function(err,data){
                if(err){
                    logger.error(err);
                    next(err,null);
                }
                next(null,data);
            })
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,results);
        return;
    })
}

auditTrailService.getBotsAuditTrailHistory = function getBotsAuditTrailHistory(botId,callback){
    var query={
        auditType:'BOTs',
        auditId:botId,
        isDeleted:false
    };
    auditTrail.getAuditTrails(query,function(err,data){
        if(err){
            callback(err,null);
        }else {
            callback(null, data);
        }
    });
}

auditTrailService.softRemoveAuditTrailById = function softRemoveAuditTrailById(auditId,callback){
    auditTrail.softRemoveAuditTrails(auditId,function(err,data){
        if(err){
            return callback(err,null);
        }else {
            return callback(null, data);
        }
    });
}

auditTrailService.updateSoftRemoveAuditTrailById = function updateSoftRemoveAuditTrailById(auditId,callback){
    auditTrail.updateSoftRemoveAuditTrails(auditId,function(err,data){
        if(err){
            return callback(err,null);
        }else {
            return callback(null, data);
        }
    });
}

auditTrailService.removeAuditTrailById = function removeAuditTrailById(auditId,callback){
    auditTrail.removeAuditTrails({auditId:auditId},function(err,data){
        if(err){
            return callback(err,null);
        }else {
            return callback(null, data);
        }
    });
}
