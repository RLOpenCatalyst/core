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
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/tracked-instances/*", sessionVerificationFunc);

    /**
     * @api {get} /tracked-instances 	        Get tracked instances
     * @apiName getTrackedInstances
     * @apiGroup tracked-instances
     *
     * @apiSuccess {Object[]} trackedInstances                      List of tracked instances
     * @apiSuccess {String} trackedInstances.id		                Instance id
     * @apiSuccess {String} trackedInstances.category 	            Instance category (managed/unmanaged)
     * @apiSuccess {String} trackedInstances.instancePlatformId		Id of the instance on the platform
     * @apiSuccess {String} trackedInstances.projectName			Project name
     * @apiSuccess {String} trackedInstances.providerId			    Provider id
     * @apiSuccess {String} trackedInstances.providerType			Provider (AWS/Azure...)
     * @apiSuccess {String} trackedInstances.environmentName		Environment name
     * @apiSuccess {String} trackedInstances.cpuUtilization		    CPU Utilization in %
     *
     * @apiSuccessExample {json} Success-Response:
     * 		HTTP/1.1 200 OK
     * 		{
	 *
	 * 			"trackedInstances": [
	 * 				{
     *                  "id": "<MongoID>",
     *                  "category": "unmanaged",
     *                  "instancePlatformId": "<InstanceID>",
     *                  "projectName": "AppName1",
     *                  "providerId": "<MongoID>",
     *                  "environmentName": "Development",
     *                  "providerType": "AWS",
     *                  "cpuUtilization": "0%"
     *              },
	 *				{
     *                  "id": "MongoID",
     *                  "category": "unmanaged",
     *                  "instancePlatformId": "<InstanceID>",
     *                  "projectName": "AppName2",
     *                  "providerId": "<MongoID>",
     *                  "environmentName": "Development",
     *                  "providerType": "AWS",
     *                  "cpuUtilization": "3%"
     *              }
	 * 			],
	 *			"count": 5,
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
                    apiUtil.paginationRequest(req.query,'trackedInstances', next);
                },
                function(paginationRequest, next) {
                    // @TODO changes to be made when token is used
                    apiUtil.databaseUtil(paginationRequest, next);
                },
                function(filterQuery, next) {
                    userService.getUserOrgs(req.session.user, function(err, orgs) {
                        if(err) {
                            next(err);
                        } else {
                            instanceService.validateListInstancesQuery(orgs, filterQuery, next);
                        }
                    });
                },
                function(filterQuery, next) {
                    instanceService.getTrackedInstances(filterQuery.queryObj, next);
                },
                function(instances, next) {
                    instanceService.createTrackedInstancesResponse(instances, next);
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