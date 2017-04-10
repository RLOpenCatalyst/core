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
var botsNewService = require('_pr/services/botsNewService.js');
var botsDao = require('_pr/model/bots/1.1/botsDao.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/botsNew*', sessionVerificationFunc);

    app.get('/botsNew',function(req,res){
        var actionStatus = null,serviceNowCheck =null;
        if(req.query.actionStatus && req.query.actionStatus !== null){
            actionStatus = req.query.actionStatus;
        }
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
        botsNewService.getBotsList(req.query,actionStatus,serviceNowCheck, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });


    app.delete('/botsNew/:botId',function(req,res){
        botsNewService.removeBotsById(req.params.botId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/botsNew/:botId/bots-history',function(req,res){
        botsNewService.getBotsHistory(req.params.botId,req.query, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/botsNew/:botId/bots-history/:historyId',function(req,res){
        botsNewService.getParticularBotsHistory(req.params.botId,req.params.historyId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data[0]);
            }
        })
    });

    app.get('/botsNew/:botId/bots-history/:historyId/logs',function(req,res){
        var timestamp = null;
        if (req.query.timestamp) {
            timestamp = req.query.timestamp;
            timestamp = parseInt(timestamp);
        }
        botsNewService.getParticularBotsHistoryLogs(req.params.botId,req.params.historyId,timestamp, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.post('/botsNew',function(req,res){
        botsNewService.createNew(req.body.bots, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.post('/botsNew/:botId/execute',function(req,res){
        var executionType = null;
        if(req.query.executionType && req.query.executionType !== null){
            executionType = req.query.executionType;
        }
        var reqBody = null;
        if(req.body.type && req.body.type ==='blueprints') {
            if (!req.body.envId) {
                res.send(400, {
                    "message": "Invalid Environment Id"
                });
                return;
            }
            reqBody = {
                userName: req.session.user.cn,
                category: req.body.type,
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
                category:req.body.type,
                userName: req.session.user.cn,
                hostProtocol: req.protocol + '://' + req.get('host'),
                data: req.body.data
            }
            if(req.body.nodeIds){
                reqBody.nodeIds =  req.body.nodeIds;
            }
        }
        botsNewService.executeBots(req.params.botId,reqBody,req.session.user.cn,executionType,false,function (err, data) {
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.put('/botsNew/:botId/scheduler',function(req,res){
        botsNewService.updateBotsScheduler(req.params.botId,req.body, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
};
