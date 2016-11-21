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
var blueprints = null;
var tasks = null;

const errorType = 'auditTrailService';

var auditTrailService = module.exports = {};
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var logsDao = require('_pr/model/dao/logsdao.js');


auditTrailService.insertAuditTrail = function insertAuditTrail(auditDetails,actionLog,actionObj,callback) {
    var auditTrailObj = {
        actionId: actionLog._id,
        auditId: auditDetails._id,
        auditType: actionObj.auditType,
        masterDetails:{
            orgId: auditDetails.orgId,
            orgName: auditDetails.orgName,
            bgId: auditDetails.bgId,
            bgName: auditDetails.bgName,
            projectId: auditDetails.projectId,
            projectName: auditDetails.projectName,
            envId: auditDetails.envId,
            envName: auditDetails.environmentName
        },
        status: actionObj.status,
        actionStatus: actionObj.actionStatus,
        user: actionObj.catUser,
        startedOn: new Date().getTime(),
        providerType: auditDetails.providerType,
        action: actionObj.action,
        logs: [{
            err: false,
            log: actionObj.log,
            timestamp: new Date().getTime()
        }]
    };
    if(actionObj.auditType === 'BOTs'){
        auditTrailObj.auditTrailConfig = {
            platformId: auditDetails.platformId,
            blueprintName: auditDetails.blueprintData.blueprintName,
            platform: "unknown",
            os:auditDetails.hardware.os,
            size:""
        };
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
        auditTrailObj.auditTrailConfig = {
            platformId: auditDetails.platformId,
            blueprintName: auditDetails.blueprintData.blueprintName,
            platform: "unknown",
            os:auditDetails.hardware.os,
            size:""
        };
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
        auditTrailObj.auditTrailConfig = {
            platformId: auditDetails.platformId,
            blueprintName: auditDetails.blueprintData.blueprintName,
            platform: "unknown",
            os:auditDetails.hardware.os,
            size:""
        };
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

auditTrailService.saveAndUpdateAuditTrail = function saveAndUpdateAuditTrail(auditTrailDetails,callback){
    if(auditTrailDetails.auditType === 'BOTs'){
        botAuditTrail.createNew(auditTrailDetails,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(auditTrailDetails.auditType === 'Instances'){
        instanceAuditTrail.createNew(auditTrailDetails,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            return;
        })
    }else if(auditTrailDetails.auditType === 'Containers'){
        containerAuditTrail.createNew(auditTrailDetails,function(err,data){
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
    if(auditType === 'BOTs'){
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
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
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

auditTrailService.getBOTsSummary = function getBOTsSummary(callback){
    async.parallel({
        totalNoOfBots: function(callback){
            blueprints = require('_pr/model/blueprint');
            tasks = require('_pr/model/classes/tasks/tasks.js');
            async.parallel({
                botsTask:function(callback){
                    tasks.getTasksServiceDeliveryCheck('true',callback);
                },
                botsBlueprint:function(callback){
                    blueprints.getBlueprintsServiceDeliveryCheck('true',callback);
                }
            },function(err,results){
                if(err){
                    logger.error(err);
                    callback(err,null);
                    return;
                }
                var totalNoOfBots = results.botsTask.length + results.botsBlueprint.length;
                callback(null,totalNoOfBots);
                return;
            })

        },
        totalNoOfSuccessBots: function(callback){
            auditTrail.getAuditTrailByStatus('BOTs','success',function(err,data){
                if(err){
                    callback(err,null);
                }
                callback(null,data.length);
            });

        },
        totalSavedTimeForBots: function(callback){
            auditTrail.getAuditTrailByType('BOTs',function(err,botAuditTrail){
                if(err){
                    callback(err,null);
                } else if(botAuditTrail.length > 0){
                    var totalTimeInSeconds = 0,count =0
                    for(var i = 0; i < botAuditTrail.length; i++){
                        (function(auditTrail){
                            count++;
                            var executionTime = getExecutionTime(auditTrail.endedOn,auditTrail.startedOn);
                            var savedTime = 600-executionTime;
                            totalTimeInSeconds = totalTimeInSeconds+savedTime;
                        })(botAuditTrail[i]);
                    }
                    if(count === botAuditTrail.length){
                        callback(null,(totalTimeInSeconds/60));
                    }
                } else{
                    callback(null,botAuditTrail.length);
                }
            });
        },
        totalNoOfFailedBots: function(callback){
            auditTrail.getAuditTrailByStatus('BOTs','failed',function(err,data){
                if(err){
                    callback(err,null);
                }
                callback(null,data.length);
            });
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


function getExecutionTime(endTime,startTime){
    var executionTimeInMS = endTime-startTime;
    var executionTime = executionTimeInMS/(1000);
    return executionTime;
}

