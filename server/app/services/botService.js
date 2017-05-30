
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
var botDao = require('_pr/model/bots/1.1/bot.js');
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
var apiExecutor = require('_pr/engine/bots/apiExecutor.js');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var uuid = require('node-uuid');
var settingService = require('_pr/services/settingsService');
var commonService = require('_pr/services/commonService');
var orgResourcePermission = require('_pr/model/org-resource-permission/orgResourcePermission.js');

const fileHound= require('filehound');
const yamlJs= require('yamljs');
const gitHubService = require('_pr/services/gitHubService.js');
var orgResourcePermission = require('_pr/model/org-resource-permission/orgResourcePermission.js');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');

const errorType = 'botService';

var botService = module.exports = {};

botService.createNew = function createNew(reqBody,callback) {
    commonService.convertJson2Yml(reqBody,function(err,ymlData){
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }else {
            botDao.createNew(ymlData, function (err, data) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                    return;
                } else {
                    callback(null, data);
                    return;
                }
            });
        }
    })
}

botService.updateBotsScheduler = function updateBotsScheduler(botId,botObj,callback) {
    if(botObj.scheduler  && botObj.scheduler !== null && Object.keys(botObj.scheduler).length !== 0 && botObj.isScheduled && botObj.isScheduled === true) {
        botObj.scheduler = apiUtil.createCronJobPattern(botObj.scheduler);
        botObj.isScheduled =true;
    }else{
        botObj.scheduler ={};
        botObj.isScheduled =false;
    }
    botDao.updateBotsDetail(botId,botObj,function(err,data) {
        if (err) {
            logger.error("Error in Updating BOTs Scheduler", err);
            callback(err, null);
            return;
        } else {
            callback(null, data);
            botDao.getBotsById(botId, function (err, botsList) {
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

botService.removeBotsById = function removeBotsById(botId,callback){
    async.parallel({
        bots: function(callback){
            botDao.removeBotsById(botId,callback);
        },
        auditTrails: function(callback){
            auditTrail.removeAuditTrails({auditId:botId},callback);
        },
        orgResourcePerm : function(callback){
        	orgResourcePermission.deleteResource(botId, 'bots', callback);
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

botService.getBotsList = function getBotsList(botsQuery,actionStatus,serviceNowCheck,userName,callback) {
    var reqData = {};
    var filterByOrg = false;
    var orgId;
    var teamId;
    var userDetail = {};
    if(botsQuery.paginationType === 'jquery'){
        async.waterfall(
            [
                function (next) {
                    apiUtil.changeRequestForJqueryPagination(botsQuery, next);
                },
                function (reqData, next) {
                    reqData = reqData;
                    apiUtil.paginationRequest(reqData, 'bots', next);
                },
                function (paginationReq, next) {
                	if(paginationReq.filterBy) {
                		orgId = paginationReq.filterBy.orgId;
                	}
                    apiUtil.databaseUtil(paginationReq, next);
                },
                function (queryObj, next) {
                    botDao.getBotsList(queryObj, function(err, result){
                    	
                    	if ( err ) {
                    		return next(err, null);
                    	}
                    	getOrgResourceList(orgId, [],function(err, orgList){
                    		
                    		if ( err ) {
                    			return next(err, null);
                    		}
                    		
                    		result.docs = filterBots(false, JSON.parse(JSON.stringify(result.docs)), orgList);
                    		return next(null, result);
                    	});
                    });
                },
                function (botList, next) {
            		apiUtil.changeResponseForJqueryPagination(botList, reqData, next);
                }

            ], function (err, results) {
                if (err){
                    return callback(err,null);
                }else{
                	return callback(null, results);
                }
            });
    }else {
	    async.waterfall([
	        function(next) {
	            apiUtil.paginationRequest(botsQuery, 'bots', next);
	        },
	        function(paginationReq, next) {
	            paginationReq['searchColumns'] = ['name', 'type', 'category','desc', 'orgName'];
	            if(paginationReq.filterBy) {
	            	orgId = paginationReq.filterBy.orgId;
	            	teamId = paginationReq.filterBy.teamId;
	            	delete paginationReq.filterBy.teamId;
	            }
	            
	            reqData = paginationReq;
	            apiUtil.databaseUtil(paginationReq, next);
	        },
	        function(queryObj, next) {
	            settingService.getOrgUserFilter(userName, function (err, orgIds) {
	                if (err) {
	                    next(err, null);
	                }
	                if(orgIds.length > 0){
	                    queryObj.queryObj['orgId'] = {$in: orgIds};
	                }
	                if(actionStatus !== null) {
	                    queryObj.queryObj['lastExecutionStatus'] = actionStatus;
	                }
	                d4dModelNew.d4dModelMastersUsers.find({
	                    loginname: userName,
	                    id:'7'
	                }, function(err, userDetails) {
	                	
	                	if ( err ) {
	                		return next(err, null);
	                	}
	                	
	                	if (userDetails.length > 0) {
	                		userDetail = userDetails[0];
	                		userDetail.orgname_rowid = (typeof userDetail.orgname_rowid[0]) !== undefined ? userDetail.orgname_rowid[0] : userDetail.orgname_rowId;
	                		userDetail.orgname = (typeof userDetail.orgname[0]) !== undefined ? userDetail.orgname[0] : userDetail.orgname;
	                	}
	                	
	                	if(serviceNowCheck === true) {
	                		queryObj.queryObj['srnSuccessExecutionCount'] = {$gt:0};
	                		var botIds = [];
	                		botDao.getAllBots(queryObj.queryObj,function(err,botData){
	                			if(err){
	                				next(err,null);
	                			}
	                			if(botData.length > 0){
	                				botData.forEach(function(bot){
	                					botIds.push(bot._id);
	                				})
	                			}
	                			if(botIds.length > 0){
	                				delete queryObj.queryObj;
	                				queryObj.queryObj = {
	                						auditId: {$in:botIds}
	                				}
	                				auditTrail.getAuditTrailList(queryObj,next);
	                			}else{
	                				botDao.getBotsList(queryObj, function(err, result){
	                					return next(err,result);
	                				});
	                			}
	                		});
	                	}else{
	                		var ids = [];
	                		if ( userDetail.userrolename === 'Admin') {
	                		
	                		   var teamIds;
	            			   if (teamId) {
	            				   filterByOrg = true;
	            				   teamIds = [teamId];
	            			   }
	            			   
	            			   getOrgResourceList((orgId || userDetail.orgname_rowid), (teamIds || [] ), function(err, orgBotsList){
	            				   
	            				   
	            				   if (filterByOrg) {
	            					   orgBotsList.forEach(function(orgBot){
	            						   ids = ids.concat(orgBot.resourceIds);
	            					   });
	            				   }
	            				   
	            				   if (ids.length > 0) {
	            					   queryObj.queryObj.id = {$in:ids};
	            				   }
	            				   botDao.getBotsList(queryObj, next);
	            			   });
		            		}else {
		            		
	 	            		   getOrgResourceList(userDetail.orgname_rowid, userDetail.teamname_rowid.split(','), function(err, orgBotsList){
	 	            			   
	 	            			  orgBotsList.forEach(function(orgBot){
            						   ids = ids.concat(orgBot.resourceIds);
            					  });
	 	            			  
	 	            			  if (ids.length > 0) {
	 	            				  queryObj.queryObj.id = {$in:ids};
	 	            			  } else {
	 	            				  return next(null, []);
	 	            			  }
	 	            			  
	 	            			  botDao.getBotsList(queryObj, next);
	 	            		   });
		 	            	}
	                	}
	                })
	            });
	        },
	        function(botList, next) {
	            addYmlFileDetailsForBots(botList,reqData,serviceNowCheck,next);
	        },
	        function(filterBotList, next) {
	           async.parallel({
	               botList:function(callback){
	                   apiUtil.paginationResponse(filterBotList, reqData, callback);
	               },
	               botSummary:function(callback){
	            	   auditTrailService.getBOTsSummary(botsQuery,'BOT',userName,callback);
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
	        };
	        return callback(null,resultObj);
	    });
    }
}

function getOrgResourceList(orgId, teamIds, callback){
	if (orgId){
	   var query = {
		   orgId : orgId,
		   resourceType : 'bots'
	   }
	   
	   if(teamIds.length > 0) {
		  query.teamId = {$in : teamIds};
	   }
	   
	   orgResourcePermission.find(query, function(err, orgResourceList){
		   if ( err ) {
			   return callback(err, null);
		   }
		   
		   if (orgResourceList.length > 0 ) {
			   var teamIds = [];
			   orgResourceList.forEach(function(orgResource){
				   teamIds.push(orgResource.teamId);
			   });
			   getTeamsInfo(orgResourceList, orgId, teamIds, function(err, result){
				   if ( err ) {
					   return callback(err, null);
				   }
				   
				   return callback(null, result);
			   });
		   } else {
			   return callback(null, []);
		   }
	   });
	} else {
		return callback(null, []);
	}
}

function filterBots(filterByOrg, botsList, orgBots){
	var bots;
	var botsTeamId = {}
	botsTeamId = orgBots.reduce(function(acc, cv, ci){
		cv.resourceIds.forEach(function(rId){
			if(acc[rId] === undefined){
				acc[rId] = {
					teams : [cv.team]
				};
			} else {
				acc[rId].teams.push(cv.team);
			}
			return acc;
		});
		return acc;
	},{});
	
	bots = botsList.filter(function(bot){
		if (botsTeamId[bot.id]){
			bot.teams = botsTeamId[bot.id].teams;
		}
		
		if (filterByOrg) {
			if (botsTeamId[bot.id] !== undefined){
				return true;
			}
			
			return false;
		}
		
		return true;
	});
	
	return bots;
}

function getTeamsInfo(result, orgId, teamIds, cb){
   
	var query = {
		orgname_rowid : orgId,
		id : '21'
	};
	
	if (teamIds.length > 0 ){
		query.rowid = {$in:teamIds}; 
	}
	
   d4dModelNew.d4dModelMastersTeams.find(query, function(err, teamList){
	   if (err) {
		   return cb(err);
	   }
	   
	   result.forEach(function(orgResource){
		   teamList.forEach(function(t){
			   if(orgResource.teamId === t.rowid){
				   orgResource.team = {
					   teamId : t.rowid,
					   teamName : t.teamname
				   };
			   }
		   });
	   });
	   
	   return cb(null, result);
   });
}

botService.executeBots = function executeBots(botsId,reqBody,userName,executionType,schedulerCallCheck,callback){
    var botId = null;
    var botRemoteServerDetails = {}
    async.waterfall([
        function(next) {
            botDao.getBotsByBotId(botsId, next);
        },
        function(bots,next){
            if(bots.length > 0) {
                botId = bots[0]._id;
                if (reqBody !== null && reqBody !== '' && (bots[0].type === 'script' || bots[0].type === 'chef') && schedulerCallCheck === false) {
                    masterUtil.getBotRemoteServerDetailByOrgId(bots[0].orgId, function (err, botServerDetails) {
                        if (err) {
                            logger.error("Error while fetching BOTs Server Details");
                            callback(err, null);
                            return;
                        } else if (botServerDetails !== null) {
                            botRemoteServerDetails.hostIP = botServerDetails.hostIP;
                            botRemoteServerDetails.hostPort = botServerDetails.hostPort;
                            next(null,bots);
                        } else {
                            var error = new Error();
                            error.message = 'BOTs Remote Engine is not configured or not in running mode';
                            error.status = 403;
                            next(error, null);
                        }
                    });

                } else {
                    next(null,bots);
                }
            }else{
                var error = new Error();
                error.message = 'There is no record available in DB against BOT : '+botsId;
                error.status = 403;
                next(error, null);
            }
        },
        function(botDetails,next) {
            if(botDetails.length > 0){
                async.parallel({
                    executor: function (callback) {
                        async.waterfall([
                            function(next){
                                var actionObj={
                                    auditType:'BOT',
                                    auditCategory:botDetails[0].type,
                                    status:'running',
                                    action:'BOT Execution',
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
                                if(schedulerCallCheck === false && reqBody.ref && reqBody.ref !== null){
                                    auditTrailObj.serviceNowTicketRefObj =  {
                                        ticketNo:reqBody.ref
                                    }
                                }
                                auditTrailService.insertAuditTrail(botDetails[0],auditTrailObj,actionObj,next);
                            },
                            function(auditTrail,next) {
                                var uuid = require('node-uuid');
                                auditTrail.actionId = uuid.v4();
                                if (botDetails[0].type === 'script') {
                                    scriptExecutor.execute(botDetails[0],reqBody, auditTrail, userName, executionType, botRemoteServerDetails,schedulerCallCheck, next);
                                }else if (botDetails[0].type === 'chef') {
                                    chefExecutor.execute(botDetails[0],reqBody, auditTrail, userName, executionType, botRemoteServerDetails,schedulerCallCheck, next);
                                }else if (botDetails[0].type === 'blueprints' || botDetails[0].type === 'blueprint') {
                                    if(schedulerCallCheck === true) {
                                        reqBody = botDetails[0].params;
                                    }
                                    blueprintExecutor.execute(botDetails[0].id,auditTrail, reqBody, userName, next);
                                }else if (botDetails[0].type === 'jenkins') {
                                    if(schedulerCallCheck === true) {
                                        reqBody = botDetails[0].params;
                                    }
                                    jenkinsExecutor.execute(botDetails[0],auditTrail, reqBody, userName, next);
                                }else if (botDetails[0].type === 'api') {
                                    if(schedulerCallCheck === true) {
                                        reqBody = botDetails[0].params;
                                    }
                                    apiExecutor.execute(botDetails[0],reqBody,auditTrail, userName,botRemoteServerDetails, next);
                                }else {
                                    var err = new Error('Invalid BOT Type');
                                    err.status = 400;
                                    err.msg = 'Invalid BOT Type';
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
                        if((botDetails[0].type === 'script' || botDetails[0].type === 'chef' || botDetails[0].type === 'jenkins' || botDetails[0].type === 'blueprints' || botDetails[0].type === 'blueprint')
                            && schedulerCallCheck === true) {
                            var botExecutionCount = botDetails[0].executionCount + 1;
                            var botUpdateObj = {
                                executionCount: botExecutionCount,
                                lastRunTime: new Date().getTime(),
                                lastExecutionStatus:"running"
                            }
                            botDao.updateBotsDetail(botId, botUpdateObj, callback);
                        } else if((botDetails[0].type === 'script' || botDetails[0].type === 'chef' || botDetails[0].type === 'jenkins' || botDetails[0].type === 'blueprints' || botDetails[0].type === 'blueprint')
                            && schedulerCallCheck === false) {
                            encryptedParam(reqBody,botDetails[0].inputFormFields,function(err,encryptData){
                                if(err){
                                    var err = new Error('Data encryption is Failed');
                                    err.status = 400;
                                    err.message = 'Data encryption is Failed';
                                    callback(err, null);
                                }else{
                                    var botExecutionCount = botDetails[0].executionCount + 1;
                                    var botUpdateObj = {
                                        executionCount: botExecutionCount,
                                        lastRunTime: new Date().getTime(),
                                        params:encryptData,
                                        lastExecutionStatus:"running"
                                    }
                                    if(reqBody.nodeIds){
                                        botUpdateObj.params.nodeIds = reqBody.nodeIds;
                                    }
                                    botDao.updateBotsDetail(botId, botUpdateObj, callback);
                                }
                            });
                        }else{
                            var err = new Error('Invalid BOT Type');
                            err.status = 400;
                            err.msg = 'Invalid BOT Type';
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

botService.syncSingleBotsWithGitHub = function syncSingleBotsWithGitHub(botId,callback){
    async.waterfall([
        function(next) {
            botDao.getBotsByBotId(botId,next);
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
                                        name: result.name,
                                        id: result.id,
                                        desc: result.desc,
                                        category: result.botCategory ? result.botCategory : result.functionality,
                                        action: result.action,
                                        execution: result.execution ? result.execution : [],
                                        manualExecutionTime: result.standardTime ? result.standardTime : 10,
                                        type: result.type,
                                        subType: result.subtype,
                                        isParameterized:result.isParameterized?result.isParameterized:false,
                                        inputFormFields: result.input[0].form,
                                        outputOptions: result.output,
                                        ymlDocFileId: ymlDocFileId,
                                        source: "GitHub"
                                    }

                                    botDao.updateBotsDetail(botsDetails[0]._id, botsObj, function (err, updateBots) {
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
                    botDao.removeBotsById(botsDetails[0]._id,next);
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


botService.syncBotsWithGitHub = function syncBotsWithGitHub(gitHubId,callback){
    async.waterfall([
        function(next) {
            async.parallel({
                gitHub:function(callback){
                    var  gitHubService = require('_pr/services/gitHubService.js');
                    gitHubService.getGitHubById(gitHubId,callback);
                },
                botsDetails:function(callback){
                    botDao.getBotsByGitHubId(gitHubId,callback);
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
                            botDao.removeBotsByGitHubId(jsonObt.gitHub._id, function (err, data) {
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
            process.setMaxListeners(100);
            if(gitHubDetails.botSync !== null){
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
                                                    name:result.name,
                                                    gitHubId:gitHubDetails.botSync._id,
                                                    gitHubRepoName:gitHubDetails.botSync.repositoryName,
                                                    gitHubRepoBranch:gitHubDetails.botSync.repositoryBranch,
                                                    id:result.id,
                                                    desc:result.desc,
                                                    category:result.botCategory?result.botCategory:result.functionality,
                                                    action:result.action,
                                                    execution:result.execution?result.execution:[],
                                                    manualExecutionTime:result.manualExecutionTime ? result.manualExecutionTime:10,
                                                    type:result.type,
                                                    subType:result.subtype,
                                                    inputFormFields:result.input && result.input !==null ? result.input[0].form:null,
                                                    outputOptions:result.output,
                                                    ymlDocFileId:ymlDocFileId,
                                                    orgId:gitHubDetails.botSync.orgId,
                                                    isParameterized:result.isParameterized?result.isParameterized:false,
                                                    orgName:gitHubDetails.botSync.orgName,
                                                    source:"GitHub"
                                                }
                                                botDao.getBotsByBotId(result.id,function(err,botsList){
                                                    if(err){
                                                        logger.error(err);
                                                        botObjList.push(err);
                                                        if(botObjList.length === files.length){
                                                            next(null,botObjList);
                                                            return;
                                                        }
                                                    }else if(botsList.length > 0){
                                                        botDao.updateBotsDetail(botsList[0]._id,botsObj,function(err,updateBots){
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
                                                        botDao.createNew(botsObj,function(err,data){
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
            botDao.getBotsByGitHubId(gitHubId,function(err,botsList){
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
                                    botDao.removeBotsById(bots._id, function (err, data) {
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

botService.getBotsHistory = function getBotsHistory(botId,botsQuery,callback){
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
            queryObj.queryObj.auditType = 'BOT';
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

botService.getParticularBotsHistory = function getParticularBotsHistory(botId,historyId,callback){
    async.waterfall([
        function(next){
            botDao.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                var query = {
                    auditType: 'BOT',
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

botService.getParticularBotsHistoryLogs= function getParticularBotsHistoryLogs(botId,historyId,callback){
    async.waterfall([
        function(next){
            botDao.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                var logsDao = require('_pr/model/dao/logsdao.js');
                var queryObj = {
                    botRefId: historyId
                }
                logsDao.getLogsDetails(queryObj,next);
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

botService.updateLastBotExecutionStatus= function updateLastBotExecutionStatus(botId,status,callback){
    async.waterfall([
        function(next){
            botDao.getBotsById(botId,next);
        },
        function(bots,next){
            if(bots.length > 0) {
                var botObj = {
                    lastExecutionStatus:status
                }
                botDao.updateBotsDetail(botId,botObj,next);
            }else{
                next({code:400, message:"Bots is not exist in DB"},null)
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


function encryptedParam(paramDetails,inputFormDetails, callback) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    var encryptedObj = {};
    if (paramDetails.type === 'script' && paramDetails.data && paramDetails.data !== null) {
        inputFormDetails.forEach(function(formField){
            if(formField.type === 'password' || formField.type === 'restricted'){
                var encryptedText = cryptography.encryptText(paramDetails.data[formField.name], cryptoConfig.encryptionEncoding,
                    cryptoConfig.decryptionEncoding);
                paramDetails.data[formField.name] = encryptedText;
            }
        })
        callback(null, paramDetails);
        return;
    }else{
        callback(null, paramDetails);
        return;
    }
}

function addYmlFileDetailsForBots(bots,reqData,serviceNowCheck,callback){
    if (bots.docs.length === 0) {
        return callback(null,bots);
    }else{
        var botsList =[];
        var botsObj={};
        for(var i = 0; i <bots.docs.length; i++){
            (function(bot){
                if(serviceNowCheck ===false) {
                    fileUpload.getReadStreamFileByFileId(bot.ymlDocFileId, function (err, file) {
                        if (err) {
                            logger.error("Error in fetching YAML Documents for : " + bot.name + " " + err);
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
                            orgName: bot.orgName,
                            ymlFileName: file !== null ? file.fileName : file,
                            ymlFileData: file !== null ? file.fileData : file,
                            isScheduled: bot.isScheduled,
                            manualExecutionTime: bot.manualExecutionTime,
                            executionCount: bot.executionCount,
                            successExecutionCount: bot.successExecutionCount,
                            failedExecutionCount: bot.failedExecutionCount,
                            srnSuccessExecutionCount: bot.srnSuccessExecutionCount,
                            scheduler: bot.scheduler,
                            createdOn: bot.createdOn,
                            lastRunTime: bot.lastRunTime,
                            savedTime: bot.savedTime,
                            source: bot.source,
                            execution:bot.execution,
                            lastExecutionStatus:bot.lastExecutionStatus
                        }
                        if(bot.type === 'jenkins') {
                            botsObj.isParameterized = bot.isParameterized;
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
                }else{
                    botDao.getBotsById(bot.auditId, function (err, botDetails) {
                        if (err) {
                            logger.error("Error in fetching BOT Details for _id: " + bot.auditId + " " + err);
                        }else {
                            fileUpload.getReadStreamFileByFileId(botDetails[0].ymlDocFileId, function (err, file) {
                                if (err) {
                                    logger.error("Error in fetching YAML Documents for : " + bot.name + " " + err);
                                } else {
                                    botsObj = {
                                        _id: botDetails[0]._id,
                                        name: botDetails[0].name,
                                        gitHubId: botDetails[0].gitHubId,
                                        id: botDetails[0].id,
                                        desc: botDetails[0].desc,
                                        action: botDetails[0].action,
                                        category: botDetails[0].category,
                                        type: botDetails[0].type,
                                        subType: botDetails[0].subType,
                                        inputFormFields: botDetails[0].inputFormFields,
                                        outputOptions: botDetails[0].outputOptions,
                                        ymlDocFileId: botDetails[0].ymlDocFileId,
                                        orgId: botDetails[0].orgId,
                                        orgName: botDetails[0].orgName,
                                        ymlFileName: file !== null ? file.fileName : file,
                                        ymlFileData: file !== null ? file.fileData : file,
                                        isScheduled: botDetails[0].isScheduled,
                                        manualExecutionTime: botDetails[0].manualExecutionTime,
                                        executionCount: botDetails[0].executionCount,
                                        scheduler: botDetails[0].scheduler,
                                        createdOn: botDetails[0].createdOn,
                                        lastRunTime: botDetails[0].lastRunTime,
                                        savedTime: bot.savedTime,
                                        source: botDetails[0].source,
                                        execution:botDetails[0].execution,
                                        lastExecutionStatus: botDetails[0].lastExecutionStatus,
                                        actionLogId: bot.actionLogId
                                    }
                                    if(serviceNowCheck === true){
                                        botsObj.srnTicketNo = bot.auditTrailConfig.serviceNowTicketRefObj.ticketNo;
                                        botsObj.srnTicketLink = bot.auditTrailConfig.serviceNowTicketRefObj.ticketLink;
                                        botsObj.srnTicketShortDesc = bot.auditTrailConfig.serviceNowTicketRefObj.shortDesc;
                                        botsObj.srnTicketDesc = bot.auditTrailConfig.serviceNowTicketRefObj.desc;
                                        botsObj.srnTicketStatus = bot.auditTrailConfig.serviceNowTicketRefObj.state;
                                        botsObj.srnTicketPriority = bot.auditTrailConfig.serviceNowTicketRefObj.priority;
                                        botsObj.srnTicketResolvedBy = bot.auditTrailConfig.serviceNowTicketRefObj.resolvedBy;
                                        botsObj.srnTicketResolvedAt = bot.auditTrailConfig.serviceNowTicketRefObj.resolvedAt;
                                        botsObj.srnTicketCreatedOn = bot.auditTrailConfig.serviceNowTicketRefObj.createdOn;
                                        botsObj.srnTicketClosedAt = bot.auditTrailConfig.serviceNowTicketRefObj.closedAt;
                                        botsObj.srnTicketOpenedAt = bot.auditTrailConfig.serviceNowTicketRefObj.openedAt;
                                        botsObj.srnTicketUpdatedOn = bot.auditTrailConfig.serviceNowTicketRefObj.updatedOn;
                                        botsObj.srnTicketCategory = bot.auditTrailConfig.serviceNowTicketRefObj.category;
                                    }
                                    if(bot.type === 'jenkins') {
                                        botsObj.isParameterized = bot.isParameterized;
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
                                }
                            });
                        }
                    });
                }
            })(bots.docs[i]);
        }
    }
}
