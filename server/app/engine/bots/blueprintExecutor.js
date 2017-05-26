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
var async = require('async');
var usersDao = require('_pr/model/users.js');
var Blueprints = require('_pr/model/blueprint');
var serviceMapService = require('_pr/services/serviceMapService.js');

const errorType = 'blueprintExecutor';

var blueprintExecutor = module.exports = {};

blueprintExecutor.execute = function execute(botId,auditTrail,reqBody,userName,callback) {
    async.waterfall([
        function (next) {
            usersDao.haspermission(userName, reqBody.type, reqBody.permissionTo, null, reqBody.permissionSet,next);
        },
        function (launchPermission, next) {
            if(launchPermission === true){
                var parallelBlueprintList=[];
                for (var i = 0; i < reqBody.blueprintIds.length; i++) {
                    (function(blueprintId) {
                        parallelBlueprintList.push(function(callback){executeBlueprint(botId,blueprintId,auditTrail,reqBody,userName,callback);});
                        if(parallelBlueprintList.length === reqBody.blueprintIds.length){
                            if(parallelBlueprintList.length > 0) {
                                async.parallel(parallelBlueprintList, function (err, results) {
                                    if (err) {
                                        logger.error(err);
                                        next(err,null);
                                        return;
                                    }
                                    logger.debug("Blueprint Execution is completed");
                                    next(null,results[0]);
                                    return;
                                })
                            }else{
                                logger.debug("There is no Blueprints right now.");
                                next(null,reqBody.blueprintIds)
                                return;
                            }
                        }
                    })(reqBody.blueprintIds[i]);
                }
            }else{
                logger.debug('No permission to ' + reqBody.permissionTo + ' on ' + reqBody.type);
                next({errCode:401,errMsg:'No permission to ' + reqBody.permissionTo + ' on ' + reqBody.type},null);
            }
        }
    ],function (err, results) {
        if (err) {
            callback(err, null);
            return;
        }
        var botAuditTrailObj = {
            botId: auditTrail.auditId,
            actionId: auditTrail.actionId
        }
        callback(null, botAuditTrailObj);
        return;
    });
};


function executeBlueprint(botId,blueprintId,auditTrail,reqBody,userName,callback){
    var stackName = null,domainName = null;
    async.waterfall([
        function (next) {
            Blueprints.getById(blueprintId,next);
        },
        function(blueprint,next){
            if(blueprint !== null) {
                if (blueprint.blueprintType === 'aws_cf' || blueprint.blueprintType === 'azure_arm') {
                    stackName = reqBody.stackName;
                    if (stackName === '' || stackName === null) {
                        next({code: 400, message: "Invalid Stack name"}, null);
                        return;
                    } else {
                        serviceMapService.getServices({name:stackName}, function (err, data) {
                            if (err) {
                                next(err, null);
                                return;
                            } else {
                                next(null, blueprint);
                                return;
                            }
                        });
                    }
                }
                else if (blueprint.domainNameCheck === true) {
                    domainName = reqBody.domainName;
                    if (domainName === '' || domainName === null) {
                        next({code: 400, message: "Invalid Domain name"}, null);
                        return;
                    } else {
                        serviceMapService.getServices({name:domainName}, function (err, data) {
                            if (err) {
                                next(err, null);
                                return;
                            } else {
                                next(null, blueprint);
                                return;
                            }
                        });
                    }
                } else {
                    next(null, blueprint);
                    return;
                }
            }else{
                logger.debug("Blueprint Does Not Exist");
                next({code:404,message:"Blueprint Does Not Exist"},null);
            }
        },
        function(blueprint,next){
            if(blueprint !== null){
                var monitorId = null,blueprintLaunchCount = 0;
                if(blueprint.executionCount) {
                    blueprintLaunchCount = blueprint.executionCount + 1;
                }else{
                    blueprintLaunchCount = 1;
                }
                Blueprints.updateBlueprintExecutionCount(blueprint._id,blueprintLaunchCount,function(err,data){
                    if(err){
                        logger.error("Error while updating Blueprint Execution Count");
                    }
                });
                if (reqBody.monitorId && reqBody.monitorId !== null && reqBody.monitorId !== 'null') {
                    monitorId = reqBody.monitorId;
                }
                blueprint.launch({
                    envId: reqBody.envId,
                    ver: reqBody.version,
                    stackName: stackName === '' || stackName === null?null:stackName,
                    domainName: domainName === '' || domainName === null?null:domainName,
                    sessionUser: userName,
                    tagServer: reqBody.tagServer,
                    monitorId: monitorId,
                    auditTrailId: auditTrail._id,
                    bot_id:botId,
                    botId:auditTrail.auditId,
                    auditType: auditTrail.auditType,
                    actionLogId:auditTrail.actionId
                },next);

            }else{
                logger.debug("Blueprint Does Not Exist");
                next({errCode:404,errMsg:"Blueprint Does Not Exist"},null);
            }
        }
    ],function (err, results) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, results);
        return;
    });
}