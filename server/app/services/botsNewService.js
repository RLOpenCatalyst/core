
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
var botsDao = require('_pr/model/bots/1.1/botsDao.js');
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileUpload = require('_pr/model/file-upload/file-upload');
var appConfig = require('_pr/config');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var auditTrailService = require('_pr/services/auditTrailService.js');
var scriptExecutor = require('_pr/engine/bots/scriptExecutor.js');
var chefExecutor = require('_pr/engine/bots/chefExecutor.js');
var blueprintExecutor = require('_pr/engine/bots/blueprintExecutor.js');
var logsDao = require('_pr/model/dao/logsdao.js');

const fileHound= require('filehound');
const yamlJs= require('yamljs');
const gitHubService = require('_pr/services/gitHubService.js');

const errorType = 'botsNewService';

var botsNewService = module.exports = {};

botsNewService.createNew = function createNew(reqBody,callback){

}

botsNewService.updateBotsScheduler = function updateBotsScheduler(botId,botObj,callback) {
    if(botObj.scheduler  && botObj.scheduler !== null && Object.keys(botObj.scheduler).length !== 0) {
        botObj.scheduler = apiUtil.createCronJobPattern(botObj.scheduler);
        botObj.isScheduled =true;
    }else{
        botObj.scheduler ={};
        botObj.isScheduled =false;
    }
    botsDao.updateBotsDetail(botId,botObj,function(err,data) {
        if (err) {
            logger.error("Error in Updating BOTs Scheduler", err);
            callback(err, null);
            return;
        } else {
            callback(null, data);
            botsDao.getBotsById(botId, function (err, botsList) {
                if (err) {
                    logger.error("Error in fetching BOTs", err);
                } else {
                    var schedulerService = require('_pr/services/schedulerService.js');
                    schedulerService.executeNewScheduledBots(botsList[0], function (err, data) {
                        if (err) {
                            logger.error("Error in executing New BOTs Scheduler");
                        }
                    });
                }
            });
        }
    });
}

botsNewService.removeBotsById = function removeBotsById(botId,callback){
    async.parallel({
        bots: function(callback){
            botsDao.removeBotsById(botId,callback);
        },
        auditTrails: function(callback){
            auditTrail.removeAuditTrails({auditId:botId},callback);
        }
    },function(err,resutls){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else {
            callback(null, resutls);
            return;
        }
    });
}

botsNewService.getBotsList = function getBotsList(botsQuery,actionStatus,serviceNowCheck,callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'bots', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['name', 'type', 'category','desc', 'orgName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            if(actionStatus !== null){
                var query = {
                    auditType: 'BOTsNew',
                    actionStatus: actionStatus,
                    isDeleted:false
                };
                var botsIds = [];
                auditTrail.getAuditTrails(query, function(err,botsAudits){
                    if(err){
                        next(err,null);
                    }else if (botsAudits.length > 0) {
                        for (var i = 0; i < botsAudits.length; i++) {
                            if (botsIds.indexOf(botsAudits[i].auditId) < 0) {
                                botsIds.push(botsAudits[i].auditId);
                            }
                        }
                        queryObj.queryObj._id = {$in:botsIds};
                        botsDao.getBotsList(queryObj, next);
                    }else {
                        queryObj.queryObj._id = null;
                        botsDao.getBotsList(queryObj, next);
                    }
                });
            }else if(serviceNowCheck === true){
                var query = {
                    auditType: 'BOTsNew',
                    actionStatus: 'success',
                    user: 'servicenow',
                    isDeleted:false
                };
                var botsIds = [];
                auditTrail.getAuditTrails(query, function(err,botsAudits){
                    if(err){
                        next(err,null);
                    }else if (botsAudits.length > 0) {
                        for (var i = 0; i < botsAudits.length; i++) {
                            if (botsIds.indexOf(botsAudits[i].auditId) < 0) {
                                botsIds.push(botsAudits[i].auditId);
                            }
                        }
                        queryObj.queryObj._id = {$in:botsIds};
                        botsDao.getBotsList(queryObj, next);
                    } else {
                        queryObj.queryObj._id = null;
                        botsDao.getBotsList(queryObj, next);
                    }
                });
            }else{
                botsDao.getBotsList(queryObj, next);
            }
        },
        function(botList, next) {
            addYmlFileDetailsForBots(botList,reqData,next);
        },
        function(filterBotList, next) {
           async.parallel({
               botList:function(callback){
                   apiUtil.paginationResponse(filterBotList, reqData, callback);
               },
               botSummary:function(callback){
                   auditTrailService.getBOTsSummary(botsQuery,'BOTsNew',callback)
               }
           },function(err,data){
               if(err){
                   next(err);
               }else{
                   next(null,data);
               }
           })
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        var resultObj = {            
            bots : results.botList.bots,            
            metaData : results.botList.metaData,            
            botSummary: results.botSummary        
        }        
        callback(null,resultObj);
        return;
    });
}

