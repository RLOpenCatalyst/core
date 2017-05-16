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

// The file contains all the end points for AppDeploy

var logger = require('_pr/logger')(module);
var botService = require('_pr/services/botService.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/bot*', sessionVerificationFunc);

    app.get('/bot',function(req,res){
        var actionStatus = null,serviceNowCheck =false;
        var loggedUser =  req.session.user.cn;
        if(req.query.actionStatus && req.query.actionStatus !== null){
            actionStatus = req.query.actionStatus;
        }
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
        botService.getBotsList(req.query,actionStatus,serviceNowCheck,loggedUser,function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });


    app.delete('/bot/:botId',function(req,res){
        botService.removeBotsById(req.params.botId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/bot/:botId/bot-history',function(req,res){
        botService.getBotsHistory(req.params.botId,req.query, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/bot/:botId/bot-history/:historyId',function(req,res){
        botService.getParticularBotsHistory(req.params.botId,req.params.historyId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data[0]);
            }
        })
    });

    app.get('/bot/:botId/bot-history/:historyId/logs',function(req,res){
        var timestamp = null;
        if (req.query.timestamp) {
            timestamp = req.query.timestamp;
            timestamp = parseInt(timestamp);
        }
        botService.getParticularBotsHistoryLogs(req.params.botId,req.params.historyId,timestamp, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.post('/bot',function(req,res){
        botService.createNew(req.body.bots, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.post('/bot/:botId/execute',function(req,res){
        var executionType = null;
        if(req.query.executionType && req.query.executionType !== null){
            executionType = req.query.executionType;
        }
        var reqBody = null;
        if(req.body.type && (req.body.type ==='blueprints' || req.body.type ==='blueprint')) {
            if (!req.body.envId) {
                res.send(400, {
                    "message": "Invalid Environment Id"
                });
                return;
            }
            reqBody = {
                userName: req.session.user.cn,
                type: 'blueprints',
                permissionTo: "execute",
                permissionSet: req.session.user.permissionset,
                envId: req.body.envId,
                blueprintIds: req.body.blueprintIds,
                monitorId: req.body.monitorId?req.body.monitorId:null,
                domainName: req.body.domainName?req.body.domainName:null,
                stackName: req.body.stackName?req.body.stackName:null,
                version: req.body.version?req.body.version:"0.1",
                tagServer: req.body.tagServer
            }
        }else{
            reqBody = {
                type:req.body.type,
                userName: req.session.user.cn,
                hostProtocol: req.protocol + '://' + req.get('host'),
                data: req.body.data?req.body.data:null,
                attributes: req.body.attributes?req.body.attributes:null,
                parameterized: req.body.parameterized?req.body.parameterized:null,
                src: req.body.src?req.body.src:null,
                ref: req.body.ref?req.body.ref:null
            }
            if(req.body.nodeIds){
                reqBody.nodeIds =  req.body.nodeIds;
            }
        }
        botService.executeBots(req.params.botId,reqBody,req.session.user.cn,executionType,false,function (err, data) {
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.put('/bot/:botId/scheduler',function(req,res){
        botService.updateBotsScheduler(req.params.botId,req.body, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
};
