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
var noticeService = require('_pr/services/noticeService');
var async = require('async');
var validate = require('express-validation');
var gitHubValidator = require('_pr/validators/gitHubValidator');

module.exports.setRoutes = function(app, sessionVerificationFunc) {

    app.all('/git-hub*', sessionVerificationFunc);

    /**
     * @api {get} /git-hub/ List all Git-Hub Repository
     * @apiName /git-hub
     * @apiGroup List all the Git-Hub Repository with Pagination
     *
     * @apiQueryParam {Number} page    Page Number
     * @apiQueryParam {Number} pageSize    Number of Records per page
     * @apiQueryParam {String} sortBy    All the records are sorted By one common field
     * @apiQueryParam {String} filterBy    All the records are filter By selected values
     * @apiQueryParam {String} search    All the records are search By input text
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     * {
	 * "gitHub": [{
	 *	"_id": "586f58a417c109866b1067ba",
	 *	"name": "Durgesh-Bots",
	 *	"description": "BOT Factory",
	 *	"repositoryURL": "https://github.com/RLIndia/botsfactory.git",
	 *	"repositoryType": "Private",
	 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
	 *	"orgName": "Phoenix",
     *	"repositoryUserName": "Durgesh1988",
	 *	"authenticationType": "userName",
	 *	"repositoryPassword": "Durgesh@12356"
	 * }],
	 * "metaData": {
     *		"totalRecords": 1,
	 * 	    "pageSize": 50,
     *		"page": 1,
	 *  	"totalPages": 1,
     *		"sortBy": "createdOn",
	 *  	"sortOrder": "asc"
     *	}
     * }
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub List'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub List'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub List'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub List'}
     *     };
     */

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

    /**
     * @api {get} /git-hub/:gitHubId Git-Hub Repository Details
     * @apiName /git-hub
     * @apiGroup Particular Git-Hub Repository Details
     *
     * @apiParam {String} gitHubId    Git Hub ID
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     * {
	 *	"_id": "586f58a417c109866b1067ba",
	 *	"name": "Durgesh-Bots",
	 *	"description": "BOT Factory",
	 *	"repositoryURL": "https://github.com/RLIndia/botsfactory.git",
	 *	"repositoryType": "Private",
	 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
	 *	"orgName": "Phoenix",
     *	"repositoryUserName": "Durgesh1988",
	 *	"authenticationType": "userName",
	 *	"repositoryPassword": "Durgesh@12356"
	 *	}
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub List'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub List'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub List'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub List'}
     *     };
     */

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

    /**
     * @api {get} /git-hub/:gitHubId/sync Git-Hub Repository Sync
     * @apiName /git-hub
     * @apiGroup Sync Git-Hub Repository
     *
     * @apiParam {String} gitHubId    Git Hub ID
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     * {
     *      code:200,
     *      message:'Git Hub Repository Successfully Synced.',
     *      fields:{successMessage:'Git Hub Repository Successfully Synced',attribute:'Git-Hub Sync'}
     * }
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub Sync'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub Sync'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub Sync'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub Sync'}
     *     };
     */

    app.get('/git-hub/:gitHubId/sync', getGitHubSync);
    function getGitHubSync(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
                    gitHubService.getGitHubSync(req.params.gitHubId,'sync', next);
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

    app.get('/git-hub/:gitHubId/import', getGitHubImport);
    function getGitHubImport(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
                    gitHubService.getGitHubSync(req.params.gitHubId,'import', next);
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

    app.post('/git-hub/:gitHubId/copy',gitHubcopy);
    function gitHubcopy(req,res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
                    gitHubService.gitHubCopy(req.params.gitHubId, req.body.gitHubBody, next);
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

    app.get('/git-hub/:gitHubId/content/:botId', getGitHubSingleImport);
    function getGitHubSingleImport(req, res) {
        async.waterfall(
            [
                function(next) {
                    gitHubService.checkIfGitHubExists(req.params.gitHubId, next);
                },
                function(gitHub,next) {
                    gitHubService.gitHubContentSync(req.params.gitHubId, req.params.botId, next);
                }
            ],
            function(err, results) {
                if (err) {
                    noticeService.notice(req.session.user.cn,{title:'Bot sync',body:req.params.botId+ ' sync unsuccessful'},"error",function(err,data){
                    if(err){
                        return res.sendStatus(500);
                    }});
                    res.status(err.status).send(err);
                } else {
                    noticeService.notice(req.session.user.cn,{title:'Bot sync',body:req.params.botId+ ' sync successful'},"success",function(err,data){
                    if(err){
                        return res.sendStatus(500);
                    }});
                    return res.sendStatus(200);
                }
            }
        );
    }
    /**
     * @api {post} /git-hub/ Create a Git-Hub Repository
     * @apiName /git-hub
     * @apiGroup Create a Git-Hub Repository
     *
     * @apiParamExample {json} Request-Example:
     *      {
     *           "name": "Durgesh-Bots",
	 *	         "description": "BOT Factory",
	 *	         "repositoryURL": "https://github.com/RLIndia/botsfactory.git",
	 *	         "repositoryType": "Private",
	 *	         "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
     *	         "repositoryUserName": "Durgesh1988",
	 *	         "authenticationType": "userName",
	 *	         "repositoryPassword": "Durgesh@12356"
     *      }
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     * {
	 *	"_id": "586f58a417c109866b1067ba",
	 *	"name": "Durgesh-Bots",
	 *	"description": "BOT Factory",
	 *	"repositoryURL": "https://github.com/RLIndia/botsfactory.git",
	 *	"repositoryType": "Private",
	 *	"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
	 *	"orgName": "Phoenix",
     *	"repositoryUserName": "Durgesh1988",
	 *	"authenticationType": "userName",
	 *	"repositoryPassword": "Durgesh@12356"
	 *	}
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub Creation'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub Creation'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub Creation'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub Creation'}
     *     };
     */

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

    /**
     * @api {put} /git-hub/:gitHubId Update a Git-Hub Repository
     * @apiName /git-hub
     * @apiGroup Update a Git-Hub Repository
     *
     * @apiParamExample {json} Request-Example:
     *      {
     *           "_id": "586f58a417c109866b1067ba"
     *           "name": "Durgesh-Bots",
	 *	         "description": "BOT Factory",
	 *	         "repositoryURL": "https://github.com/RLIndia/botsfactory.git",
	 *	         "repositoryType": "Private",
	 *	         "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
     *	         "repositoryUserName": "Durgesh1988",
	 *	         "authenticationType": "userName",
	 *	         "repositoryPassword": "Durgesh@12356"
     *      }
     *
     * @apiSuccess [JSONObject]
     *
     * @apiSuccessExample Success-Response:
     * {
     *      code:200,
     *      message:'Git Hub Repository Successfully updated.',
     *      fields:{successMessage:'Git Hub Repository Successfully updated',attribute:'Git-Hub Updating'}
     * }
     *
     * @apiError 400 Bad Request.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:400,
     *      message:'Bad Request',
     *      fields:{errorMessage:'Bad Request',attribute:'Git-Hub Updating'}
     *     };
     * @apiError 403 Forbidden.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:403,
     *      message:'Forbidden',
     *      fields:{errorMessage:'The request was a valid request, but the server is refusing to respond to it',attribute:'Git-Hub Updating'}
     *     };
     * @apiError 404 Not Found.
     *
     * @apiErrorExample Error-Response:
     *    {
     *      code:404,
     *      message:'Not Found',
     *      fields:{errorMessage:'The requested resource could not be found but may be available in the future',attribute:'Git-Hub Updating'}
     *     };
     * @apiError 500 InternalServerError.
     *
     * @apiErrorExample Error-Response:
     *  {
     *      code:500,
     *      message:'Internal Server Error',
     *      fields:{errorMessage:'Server Behaved Unexpectedly',attribute:'Git-Hub Updating'}
     *     };
     */


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
     *  {
     *      code:200,
     *      message:'Git Hub Repository Successfully deleted.',
     *      fields:{successMessage:'Git Hub Repository Successfully deleted',attribute:'Git-Hub Deletion'}
     * }
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
