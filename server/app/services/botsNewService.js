
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
var appConfig = require('_pr/config');
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

botsNewService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId,callback){
    async.waterfall([
        function(next) {
            botsDao.removeBotsByGitHubId(gitHubId,next);
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
                                        count++;
                                        var botsObj={
                                            name:result.name,
                                            gitHubId:gitHubDetails._id,
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




