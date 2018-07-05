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
var resources = require('_pr/model/resources/resources');
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
    app.all("/resources*", sessionVerificationFunc);

    app.get('/resources', getAllResources);

    app.get('/resources/:resourceId', getResourceById);

    app.get('/resources/resourceList', getAllResourceList);

    function getAllResources(req, res, next) {
            var reqObj = {};
            async.waterfall(
                [
                    function(next){
                        apiUtil.changeRequestForJqueryPagination(req.query,next);
                    },
                    function(reqData,next) {
                        reqObj = reqData;
                        apiUtil.paginationRequest(reqData, 'resources', next);
                    },
                    function(paginationReq, next) {
                        if(paginationReq.filterBy.resourceType === 'S3'){
                            paginationReq['searchColumns'] = ['resourceDetails.bucketName','resourceDetails.bucketOwnerName'];
                        }else if(paginationReq.filterBy.resourceType === 'RDS') {
                            paginationReq['searchColumns'] = ['resourceDetails.dbName','resourceDetails.dbEngine','resourceDetails.dbInstanceClass','resourceDetails.region'];
                        }
                        apiUtil.databaseUtil(paginationReq, next);
                    },
                    function(queryObj, next) {
                        resourceService.getResources(queryObj, next);
                    },
                    function(resources,next){
                        apiUtil.changeResponseForJqueryPagination(resources[0],reqObj,next);
                    },

                ], function(err, results) {
                    if (err)
                        next(err);
                    else
                        return res.status(200).send(results);
                });
    };

    function getResourceById(req,res){
        resources.getResourceById(req.params.resourceId,function(err,resource){
            if(err){
                return res.status(500).send(err);
            }else{
                return res.status(200).send(resource);
            }
        })
    };

    function getAllResourceList(req,res,next) {
        var reqData = {};
        async.waterfall(
            [
                function (next) {
                    apiUtil.paginationRequest(req.query, 'resources', next);
                },
                function (paginationReq, next) {
                    reqData = paginationReq;
                    apiUtil.databaseUtil(paginationReq, next);
                },
                function (queryObj, next) {
                    resourceService.getResources(queryObj, next);
                },
                function (resources, next) {
                    apiUtil.paginationResponse(resources[0], reqData, next);
                }

            ], function (err, results) {
                if (err)
                    next(err);
                else
                    return res.status(200).send(results);
            });
    }


    app.patch('/resources', updateUnassignedResourcesTags);
    
    function updateUnassignedResourcesTags(req,res,next){
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
                    resourceService.bulkUpdateUnassignedResourceTags(req.body.resources, next);
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