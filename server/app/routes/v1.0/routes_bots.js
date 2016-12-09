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


module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/bots/*', sessionVerificationFunc);

    app.get('/bots',function(req,res){
        botsService.getBotsList(req.query, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
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
        botsService.getBotsHistory(req.params.botId, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });

    app.post('/bots/:botId/execute',function(req,res){
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
                tagServer: req.body.tagServer
            }
            var paramOptions = {
                cookbookAttributes: req.body.cookbookAttributes,
                scriptParams: req.body.scriptParams
            };

            if (paramOptions.scriptParams && paramOptions.scriptParams.length) {
                var cryptoConfig = appConfig.cryptoSettings;
                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                var encryptedParams = [];
                for (var i = 0; i < paramOptions.scriptParams.length; i++) {
                    var encryptedText = cryptography.encryptText(paramOptions.scriptParams[i], cryptoConfig.encryptionEncoding,
                        cryptoConfig.decryptionEncoding);
                    encryptedParams.push(encryptedText);
                }
                paramOptions.scriptParams = encryptedParams;
            }
            reqBody.paramOptions=paramOptions;
        }
        if(reqBody !== null) {
            botsService.executeBots(req.params.botId, reqBody, function (err, data) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.status(200).send(data);
                }
            })
        }
    });

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