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
var botsService = require('_pr/services/botsService.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/botsOld*', sessionVerificationFunc);

    app.get('/botsOld',function(req,res){
        var actionStatus = null,serviceNowCheck = false;
        if(req.query.actionStatus && req.query.actionStatus !== null){
            actionStatus = req.query.actionStatus;
        }
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
        botsService.getBotsList(req.query,actionStatus,serviceNowCheck, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });


    app.delete('/botsOld/:botId',function(req,res){
        botsService.removeSoftBotsById(req.params.botId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/botsOld/:botId/bots-history',function(req,res){
        var serviceNowCheck = false;
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
        botsService.getBotsHistory(req.params.botId,req.query, serviceNowCheck,function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/botsOld/:botId/bots-history/:historyId',function(req,res){
        botsService.getPerticularBotsHistory(req.params.botId,req.params.historyId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data[0]);
            }
        })
    });

    app.post('/botsOld/:botId/execute',function(req,res){
        var reqBody = null;
        if(req.body.category && req.body.category ==='Blueprints') {
            if (!req.body.envId) {
                res.send(400, {
                    "message": "Invalid Environment Id"
                });
                return;
            }
            reqBody = {
                userName: req.session.user.cn,
                category: "blueprints",
                permissionTo: "execute",
                permissionSet: req.session.user.permissionset,
                envId: req.body.envId,
                monitorId: req.body.monitorId,
                domainName: req.body.domainName,
                stackName: req.body.stackName,
                version: req.body.version,
                tagServer: req.body.tagServer
            }
        }else{
            reqBody = {
                userName: req.session.user.cn,
                hostProtocol: req.protocol + '://' + req.get('host'),
                choiceParam: req.body.choiceParam,
                appData: req.body.appData,
                tagServer: req.body.tagServer,
                paramOptions:{
                    cookbookAttributes: req.body.cookbookAttributes,
                    scriptParams: req.body.scriptParams
                }
            }
        }
        if(reqBody !== null) {
            botsService.executeBots(req.params.botId, reqBody, function (err, data) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    data.botId=req.params.botId;
                    return res.status(200).send(data);
                }
            })
        }
    });

    app.put('/botsOld/:botId/scheduler',function(req,res){
        botsService.updateBotsScheduler(req.params.botId,req.body, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
};