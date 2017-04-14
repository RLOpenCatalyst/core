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

const logger = require('_pr/logger')(module);
var async = require('async');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var resourceMap = require('_pr/model/resourceMap/resourceMap.js');

var resourceMapService = module.exports = {};

resourceMapService.getAllResourcesByFilter = function getAllResourcesByFilter(reqQueryObj,callback){
    async.waterfall([
        function (next) {
            apiUtil.queryFilterBy(reqQueryObj, next);
        },
        function (queryObj, next) {
            resourceMap.getAllResourceMapByFilter(queryObj, next);
        },
        function (serviceMapList,next){
            var resourceMapList = [];
            serviceMapList.forEach(function(serviceMap){
                resourceMapList.push({
                    name:serviceMap.stackName,
                    status: serviceMap.stackStatus,
                    type:serviceMap.stackType,
                    resources:serviceMap.resources
                });
            });
            next(null,resourceMapList);
        }
    ],function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })

};

resourceMapService.createNewResourceMap = function createNewResourceMap(resourceMapObj,callback){
    resourceMap.createNew(resourceMapObj,function(err,resourceMapData){
        if(err){
            logger.error("resourceMap.createNew is Failed ==>", err);
            callback(err,null);
            return;
        }else{
            callback(null,resourceMapData);
            return;
        }
    });
}

resourceMapService.updateResourceMap = function updateResourceMap(resourceStackName,data,callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMapByStackName(resourceStackName,next);
        },
        function(resourceMapData,next){
            if(resourceMapData.length > 0){
                if(resourceMapData[0].resources.length > 0){
                    var findCheck = false;
                    resourceMapData[0].resources.forEach(function(resource){
                        if(resource.id===data.id){
                            findCheck = true;
                        }
                    })
                    if(findCheck=== true){
                        var resourceObj = {
                            stackStatus:data.stackStatus
                        }
                        resourceMap.updatedResourceMap(resourceId,resourceObj,next);
                    }else{
                        resourceMapData[0].resources.push({
                            id:data.id,
                            type:data.type
                        })
                        var resourceObj = {
                            resources:resourceMapData[0].resources,
                            stackStatus:data.stackStatus
                        }
                        resourceMap.updatedResourceMap(resourceId,resourceObj,next);
                    }
                }else{
                    resourceMapData[0].resources.push({
                        id:data.id,
                        type:data.type
                    })
                }
                var resourceObj = {
                    resources:resourceMapData[0].resources,
                    stackStatus:data.stackStatus
                }
                resourceMap.updatedResourceMap(resourceId,resourceObj,next);
            }else{
                var err =  new Error();
                err.code = 500;
                err.message = "No Resource Map is available in DB against Id "+resourceId;
                next(err,null);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
}

resourceMapService.getResourceMapByStackName = function getResourceMapByStackName(stackName,callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMapByStackName(stackName,next);
        },
        function(resourceMapData,next){
            if(resourceMapData.length > 0){
                var err =  new Error();
                err.code = 500;
                err.message = stackName+" is already used by other service. So please enter different and unique";
                next(err,null);
            }else{
               next(null,resourceMapData);
            }
        }
    ],function(err,results){
        if(err){
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })
}



