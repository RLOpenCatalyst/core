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
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');

const errorType = 'auditTrailService';

var auditTrailService = module.exports = {};
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var logsDao = require('_pr/model/dao/logsdao.js');


auditTrailService.insertAuditTrail = function insertAuditTrail(auditDetails,actionLog,actionObj,callback) {
    var auditTrailObj = {
        actionId: actionLog._id,
        auditId: auditDetails._id,
        auditType: auditDetails.auditType,
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
        auditTrailObj.auditTrailConfig = auditDetails.auditTrailConfig;
    }else if(actionObj.auditType === 'Instances'){
        auditTrailObj.auditTrailConfig = {
            platformId: auditDetails.platformId,
            blueprintName: auditDetails.blueprintData.blueprintName,
            platform: "unknown",
            os:auditDetails.hardware.os,
            size:""
        };
    }else if(actionObj.auditType === 'Containers'){
        auditTrailObj.auditTrailConfig = auditDetails.auditTrailConfig;
    }else{
        callback({
            message: "Invalid Audit Trail Type. "
        }, null);
    }
    console.log(JSON.stringify(auditTrailObj));
    auditTrail.insertAuditTrail(auditTrailObj,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    })
}

auditTrailService.updateAuditTrail = function updateAuditTrail(auditId,actionId,auditObj,callback) {
    var queryObj = {
        auditId:auditId,
        actionId:actionId
    };
    auditTrail.updateAuditTrail(queryObj,auditObj,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    })
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

