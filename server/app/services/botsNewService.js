
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
const fileHound= require('filehound');
const yamlJs= require('yamljs');
const gitHubService = require('_pr/services/gitHubService.js');

const errorType = 'botsNewService';

var botsNewService = module.exports = {};

botsNewService.updateBotsScheduler = function updateBotsScheduler(botId,botObj,callback) {
    if(botObj.scheduler  && botObj.scheduler !== null && Object.keys(botObj.scheduler).length !== 0) {
        botObj.scheduler = apiUtil.createCronJobPattern(botObj.scheduler);
        botObj.isScheduled =true;
    }else{
        botObj.scheduler ={};
        botObj.isScheduled =false;
    }
    botsDao.updateBotsDetail(botId,botObj,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else {
            callback(null, data);
            return;
        }
    });
}

botsNewService.removeBotsById = function removeBotsById(botId,callback){
    botsDao.removeBotsById(botId,function(err,data){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        callback(null,data);
        return;
    });
}

botsNewService.getBotsList = function getBotsList(botsQuery,actionStatus,callback) {
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
                        botsDao.getBotsList(queryObj, next);
                    } else {
                        queryObj.queryObj.botId = null;
                        botsDao.getBotsList(queryObj, next);
                    }
                });
            }else{
                botsDao.getBotsList(queryObj, next);
            }
        },
        function(botList, next) {
            addYmlFileDetailsForBots(botList,next);
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

botsNewService.executeBots = function executeBots(botId,reqBody,callback){
    async.waterfall([
        function(next){
            if(reqBody !== null
                && reqBody.scriptParams
                && reqBody.scriptParams !== null){
                encryptedParam(reqBody.scriptParams,next);
            }else{
                next(null,[]);
            }
        },
        function(encryptedParamList,next) {
            if(encryptedParamList.length > 0){
                botsDao.updateBotsDetail(botId,{params:encryptedParamList},function(err,botsData){
                    if(err){
                        next(err);
                    }else{
                        botsDao.getBotsById(botId, next);
                    }
                })
            }else {
                botsDao.getBotsById(botId, next);
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
            async.parallel({
                botsSync: function(callback){
                    botsDao.removeBotsByGitHubId(gitHubId,callback);
                },
                fileSync: function(callback){
                    if(botDetails.length > 0){
                        var count = 0;
                        for(var  i = 0 ; i < botDetails.length; i++){
                            (function(botDetail){
                                fileUpload.removeFileByFileId(botDetail.ymlDocFileId,function(err,data){
                                    if(err){
                                        logger.error("There are some error in deleting yml file.",err,botDetail.ymlDocFileId);
                                    }
                                    count++;
                                    if(count === botDetails.length){
                                        callback(null,botDetails);
                                    }
                                })
                            })(botDetails[i]);
                        }
                    }else{
                        callback(null,botDetails);
                    }
                }
            },function(err,results){
                if(err){
                    next(err);
                }else{
                    next(null,results);
                }
            })
        },
        function(gitHubSyncStatus,next) {
            var  gitHubService = require('_pr/services/gitHubService.js');
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
                                        fileUpload.uploadFile(result.id,ymlFile,null,function(err,ymlDocFileId){
                                            if(err){
                                                logger.error("Error in uploading yaml documents.",err);
                                                next(err);
                                            }else{
                                                count++;
                                                var botsObj={
                                                    name:result.name,
                                                    gitHubId:gitHubDetails._id,
                                                    id:result.id,
                                                    desc:result.desc,
                                                    category:result.category,
                                                    type:result.type,
                                                    inputFormFields:result.input[0].form,
                                                    outputOptions:result.output,
                                                    ymlDocFilePath:ymlFile,
                                                    ymlDocFileId:ymlDocFileId,
                                                    orgId:gitHubDetails.orgId,
                                                    orgName:gitHubDetails.orgName
                                                }
                                                botsDao.createNew(botsObj,function(err,data){
                                                    if(err){
                                                        logger.error(err);
                                                    }
                                                    botObjList.push(botsObj);
                                                })
                                            }
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

function encryptedParam(paramDetails, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var encryptedList = [];
    if(paramDetails.length > 0) {
        for (var i = 0; i < paramDetails.length; i++) {
            var encryptedText = cryptography.encryptText(paramDetails[i].paramVal, cryptoConfig.encryptionEncoding,
                cryptoConfig.decryptionEncoding);
            encryptedList.push({
                paramVal: encryptedText,
                paramDesc: paramDetails[i].paramDesc,
                paramType: paramDetails[i].paramType
            });
        }
        callback(null,encryptedList);
    }else{
        callback(null,encryptedList);
    }
}

function addYmlFileDetailsForBots(bots,callback){
    if (bots.docs.length === 0) {
        return callback(null,scripts);
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
                            name:bot.name,
                            gitHubId:bot._id,
                            id:bot.id,
                            desc:bot.desc,
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
                            createdOn:bot.createdOn
                            
                        }
                        botsList.push(botsObj);
                        botsObj={};
                        if (botsList.length === bots.docs.length) {
                            bots.docs = botsList;
                            return callback(null, bots);
                        }
                    }
                })
            })(bots.docs[i]);
        }
    }
}




