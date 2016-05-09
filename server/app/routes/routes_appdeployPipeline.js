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
var AppDeploy = require('_pr/model/app-deploy/app-deploy');
var errorResponses = require('./error_responses');
var AppData = require('_pr/model/app-deploy/app-data');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var AppDeployPipeline = require('_pr/model/app-deploy/appdeploy-pipeline');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var async = require('async');
var	appDeployPipelineService = require('_pr/services/appDeployPipelineService');
var appDeployValidator = require('_pr/validators/appDeployValidator');
var validate = require('express-validation');




module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/app-deploy-pipeline/*', sessionVerificationFunc);



    app.post('/app-deploy-pipeline/data/configure', function(req, res) {
        var loggedInUser = req.session.user.cn;
        req.body.appDeployPipelineData.loggedInUser = loggedInUser;
        AppDeployPipeline.getAppDeployPipelineByProjectId(req.body.appDeployPipelineData.projectId, function(err, appDeployes) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            if (appDeployes.length) {
                appDeployes[0].envId = req.body.appDeployPipelineData.envId;
                appDeployes[0].envSequence = req.body.appDeployPipelineData.envSequence;

                appDeployes[0].save(function(err, appDeployes) {
                    if (err) {
                        res.status(500).send("Pipeline Data Already Exist.");
                        return;
                    }
                    else {
                        res.send(200, appDeployes);
                        return;
                    }
                });
            }
            else {
                AppDeployPipeline.createNew(req.body.appDeployPipelineData, function(err, appDeployes) {
                    if (err) {
                        res.status(500).send("Pipeline Data Already Exist.");
                        return;
                    }
                    else{
                        res.send(200, appDeployes);
                        return;
                    }
                });
            }
        });

    });


    app.get('/app-deploy-pipeline/project/:projectId',validate(appDeployValidator.get),getProject);

    function getProject(req, res, next) {
        async.waterfall(
            [
                function (next) {
                    appDeployPipelineService.getProjectByProjectId(req.params.projectId, next);
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

    app.post('/app-deploy-pipeline/save/appConfigPipeLineData',validate(appDeployValidator.post),saveAndUpdatePipeLineConfiguration);

    app.put('/app-deploy-pipeline/update/appConfigPipeLineData',validate(appDeployValidator.post), saveAndUpdatePipeLineConfiguration);

    function saveAndUpdatePipeLineConfiguration(req, res, next) {
        var loggedInUser = req.session.user.cn;
        var jsonReqData = req.body;
        jsonReqData['loggedInUser']=loggedInUser;
        async.waterfall(
            [
                function (next) {
                    appDeployPipelineService.saveAndUpdatePipeLineConfiguration(jsonReqData, next);
                }
            ],
            function (err, results) {
                if (err) {
                    return res.status(500).send({code: 500, errMessage: err});
                } else {
                    return res.status(200).send(results);
                }

        });
    };
    



    app.post('/app-deploy-pipeline/update/configureData/project/:projectId', function(req, res) {
        AppDeployPipeline.updateConfigurePipeline(req.params.projectId, req.body.appDeployPipelineUpdateData, function(err, appDeployes) {
            if (err) {
                res.send(403, "Pipeline Data Already Exist.");
                return;
            }
            else {
                res.send(200, appDeployes);
                return;
            }
        });
    });

};