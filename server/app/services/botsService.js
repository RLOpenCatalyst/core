
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
var bots = require('_pr/model/bots/1.0/bots.js');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var async = require("async");
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var taskService =  require('_pr/services/taskService.js');
var auditTrailService =  require('_pr/services/auditTrailService.js');
var blueprintService =  require('_pr/services/blueprintService.js');
var auditTrail = require('_pr/model/audit-trail/audit-trail.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
const fileHound= require('filehound');
const yamlJs= require('yamljs');
const gitHubService = require('_pr/services/gitHubService.js');

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
        version:botsDetail.version ? botsDetail.version : 1,
        domainNameCheck:botsDetail.domainNameCheck ? botsDetail.domainNameCheck : false,
        createdOn: new Date().getTime()
    };
    var versionsList = [];
    var versionOptional;
    if(botsDetail.blueprintConfig && botsDetail.blueprintConfig.infraManagerData && botsDetail.blueprintConfig.infraManagerData.versionsList){
        versionsList = botsDetail.blueprintConfig.infraManagerData.versionsList;
        versionOptional = versionsList[versionsList.length-1].ver;
        botsObj.version = versionOptional;
    }
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
        botObj.isBotScheduled =true;
    }else{
        botObj.botScheduler ={};
        botObj.isBotScheduled =false;
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
                        var schedulerService = require('_pr/services/schedulerService.js');
                        schedulerService.executeScheduledBots(botsData[0],function(err,data){
                            if(err){
                                logger.error("Error in executing BOTs Scheduler");
                            }
                        });
                        if (botsData[0].botLinkedCategory === 'Task') {
                            var tasks =  require('_pr/model/classes/tasks/tasks.js');
                            tasks.getTaskById(botId, function (err, task) {
                                if (err) {
                                    logger.error("Error in fetching Task details", err);
                                } else if (task.isTaskScheduled === true) {
                                    tasks.updateTaskScheduler(botId, function (err, updateData) {
                                        if (err) {
                                            logger.error("Error in Updating Task details", err);
                                        }
                                    });
                                    if (task.cronJobId && task.cronJobId !== null) {
                                        var cronTab = require('node-crontab');
                                        cronTab.cancelJob(task.cronJobId);
                                    }
                                }
                            });
                        }
                    }else{
                        var schedulerService = require('_pr/services/schedulerService.js');
                        schedulerService.executeScheduledBots(botsData[0],function(err,data){
                            if(err){
                                logger.error("Error in executing BOTs Scheduler");
                            }
                        });
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

botsService.getBotsList = function getBotsList(botsQuery,actionStatus,serviceNowCheck,callback) {
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'bots', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['botName', 'botType', 'botCategory','botDesc', 'botLinkedCategory','botLinkedSubCategory', 'masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            if(actionStatus !== null){
                var query = {
                    auditType: 'BOTs',
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
                        queryObj.queryObj.botId = {$in:botsIds};
                        bots.getBotsList(queryObj, next);
                    } else {
                        queryObj.queryObj.botId = null;
                        bots.getBotsList(queryObj, next);
                    }
                });
            }else if(serviceNowCheck === true){
                var query = {
                    auditType: 'BOTs',
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
                        queryObj.queryObj.botId = {$in:botsIds};
                        bots.getBotsList(queryObj, next);
                    } else {
                        queryObj.queryObj.botId = null;
                        bots.getBotsList(queryObj, next);
                    }
                });
            } else{
                bots.getBotsList(queryObj, next);
            }
        },
        function(botList, next) {
            filterScriptBotsData(botList,next);
        },
        function(botList, next) {
            if(serviceNowCheck=== true){
                filterDataForServiceNow(botList,next);
            }else{
                next(null,botList);
            }
        },
        function(filterBotList, next) {
            apiUtil.paginationResponse(filterBotList, reqData, next);
        }
    ],function(err, results) {
        if (err){
            logger.error(JSON.stringify(err));
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

botsService.getBotsHistory = function getBotsHistory(botId,botsQuery,serviceNowCheck,callback){
    var reqData = {};
    async.waterfall([
        function(next) {
            apiUtil.paginationRequest(botsQuery, 'botHistory', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'auditTrailConfig.name','masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {
            queryObj.queryObj.auditId = botId;
            queryObj.queryObj.auditType = 'BOTs';
            if(serviceNowCheck === true){
                queryObj.queryObj.user = 'servicenow';
            }
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

botsService.updateSavedTimePerBots = function updateSavedTimePerBots(botId,callback){
    var query = {
        auditType: 'BOTs',
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
            bots.updateBotsDetail(botId, {savedTime: result,executionCount:botAuditTrail.length}, function (err, data) {
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

botsService.getPerticularBotsHistory = function getPerticularBotsHistory(botId,historyId,callback){
    async.waterfall([
        function(next){
            bots.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                if (bots[0].botLinkedCategory === 'Task') {
                    var query = {
                        auditType: 'BOTs',
                        auditId: botId,
                        auditHistoryId: historyId
                    };
                    auditTrail.getAuditTrails(query, next);
                }else{
                    var query = {
                        "auditType": 'BOTs',
                        "auditId": botId,
                        "auditTrailConfig.nodeIdsWithActionLog": {$elemMatch:{actionLogId:ObjectId(historyId)}}
                    };
                    auditTrail.getAuditTrails(query, next);
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

botsService.executeBots = function executeBots(botId,reqBody,callback){
    async.waterfall([
        function(next){
            if(reqBody !== null
                && reqBody.paramOptions
                && reqBody.paramOptions.scriptParams
                && reqBody.paramOptions.scriptParams !== null){
                encryptedParam(reqBody.paramOptions.scriptParams,next);
            }else{
                next(null,[]);
            }
        },
        function(encryptedParamList,next) {
            if (encryptedParamList.length > 0){
                async.parallel({
                    bot: function (callback) {
                        var botObj = {
                            'botConfig.scriptDetails':encryptedParamList
                        }
                        bots.updateBotsDetail(botId,botObj,callback);
                    },
                    task: function (callback) {
                        var taskObj = {
                            'taskConfig.scriptDetails':encryptedParamList
                        }
                        var tasks =  require('_pr/model/classes/tasks/tasks.js');
                        tasks.updateTaskDetail(botId,taskObj,callback);
                    }
                }, function (err, data) {
                    if (err) {
                        next(err);
                    } else {
                        bots.getBotsById(botId, next);
                    }
                })
            }else{
                bots.getBotsById(botId, next);
            }
        },
        function(bots,next){
            if(bots.length > 0){
                if(bots[0].botLinkedCategory === 'Task'){
                    if(reqBody === null) {
                        taskService.executeTask(botId, 'system', 'undefined', 'undefined', 'undefined',  'undefined', 'undefined', callback);
                    }else{
                        taskService.executeTask(botId, reqBody.userName ? reqBody.userName : 'system', reqBody.hostProtocol ? reqBody.hostProtocol : 'undefined',
                            reqBody.choiceParam ? reqBody.choiceParam : 'undefined', reqBody.appData ? reqBody.appData : 'undefined', reqBody.paramOptions ? reqBody.paramOptions : 'undefined',
                            reqBody.tagServer ? reqBody.tagServer : 'undefined', callback);
                    }
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

botsService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId,callback){
    async.waterfall([
        function(next) {
            gitHubService.getGitHubById(gitHubId,next);
        },
        function(gitHubDetails,next){
            if(gitHubDetails !== null){
                var gitHubDirPath = appConfig.gitHubDir + gitHubDetails.repositoryName;
                fileHound.create()
                    .paths(gitHubDirPath)
                    .ext('yaml')
                    .find().then(function(files){
                    if(files.length > 0){
                        var count = 0;
                        var botObjList = [];
                        for(var i = 0; i < files.length; i++){
                            (function(ymlFile){
                                yamlJs.load(ymlFile, function(result) {
                                    if(result !== null){
                                        count++;
                                        var botsObj={
                                            name:result.name,
                                            id:result.id,
                                            desc:result.desc,
                                            category:result.category,
                                            type:result.type,
                                            inputFormFields:result.input.form,
                                            outputOptions:result.output,
                                            ymlDocFilePath:ymlFile,
                                            orgId:gitHubDetails.orgId,
                                            orgName:gitHubDetails.orgName
                                        }
                                        botsDao.createNew(botsObj,function(err,data){
                                            if(err){
                                                logger.error(err);
                                            }
                                            botObjList.push(botsObj);
                                        })
                                    }else{
                                        count++;
                                    }
                                    if(count === files.length){
                                        next(null,botObjList);
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

function filterScriptBotsData(data,callback){
    var botsList = [];
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    if(data.docs.length === 0){
        callback(null,data);
        return;
    }else {
        for (var i = 0; i < data.docs.length; i++) {
            (function (bots) {
                if ((bots.botLinkedSubCategory === 'script')
                    && ('scriptDetails' in bots.botConfig)
                    && (bots.botConfig.scriptDetails.length > 0)) {
                    var scriptCount = 0;
                    for (var j = 0; j < bots.botConfig.scriptDetails.length; j++) {
                        (function (scriptBot) {
                            if (scriptBot.scriptParameters.length > 0) {
                                scriptCount++;
                                for (var k = 0; k < scriptBot.scriptParameters.length; k++) {
                                    if (scriptBot.scriptParameters[k].paramType === '' || scriptBot.scriptParameters[k].paramType === 'Default' || scriptBot.scriptParameters[k].paramType === 'Password') {
                                        scriptBot.scriptParameters[k].paramVal = cryptography.decryptText(scriptBot.scriptParameters[k].paramVal, cryptoConfig.decryptionEncoding,
                                            cryptoConfig.encryptionEncoding);
                                    } else {
                                        scriptBot.scriptParameters[k].paramVal = '';
                                    }
                                }
                            } else {
                                scriptCount++;
                            }
                        })(bots.botConfig.scriptDetails[j]);
                    }
                    if (scriptCount === bots.botConfig.scriptDetails.length) {
                        botsList.push(bots);
                        if (botsList.length === data.docs.length) {
                            data.docs = botsList;
                            callback(null, data);
                            return;
                        }
                    }
                } else {
                    botsList.push(bots);
                    if (botsList.length === data.docs.length) {
                        data.docs = botsList;
                        callback(null, data);
                        return;
                    }
                }
            })(data.docs[i]);
        }
    }
}

function encryptedParam(paramDetails, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    for (var i = 0; i < paramDetails.length; i++) {
        if (paramDetails[i].scriptParameters.length > 0) {
            for (var j = 0; j < paramDetails[i].scriptParameters.length; j++) {
                var encryptedText = cryptography.encryptText(paramDetails[i].scriptParameters[j].paramVal, cryptoConfig.encryptionEncoding,
                    cryptoConfig.decryptionEncoding);
                paramDetails[i].scriptParameters[j].paramVal = encryptedText;
            }
        }
    }
    callback(null, paramDetails)
    return;
}

function getExecutionTime(endTime, startTime) {
    var executionTimeInMS = endTime - startTime;
    var totalSeconds = Math.floor(executionTimeInMS / 1000);
    return totalSeconds;
}

function filterDataForServiceNow(botList,callback){
    if(botList.docs.length > 0){
        var resultList = [];
        for(var i = 0; i < botList.docs.length; i++){
            (function(bot){
                var query={
                    auditType:'BOTs',
                    actionStatus:'success',
                    isDeleted:false,
                    user:'servicenow',
                    auditId:bot.botId
                };
                auditTrail.getAuditTrails(query, function(err,botsAudits){
                    if(err){
                        logger.error(err);
                    }
                    bot.executionCount = botsAudits.length;
                    var totalTimeInSeconds = 0;
                    for (var m = 0; m < botsAudits.length; m++) {
                        if (botsAudits[m].endedOn && botsAudits[m].endedOn !== null
                            && botsAudits[m].auditTrailConfig.manualExecutionTime
                            && botsAudits[m].auditTrailConfig.manualExecutionTime !== null) {
                            var executionTime = getExecutionTime(botsAudits[m].endedOn, botsAudits[m].startedOn);
                            totalTimeInSeconds = totalTimeInSeconds + ((botsAudits[m].auditTrailConfig.manualExecutionTime * 60) - executionTime);
                        }
                    }
                    var totalTimeInMinutes = Math.round(totalTimeInSeconds / 60);
                    var result = {
                        hours: Math.floor(totalTimeInMinutes / 60),
                        minutes: totalTimeInMinutes % 60
                    }
                    bot.savedTime = result;
                    resultList.push(bot);
                    if(resultList.length === botList.docs.length){
                        botList.docs = resultList;
                        callback(null,botList);
                        return;
                    }

                });
            })(botList.docs[i]);
        }

    }else{
        callback(null,botList);
    }
}





