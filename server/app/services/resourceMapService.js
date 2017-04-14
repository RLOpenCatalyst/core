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
var cloudFormation = require('_pr/model/cloud-formation');
var azureArm = require('_pr/model/azure-arm');
var instancesDao = require('_pr/model/classes/instance/instance');
var resources = require('_pr/model/resources/resources');
var resourceMap = require('_pr/model/resourceMap/resourceMap.js');

var resourceMapService = module.exports = {};

resourceMapService.getAllResourcesByFilter = function getAllResourcesByFilter(reqQueryObj,callback){
    var stackNameObj = [];
    async.parallel({
        instances:function(callback){
            var reqData = {};
            async.waterfall([
                function (next) {
                    apiUtil.queryFilterBy(reqQueryObj, next);
                },
                function (queryObj, next) {
                    queryObj["providerId"] = {$ne:null};
                    var filterByObjKeyList = Object.keys(queryObj);
                    if (filterByObjKeyList.indexOf('stackName') >= 0) {
                        async.parallel({
                            cfs: function (callback) {
                                cloudFormation.getCloudFormationList({stackName: queryObj.stackName}, function (err, cloudFormationList) {
                                    if (err) {
                                        callback(err, null);
                                        return;
                                    } else {
                                        var cfsIds = [];
                                        cloudFormationList.forEach(function (cfs) {
                                            cfsIds.push(cfs._id);
                                        });
                                        callback(null, cfsIds);
                                        return;
                                    }
                                });
                            },
                            arm: function (callback) {
                                azureArm.getAzureArmList({deploymentName: queryObj.stackName}, function (err, armList) {
                                    if (err) {
                                        next(err, null);
                                        return;
                                    } else {
                                        var armIds = [];
                                        armList.forEach(function (arm) {
                                            armIds.push(arm._id);
                                        })
                                        callback(null, armIds);
                                        return;
                                    }
                                })
                            }
                        }, function (err, result) {
                            if (err) {
                                next(err, null);
                                return;
                            } else {
                                queryObj["$or"] = [
                                    {cloudFormationId: {$in: result.cfs}},
                                    {armId: {$in: result.arm}},
                                    {domainName: queryObj.stackName}
                                ];
                                delete queryObj['stackName'];
                                instancesDao.getAllInstancesByStackName(queryObj, next);
                                return;
                            }
                        })
                    }else{
                        instancesDao.getAllInstancesByStackName(queryObj, next);
                        return;
                    }
                },
                function (instances, next) {
                    var instanceIds = [];
                    instances.forEach(function(instance){
                        instanceIds.push(instance._id);
                    })
                    next(null,instanceIds);
                }], function (err, results) {
                if (err) {
                    callback({
                        "errorCode": 500,
                        "message": "Error occured while fetching Instance."
                    },null);
                } else {
                    callback(null,results);
                    return;
                }
            });
        },
        rds:function(callback){
            async.waterfall([
                function (next) {
                    apiUtil.queryFilterBy(reqQueryObj,next);
                },
                function (queryObj, next) {
                    queryObj['resourceType'] = "RDS";
                    resources.getResources(queryObj, next)
                },
                function (rdsResources, next) {
                    var rdsIds = [];
                    rdsResources.forEach(function(rdsResource){
                        rdsIds.push(rdsResource._id);
                    })
                    next(null,rdsIds);
                }], function (err, results) {
                if (err) {
                    callback({
                        "errorCode": 500,
                        "message": "Error occured while fetching RDS resources."
                    },null);
                } else {
                    callback(null,results);
                    return;
                }
            });
        },
        s3:function(callback){
            async.waterfall([
                function (next) {
                    apiUtil.queryFilterBy(reqQueryObj,next);
                },
                function (queryObj, next) {
                    queryObj['resourceType'] = "S3";
                    resources.getResources(queryObj, next)
                },
                function (s3Resources, next) {
                    var s3Ids = [];
                    s3Resources.forEach(function(s3Resource){
                        s3Ids.push(s3Resource._id);
                    })
                    next(null,s3Ids);
                }], function (err, results) {
                if (err) {
                    callback({
                        "errorCode": 500,
                        "message": "Error occured while fetching S3 resources."
                    },null);
                } else {
                    callback(null,results);
                    return;
                }
            });
        }
    },function(err,results){
        if(err){
            logger.error(err);
            callback(err,null);
            return;
        }else{
            callback(null,results);
            return;
        }
    })

}

resourceMapService.updateResourceMap = function updateResourceMap(resourceId,resourceObj,callback){
    async.waterfall([
        function(next){
            resourceMap.getResourceMapById(resourceId,next);
        },
        function(resourceMapData,next){
            if(resourceMapData.length > 0 && resourceMapData[0].resources.length === 0){
                resourceMap.updatedResourceMap(resourceId,resourceObj,next);
            }else if(resourceMapData.length > 0 && resourceMapData[0].resources.length > 0){
                resourceMapData[0].resources

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



