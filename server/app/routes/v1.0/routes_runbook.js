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


// The file contains all the end points for Runbook

var logger = require('_pr/logger')(module);
var errorResponses = require('./error_responses');
var runbookService = require('../../services/runbookService');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all('/runbooks*', sessionVerificationFunc);

    // Get  AppData by Project and Env
    app.get('/runbooks', function(req, res) {
        runbookService.getRunbookYAML(req.query, function(err, data) {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.status(200).send(data);
            return;
        });
    });


    app.get('/runbooks/bots', function(req, res) {
        runbookService.getRunbookBots(req.query.runbookId,function(err, data) {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.status(200).send(data);
            return;
        });
    });

    app.get('/runbooks/credentials', function(req, res) {
        runbookService.getRunbookCredentials(req.query.runbookId,function(err, appData) {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.status(200).send(appData);
            return;
        });
    });

    // Create if not exist else update
/*   app.post('/runbook', function(req, res) {

       runbookService.createNewOrUpdate(data, function(err, appData) {
            if (err) {
                res.status(500).send(err);
                return;
            }
            logger.debug("AppData created: ", JSON.stringify(appData));
            res.status(200).send(appData);
            return;
        });

    });*/
};
