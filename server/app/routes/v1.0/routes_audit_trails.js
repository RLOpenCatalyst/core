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

var instancesDao = require('_pr/model/classes/instance/instance');
var logsDao = require('_pr/model/dao/logsdao.js');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var instanceService = require('_pr/services/instanceService');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all('/audit-trail/*', sessionVerificationFunc);
    app.get('/audit-trail/instance-action', getInstanceActionList);

    function getInstanceActionList(req, res, next) {
        var reqData = {};
        async.waterfall(
            [

                function(next) {
                    apiUtil.paginationRequest(req.query, 'instances', next);
                },
                function(paginationReq, next) {
                    reqData = paginationReq;
                    instanceService.getInstanceActionList(paginationReq, next);
                },
                function(instanceActions, next) {
                    apiUtil.paginationResponse(instanceActions, reqData, next);
                }

            ],
            function(err, results) {
                if (err)
                    next(err);
                else
                    return res.status(200).send(results);
            });
    }
};
