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

var logger = require('_pr/logger')(module);
var appConfig = require('_pr/config');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var MasterUtil = require('_pr/lib/utils/masterUtil.js');
var uuid = require('node-uuid');
var constantData = require('_pr/lib/utils/constant.js');
var validate = require('express-validation');
var instanceValidator = require('_pr/validators/instanceValidator');
var	providerService = require('_pr/services/providerService');
var instanceService = require('_pr/services/instanceService');
var userService = require('_pr/services/userService');
var async = require('async');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/tracked-instances/*", sessionVerificationFunc);

    /**
     * @api {get} /tracked-instances 	        Get tracked instances
     * @apiName getTrackedInstances
     * @apiGroup tags
     *
     * @apiParam {Number} providerId 			Provider ID
     *
     * @apiSuccess {Object[]} tags				List of tags
     * @apiSuccess {String} tags.name			Tag name
     * @apiSuccess {String} tags.description 	Tag description
     * @apiSuccess {Number} count				Number of tags in the result set
     * @apiSuccess {pageSize} pageSize			Page size
     * @apiSuccess {pageIndex} pageIndex		Page index
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
     * 		{
	 *
	 * 			"tracked-instances": [
	 * 				{
	 * 					"name":	"env",
	 * 					"description": "Deployment environment"
	 * 				},
	 *				{
	 * 					"name":	"application",
	 * 					"description": "Project name"
	 * 				}
	 * 			],
	 *			"count": 2,
	 *			"pageSize": 10,
	 *			"pageIndex": 1
	 * 		}
     *
     */
    app.get('/tracked-instances', getTrackedInstances);

    function getTrackedInstances(req, res, next) {
        async.waterfall(
            [
                function(next) {
                    // @TODO changes  to be made when token is used
                    userService.getUserOrgs(req.session.user, next);
                },
                function(orgIds, next) {
                    instanceService.getTrackedInstancesForOrgs(orgIds, next);
                }
            ],
            function(err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};