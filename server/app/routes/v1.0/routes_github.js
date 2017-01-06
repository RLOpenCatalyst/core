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

    function getGitHubList(req, res) {
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
    function getGitHubById(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
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

    app.get('/git-hub/:gitHubId/sync', getGitHubSync);
    function getGitHubSync(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
                    gitHubService.getGitHubSync(req.params.gitHubId, next);
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

    function createGitHub(req, res) {
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

    function updateGitHub(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub, next) {
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
    /**
     * @api {delete} /git-hub/:gitHubId Delete Git-Hub Repository
     * @apiName /git-hub
     * @apiGroup Delete Git-Hub Repository
     *
     * @apiParam {String} gitHubId    Git Hub ID
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub Deletion'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub Deletion'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub Deletion'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub Deletion'}
     *     };
     */


    app.delete('/git-hub/:gitHubId', deleteGitHub);

    function deleteGitHub(req, res) {
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
