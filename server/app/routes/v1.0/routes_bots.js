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
var	botsService = require('_pr/services/botsService.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var botExecuteService = require('_pr/services/botsExecuteService.js');
var	botsNewService = require('_pr/services/botsNewService.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/bots/*', sessionVerificationFunc);

    app.get('/bots',function(req,res){
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

    app.get('/bots/all',function(req,res) {
        var actionStatus = null,serviceNowCheck = false,data = null;
        if(req.query.actionStatus && req.query.actionStatus !== null){
            actionStatus = req.query.actionStatus;
        }
        if(req.query.serviceNowCheck && req.query.serviceNowCheck !== null && req.query.serviceNowCheck === 'true'){
            serviceNowCheck = true;
        }
        botsService.getBotsList(req.query,actionStatus,serviceNowCheck, function(err,result){
            if(!err){
                var recordCount = result.metaData.totalRecords;
                for(var i = 0; i<recordCount; i++) {
                    result.bots[i].isBotNew = false;
                }
                data = result;
            }

        });
        botsNewService.getBotsList(req.query,actionStatus, function(err,result){
            if (err && data === null ) {
                return res.status(500).send(err);
            } else {
                if(data.metaData.totalRecords === 0){
                    data = result;
                }else {
                    var recordCount = result.metaData.totalRecords;
                    for(var i = 0; i<recordCount; i++) {
                        result.bots[i].isBotNew = true;
                        data.bots.push(result.bots[i]);
                    }
                    
                    data.metaData.totalRecords += result.metaData.totalRecords;
                }
                return res.status(200).send(data);
            }
        })
    });

    app.delete('/bots/:botId',function(req,res){
        botsService.removeSoftBotsById(req.params.botId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.get('/bots/:botId/bots-history',function(req,res){
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

    app.get('/bots/:botId/bots-history/:historyId',function(req,res){
        botsService.getPerticularBotsHistory(req.params.botId,req.params.historyId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data[0]);
            }
        })
    });

    app.post('/bots/:botId/execute', botExecuteService.botExecute);

    app.put('/bots/:botId/scheduler',function(req,res){
        botsService.updateBotsScheduler(req.params.botId,req.body, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
};