botsNewService.executeBots = function executeBots(botsId,reqBody,userName,executionType,schedulerCallCheck,callback){
    var botId = null;
    async.waterfall([
        function(next) {
            botsDao.getBotsByBotId(botsId, next);
        },
        function(bots,next){
            botId = bots[0]._id;
            if(reqBody !== null && reqBody !== '' && bots[0].type === 'script' && schedulerCallCheck === false){
                encryptedParam(reqBody.params,next);
            }else if(bots[0].type === 'blueprints'){
                next(null,reqBody);
            }else {
                next(null,reqBody.params);
            }
        },
        function(paramObj,next) {
            if(schedulerCallCheck === false) {
                botsDao.updateBotsDetail(botId, {params: paramObj}, next);
            }else{
                next(null,paramObj);
            }
        },
        function(updateStatus,next) {
            botsDao.getBotsById(botId, next);
        },
        function(botDetails,next) {
            if(botDetails.length > 0){
                async.parallel({
                    executor: function (callback) {
                        async.waterfall([
                            function(next){
                                var actionObj={
                                    auditType:'BOTsNew',
                                    auditCategory:reqBody.category,
                                    status:'running',
                                    action:'BOTs Execution',
                                    actionStatus:'running',
                                    catUser:userName
                                };
                                var auditTrailObj = {
                                    name:botDetails[0].name,
                                    type:botDetails[0].action,
                                    description:botDetails[0].desc,
                                    category:botDetails[0].category,
                                    executionType:botDetails[0].type,
                                    manualExecutionTime:botDetails[0].manualExecutionTime
                                };
                                auditTrailService.insertAuditTrail(botDetails[0],auditTrailObj,actionObj,next);
                            },
                            function(auditTrail,next){
                                var uuid = require('node-uuid');
                                auditTrail.actionId = uuid.v4();
                                if (botDetails[0].type === 'script') {
                                    scriptExecutor.execute(botDetails[0],auditTrail, userName,executionType, next);
                                }else if(botDetails[0].type === 'chef'){
                                    chefExecutor.execute(botDetails[0],auditTrail, userName, executionType, next);
                                }else if(botDetails[0].type === 'blueprints'){
                                    blueprintExecutor.execute(botDetails[0],auditTrail, userName,reqBody,next);
                                }else{
                                    var err = new Error('Invalid BOTs Type');
                                    err.status = 400;
                                    err.msg = 'Invalid BOTs Type';
                                    callback(err, null);
                                }
                            }

                        ],function(err,executionResult){
                            if(err){
                                callback(err,null);
                                return;
                            }else{
                               callback(null,executionResult);
                               return;
                            }
                        })
                    },
                    bots: function (callback) {
                        if(botDetails[0].type === 'script' || botDetails[0].type === 'chef' || botDetails[0].type === 'jenkins' || botDetails[0].type === 'blueprint') {
                            var botExecutionCount = botDetails[0].executionCount + 1;
                            var botUpdateObj = {
                                executionCount: botExecutionCount,
                                lastRunTime: new Date().getTime()
                            }
                            botsDao.updateBotsDetail(botId, botUpdateObj, callback);
                        }else{
                            var err = new Error('Invalid BOTs Type');
                            err.status = 400;
                            err.msg = 'Invalid BOTs Type';
                            callback(err, null);
                        }
                    }
                },function(err,data) {
                    if(err){
                        next(err,null);
                    }else {
                        next(null, data.executor);
                    }
                });
            }else {
               next(null,botDetails);
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

botsNewService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId,callback){
    async.waterfall([
        function(next) {
            botsDao.getBotsByGitHubId(gitHubId,next);
        },
        function(botDetails,next) {
            if(botDetails.length > 0) {
                var count = 0;
                for (var i = 0; i < botDetails.length; i++) {
                    (function (botDetail) {
                        fileUpload.removeFileByFileId(botDetail.ymlDocFileId, function (err, data) {
                            if (err) {
                                logger.error("There are some error in deleting yml file.", err, botDetail.ymlDocFileId);
                            }
                            count++;
                            if (count === botDetails.length) {
                                next(null, botDetails);
                            }
                        })
                    })(botDetails[i]);
                }
            }else {
                next(null, botDetails);
            }
        },
        function(gitHubSyncStatus,next) {
            var  gitHubService = require('_pr/services/gitHubService.js');
            gitHubService.getGitHubById(gitHubId,next);
        },
        function(gitHubDetails,next){
            if(gitHubDetails !== null){
                var gitHubDirPath = appConfig.gitHubDir + gitHubDetails._id;
                fileHound.create()
                    .paths(gitHubDirPath)
                    .ext('yaml')
                    .find().then(function(files){
                    if(files.length > 0){
                        var botObjList = [];
                        for(var i = 0; i < files.length; i++){
                            (function(ymlFile){
                                yamlJs.load(ymlFile, function(result) {
                                    if(result !== null){
                                       fileUpload.uploadFile(result.id,ymlFile,null,function(err,ymlDocFileId){
                                            if(err){
                                                logger.error("Error in uploading yaml documents.",err);
                                                next(err);
                                            }else{
                                                var botsObj={
                                                    ymlJson:result,
                                                    name:result.name,
                                                    gitHubId:gitHubDetails._id,
                                                    gitHubRepoName:gitHubDetails.repositoryName,
                                                    id:result.id,
                                                    desc:result.desc,
                                                    category:result.botCategory?result.botCategory:result.functionality,
                                                    action:result.action,
                                                    execution:result.execution,
                                                    type:result.type,
                                                    inputFormFields:result.input[0].form,
                                                    outputOptions:result.output,
                                                    ymlDocFilePath:ymlFile,
                                                    ymlDocFileId:ymlDocFileId,
                                                    orgId:gitHubDetails.orgId,
                                                    orgName:gitHubDetails.orgName
                                                }
                                                botsDao.getBotsByBotId(result.id,function(err,botsList){
                                                    if(err){
                                                        logger.error(err);
                                                        botObjList.push(err);
                                                        if(botObjList.length === files.length){
                                                            next(null,botObjList);
                                                        }
                                                    }else if(botsList.length > 0){
                                                        botsDao.updateBotsDetail(botsList[0]._id,botsObj,function(err,updateBots){
                                                            if(err){
                                                                logger.error(err);
                                                            }
                                                            botObjList.push(botsObj);
                                                            if(botObjList.length === files.length){
                                                                next(null,botObjList);
                                                            }
                                                        })
                                                    }else{
                                                        botsDao.createNew(botsObj,function(err,data){
                                                            if(err){
                                                                logger.error(err);
                                                            }
                                                            botObjList.push(botsObj);
                                                            if(botObjList.length === files.length){
                                                                next(null,botObjList);
                                                            }
                                                        });
                                                    }
                                                })
                                            }
                                        })
                                    }else{
                                        botObjList.push(result);
                                        if(botObjList.length === files.length){
                                            next(null,botObjList);
                                        }
                                    }
                                });
                            })(files[i]);
                        }

                    }else{
                        logger.info("There is no YML files in this directory.",gitHubDirPath);
                    }
                }).catch(function(err){
                    next(err,null);
                });

            }else{
                next(null,gitHubDetails);
            }
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }else {
            callback(null, results)
            return;
        }
    });
}

botsNewService.getBotsHistory = function getBotsHistory(botId,botsQuery,callback){
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'botHistory', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'auditTrailConfig.name','masterDetails.orgName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            queryObj.queryObj.auditId = botId;
            queryObj.queryObj.auditType = 'BOTsNew';
            auditTrail.getAuditTrailList(queryObj,next)
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

botsNewService.getParticularBotsHistory = function getParticularBotsHistory(botId,historyId,callback){
    async.waterfall([
        function(next){
            botsDao.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                var query = {
                    auditType: 'BOTsNew',
                    auditId: botId,
                    actionLogId: historyId
                };
                auditTrail.getAuditTrails(query, next);

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

botsNewService.getParticularBotsHistoryLogs= function getParticularBotsHistoryLogs(botId,historyId,timestamp,callback){
    async.waterfall([
        function(next){
            botsDao.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                var logsDao = require('_pr/model/dao/logsdao.js');
                logsDao.getLogsByReferenceId(historyId, timestamp,next);
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

botsNewService.updateSavedTimePerBots = function updateSavedTimePerBots(botId,callback){
    var query = {
        auditType: 'BOTsNew',
        isDeleted: false,
        auditId: botId
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
                    && botAuditTrail[m].auditTrailConfig.manualExecutionTime
                    && botAuditTrail[m].auditTrailConfig.manualExecutionTime !== null
                    && botAuditTrail[m].actionStatus ==='success' ) {
                    var executionTime = getExecutionTime(botAuditTrail[m].endedOn, botAuditTrail[m].startedOn);
                    totalTimeInSeconds = totalTimeInSeconds + ((botAuditTrail[m].auditTrailConfig.manualExecutionTime * 60) - executionTime);
                }
            }
            var totalTimeInMinutes = Math.round(totalTimeInSeconds / 60);
            var result = {
                hours: Math.floor(totalTimeInMinutes / 60),
                minutes: totalTimeInMinutes % 60
            }
            botsDao.updateBotsDetail(botId, {savedTime: result,executionCount:botAuditTrail.length}, function (err, data) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                    return;
                }
                callback(null, data);
                return;
            })
        } else {
            callback(null, botAuditTrail);
            return;
        }
    });
}

function getExecutionTime(endTime, startTime) {
    var executionTimeInMS = endTime - startTime;
    var totalSeconds = Math.floor(executionTimeInMS / 1000);
    return totalSeconds;
}


function encryptedParam(paramDetails, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var encryptedObj = {};
    if(paramDetails !== null) {
        Object.keys(paramDetails).forEach(function(key){
            var encryptedText = cryptography.encryptText(paramDetails[key], cryptoConfig.encryptionEncoding,
                cryptoConfig.decryptionEncoding);
            encryptedObj[key]=encryptedText;
        });
        callback(null,encryptedObj);
    }else{
        callback(null,encryptedObj);
    }
}

function addYmlFileDetailsForBots(bots,reqData,callback){
    if (bots.docs.length === 0) {
        return callback(null,bots);
    }else{
        var botsList =[];
        var botsObj={};
        for(var i = 0; i <bots.docs.length; i++){
            (function(bot){
                fileUpload.getReadStreamFileByFileId(bot.ymlDocFileId,function(err,file){
                    if(err){
                        var err = new Error('Internal server error');
                        err.status = 500;
                        return callback(err,null);
                    }else{
                        botsObj = {
                            _id:bot._id,
                            name:bot.name,
                            gitHubId:bot.gitHubId,
                            id:bot.id,
                            desc:bot.desc,
                            action:bot.action,
                            category:bot.category,
                            type:bot.type,
                            inputFormFields:bot.inputFormFields,
                            outputOptions:bot.outputOptions,
                            ymlDocFilePath:bot.ymlDocFilePath,
                            ymlDocFileId:bot.ymlDocFileId,
                            orgId:bot.orgId,
                            orgName:bot.orgName,
                            ymlFileName: file.fileName,
                            ymlFileData: file.fileData,
                            isScheduled:bot.isScheduled,
                            manualExecutionTime:bot.manualExecutionTime,
                            executionCount:bot.executionCount,
                            scheduler:bot.scheduler,
                            createdOn:bot.createdOn,
                            lastRunTime:bot.lastRunTime,
                            savedTime:bot.savedTime
                        }
                        botsList.push(botsObj);
                        if (botsList.length === bots.docs.length) {
                            var alaSql = require('alasql');
                            var sortField=reqData.mirrorSort;
                            var sortedField=Object.keys(sortField)[0];
                            var sortedOrder = reqData.mirrorSort ? (sortField[Object.keys(sortField)[0]]==1 ?'asc' :'desc') : '';
                            if(sortedOrder ==='asc'){
                                bots.docs = alaSql( 'SELECT * FROM ? ORDER BY '+sortedField+' ASC',[botsList]);
                            }else{
                                bots.docs = alaSql( 'SELECT * FROM ? ORDER BY '+sortedField+' DESC',[botsList]);
                            }
                            return callback(null, bots);
                        }
                    }
                })
            })(bots.docs[i]);
        }
    }
}
