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


// The file contains all the end points for AppDeploy promote permission

var logger = require('_pr/logger')(module);
var errorResponses = require('./error_responses');
var DeployPermission = require('_pr/model/app-deploy/deploy-permission');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/deploy/permission/*', sessionVerificationFunc);

    // Get  DeployPermission by Project and Env
    app.get('/deploy/permission/project/:projectId/env/:envId', function(req, res) {
        logger.debug("version= ",req.query.version);
        DeployPermission.getDeployPermissionByProjectAndEnv(req.params.projectId, req.params.envId,req.query.application, req.query.version, function(err, permission) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(permission);
            return;
        });
    });

    // Create if not exist else update
    app.post('/deploy/permission', function(req, res) {
        DeployPermission.createNewOrUpdate(req.body.permission, function(err, permission) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(permission);
            return;
        });

    });
};