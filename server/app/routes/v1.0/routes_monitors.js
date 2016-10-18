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
var validate = require('express-validation');
var monitorsValidator = require('_pr/validators/monitorsValidator');

module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/monitors/*', sessionVerificationFunc);
    /**
     * @api {get} /monitors/filterBy=orgId:<organizationId>
     *                                                                                              Get aggregate cost
     * @apiName getMonitors
     * @apiGroup reports
     * @apiVersion 1.0.0
     *
     * @apiParam {String} filterBy          Catalyst entity. Multiple entities can be specified using +
     * 
     * @apiExample Sample_Request_1
     *      /monitors?filterBy=orgId:5790c31edff2c49223fd6efa
     *
     * @apiSuccess {Object[]} monitors              List of monitors
     * @apiSuccess {String} monitors.id       Monitor id
     * @apiSuccess {Object} monitors.organization       Monitor Organization
     * @apiSuccess {String} monitors.organization.id        Monitor organization id
     * @apiSuccess {String} monitors.organization.name      Monitor organization name
     * @apiSuccess {String} monitors.serverType         Monitor Server type     
     * @apiSuccess {Object} monitors.serverParameters       Monitor Server Parameters
     * @apiSuccess {String} monitors.serverParameters.url   Monitor Server Url
     * @apiSuccess {String} monitors.serverParameters.transportProtocolName   Monitor Server Transport Protocols
     * @apiSuccess {Object} monitors.serverParameters.transportProtocolParameters   Monitor Server Transport Protocols
     * @apiSuccess {String} monitors.serverParameters.transportProtocolParameters.host   Monitor Server Transport Protocols
     * @apiSuccessExample {json} Monitor-Success-Response:
     *      HTTP/1.1 200 OK
     *      {[
     *          "_id": "",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "serverType": "Sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "rabbitmq",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "vhost": "/sensu",
     *                      "user": "sensu",
     *                      "password": "secret",
     *                      "heartbeat": 30,
     *                      "prefetch": 50,
     *                      "ssl": {
     *                          "certChainFile": "/etc/sensu/ssl/cert.pem",
     *                          "privateKeyFile": "/etc/sensu/ssl/key.pem"
     *                      }
     *                  }
     *              }
     *          }
     *      ]}
     *      
     *      
     *      HTTP/1.1 200 OK
     *      {[
     *          "id": "",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "serverType": "Sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "redis",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "password": "secret"
     *                  }
     *              }
     *          }
     *      ]}
     */
    app.get("/monitors/", getMonitors);

    function getMonitors(req, res, next) {

        //@TODO Authorization to be implemented after fixing provider schema
        async.waterfall([
            function(next) {
                monitorsService.getMonitors(req.query, next);
            }
        ], function(err, monitors) {
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
     * @apiSuccess {Object[]} monitors              List of monitors
     * @apiSuccess {String} monitors.organization       Monitor Organization
     * @apiSuccess {String} monitors.organization.id        Monitor organization id
     * @apiSuccess {String} monitors.organization.name      Monitor organization name
     * @apiSuccess {String} monitors.serverType         Monitor Server type     
     * @apiSuccess {String} monitors.serverParameters       Monitor Server Parameters
     * @apiSuccess {String} monitors.serverParameters.url   Monitor Server Url
     * @apiSuccess {String} monitors.serverParameters.transportProtocol   Monitor Server Transport Protocols
     * @apiSuccessExample {json} Monitor-Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "_id": "",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "serverType": "Sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "rabbitmq",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "vhost": "/sensu",
     *                      "user": "sensu",
     *                      "password": "secret",
     *                      "heartbeat": 30,
     *                      "prefetch": 50,
     *                      "ssl": {
     *                          "certChainFile": "/etc/sensu/ssl/cert.pem",
     *                          "privateKeyFile": "/etc/sensu/ssl/key.pem"
     *                      }
     *                  }
     *              }
     *          }
     *      }
     *      
     *      
     *      HTTP/1.1 200 OK
     *      {
     *          "id": "",
     *          "organization": {
     *              "id": "",
     *              "name": "Organization name"
     *          },
     *          "serverType": "Sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *              "transportProtocol": {
     *                  "name": "redis",
     *                  "parameters": {
     *                      "host": "10.0.0.6",
     *                      "port": 5671,
     *                      "password": "secret"
     *                  }
     *              }
     *          }
     *      }
     */
    app.get('/monitors/:monitorId', getMonitor);

    function getMonitor(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    monitorsService.getMonitor(req.params.monitorId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    /**
     * @api {post} /monitors/:monitorId/monitors  Add tag
     * @apiName addTag
     * @apiGroup monitors
     *
     * @apiParam {Number} monitorId            Provider ID
     * @apiParam {String} tagName               Tags name
     * @apiParam {Object} tag                   Tag object in request body
     * @apiParam {String} tag.name              Tag name
     * @apiParam {String} tag.description       Tag description
     * @apiParamExample {json} Request-Example:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "serverType": "sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *             "transportProtocolName": "rabbitmq",
     *             "transportProtocolParameters":{
     *                 "host": "10.0.0.6",
     *                 "port": 5671,
     *                 "vhost": "/sensu",
     *                 "user": "sensu",
     *                 "password": "secret",
     *                 "heartbeat": 30,
     *                 "prefetch": 50,
     *                 "ssl": {
     *                     "certChainFileId": "SomeId",
     *                     "privateKeyFileId": "SomeId"
     *                 }
     *             }
     *          }
     *      }
     *
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "serverType": "sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *             "transportProtocolName": "redis",
     *             "transportProtocolParameters":{
     *                 "host": "10.0.0.6",
     *                 "port": 5671,
     *                 "password": "secret",
     *              }
     *          }
     *      }
     *
     * @apiSuccess {Object} tag                 Tag details
     * @apiSuccess {String} monitors.name           Tag name
     * @apiSuccess {String} monitors.description    Tag description
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927535",
     *          "serverType": "sensu",
     *          "serverParameters": {
     *              "url": "Server Url",
     *             "transportProtocolName": "rabbitmq",
     *             "transportProtocolParameters":{
     *                 "host": "10.0.0.6",
     *                 "port": 5671,
     *                 "vhost": "/sensu",
     *                 "user": "sensu",
     *                 "password": "secret",
     *                 "heartbeat": 30,
     *                 "prefetch": 50,
     *                 "ssl": {
     *                     "certChainFileId": "SomeId",
     *                     "privateKeyFileId": "SomeId"
     *                 }
     *             }
     *          }
     *      }
     */
    app.post('/monitors', validate(monitorsValidator.create), createMonitors);

    function createMonitors(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    monitorsService.createMonitor(req.body, next);
                }
            ],
            function(err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(201).send(results);
                }
            }
        );
    }


    /**
     * @api {put} /monitors/:monitorId  Update monitor
     * @apiName updateMonitor
     * @apiGroup monitors
     *
     * @apiParam {Number} monitorId            Provider ID
     * @apiParam {String} tagName               Tags name
     * @apiParam {Object[]} tag                 Tag object in request body
     * @apiParam {String} tag.description       Tag description
     * @apiParamExample {json} Request-Example:
     *      {
     *          "description": "Tag description"
     *      }
     *
     * @apiSuccess {Object} tag                 Tag details
     * @apiSuccess {String} monitors.name           Tag name
     * @apiSuccess {String} monitors.description    Tag description
     *
     * @apiSuccessExample {json} Success-Response:
     *      HTTP/1.1 200 OK
     *      {
     *          "name": "environment",
     *          "description": "Deployment environment"
     *      }
     */
    app.put('/monitors/:monitorId', validate(monitorsValidator.update), updateMonitor);

    function updateMonitor(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    monitorsService.checkIfProviderExists(req.params.monitorId, next);
                },
                function(provider, next) {
                    var tagDetails = {
                        'name': req.params.tagName,
                        'description': req.body.description
                    };
                    monitorsService.updateTag(provider, tagDetails, next);
                }
            ],
            function(err, results) {
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
    app.delete('/monitors/:monitorId', validate(monitorsValidator.update), deleteMonitor);

    function deleteMonitor(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    monitorsService.deleteMonitors(req.params.monitorId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};
