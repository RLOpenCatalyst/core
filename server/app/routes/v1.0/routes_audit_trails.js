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

var logsDao = require('_pr/model/dao/logsdao.js');
var async = require('async');
var instanceService = require('_pr/services/instanceService');
var auditTrailService = require('_pr/services/auditTrailService');
var logger = require('_pr/logger')(module);
var taskService = require('_pr/services/taskService');
var instanceLogModel = require('_pr/model/log-trail/instanceLog.js');
var containerLogModel = require('_pr/model/log-trail/containerLog.js');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var moment = require('moment');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/audit-trail*', sessionVerificationFunc);

    app.get('/audit-trail', function(req,res){

        //adding user to query
        req.query.user = req.session.user.cn;
        logger.info(req.query.user)
        auditTrailService.getAuditTrailList(req.query,function(err,auditTrailList){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(auditTrailList);
        })
    });

//API for getting the upper metric   
    
    app.get('/audit-trail/uppermetric', function(req,res){

        //adding user to query
        req.query.user = req.session.user.cn;
        logger.info(req.query.user)
        auditTrailService.getAuditTrailListMod(req.query,function(err,auditTrailList){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(auditTrailList);
        })
    });

  
    app.get('/audit-trail/botreporttable', function(req,res){

        //adding user to query
        req.query.user = req.session.user.cn;
        logger.info(req.query.user)
        auditTrailService.getAuditTrailListforuppermetric(req.query,function(err,auditTrailList){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(auditTrailList);
        })
    });




    app.get('/audit-trail/:actionId/logs', function(req,res){
        auditTrailService.getAuditTrailActionLogs(req.params.actionId,req.query.timestamp,function(err,auditTrailActionLogs){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(auditTrailActionLogs);
        })
    });

    app.get('/audit-trail/bots-summary', function(req,res){
        var loggedUser = req.session.user.cn;
        logger.info('Entered - bots-summary')
        //Enabling session caching for summary data.
        if(req.session.botcache){
            if(moment().diff(req.session.botcache.lastrequestdate,'minutes') < 5){
                //read from cache if query matches
                if(JSON.stringify(req.session.botcache.lastquery) === JSON.stringify(req.query) && req.session.botcache.botSummary){
                    logger.info('Serving from cache..last request was sooner ');
                    logger.info('Exited - bots-summary');
                    return res.status(200).send(req.session.botcache.botSummary);
                }
                else{
                    req.session.botcache.lastquery = req.query;
                }
            }
        }
        //end session caching.
        auditTrailService.getBOTsSummary(req.query,'BOT',loggedUser,function(err,botSummary){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            logger.info('Exited - bots-summary');
            if(req.session.botcache){
                req.session.botcache.lastrequestdate = moment();
                req.session.botcache.lastquery = req.query;
                req.session.botcache.botSummary = botSummary;

            }
            else
                botSummary.lastrequestdate = new Date();
            req.session.botcache = {
                lastrequestdate : moment(),
                lastquery : req.query,
                botSummary : botSummary
            }
            return res.status(200).send(botSummary);
        })
    });

    app.get('/audit-trail/:auditId/srnTicketSync', function(req,res){
        auditTrailService.syncCatalystWithServiceNow(req.params.auditId,function(err,srnTicketSync){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(srnTicketSync);
        })
    });


    app.get('/audit-trail/instance-action', getInstanceActionList);

    function getInstanceActionList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [
                function(next) {
                    apiUtil.paginationRequest(req.query, 'instanceLogs', next);
                },
                function(paginationReq, next) {
                    reqData = paginationReq;
                    instanceLogModel.getInstanceActionList(paginationReq, next);
                },
                function(instanceActions, next) {
                    apiUtil.paginationResponse(instanceActions, reqData, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/audit-trail/instance-action/:actionId', getInstanceAction);

    function getInstanceAction(req, res, next) {
        async.waterfall(
            [

                function(next) {
                    instanceLogModel.getLogsByActionId(req.params.actionId, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/audit-trail/task-action', getTaskActionList);

    function getTaskActionList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [

                function(next) {
                    apiUtil.paginationRequest(req.query, 'taskLogs', next);
                },
                function(paginationReq, next) {
                    reqData = paginationReq;
                    taskService.getTaskActionList(paginationReq, next);
                },
                function(taskActions, next) {
                    apiUtil.paginationResponse(taskActions, reqData, next);
                }

            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/audit-trail/task-action/:actionId', getTaskAction);

    function getTaskAction(req, res, next) {
        async.waterfall(
            [

                function(next) {
                    instanceLogModel.getLogsByActionId(req.params.actionId, next);
                }

            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/audit-trail/instance-action/:actionId/logs', pollInstanceActionLog);

    function pollInstanceActionLog(req, res, next) {
        var timestamp = req.query.timestamp;
        if (timestamp) {
            timestamp = parseInt(timestamp);
        }
        async.waterfall(
            [
                function(next) {
                    logsDao.getLogsByReferenceId(req.params.actionId, timestamp, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }
    app.get('/audit-trail/task-action/:actionId/logs', pollTaskActionLog);

    function pollTaskActionLog(req, res, next) {
        var timestamp = req.query.timestamp;
        if (timestamp) {
            timestamp = parseInt(timestamp);
        }
        async.waterfall(
            [
                function(next) {
                    logsDao.getLogsByReferenceId(req.params.actionId, timestamp, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }


    app.get('/audit-trail/container-action', getContainerActionList);

    function getContainerActionList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [
                function(next) {
                    apiUtil.paginationRequest(req.query, 'containerLogs', next);
                },
                function(paginationReq, next) {
                    paginationReq['searchColumns'] = ['platformId', 'status', 'action', 'user', 'actionStatus', 'orgName', 'bgName', 'projectName', 'environmentName', 'containerName', 'image'];
                    reqData = paginationReq;
                    apiUtil.databaseUtil(paginationReq, next);
                },
                function(dataQuery, next) {
                    containerLogModel.getContainerActionLogs(dataQuery, next);
                },
                function(instanceActions, next) {
                    apiUtil.paginationResponse(instanceActions, reqData, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }

    app.get('/audit-trail/container-action/:actionId/logs', pollContainerActionLog);

    function pollContainerActionLog(req, res, next) {
        var timestamp = req.query.timestamp;
        if (timestamp) {
            timestamp = parseInt(timestamp);
        }
        async.waterfall(
            [
                function(next) {
                    logsDao.getLogsByReferenceId(req.params.actionId, timestamp, next);
                }
            ],
            function(err, results) {
                if (err)
                    return res.status(500).send(err);
                else
                    return res.status(200).send(results);
            });
    }


};
