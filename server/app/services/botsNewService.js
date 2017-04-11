
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
var jenkinsExecutor = require('_pr/engine/bots/jenkinsExecutor.js');
var fileIo = require('_pr/lib/utils/fileio');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var uuid = require('node-uuid');


const fileHound= require('filehound');
const yamlJs= require('yamljs');
const gitHubService = require('_pr/services/gitHubService.js');

const errorType = 'botsNewService';

var botsNewService = module.exports = {};

botsNewService.createNew = function createNew(reqBody,callback) {
    fileUpload.getReadStreamFileByFileId(reqBody.fileId, function (err, fileDetail) {
        if (err) {
            logger.error("Error in reading YAML File.");
            callback(err, null);
            return;
        } else {
            var fileName = uuid.v4() + '_' + fileDetail.fileName;
            var desPath = appConfig.scriptDir + fileName;
            fileIo.writeFile(desPath, fileDetail.fileData, false, function (err) {
                if (err) {
                    logger.error("Unable to write file");
                    callback(err, null);
                    return;
                } else {
                    yamlJs.load(desPath, function (result) {
                        if (result !== null) {
                            var paramObj = {};
                            if (reqBody.type === 'chef') {
                                paramObj = {
                                    data: {
                                        runlist: reqBody.runlist,
                                        attributes: reqBody.attributes
                                    }
                                }
                            } else if (reqBody.type === 'script') {
                                paramObj = {
                                    scriptId: reqBody.scriptId,
                                    data: reqBody.params
                                }
                            } else if (reqBody.type === 'jenkins') {
                                paramObj = {
                                    jenkinsServerId: reqBody.jenkinsServerId,
                                    jenkinsBuildName: reqBody.jenkinsBuildName,
                                    data: reqBody.params
                                }
                            } else {
                                paramObj = paramObj;
                            }
                            var botsObj = {
                                ymlJson: result,
                                name: result.name,
                                id: result.id,
                                desc: result.desc,
                                category: reqBody.category,
                                action: result.action,
                                execution: result.execution,
                                type: reqBody.type,
                                subType: reqBody.subType,
                                inputFormFields: result.input[0].form,
                                outputOptions: result.output,
                                ymlDocFileId: reqBody.fileId,
                                orgId: reqBody.orgId,
                                orgName: reqBody.orgName,
                                manualExecutionTime: reqBody.standardTime,
                                params: paramObj,
                                source: "Catalyst"
                            }
                            botsDao.createNew(botsObj, function (err, data) {
                                if (err) {
                                    logger.error(err);
                                    callback(err, null);
                                    removeScriptFile(desPath);
                                    return;
                                } else {
                                    callback(null, data);
                                    removeScriptFile(desPath);
                                    return;
                                }
                            });

                        }
                    })
                }
            });
        }
    });
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
                    //user: 'servicenow',
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
    var botRemoteServerDetails = {}
    async.waterfall([
        function(next) {
            botsDao.getBotsByBotId(botsId, next);
        },
        function(bots,next){
            botId = bots[0]._id;
            if(reqBody !== null && reqBody !== '' && (bots[0].type === 'script' || bots[0].type === 'chef') && schedulerCallCheck === false){
                masterUtil.getBotRemoteServerDetailByOrgId(bots[0].orgId,function(err,botServerDetails) {
                    if (err) {
                        logger.error("Error while fetching BOTs Server Details");
                        callback(err, null);
                        return;
                    } else if (botServerDetails !== null) {
                        botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                        botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                        encryptedParam(reqBody.data, next);
                    } else {
                        var error = new Error();
                        error.message = 'BOTs Remote Engine is not configured or not in running mode';
                        error.status = 403;
                        next(error, null);
                    }
                });

            }else if(bots[0].type === 'blueprints'){
                next(null,reqBody);
            }else if(schedulerCallCheck === false && (bots[0].type === 'script' || bots[0].type === 'chef')){
                masterUtil.getBotRemoteServerDetailByOrgId(bots[0].orgId,function(err,botServerDetails) {
                    if (err) {
                        logger.error("Error while fetching BOTs Server Details");
                        callback(err, null);
                        return;
                    } else if (botServerDetails !== null) {
                        botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                        botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                        next(null,reqBody.data);
                    } else {
                        var error = new Error();
                        error.message = 'BOTs Remote Engine is not configured or not in running mode';
                        error.status = 403;
                        next(error, null);
                    }
                });
            }else{
                next(null,reqBody);
            }
        },
        function(paramObj,next) {
            if(schedulerCallCheck === false) {
                var botObj = {
                    params: {
                        data: paramObj,
                        nodeIds:[]
                    }
                }
                if(reqBody.nodeIds){
                    botObj.params.nodeIds = reqBody.nodeIds;
                }
                botsDao.updateBotsDetail(botId,botObj, next);
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
                                    auditCategory:botDetails[0].type,
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
                            function(auditTrail,next) {
                                var uuid = require('node-uuid');
                                auditTrail.actionId = uuid.v4();
                                if (botDetails[0].type === 'script') {
                                    scriptExecutor.execute(botDetails[0], auditTrail, userName, executionType, botRemoteServerDetails, next);
                                } else if (botDetails[0].type === 'chef') {
                                    chefExecutor.execute(botDetails[0], auditTrail, userName, executionType, botRemoteServerDetails, next);
                                } else if (botDetails[0].type === 'blueprints') {
                                    if (schedulerCallCheck === true) {
                                        reqBody = botDetails[0].params.data;
                                    }
                                    blueprintExecutor.execute(auditTrail, reqBody, userName, next);
                                } else if (botDetails[0].type === 'jenkins') {
                                    jenkinsExecutor.execute(botDetails[0],auditTrail, reqBody, userName, next);
                                } else {
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
                        if(botDetails[0].type === 'script' || botDetails[0].type === 'chef' || botDetails[0].type === 'jenkins' || botDetails[0].type === 'blueprints') {
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

botsNewService.syncSingleBotsWithGitHub = function syncSingleBotsWithGitHub(botId,callback){
    async.waterfall([
        function(next) {
            botsDao.getBotsByBotId(botId,next);
        },
        function(botsDetails,next){
            if(botsDetails.length > 0) {
                fileUpload.getReadStreamFileByFileId(botsDetails[0].ymlDocFileId, function (err, fileData) {
                    if (err) {
                        next(err, null);
                        return;
                    } else {
                        fileUpload.removeFileByFileId(botsDetails[0].ymlDocFileId, function (err, data) {
                            if (err) {
                                next(err, null);
                                return;
                            } else {
                                next(null, fileData, botsDetails);
                                return;
                            }
                        })
                    }
                });
            }else{
                next({errCode:400,errMsg:"BOTs is not available"},null);
                return;
            }
        },
        function(ymlFileDetails,botsDetails,next) {
            var botFactoryDirPath = appConfig.botCurrentFactoryDir;
            fileHound.create()
                .paths(botFactoryDirPath)
                .match(ymlFileDetails.fileName+'.yaml')
                .find().then(function (files) {
                if (files.length > 0) {
                    yamlJs.load(files[0], function (result) {
                        if (result !== null) {
                            fileUpload.uploadFile(result.id, files[0], null, function (err, ymlDocFileId) {
                                if (err) {
                                    logger.error("Error in uploading yaml documents.", err);
                                    next(err, null);
                                } else {
                                    var botsObj = {
                                        ymlJson: result,
                                        name: result.name,
                                        id: result.id,
                                        desc: result.desc,
                                        category: result.botCategory ? result.botCategory : result.functionality,
                                        action: result.action,
                                        execution: result.execution ? result.execution : [],
                                        manualExecutionTime: result.standardTime ? result.standardTime : 10,
                                        type: result.type,
                                        subType: result.subtype,
                                        inputFormFields: result.input[0].form,
                                        outputOptions: result.output,
                                        ymlDocFileId: ymlDocFileId,
                                        source: "GitHub"
                                    }

                                    botsDao.updateBotsDetail(botsDetails[0]._id, botsObj, function (err, updateBots) {
                                        if (err) {
                                            logger.error(err);
                                            callback(err,null);
                                            return;
                                        }else{
                                            callback(null,updateBots);
                                            return;
                                        }
                                    })

                                }
                            });
                        } else {
                            next({errCode:400,errMsg:"Error in Uploading YML."},null);
                            return;
                        }
                    });
                } else {
                    logger.debug("YML is not available there.")
                    botsDao.removeBotsById(botsDetails[0]._id,next);
                    //next({errCode:400,errMsg:"YML is not available there."},null);
                    return;
                }
            })
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


botsNewService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId,callback){
    async.waterfall([
        function(next) {
            async.parallel({
                gitHub:function(callback){
                    var  gitHubService = require('_pr/services/gitHubService.js');
                    gitHubService.getGitHubById(gitHubId,callback);
                },
                botsDetails:function(callback){
                    botsDao.getBotsByGitHubId(gitHubId,callback);
                }
            },next);
        },
        function(jsonObt,next) {
            async.parallel({
                fileUpload: function (callback) {
                    if(jsonObt.botsDetails.length > 0) {
                        var count = 0;
                        for (var i = 0; i < jsonObt.botsDetails.length; i++) {
                            (function (botsDetail) {
                                fileUpload.removeFileByFileId(botsDetail.ymlDocFileId, function (err, data) {
                                    if (err) {
                                        logger.error("There are some error in deleting yml file.", err, botsDetail.ymlDocFileId);
                                    }
                                    count++;
                                    if (count === jsonObt.botsDetails.length) {
                                        callback(null, jsonObt.gitHub);
                                        return;
                                    }
                                })
                            })(jsonObt.botsDetails[i]);
                        }
                    }else {
                        callback(null, jsonObt.gitHub);
                        return;
                    }
                },
                botSync: function (callback) {
                    if (jsonObt.botsDetails.length > 0){
                        if (jsonObt.botsDetails[0].gitHubRepoName !== jsonObt.gitHub.repositoryName || jsonObt.botsDetails[0].gitHubRepoBranch !== jsonObt.gitHub.repositoryBranch) {
                            botsDao.removeBotsByGitHubId(jsonObt.gitHub._id, function (err, data) {
                                if (err) {
                                    logger.error("There are some error in deleting BOTs : ", err);
                                    callback(err, null);
                                    return;
                                } else {
                                    callback(null, jsonObt.gitHub);
                                    return;
                                }
                            })
                        }else{
                            callback(null, jsonObt.gitHub);
                            return;
                        }
                    }else{
                        callback(null, jsonObt.gitHub);
                        return;
                    }
                }
            }, next);
        },
        function(gitHubDetails,next){
            if(gitHubDetails.botSync !== null){
                process.setMaxListeners(50);
                var botFactoryDirPath = appConfig.botCurrentFactoryDir;
                fileHound.create()
                    .paths(botFactoryDirPath)
                    .ext('yaml')
                    .find().then(function(files){
                    if(files.length > 0){
                        var botObjList = [];
                        for(var i = 0; i < files.length; i++){
                            (function(ymlFile){
                                yamlJs.load(ymlFile, function(result) {
                                    process.on('uncaughtException', function (err) {
                                        botObjList.push(err);
                                        if(botObjList.length === files.length){
                                            next(null,botObjList);
                                            return;
                                        }
                                    });
                                    if(result !== null){
                                       fileUpload.uploadFile(result.id,ymlFile,null,function(err,ymlDocFileId){
                                           if(err){
                                               botObjList.push(err);
                                               logger.error("Error in uploading yaml documents.",err);
                                               fileUpload.removeFileByFileId(ymlDocFileId,function(err,data){
                                                   if(err){
                                                       logger.error("Error in removing YAML File. ",err);
                                                   }
                                                   if(botObjList.length === files.length){
                                                       next(null,botObjList);
                                                       return;
                                                   }
                                               });
                                           }else{
                                                var botsObj={
                                                    ymlJson:result,
                                                    name:result.name,
                                                    gitHubId:gitHubDetails.botSync._id,
                                                    gitHubRepoName:gitHubDetails.botSync.repositoryName,
                                                    gitHubRepoBranch:gitHubDetails.botSync.repositoryBranch,
                                                    id:result.id,
                                                    desc:result.desc,
                                                    category:result.botCategory?result.botCategory:result.functionality,
                                                    action:result.action,
                                                    execution:result.execution?result.execution:[],
                                                    manualExecutionTime:result.manualExecutionTime?result.manualExecutionTime:10,
                                                    type:result.type,
                                                    subType:result.subtype,
                                                    inputFormFields:result.input !==null ?result.input[0].form:result.input,
                                                    outputOptions:result.output,
                                                    ymlDocFileId:ymlDocFileId,
                                                    orgId:gitHubDetails.botSync.orgId,
                                                    orgName:gitHubDetails.botSync.orgName,
                                                    source:"GitHub"
                                                }
                                                botsDao.getBotsByBotId(result.id,function(err,botsList){
                                                    if(err){
                                                        logger.error(err);
                                                        botObjList.push(err);
                                                        if(botObjList.length === files.length){
                                                            next(null,botObjList);
                                                            return;
                                                        }
                                                    }else if(botsList.length > 0){
                                                        botsDao.updateBotsDetail(botsList[0]._id,botsObj,function(err,updateBots){
                                                            if(err){
                                                                logger.error(err);
                                                            }
                                                            botObjList.push(botsObj);
                                                            if(botObjList.length === files.length){
                                                                next(null,botObjList);
                                                                return;
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
                                                                return;
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
                                            return;
                                        }
                                    }
                                });
                            })(files[i]);
                        }

                    }else{
                        logger.info("There is no YML files in this directory.",botFactoryDirPath);
                    }
                }).catch(function(err){
                    next(err,null);
                });

            }else{
                next(null,gitHubDetails.botSync);
            }
        },
        function(botsDetails,next){
            botsDao.getBotsByGitHubId(gitHubId,function(err,botsList){
                if(err){
                    next(err,null);
                    return;
                }else if(botsList.length>0) {
                    var count = 0;
                    for (var i = 0; i < botsList.length; i++) {
                        (function (bots) {
                            fileUpload.getFileByFileId(bots.ymlDocFileId, function (err, data) {
                                if (err) {
                                    logger.error("Error in getting YAML File.", err);
                                }
                                if (data !== null) {
                                    count++;
                                    if (count === botsList.length) {
                                        next(null, botsList);
                                        return;
                                    }
                                } else {
                                    botsDao.removeBotsById(bots._id, function (err, data) {
                                        if (err) {
                                            logger.error("Error in Deleting BOTs . ", err);
                                        }
                                        count++;
                                        if (count === botsList.length) {
                                            next(null, botsList);
                                            return;
                                        }
                                    })
                                }
                            })

                        })(botsList[i]);
                    }
                }else{
                    next(null,botsDetails);
                }
            });
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

botsNewService.executeSINTLBOTs = function executeSINTLBOTs(botId,reqBody,callback){
    var actionLogId = null;
    async.waterfall([
        function(next) {
            botsDao.getBotsByBotId(botId, next);
        },
        function(botDetails,next) {
            if(botDetails.length > 0){
                actionLogId = uuid.v4();
                async.parallel({
                    execution:function(callback){
                        var actionObj={
                            auditType:'BOTsNew',
                            auditCategory:botDetails[0].type,
                            status:'running',
                            action:'BOTs Execution',
                            actionStatus:'running',
                            catUser:reqBody.userName
                        };
                        var auditTrailObj = {
                            name:botDetails[0].name,
                            type:botDetails[0].action,
                            description:botDetails[0].desc,
                            category:botDetails[0].category,
                            executionType:botDetails[0].type,
                            manualExecutionTime:botDetails[0].manualExecutionTime,
                            actionLogId:actionLogId
                        };
                        auditTrailService.insertAuditTrail(botDetails[0],auditTrailObj,actionObj,callback);
                    },
                    executionCount:function(callback){
                        var botExecutionCount = botDetails[0].executionCount + 1;
                        var botUpdateObj = {
                            executionCount: botExecutionCount,
                            lastRunTime: new Date().getTime()
                        }
                        botsDao.updateBotsDetail(botDetails[0]._id, botUpdateObj, callback);
                    }
                },function(err,result){
                    if(err){
                        next(err,null);
                        return;
                    }else{
                        var logsReferenceIds =[botDetails[0]._id,actionLogId];
                        var logsDao = require('_pr/model/dao/logsdao.js');
                        logsDao.insertLog({
                            referenceId: logsReferenceIds,
                            err: false,
                            log: 'BOTs execution started for script ' + botDetails[0].id,
                            timestamp: new Date().getTime()
                        });
                        var resultObj = {
                            botId:botId,
                            actionLogId:actionLogId,
                            status:"running"
                        }
                        next(null,resultObj);
                        checkSINTLAuditAction(actionLogId,botDetails[0],reqBody.userName,function(err,data){
                            if(err){
                                logger.error("Error in check Audit Trails for SINTL");
                            }
                        })
                        return;
                    }
                })
            }else {
                var error =new Error();
                error.message=botId+" BOT is not available in DB.";
                error.status=303
                next(error,null);
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

function checkSINTLAuditAction(actionLogId,botDetails,userName,callback){
    var every = require('every-moment');
    var timer = every(botDetails.manualExecutionTime * 60, 'seconds', function () {
        auditTrail.getAuditTrails({actionLogId:actionLogId},function(err,botAuditTrails){
            if(err){
                callback(err,null);
                timer.stop();
                return;
            }else if(botAuditTrails.length > 0 && botAuditTrails[0].status === 'running'){
                var reqObj = {
                    botId:botDetails.id,
                    actionLogId:actionLogId,
                    status:"failed",
                    userName:userName
                }
                auditTrailService.updateBOTsAction(reqObj,callback);
                timer.stop();
            }else{
                var error =new Error();
                error.message="There is no Audit Trails in DB for BOTs "+botDetails.id;
                error.status=303
                callback(error,null);
                timer.stop();
                return;
            }
        });
    })
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
                        logger.error("Error in fetching YAML Documents for : "+bot.name + " "+err);
                    }
                    botsObj = {
                        _id: bot._id,
                        name: bot.name,
                        gitHubId: bot.gitHubId,
                        id: bot.id,
                        desc: bot.desc,
                        action: bot.action,
                        category: bot.category,
                        type: bot.type,
                        subType: bot.subType,
                        inputFormFields: bot.inputFormFields,
                        outputOptions: bot.outputOptions,
                        ymlDocFileId: bot.ymlDocFileId,
                        orgId: bot.orgId,
                        subType: bot.subType,
                        orgName: bot.orgName,
                        ymlFileName: file !==null?file.fileName:file,
                        ymlFileData: file !==null?file.fileData:file,
                        isScheduled: bot.isScheduled,
                        manualExecutionTime: bot.manualExecutionTime,
                        executionCount: bot.executionCount,
                        scheduler: bot.scheduler,
                        createdOn: bot.createdOn,
                        lastRunTime: bot.lastRunTime,
                        savedTime: bot.savedTime,
                        source:bot.source
                    }
                    botsList.push(botsObj);
                    if (botsList.length === bots.docs.length) {
                        var alaSql = require('alasql');
                        var sortField = reqData.mirrorSort;
                        var sortedField = Object.keys(sortField)[0];
                        var sortedOrder = reqData.mirrorSort ? (sortField[Object.keys(sortField)[0]] == 1 ? 'asc' : 'desc') : '';
                        if (sortedOrder === 'asc') {
                            bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' ASC', [botsList]);
                        } else {
                            bots.docs = alaSql('SELECT * FROM ? ORDER BY ' + sortedField + ' DESC', [botsList]);
                        }
                        return callback(null, bots);
                    }
                })
            })(bots.docs[i]);
        }
    }
}

function removeScriptFile(filePath) {
    fileIo.removeFile(filePath, function(err, result) {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.debug("Successfully Remove file");
            return
        }
    })
}
