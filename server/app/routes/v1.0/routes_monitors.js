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
const json2csv = require('json2csv');
const monitorsService = require('_pr/services/monitorsService');
const async = require('async');
var logger = require('_pr/logger')(module);
var validate = require('express-validation');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var monitorsValidator = require('_pr/validators/monitorsValidator');

module.exports.setRoutes = function (app, sessionVerificationFunc) {

    app.all('/monitors/*', sessionVerificationFunc);
    /**
     * @api {get} /monitors/filterBy=orgId:<organizationId> 
     *                                     Get monitors list
     * @apiName getMonitors
     * @apiGroup monitors
     * @apiVersion 1.0.0
     *
     * @apiParam {String} filterBy          Catalyst entity. Multiple entities can be specified using +
     * 
     * @apiExample Sample_Request_1
     *      /monitors?filterBy=orgId:5790c31edff2c49223fd6efa
     *
     * @apiSuccess {Object[]} monitors              List of monitors
     * @apiSuccess {String} id       Monitor id
     * @apiSuccess {Object} organization       Monitor Organization
     * @apiSuccess {String} organization.id        Monitor organization id
     * @apiSuccess {String} organization.name      Monitor organization name
     * @apiSuccess {String} type         Monitor Server type     
     * @apiSuccess {String} name         Monitor Server name     
     * @apiSuccess {Object} parameters       Monitor Server Parameters
     * @apiSuccess {String} parameters.url   Monitor Server Url
     * @apiSuccess {String} parameters.transportProtocol   Monitor Server Transport Protocols Name
     * @apiSuccess {Object} parameters.transportProtocolParameters   Monitor Server Transport Protocols Parameters
     * @apiSuccessExample {json} Monitor-Success-Response:
     *      HTTP/1.1 200 OK
     *      {[
     *          "_id": "",
     *          "name": "someName",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "type": "Sensu",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "rabbitmq",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "vhost": "/sensu",
     *                      "user": "sensu",
     *                      "heartbeat": 30,
     *                      "prefetch": 50
     *                  }
     *              }
     *          }
     *      ]}
     *      
     *      
     *      HTTP/1.1 200 OK
     *      {[
     *          "_id": "",
     *          "name": "someName",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "type": "Sensu",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "redis",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671
     *                  }
     *              }
     *          }
     *      ]}
     */
    app.get("/monitors/", getMonitors);

    function getMonitors(req, res, next) {

        //@TODO Authorization to be implemented after fixing provider schema
        async.waterfall([
            function (next) {
                monitorsService.getMonitors(req.query, next);
            }
        ], function (err, monitors) {
            if (err) {
                next(err);
            } else {
                res.status(200).send(monitors);
            }
        });
    }


    /**
     * @api {get} /monitors/:monitorId Get monitor details
     * @apiName getMonitor
     * @apiGroup monitors
     *
     * @apiSuccess {Object} monitor             monitor data
     * @apiSuccess {String} id       Monitor id
     * @apiSuccess {Object} organization       Monitor Organization
     * @apiSuccess {String} organization.id        Monitor organization id
     * @apiSuccess {String} organization.name      Monitor organization name
     * @apiSuccess {String} type         Monitor Server type     
     * @apiSuccess {String} name         Monitor Server name
     * @apiSuccess {Object} parameters       Monitor Server Parameters
     * @apiSuccess {String} parameters.url   Monitor Server Url
     * @apiSuccess {String} parameters.transportProtocol   Monitor Server Transport Protocols Name
     * @apiSuccess {Object} parameters.transportProtocolParameters   Monitor Server Transport Protocols Parameters
     * @apiSuccessExample {json} Monitor-Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "_id": "",
     *          "name": "someName",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "type": "Sensu",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "rabbitmq",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "vhost": "/sensu",
     *                      "user": "sensu"
     *                      "heartbeat": 30,
     *                      "prefetch": 50
     *                  }
     *              }
     *          }
     *      }
     *      
     *      
     *      HTTP/1.1 200 OK
     *      {
     *          "_id": "",
     *          "name": "someName",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "type": "Sensu",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "redis",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671
     *                  }
     *              }
     *          }
     *      }
     */
    app.get('/monitors/:monitorId', getMonitor);

    function getMonitor(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    monitorsService.getMonitor(req.params.monitorId, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    /**
     * @api {post} /monitors/  Add Monitor
     * @apiName createMonitors
     * @apiGroup monitors
     *
     * @apiSuccess {Object} monitor             monitor data
     * @apiSuccess {String} orgId        Organization Id
     * @apiSuccess {String} type         Monitor Server type     
     * @apiSuccess {String} name         Monitor Server name     
     * @apiSuccess {Object} parameters       Monitor Server Parameters
     * @apiSuccess {String} parameters.url   Monitor Server Url
     * @apiSuccess {String} parameters.transportProtocol   Monitor Server Transport Protocols Name
     * @apiSuccess {Object} parameters.transportProtocolParameters   Monitor Server Transport Protocols Parameters
     * @apiParamExample {json} Request-Example:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": "redis",
     *              "transportProtocolParameters":{
     *                  "host": "10.0.0.6",
     *                  "port": 5671,
     *                  "password": "secret",
     *              
     *              }
     *          }
     *      }
     *
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *          "url": "Server Url",
     *          "transportProtocol": "rabbitmq",
     *          "transportProtocolParameters":{
     *              "host": "10.0.0.6",
     *              "port": 5671,
     *              "vhost": "/sensu",
     *              "user": "sensu",
     *              "password": "secret",
     *              "heartbeat": 30,
     *              "prefetch": 50,
     *              "ssl": {
     *                  "certChainFileId": "SomeId",
     *                  "privateKeyFileId": "SomeId"
     *              }
     *          }
     *          }
     *      }
     *
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "__v": 0,
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *              "transportProtocolParameters": {
     *                  "password": "iEhK5+u/dBHRNbilkF7f7Q==",
     *                  "port": 5671,
     *                  "host": "10.0.0.6"
     *              },
     *              "transportProtocol": "redis",
     *              "url": "Server Url"
     *          },
     *          "_id": "58071046efa15bb50b7ccdf8",
     *          "isDeleted": false
     *      }
     *
     *      {
     *          "__v": 0,
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *              "transportProtocolParameters": {
     *                  "ssl": {
     *                      "privateKeyFileId": "SomeId",
     *                      "certChainFileId": "SomeId"
     *                  },
     *                  "prefetch": 50,
     *                  "heartbeat": 30,
     *                  "password": "iEhK5+u/dBHRNbilkF7f7Q==",
     *                  "user": "sensu",
     *                  "vhost": "/sensu",
     *                  "port": 5671,
     *                  "host": "10.0.0.6"
     *              },
     *              "transportProtocol": "rabbitmq",
     *              "url": "Server Url"
     *          },
     *          "_id": "58071104efa15bb50b7cce41",
     *          "isDeleted": false
     *      }
     */
    app.post('/monitors', validate(monitorsValidator.create), createMonitors);

    function createMonitors(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    var query = {
                        "filterBy": "orgId:"+req.body.orgId
                    };
                    monitorsService.getMonitors(query, next);
                },
                function (monitors, next) {
                    if(monitors.length === 0){
                        req.body.isDefault = true;
                    }else{
                        req.body.isDefault = false;
                    }
                    if (req.body.type === 'sensu' && req.body.parameters.transportProtocolParameters['password']) {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                        var encryptedPassword = cryptography.encryptText(req.body.parameters.transportProtocolParameters['password'], cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
                        req.body.parameters.transportProtocolParameters['password'] = encryptedPassword;
                    }
                    monitorsService.createMonitor(req.body, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(201).send(results);
                }
            }
        );
    }


    /**
     * @api {put} /monitors/:monitorId  Update Monitor
     * @apiName updateMonitor
     * @apiGroup monitors
     *
     * @apiSuccess {Object} monitor             monitor data
     * @apiSuccess {String} orgId        Organization Id
     * @apiSuccess {String} type         Monitor Server type     
     * @apiSuccess {String} name         Monitor Server name     
     * @apiSuccess {Object} parameters       Monitor Server Parameters
     * @apiSuccess {String} parameters.url   Monitor Server Url
     * @apiSuccess {String} parameters.transportProtocol   Monitor Server Transport Protocols Name
     * @apiSuccess {Object} parameters.transportProtocolParameters   Monitor Server Transport Protocols Parameters
     * @apiParamExample {json} Request-Example:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *              "url": "Server Url",
     *              "transportProtocol": "redis",
     *              "transportProtocolParameters":{
     *                  "host": "10.0.0.6",
     *                  "port": 5671,
     *                  "password": "secret",
     *              }
     *          }
     *      }
     *
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *          "url": "Server Url",
     *          "transportProtocol": "rabbitmq",
     *          "transportProtocolParameters":{
     *              "host": "10.0.0.6",
     *              "port": 5671,
     *              "vhost": "/sensu",
     *              "user": "sensu",
     *              "password": "secret",
     *              "heartbeat": 30,
     *              "prefetch": 50,
     *              "ssl": {
     *                  "certChainFileId": "SomeId",
     *                  "privateKeyFileId": "SomeId"
     *              }
     *          }
     *          }
     *      }
     *
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "__v": 0,
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "type": "sensu",
     *          "name": "someName",
     *          "parameters": {
     *              "transportProtocolParameters": {
     *                  "password": "iEhK5+u/dBHRNbilkF7f7Q==",
     *                  "port": 5671,
     *                  "host": "10.0.0.6"
     *              },
     *              "transportProtocol": "redis",
     *              "url": "Server Url"
     *          },
     *          "_id": "58071046efa15bb50b7ccdf8",
     *          "isDeleted": false
     *      }
     *
     *      {
     *          "__v": 0,
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "name": "someName",
     *          "type": "sensu",
     *          "parameters": {
     *              "transportProtocolParameters": {
     *                  "ssl": {
     *                      "privateKeyFileId": "SomeId",
     *                      "certChainFileId": "SomeId"
     *                  },
     *                  "prefetch": 50,
     *                  "heartbeat": 30,
     *                  "password": "iEhK5+u/dBHRNbilkF7f7Q==",
     *                  "user": "sensu",
     *                  "vhost": "/sensu",
     *                  "port": 5671,
     *                  "host": "10.0.0.6"
     *              },
     *              "transportProtocol": "rabbitmq",
     *              "url": "Server Url"
     *          },
     *          "_id": "58071104efa15bb50b7cce41",
     *          "isDeleted": false
     *      }
     */
    app.put('/monitors/:monitorId', validate(monitorsValidator.update), updateMonitor);

    function updateMonitor(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    monitorsService.checkIfMonitorExists(req.params.monitorId, next);
                },
                function (monitor, next) {
                    if (req.body.type === 'sensu' && req.body.parameters.transportProtocolParameters['password']) {
                        var cryptoConfig = appConfig.cryptoSettings;
                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                        var encryptedPassword = cryptography.encryptText(req.body.parameters.transportProtocolParameters['password'], cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
                        req.body.parameters.transportProtocolParameters['password'] = encryptedPassword;
                    }
                    monitorsService.updateMonitor(req.params.monitorId, req.body, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }


    /**
     * @api {delete} /monitors/:monitorId Delete Monitor
     * @apiName deleteMonitor
     * @apiGroup monitors
     *
     * @apiParam {Number} monitorId    Monitor ID
     *
     * @apiSuccess {Object} response    Empty response object
     *
     */
    app.delete('/monitors/:monitorId', deleteMonitor);

    function deleteMonitor(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    monitorsService.checkIfMonitorExists(req.params.monitorId, next);
                },
                function (monitor, next) {
                    monitorsService.deleteMonitors(req.params.monitorId, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    /**
     * @api {put} /monitors/:monitorId Set default Monitor for an organization
     * @apiName setDefaultMonitor
     * @apiGroup monitors
     *
     * @apiParam {Number} monitorId    Monitor ID
     * @apiParam {Number} orgId        Org ID
     *
     * @apiSuccess {Object} response    Empty response object
     *
     */
    app.put('/monitors/:monitorId/org/:orgId/setdefault', setDefaultMonitor);

    function setDefaultMonitor(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    monitorsService.removeDefaultMonitor(req.params.orgId, next);
                },
                function (monitor, next) {
                    monitorsService.setDefaultMonitor(req.params.monitorId, req.params.orgId, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};
