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
var uuid = require('node-uuid');
var instanceValidator = require('_pr/validators/instanceValidator');
var	providerService = require('_pr/services/providerService');
var instanceService = require('_pr/services/instanceService');
var settingService = require('_pr/services/settingsService');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/tracked-instances*", sessionVerificationFunc);

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
	 * 			]
	 * 		}
     *
     */
    app.get('/tracked-instances', getTrackedInstances);

    /**
     * Lists all tracked(managed+unmanaged) instances.
     * Pagination not supported. Only search and filterBy supported.
     *
     * @param req
     * @param res
     * @param next
     */
    function getTrackedInstances(req, res, next) {
        var category = req.query.category;
        var reqObj={};
        async.waterfall(
            [
                function (next) {
                    apiUtil.changeRequestForJqueryPagination(req.query, next);
                },
                function(reqData,next) {
                    reqObj = reqData;
                    apiUtil.paginationRequest(reqData,'trackedInstances', next);
                },
                function(paginationRequest, next) {
                    if(category === 'managed') {
                        paginationRequest['searchColumns'] = ['instanceIP', 'instanceState','platformId','hardware.os','projectName','environmentName'];
                    }else if(category === 'assigned'){
                        paginationRequest['searchColumns'] = ['ip', 'platformId','os','state','projectName','environmentName','providerData.region'];
                    }else{
                        paginationRequest['searchColumns'] = ['ip', 'platformId','os','state','providerData.region'];
                    }
                    apiUtil.databaseUtil(paginationRequest, next);
                },
                function(filterQuery, next) {
                    if(filterQuery.queryObj['$and'][0].orgId){
                        if(filterQuery.queryObj['$and'][0].providerId){
                            next(null,filterQuery);
                        }else{
                            filterQuery.queryObj['$and'][0].providerId = { $ne : null };
                            next(null,filterQuery);
                        }
                    }else {
                        settingService.getOrgUserFilter(req.session.user.cn, function (err, orgIds) {
                            if (err) {
                                next(err);
                            }else if(orgIds.length > 0){
                                filterQuery.queryObj['$and'][0].orgId = { $in : orgIds };
                                next(null,filterQuery);
                            }else{
                                next(null,filterQuery);
                            }
                        });
                    }
                },
                function(filterQuery, next) {
                    instanceService.getTrackedInstances(filterQuery,category, next);
                },
                function (instances, next) {
                    apiUtil.changeResponseForJqueryPagination(instances[0], reqObj, next);
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