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


// This file act as a Controller which contains project related all end points.


var blueprintsDao = require('_pr/model/dao/blueprints');

var instancesDao = require('_pr/model/classes/instance/instance');

module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/projects/*', sessionVerificationFunc);

    app.get('/projects/:projectId/environments/:envId/blueprints', function(req, res) {
        blueprintsDao.getBlueprintsByProjectAndEnvId(req.params.projectId, req.params.envId, req.query.blueprintType, req.session.user.cn, function(err, data) {
            if (err) {
                res.send(500);
                return;
            }
            res.send(data);
        });
    });

    app.post('/projects/:projectId/environments/:envId/blueprints', function(req, res) {
        var blueprintData = req.body.blueprintData;
        blueprintData.projectId = req.params.projectId;
        blueprintData.envId = req.params.envId;
        logger.debug(JSON.stringify(blueprintData));
        if (!blueprintData.runlist) {
            blueprintData.runlist = [];
        }
        if (!blueprintData.users || !blueprintData.users.length) {
            res.send(400);
            return;
        }

        blueprintsDao.createBlueprint(blueprintData, function(err, data) {
            if (err) {
                res.send(500);
                return;
            }
            res.send(data);
        });
    });

    app.get('/projects/:projectId/environments/:envId/instances', function(req, res) {
        instancesDao.getInstancesByProjectAndEnvId(req.params.projectId, req.params.envId, req.query.instanceType, req.session.user.cn, function(err, data) {
            if (err) {
                res.send(500);
                return;
            }
            res.send(data);
        });
    });


};