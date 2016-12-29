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
var gitHubService = require('_pr/services/gitHubService');
var async = require('async');
var validate = require('express-validation');
var gitHubValidator = require('_pr/validators/gitHubValidator');

module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/git-hub/*', sessionVerificationFunc);
    
    app.get("/git-hub", getGitHubList);

    function getGitHubList(req, res, next) {
        async.waterfall([
            function(next) {
                gitHubService.getGitHubList(req.query, next);
            }
        ], function(err, monitors) {
            if (err) {
                res.status(err.status).send(err);
            } else {
                res.status(200).send(monitors);
            }
        });
    }

    app.get('/git-hub/:gitHubId', getGitHubById);
    function getGitHubById(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.getGitHubById(req.params.gitHubId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
    app.post('/git-hub', validate(gitHubValidator.create), createGitHub);

    function createGitHub(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.createGitHub(req.body, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(201).send(results);
                }
            }
        );
    }

    app.put('/git-hub/:gitHubId', validate(gitHubValidator.update), updateGitHub);

    function updateGitHub(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(monitor, next) {
                    gitHubService.updateGitHub(req.params.gitHubId, req.body, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }

    app.delete('/git-hub/:gitHubId', deleteGitHub);

    function deleteGitHub(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(monitor, next) {
                    gitHubService.deleteGitHub(req.params.gitHubId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    res.status(err.status).send(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};
