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
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(reqQueryObj, 'resourceMap', next);
        },
        function(paginationReq,next){
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            resourceMap.getAllResourceMapByFilter(queryObj, next);
        },
        function(resourceMapData,next){
            apiUtil.paginationResponse(resourceMapData, reqData, next);
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

resourceMapService.deleteAllResourcesByFilter = function deleteAllResourcesByFilter(reqQueryObj,callback){
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.queryFilterBy(reqQueryObj, next);
        },
        function (queryObj, next) {
            resourceMap.deleteAllResourcesByFilter(queryObj, next);
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

resourceMapService.updateResourceMap = function updateResourceMap(resourceName,data,callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMapByName(resourceName,next);
        },
        function(resourceMapData,next){
            if(resourceMapData.length > 0){
                resourceMap.updatedResourceMap(resourceName,data,next);
            }else{
                var err =  new Error();
                err.code = 500;
                err.message = "No Resource Map is available in DB against name "+resourceName;
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

resourceMapService.getResourceMapByName = function getResourceMapByName(name,callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMapByName(name,next);
        },
        function(resourceMapData,next){
            if(resourceMapData.length > 0){
                var err =  new Error();
                err.code = 500;
                err.message = name+" is already used by other service. So please enter different and unique name.";
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

resourceMapService.getResourceMaps = function getResourceMaps(callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMaps(next);
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



