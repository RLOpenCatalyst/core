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

var resourceService = require('_pr/services/resourceService');
var providerService = require('_pr/services/providerService');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/resources/*", sessionVerificationFunc);

    app.get('/resources', getAWSResources);

    function getAWSResources(req, res, next) {
            var reqData = {};
            async.waterfall(
                [
                    function(next){
                        apiUtil.changeRequestForJqueryPagination(req.query,next);
                    },
                    function(reqData,next) {
                        apiUtil.paginationRequest(reqData, 'resources', next);
                    },
                    function(paginationReq, next) {
                        reqData = paginationReq;
                        if(paginationReq.filterBy.resourceType === 'S3'){
                            paginationReq['searchColumns'] = ['resourceDetails.bucketName'];
                        }else if(paginationReq.filterBy.resourceType === 'RDS') {
                            paginationReq['searchColumns'] = ['resourceDetails.dbName','resourceDetails.dbEngine'];
                        }
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function(queryObj, next) {
                        resourceService.getResources(queryObj, next);
                    },
                    function(resources,next){
                        apiUtil.changeResponseForJqueryPagination(resources[0],reqData,next);
                    },

                ], function(err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
        };

    app.patch('resources/', updateUnassignedResourcesTags);
    
    function updateUnassignedResourcesTags(req,res,next){
        console.log("Welcome");
        async.waterfall(
            [
                function (next) {
                    providerService.checkIfProviderExists(req.query.providerId, next);
                },
                function(provider, next) {
                    if('resources' in req.body) {
                        resourceService.bulkUpdateResourceProviderTags(provider, req.body.resources, next);
                    } else {
                        var err = new Error("Malformed request");
                        err.status = 400;
                        next(err);
                    }
                },
                function(resources, next) {
                    console.log("Welcome 1234");
                    resourceService.bulkUpdateUnassignedResourceTags(resources, next);
                }
            ],
            function (err, results) {
                if (err) {
                    next(err);
                } else {
                    return res.status(200).send(results);
                }
            }
        );
    }
};