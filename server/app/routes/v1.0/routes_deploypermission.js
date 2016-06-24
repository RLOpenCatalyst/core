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
var async = require('async');
var	appDeployPermissionService = require('_pr/services/appDeployPermissionService');
var appDeployValidator = require('_pr/validators/appDeployValidator');
var validate = require('express-validation');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/deploy-permission/*', sessionVerificationFunc);

  /*  // Get  DeployPermission by Project and Env
    app.get('/deploy-permission/project/:projectId/env/:envId', function(req, res) {
        logger.debug("version= ",req.query.version);
        DeployPermission.getDeployPermissionByProjectAndEnv(req.params.projectId, req.params.envName,req.query.application, req.query.version, function(err, permission) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(permission);
            return;
        });
    });

    // Create if not exist else update
    app.post('/deploy-permission', function(req, res) {
        DeployPermission.createNewOrUpdate(req.body.permission, function(err, permission) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(permission);
            return;
        });

    });*/
    app.get('/deploy-permission/project/:projectId/env/:envName/permissionList',validate(appDeployValidator.getDeployPermission),getDeployPermissionByProjectIdEnvNameAppNameVersion);

    function getDeployPermissionByProjectIdEnvNameAppNameVersion(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    appDeployPermissionService.getDeployPermissionByProjectIdEnvNameAppNameVersion(req.params.projectId, req.params.envName,req.query.appName, req.query.version, next);
                }
            ],
            function (err, results) {
                if (err) {
                    //return res.status(500).send({code: 500, errMessage: err});
                    next(err);
                } else {
                    return res.send(results);
                }
            }
        );
    }




    app.post('/deploy-permission/save/permissionData',validate(appDeployValidator.deployPermission),saveAndUpdateDeployPermission);
    app.put('/deploy-permission/update/permissionData',validate(appDeployValidator.deployPermission),saveAndUpdateDeployPermission);

    function saveAndUpdateDeployPermission(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    appDeployPermissionService.saveAndUpdateDeployPermission(req.body, next);
                }
            ],
            function (err, results) {
                if (err) {
                    return res.status(500).send({code: 500, errMessage: err});
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};