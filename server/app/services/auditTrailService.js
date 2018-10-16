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
var botOld = require('_pr/model/bots/1.0/botOld.js');
var botDao = require('_pr/model/bots/1.1/bot.js');
var ObjectId = require('mongoose').Types.ObjectId;

const errorType = 'auditTrailService';

var auditTrailService = module.exports = {};
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var serviceNow = require('_pr/model/servicenow/servicenow.js');
var settingService = require('_pr/services/settingsService');
var topBotList = [];

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
    if(actionObj.auditType === 'BOTOLD' || actionObj.auditType === 'BOT'){
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
    if(auditType === 'BOTOLD' || auditType === 'BOT'){
        botAuditTrail.updateBotAuditTrail(auditId,auditObj,function(err,data){
            if(err){
                logger.error(err);
                callback(err,null);
                return;
            }
            callback(null,data);
            async.parallel({
                botServiceNowSync:function(callback){
                    var botAuditTrailService = require('_pr/services/auditTrailService.js');
                    botAuditTrailService.syncCatalystWithServiceNow(auditId,function(err,data){
                        if(err){
                            logger.error("Error in updating Service Now Ticket Details:");
                            callback(err,null);
                        }else{
                            logger.debug("ServiceNow sync is Done.")
                            callback(err,null);
                        }
                    });
                },
                botExecutionLastStatus:function(callback){
                    async.waterfall([
                        function(next){
                            auditTrail.getAuditTrails({_id:new ObjectId(auditId)},next)
                        },
                        function(botAuditTrail,next){
                            if(botAuditTrail.length > 0 && auditObj.status
                                && (auditObj.status !== null || auditObj.status !== '')){
                                var botService = require('_pr/services/botService.js');
                                botService.updateLastBotExecutionStatus(botAuditTrail[0].auditId,auditObj.status,function(err,data){
                                    if(err){
                                        logger.error("Error in updating Last Execution Time Details:");
                                        callback(err,null);
                                    }else{
                                        logger.debug("ServiceNow sync is Done.")
                                        callback(err,null);
                                    }
                                });
                            }else{
                                next({code:400,message:"There is no records are available for BOTS Last Execution Status"},null);
                            }
                        },

                    ],function(err,results){
                        if(err){
                            callback(err,null);
                            return;
                        }else{
                            callback(null,results);
                            return;
                        }
                    })
                }
            },function(err,results){
                if(err){
                    logger.error(JSON.stringify(err));
                    return;
                }else{
                    logger.debug(JSON.stringify(results));
                    return;
                }
            })
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

auditTrailService.getAuditTrailListforuppermetric = function getAuditTrailList(auditTrailQuery,callback) {
    var reqData = {};
    var result = [];
   var snowbotsid = [];
   var count= new Array(31).fill(0);
   var name = [];
    // var totalcount={};
    console.log(JSON.stringify(auditTrailQuery));
    async.waterfall([
        function(next){

            settingService.getOrgUserFilter(auditTrailQuery.user,function(err,orgIds){
                logger.info('Exiting Org user filter');
                if(err){
                    next(err,null);
                }else{
                    var filterQuery = [];
                    filterQuery['orgId'] = { $in: orgIds };
                    botDao.getAllBots(filterQuery, function(errbots,topBotList){
                        if(errbots){
                            next(errbots)
                        }
                        else{
                        
                            for(var i = 0; i < topBotList.length;i++){
                                if(topBotList[i].input){
                                    logger.info("Found one with input " + topBotList[i].input.length);
                                    for(var j = 0; j < topBotList[i].input.length; j++){
                                       // logger.info(topBotList[i].input[j]["name"]);
                                        if(topBotList[i].input[j]["name"] == "sysid"){
                                            snowbotsid.push(topBotList[i]._id);
                                        }
                                    }
                                }
                            }
                           // logger.info("Fetched snowbots:" + snowbotsid);
                            next();
                            //snowbotsid.push(snowbots[i]._id);
                        }
                    });
                }

 

            });
        },
        function(next) {
            var queryObj={};
            
            //appending queryObj with auditTrailQuery
            //queryObj.auditTrailQuery = auditTrailQuery;
            queryObj.$and = [];
        

            
                console.log(auditTrailQuery);
                if(auditTrailQuery.startdate && auditTrailQuery.enddate){
                    console.log("making query");
                    var sdt = new Date(auditTrailQuery.startdate).getTime();
                    var edt = new Date(auditTrailQuery.enddate).getTime();
                    if(auditTrailQuery.startdate === auditTrailQuery.enddate){
                        edt = edt+86400000;
                        console.log("query object with and");
                        queryObj.$and.push({"startedOn":{$gte:sdt,$lt:edt}});
                    }
                    else {
                        queryObj.$and.push({"startedOn": {$gte: sdt, $lt: edt}});
                    }
                }
                console.log(JSON.stringify(queryObj));
                if(auditTrailQuery.startdate && !auditTrailQuery.enddate){
                    var sdt = new Date(auditTrailQuery.startdate).getTime();

                    queryObj.$and.push({"startedOn":{$gte:sdt}});
                }

                if(auditTrailQuery.actionStatus){
                    var actionStatusList= auditTrailQuery.actionStatus.split(',');
                    if(actionStatusList.length > 1)
                        queryObj.$and.push({"actionStatus":{$in:actionStatusList}});
                    else{
                        if(auditTrailQuery.actionStatus === "success"){
                            //to fetch all tickets in success states
                            //get all bots with sysid
                            logger.info("in success query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.$and.push({auditId : {$in:snowbotsid}});
                            queryObj.$and.push({"actionStatus" : "success"});

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }

                        else if(auditTrailQuery.actionStatus === "failed"){
                            //to fetch all tickets in failed states
                            //get all bots with sysid
                            logger.info("in failed query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.$and.push({auditId : {$in:snowbotsid}});
                            queryObj.$and.push({"actionStatus" : "failed"});

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }

                        else if(auditTrailQuery.actionStatus === "all"){
                            //to fetch all tickets 
                            //get all bots with sysid
                            logger.info("in all query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.$and.push({auditId : {$in:snowbotsid}});
                          //  queryObj.$and.push({"actionStatus" : "failed"});

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }
                    
                        else
                            queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});
                    }

                    // queryObj.queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});

                }

            
            logger.info("Query obj build completed:"+JSON.stringify(queryObj));
            auditTrail.getAuditTrails(queryObj, function(err, data){
                if(err){
                    next(err, null);
                } else {

                 console.log(data);

                 
                    for(var i=0;i<data.length-1;i++)
                    {

                        var flag = 0;
                        if (name.length != 0) {
                            // array empty or does not exist
                        
                        for(var l=0;l<name.length;l++)
                                {
                               
                                if (data[i].auditTrailConfig.name === name[l]) {

                                 flag=1;
                                  break;
                                }

                            }      
                        }
                            if(flag === 1)
                            {
                                continue;
                            }

                            else{


                                                                                                                                                                                                                                                                                                                                                                    
                        
                      var startdateforfirst = new Date(data[i].startedOn);
                      var indforfirst =  new Date(startdateforfirst).getDate();
                      count[indforfirst]=1;
                        console.log(startdateforfirst);
                       for(var j=i+1;j<data.length;j++)
                        {
                            var startdateforsecond = new Date(data[j].startedOn);

                            // For every particular BOT
                           // console.log(startdateforsecond.getDate());
                
                        if(data[i].auditId === data[j].auditId)
                        {
                            
                             var ind =  new Date(startdateforsecond).getDate();
                         
                            if(count[ind] == null || count[ind] == undefined)
                            count[ind] = 1;
                            else count[ind]++;
                  
                        }
                     }
                    
                    }
       

                   name.push(data[i].auditTrailConfig.name);

                     var item = {"name" : data[i].auditTrailConfig.name,"count" : count};
                     count= new Array(31).fill(0);
                     result.push(item);
                
                    }
                console.log(JSON.stringify(result));
                    
                next(null, result);
                }
            });
        }



    ],function(err, results) {  
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        console.log(results);
        callback(null,results)
        return;
    });
}




auditTrailService.getAuditTrailListMod = function getAuditTrailList(auditTrailQuery,callback) {
    var reqData = {};
    var snowbotsid = [];
    var result = [];
    console.log(JSON.stringify(auditTrailQuery));
    async.waterfall([
        function(next){

            settingService.getOrgUserFilter(auditTrailQuery.user,function(err,orgIds){
                logger.info('Exiting Org user filter');
                if(err){
                    next(err,null);
                }else{
                    var filterQuery = [];
                    filterQuery['orgId'] = { $in: orgIds };
                    botDao.getAllBots(filterQuery, function(errbots,topBotList){
                        if(errbots){
                            next(errbots)
                        }
                        else{
                        
                            for(var i = 0; i < topBotList.length;i++){
                                if(topBotList[i].input){
                                    logger.info("Found one with input " + topBotList[i].input.length);
                                    for(var j = 0; j < topBotList[i].input.length; j++){
                                       // logger.info(topBotList[i].input[j]["name"]);
                                        if(topBotList[i].input[j]["name"] == "sysid"){
                                            snowbotsid.push(topBotList[i]._id);
                                        }
                                    }
                                }
                            }
                           // logger.info("Fetched snowbots:" + snowbotsid);
                            next();
                            //snowbotsid.push(snowbots[i]._id);
                        }
                    });
                }

 

            });
        },
        function(next) {
            var queryObj={};
            //appending queryObj with auditTrailQuery
            //queryObj.auditTrailQuery = auditTrailQuery;
           queryObj.$and = [];
                console.log(auditTrailQuery);
                if(auditTrailQuery.startdate && auditTrailQuery.enddate){
                    console.log("making query");
                    var sdt = new Date(auditTrailQuery.startdate).getTime();
                    var edt = new Date(auditTrailQuery.enddate).getTime();
                    if(auditTrailQuery.startdate === auditTrailQuery.enddate){
                        edt = edt+86400000;
                        console.log("query object with and");
                        queryObj.$and.push({"startedOn":{$gte:sdt,$lt:edt}});
                    }
                    else {
                        queryObj.$and.push({"startedOn": {$gte: sdt, $lt: edt}});
                    }
                }
                console.log(JSON.stringify(queryObj));
                if(auditTrailQuery.startdate && !auditTrailQuery.enddate){
                    var sdt = new Date(auditTrailQuery.startdate).getTime();

                    queryObj.$and.push({"startedOn":{$gte:sdt}});
                }

                if(auditTrailQuery.actionStatus){
                    var actionStatusList= auditTrailQuery.actionStatus.split(',');
                    if(actionStatusList.length > 1)
                        queryObj.$and.push({"actionStatus":{$in:actionStatusList}});
                    else{
                        if(auditTrailQuery.actionStatus === "success"){
                            //to fetch all tickets in success states
                            //get all bots with sysid
                            logger.info("in success query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.$and.push({auditId : {$in:snowbotsid}});
                            queryObj.$and.push({"actionStatus" : "success"});

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }
                    
                        else
                            queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});
                    }

                    // queryObj.queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});

                }

            
            logger.info("Query obj build completed:"+JSON.stringify(queryObj));
            auditTrail.getAuditTrails(queryObj, function(err, data){
                if(err){
                    next(err, null);
                }else{
                             console.log(data.length);
                var item = {"totalticketsresolved" : data.length};
                result.push(item);

                next(null, result);
                }
            });
        }
    ],function(err, results) {
        if (err){
            logger.error(err);
            callback(err,null);
            return;
        }
        console.log(results);
        callback(null,results)
        return;
    });
}









auditTrailService.getAuditTrailList = function getAuditTrailList(auditTrailQuery,callback) {
    var reqData = {};
    var snowbotsid = [];
    async.waterfall([
        function(next){

            settingService.getOrgUserFilter(auditTrailQuery.user,function(err,orgIds){
                logger.info('Exiting Org user filter');
                if(err){
                    next(err,null);
                }else{
                    var filterQuery = [];
                    filterQuery['orgId'] = { $in: orgIds };
                    botDao.getAllBots(filterQuery, function(errbots,topBotList){
                        if(errbots){
                            next(errbots)
                        }
                        else{
                            console.log("TopbotList",topBotList);
                            for(var i = 0; i < topBotList.length;i++){
                                if(topBotList[i].input){
                                   // logger.info("Found one with input " + topBotList[i].input.length);
                                    for(var j = 0; j < topBotList[i].input.length; j++){
                                       // logger.info(topBotList[i].input[j]["name"]);
                                        if(topBotList[i].input[j]["name"] == "sysid"){
                                            snowbotsid.push(topBotList[i]._id);
                                        }
                                    }
                                }
                            }
                           // logger.info("Fetched snowbots:" + snowbotsid);
                            next();
                            //snowbotsid.push(snowbots[i]._id);
                        }
                    });
                }



            });
        },
        function(next) {
            apiUtil.paginationRequest(auditTrailQuery, 'auditTrails', next);
        },
        function(paginationReq, next) {
            paginationReq['searchColumns'] = ['status', 'action', 'user', 'actionStatus', 'auditTrailConfig.name','masterDetails.orgName', 'masterDetails.bgName', 'masterDetails.projectName', 'masterDetails.envName'];
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj, next) {

            //appending queryObj with auditTrailQuery
            queryObj.auditTrailQuery = auditTrailQuery;
            if(queryObj.queryObj.$and){
                if(auditTrailQuery.startdate && auditTrailQuery.enddate){
                    var sdt = new Date(auditTrailQuery.startdate).getTime();
                    var edt = new Date(auditTrailQuery.enddate).getTime();
                    if(auditTrailQuery.startdate === auditTrailQuery.enddate){
                        edt = edt+86400000;
                        queryObj.queryObj.$and.push({"startedOn":{$gte:sdt,$lte:edt}});
                    }
                    else {
                        queryObj.queryObj.$and.push({"startedOn": {$gte: sdt, $lte: edt}});
                    }
                }
                if(auditTrailQuery.startdate && !auditTrailQuery.enddate){
                    var sdt = new Date(auditTrailQuery.startdate).getTime();

                    queryObj.queryObj.$and.push({"startedOn":{$gte:sdt}});
                }

                if(auditTrailQuery.actionStatus){
                    var actionStatusList= auditTrailQuery.actionStatus.split(',');
                    if(actionStatusList.length > 1)
                        queryObj.queryObj.$and.push({"actionStatus":{$in:actionStatusList}});
                    else{
                        if(auditTrailQuery.actionStatus === "success"){
                            //to fetch all tickets in success states
                            //get all bots with sysid
                            logger.info("in success query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.queryObj.$and.push({auditId : {$in:snowbotsid}});
                            queryObj.queryObj.$and.push({"actionStatus" : "success"});
                            logger.info(JSON.stringify(queryObj));

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }else if(auditTrailQuery.actionStatus === "failed"){
                            //to fetch all tickets in success states
                            //get all bots with sysid
                            logger.info("in failure query " + snowbotsid);

                            //actionStatus:'success',

                            queryObj.queryObj.$and.push({auditId : {$in:snowbotsid}});
                            queryObj.queryObj.$and.push({"actionStatus" : "failed"});

                            //queryObj.queryObj.$and.push({"auditTrailConfig.serviceNowTicketRefObj.state":"Closed"});
                        }
                        else
                            queryObj.queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});
                    }

                    // queryObj.queryObj.$and.push({"actionStatus":auditTrailQuery.actionStatus});

                }

            }
            logger.info("Query obj build completed:"+JSON.stringify(queryObj));
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













auditTrailService.syncCatalystWithServiceNow = function syncCatalystWithServiceNow(auditTrailId,callback){
    var srnTicketNo = null;
    async.waterfall([
        function(next){
            auditTrail.getAuditTrailsById(auditTrailId,next)
        },
        function(botAuditTrail,next){
            if(botAuditTrail.length > 0 && botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj
                && (botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj !== null || botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj !== '')){
                srnTicketNo = botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj.ticketNo;
                serviceNow.getCMDBList(function(err,srnServerDetails) {
                    if (err) {
                        next(err, null);
                    } else if (srnServerDetails.length > 0) {
                        var tableName = 'incident';
                        if(botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj.tableName){
                            tableName = botAuditTrail[0].auditTrailConfig.serviceNowTicketRefObj.tableName
                        }
                        var config = {
                            username: srnServerDetails[0].servicenowusername,
                            password: srnServerDetails[0].servicenowpassword,
                            host: srnServerDetails[0].url,
                            ticketNo: srnTicketNo
                        };
                        serviceNow.getConfigItems(tableName, config, function (err, ticketData) {
                            if (err) {
                                logger.error("Error in Getting Servicenow Config Items:", err);
                                next(err, null);
                                return;
                            } else if (!ticketData.result) {
                                logger.error("ServiceNow CI data fetch error");
                                next({
                                    code: 303,
                                    message: "No Data is available in ServiceNow against ticketNo:" + srnTicketNo
                                }, null);
                                return;
                            } else {
                                var serviceNowObj = {
                                    ticketNo: srnTicketNo,
                                    number: ticketData.result.number,
                                    ticketLink: srnServerDetails[0].url + '/' + tableName + ".do?sys_id=" + srnTicketNo,
                                    shortDesc: ticketData.result.short_description,
                                    desc: ticketData.result.description,
                                    openedAt: toTimestamp(ticketData.result.opened_at),
                                    createdOn: toTimestamp(ticketData.result.sys_created_on),
                                    closedAt: toTimestamp(ticketData.result.closed_at),
                                    updatedOn: toTimestamp(ticketData.result.sys_updated_on),
                                    resolvedAt: toTimestamp(ticketData.result.resolved_at),
                                    state: checkServiceNowTicketState(ticketData.result.incident_state),
                                    priority: checkServiceNowTicketPriority(ticketData.result.priority),
                                    category: ticketData.result.category,
                                    resolvedBy:ticketData.result.resolved_by
                                };
                                var botAuditTrail = require('_pr/model/audit-trail/bot-audit-trail.js');
                                botAuditTrail.updateBotAuditTrail(auditTrailId, {
                                    'auditTrailConfig.serviceNowTicketRefObj': serviceNowObj
                                }, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                        next(err, null);
                                        return;
                                    } else {
                                        next(null, data);
                                        return;
                                    }
                                })
                            }
                        });
                    } else {
                        logger.info("There is no Service Now Server details available. Please configure first for serviceNow Syncing");
                        next(null,null);
                    }
                });
            }else{
                logger.info("There is no records are available for Service Now Ticket Sync");
                next(null,null);
            }
        }

    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
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

auditTrailService.getBOTsSummary = function getBOTsSummary(queryParam, BOTSchema, userName, callback) {
    async.waterfall([
        function(next){
            apiUtil.queryFilterBy(queryParam,next);
        },
        function(filterQuery,next) {
            filterQuery.isDeleted=false;

            if(BOTSchema === 'BOTOLD') {
                settingService.getOrgUserFilter(userName,function(err,orgIds){
                    logger.info('Exiting Org user filter');
                    if(err){
                        next(err,null);
                    }else if(orgIds.length > 0){
                        filterQuery['orgId'] = {$in:orgIds};
                        botOld.getAllBots(filterQuery, next);
                    }else{
                        botOld.getAllBots(filterQuery, next);
                    }
                });
            }else{
                settingService.getOrgUserFilter(userName,function(err,orgIds){
                    logger.info('Exiting Org user filter');
                    if(err){
                        next(err,null);
                    }else if(orgIds.length > 0){
                        filterQuery['orgId'] = { $in: orgIds };
                        botDao.getAllBots(filterQuery, next);
                    }else{
                        botDao.getAllBots(filterQuery, next);
                    }
                });
            }
        },
        function(botsList,next){
            var auditIds = [];
            logger.info('Entering Seggregation');
            for(var i = 0; i < botsList.length; i++) {
                if(BOTSchema === 'BOTOLD') {
                    auditIds.push(botsList[i].botId);
                }else{
                    auditIds.push(botsList[i]._id);
                }
            }
            //fetching startedon date
            logger.info('Exiting Seggregation');
            topBotList = botsList;
            async.parallel({
                totalNoOfBots: function(callback){
                    callback(null, botsList.length);
                },
                totalNoOfSuccessBots: function(callback){
                    var query = {
                        auditType: BOTSchema,
                        actionStatus: 'success',
                        isDeleted: false,
                        //auditId:{$in:auditIds}
                    };
                    if(queryParam.startdate){
                        var sdt = new Date(queryParam.startdate).getTime();
                        query.startedOn={};
                        query.startedOn.$gte=sdt;
                    }
                    if(queryParam.enddate){
                        var edt = new Date(queryParam.enddate).getTime();
                        if(sdt === edt) edt = edt+86400000;
                        if(query.startedOn) query.startedOn.$lte=edt;
                    }
                    var botsIds = [];
                    auditTrail.getAuditTrailsCount(query, function (err, botsAuditsCount) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else{
                            callback(null, botsAuditsCount);
                            return;
                        }
                    });
                },
                totalNoOfServiceNowTickets: function(callback){
                    //get the list of servicenow bots

                    var snowbotsid = [];
                    logger.info(topBotList.length);
                    for(var i = 0; i < topBotList.length;i++){
                        if(topBotList[i].input){
                            //logger.info("Found one with input " + topBotList[i].input.length);
                            for(var j = 0; j < topBotList[i].input.length; j++){
                                //logger.info(topBotList[i].input[j]["name"]);
                                if(topBotList[i].input[j]["name"] == "sysid"){
                                    snowbotsid.push(topBotList[i]._id);
                                }
                            }
                        }
                        //snowbotsid.push(snowbots[i]._id);
                    }
                    logger.info("Exited snow bots filter")

                    var query={
                        auditType:BOTSchema,
                        auditId : {$in:snowbotsid},
                        //actionStatus:'success',
                        "actionStatus" : "success"
                        //auditId: { $in: auditIds }
                    };
                    //logger.info("servicenow query bot audit*******************");
                    //logger.info(JSON.stringify(query));

                    if(queryParam.startdate){
                        var sdt = new Date(queryParam.startdate).getTime();
                        query.startedOn={};
                        query.startedOn.$gte=sdt;
                    }
                    if(queryParam.enddate){
                        var edt = new Date(queryParam.enddate).getTime();
                        if(sdt === edt) edt = edt+86400000;
                        if(query.startedOn) query.startedOn.$lte=edt;
                    }
                    auditTrail.getAuditTrailsCount(query, function(err,botsAuditsCount){
                        if(err){
                            callback(err,null);
                        }else {
                            callback(null, botsAuditsCount);
                        }
                    });
                },
                totalNoOfRunningBots: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'running',
                        isDeleted:false,
                        //auditId:{$in:auditIds}
                    };

                    if(queryParam.startdate){
                        var sdt = new Date(queryParam.startdate).getTime();
                        query.startedOn={};
                        query.startedOn.$gte=sdt;
                    }
                    if(queryParam.enddate){
                        var edt = new Date(queryParam.enddate).getTime();
                        if(sdt === edt) edt = edt+86400000;
                        if(query.startedOn) query.startedOn.$lte=edt;
                    }
                    var botsIds = [];
                    auditTrail.getAuditTrails(query, function (err, botsAudits){
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
                    //
                    var query = {
                        auditType: BOTSchema,
                        actionStatus: 'success',
                        isDeleted: false,
                        //auditId:{$in:auditIds}
                    };
                    if(queryParam.startdate){
                        var sdt = new Date(queryParam.startdate).getTime();
                        query.startedOn={};
                        query.startedOn.$gte=sdt;
                    }
                    if(queryParam.enddate){
                        var edt = new Date(queryParam.enddate).getTime();
                        if(sdt === edt) edt = edt+86400000;
                        if(query.startedOn) query.startedOn.$lte=edt;
                    }
                    var botssuccesslist = [];
                    auditTrail.getAuditTrails(query, function (err, botal) {
                        if (err) {
                            callback(err, null);
                            return;
                        } else{
                            // callback(null, botsAuditsCount);
                            // return;
                            botal.forEach(function(ba){
                                if(botssuccesslist.indexOf(ba.auditId) < 0)
                                    botssuccesslist.push(ba.auditId);
                            })
                            botsAuditList(botssuccesslist);
                        }


                    });


                    var botsAuditList = function(botssuccesslist){
                        var minutes =0;
                        var hours = 0;
                        var days = 0;
                        if(botssuccesslist.length > 0) {
                            for (var k = 0; k < botssuccesslist.length; k++) {

                                botsList.forEach(function(bl){
                                    var _botid = "";
                                    if(BOTSchema === 'BOTOLD') {
                                        _botid = bl.botId;
                                    }else{
                                        _botid = bl._id;
                                    }
                                    if(_botid == botssuccesslist[k]){
                                        if(bl.savedTime && bl.savedTime.hours) {
                                            hours = hours + bl.savedTime.hours;
                                        }
                                        if(bl.savedTime && bl.savedTime.minutes){
                                            minutes = minutes + bl.savedTime.minutes;
                                        }
                                    }
                                })
                            }
                        }
                        if(minutes >= 60){
                            hours = hours + Math.floor(minutes / 60);
                            minutes = minutes % 60;
                        }
                        if (hours >= 24) {
                            days = days + Math.floor(hours / 24);
                            hours = hours % 24;
                        }
                        var result = {
                            days:days,
                            hours:hours,
                            minutes:minutes
                        }
                        callback(null,result);
                    }
                },
                totalNoOfFailedBots: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'failed',
                        isDeleted:false,
                        //auditId:{$in:auditIds}
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
                totalNoOfFailedServiceNowTickets: function(callback){
                    var query={
                        auditType:BOTSchema,
                        actionStatus:'failed',
                        isDeleted:false,
                        //'auditTrailConfig.serviceNowTicketRefObj': { $ne: null },
                        //auditId: { $in: auditIds }
                    };
                    if(queryParam.startdate){
                        var sdt = new Date(queryParam.startdate).getTime();
                        query.startedOn={};
                        query.startedOn.$gte=sdt;
                    }
                    if(queryParam.enddate){
                        var edt = new Date(queryParam.enddate).getTime();
                        if(sdt === edt) edt = edt+86400000;
                        if(query.startedOn) query.startedOn.$lte=edt;
                    }
                    auditTrail.getAuditTrailsCount(query, function(err,botsAuditsCount){
                        if(err){
                            callback(err,null);
                        }else {
                            callback(null, botsAuditsCount);
                        }
                    });
                }

            },function(err,data){
                if(err){
                    logger.error(err);
                    next(err,null);
                }
                logger.info("Exiting all counts.")
                next(null,data);
            })
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }
        logger.info("Exiting all counts final.")
        callback(null,results);
        return;
    })
}

auditTrailService.getBotsAuditTrailHistory = function getBotsAuditTrailHistory(botId,callback){
    var query={
        auditType:'BOTOLD',
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

function toTimestamp(strDate){
    var datum = Date.parse(strDate);
    return datum;
}

function checkServiceNowTicketState(state){
    var status = '';
    switch (parseInt(state)) {
        case 1:
            status = "New";
            break;
        case 2:
            status = "Active";
            break;
        case 3:
            status = "Work In Progress";
            break;
        case 4:
            status = "Awaiting Problem Resolution";
            break;
        case 5:
            status = "Awaiting User Info";
            break;
        case 6:
            status = "Resolved";
            break;
        case 7:
            status = "Closed";
            break;
        case 8:
            status = "Cancelled";
            break;
        default:
            status = "New";
            break;
    }
    return status;
}

function checkServiceNowTicketPriority(priority){
    var priorityState = '';
    switch (parseInt(priority)) {
        case 0:
            priorityState = "VIP";
            break;
        case 1:
            priorityState = "1-Critical";
            break;
        case 2:
            priorityState = "2-High";
            break;
        case 3:
            priorityState = "3-Medium";
            break;
        case 4:
            priorityState = "4-Low";
            break;
        case 5:
            priorityState = "5-Very Low";
            break;
        default:
            priorityState = "1-Critical";
            break;
    }
    return priorityState;
}
