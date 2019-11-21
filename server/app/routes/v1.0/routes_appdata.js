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
var errorResponses = require('./error_responses');
var AppData = require('_pr/model/app-deploy/app-data');
var appDataService = require('_pr/services/appDataService');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/app-data*', sessionVerificationFunc);

    // Get  AppData by Project and Env
    app.get('/app-data/project/:projectId/env/:envName', function(req, res) {
        appDataService.getAppDataByProjectAndEnv(req.params.projectId, req.params.envName, req.query.application, req.query.version, function(err, appData) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            res.status(200).send(appData);
            return;
        });
    });

    // Create if not exist else update
    app.post('/app-data', function(req, res) {
        logger.debug("appData: ", JSON.stringify(req.body.appData));
        AppData.createNewOrUpdate(req.body.appData, function(err, appData) {
            if (err) {
                res.status(500).send(errorResponses.db.error);
                return;
            }
            logger.debug("AppData created: ", JSON.stringify(appData));
            res.status(200).send(appData);
            return;
        });

    });
};
