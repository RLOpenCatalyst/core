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

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/audit-trail*', sessionVerificationFunc);

    app.get('/audit-trail', function(req,res){
        auditTrailService.getAuditTrailList(req.query,function(err,auditTrailList){
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
        auditTrailService.getBOTsSummary(req.query,'BOTs',function(err,botSummary){
            if(err){
                logger.error(err);
                return res.status(500).send(err);
            }
            return res.status(200).send(botSummary);
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

    app.post('/audit-trail/bots-action/update', updateBOTsAction);

    function updateBOTsAction(req, res, next) {
        req.body.userName = req.session.user.cn;
        async.waterfall(
            [
                function(next) {
                    auditTrailService.updateBOTsAction(req.body, next);
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
