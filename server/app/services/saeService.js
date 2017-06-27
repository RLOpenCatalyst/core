/*
 Copyright [2017] [Relevance Lab]

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
var chefDao = require('_pr/model/dao/chefDao.js');
var ec2Model = require('_pr/model/resources/instance-resource');
var services = require('_pr/model/services/services.js');
var resourceModel = require('_pr/model/resources/resources');
var saeService = module.exports = {};


saeService.serviceMapSync = function serviceMapSync(callback){
    logger.debug("ServiceMap is Started");
    async.waterfall([
        function(next){
            services.getLastVersionOfEachService({},next);
        },
        function(services,next){
            if(services.length >0){
                var saeAnalysisList = [];
                services.forEach(function(service){
                    saeAnalysisList.push(function(callback){saeAnalysis(service,callback);});
                });
                if(saeAnalysisList.length === services.length) {
                    async.parallel(saeAnalysisList, function (err, results) {
                        if (err) {
                            next(err, null);
                        } else {
                            next(null, results);
                        }
                    })
                }
            }else{
                next(null,services);
            }
        }
    ],function(err,data){
        if(err){
            return callback(err,null);
        }else{
            logger.debug("ServiceMap is Done");
            return callback(null,data);
        }
    })
}


function saeAnalysis(service,callback) {
    var keyCount = 0;
    Object.keys(service.identifiers).forEach(function (key) {
        if (key === 'aws') {
            var identifierCount = 0, resourceList = [], queryObj = {}, instanceStateList = [];
            keyCount++;
            Object.keys(service.identifiers.aws).forEach(function (awsKey) {
                var queryObj = apiUtil.getQueryByKey(awsKey, service.identifiers.aws[awsKey]);
                if (queryObj.error) {
                    services.updateServiceById(service.id, {state: 'Error'}, function (err, res) {
                        if (err) {
                            logger.error("Invalid Key is in YML:", err);
                        }
                        identifierCount++
                        instanceStateList.push('error');
                        if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.aws).length) {
                            callback(null, resourceList);
                            serviceMapVersion(service, resourceList, instanceStateList);
                        }
                    })
                } else if (awsKey === 'groups') {
                    var groupKeyList = [];
                    identifierCount++;
                    Object.keys(queryObj).forEach(function (groupKey) {
                        queryObj[groupKey]['isDeleted'] = false;
                        groupKeyList.push(function (callback) {
                            awsGroupResources(groupKey, queryObj[groupKey], callback);
                        });
                    })
                    async.parallel(groupKeyList, function (err, results) {
                        if (err) {
                            callback(err, null);
                        } else {
                            var resultList = [];
                            results.forEach(function (result) {
                                result.forEach(function (resource) {
                                    resultList.push(resource);
                                })
                            })
                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.aws).length) {
                                callback(null, resultList);
                                serviceMapVersion(service, resultList, instanceStateList);
                            }
                        }
                    });
                    function awsGroupResources(groupKey, query, callback) {
                        resourceModel.getResources(query, function (err, resource) {
                            if (err) {
                                logger.error("Error in fetching Resources for Query:", query, err);
                            }
                            if (resource.length > 0) {
                                resource.forEach(function (instance) {
                                    resourceList.push({
                                        type: awsKey,
                                        value: groupKey,
                                        result: instance
                                    });
                                    if (instance.resourceDetails.state !== 'terminated' || instance.resourceDetails.state !== 'deleted') {
                                        instanceStateList.push(instance.resourceDetails.state);
                                    }
                                });
                                callback(null, resourceList);
                            } else {
                                callback(null, resourceList);
                            }
                        })
                    }
                } else {
                    resourceModel.getResources(queryObj, function (err, resource) {
                        if (err) {
                            logger.error("Error in fetching Resources for Query:", queryObj, err);
                        }
                        if (resource.length > 0) {
                            identifierCount++;
                            resource.forEach(function (instance) {
                                resourceList.push({
                                    type: awsKey,
                                    value: service.identifiers.aws[awsKey],
                                    result: instance
                                });
                                if (instance.resourceDetails.state !== 'terminated' || instance.resourceDetails.state !== 'deleted') {
                                    instanceStateList.push(instance.resourceDetails.state);
                                }
                            });
                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.aws).length) {
                                callback(null, resourceList);
                                serviceMapVersion(service, resourceList, instanceStateList);
                            }
                        } else {
                            identifierCount++;
                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.aws).length) {
                                callback(null, resourceList);
                                serviceMapVersion(service, resourceList, instanceStateList);
                            }
                        }
                    })
                }
            })
        } else {
            var identifierCount = 0, resourceList = [], queryObj = {}, instanceStateList = [];
            keyCount++;
            Object.keys(service.identifiers.chef).forEach(function (chefKey) {
                var queryObj = apiUtil.getQueryByKey(chefKey, service.identifiers.chef[chefKey]);
                if (queryObj.error) {
                    services.updateServiceById(service.id, {state: 'Error'}, function (err, res) {
                        if (err) {
                            logger.error("Invalid Key is in YML:", err);
                        }
                        identifierCount++;
                        instanceStateList.push('error');
                        if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length) {
                            callback(null, resourceList);
                            serviceMapVersion(service, resourceList, instanceStateList);
                        }
                    })
                } else if (chefKey === 'groups') {
                    var groupKeyList = [];
                    identifierCount++;
                    Object.keys(queryObj).forEach(function (groupKey) {
                        queryObj[groupKey]['orgId'] = service.masterDetails.orgId;
                        queryObj[groupKey]['serverId'] = service.masterDetails.configId;
                        queryObj[groupKey]['isDeleted'] = false;
                        groupKeyList.push(function (callback) {
                            chefGroupResources(groupKey, queryObj[groupKey], callback);
                        });
                    })
                    async.parallel(groupKeyList, function (err, results) {
                        if (err) {
                            callback(err, null);
                        } else {
                            var resultList = [];
                            results.forEach(function (result) {
                                result.forEach(function (resource) {
                                    resultList.push(resource);
                                })
                            });
                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length) {
                                callback(null, resultList);
                                serviceMapVersion(service, resultList, instanceStateList);
                            }
                        }
                    })
                    function chefGroupResources(groupKey, query, callback) {
                        chefDao.getChefNodes(query, function (err, chefNodes) {
                            if (err) {
                                logger.error("Error in fetching Resources for Query:", query, err);
                            }
                            if (chefNodes.length > 0) {
                                var chefNodeCount = 0;
                                chefNodes.forEach(function (chefNode) {
                                    var query = {
                                        $or: [{
                                            'resourceDetails.publicIp': chefNode.ip
                                        },
                                            {
                                                'resourceDetails.privateIp': chefNode.ip
                                            },
                                            {
                                                'configDetails.nodeName': chefNode.name
                                            },
                                            {
                                                'resourceDetails.platformId': chefNode.platformId
                                            }],
                                        isDeleted: false
                                    }
                                    ec2Model.getInstanceData(query, function (err, data) {
                                        if (err) {
                                            logger.error("Error in finding Resource Details for Query : ", query, err);
                                        }
                                        if (data.length > 0) {
                                            ec2Model.updateInstanceData(data[0]._id, {
                                                'resourceDetails.bootStrapState': 'success',
                                                'resourceDetails.hardware': chefNode.hardware
                                            }, function (err, data) {
                                                if (err) {
                                                    logger.error("Error in updating BootStrap State:", err);
                                                }
                                            });
                                            data[0].resourceDetails.bootStrapState = 'success';
                                            resourceList.push({
                                                type: chefKey,
                                                value: groupKey,
                                                result: data[0]
                                            });
                                            chefNodeCount++;
                                            if (data[0].resourceDetails.state !== 'terminated' || data[0].resourceDetails.state !== 'deleted') {
                                                instanceStateList.push(data[0].resourceDetails.state);
                                            }
                                            if (chefNodeCount === chefNodes.length) {
                                                callback(null, resourceList);
                                            }
                                        } else {
                                            var commonService = require('_pr/services/commonService');
                                            commonService.syncChefNodeWithResources(chefNode, service, function (err, resourceData) {
                                                if (err) {
                                                    logger.error("Error in syncing Chef Node with Resources: ", err);
                                                }
                                                resourceList.push({
                                                    type: chefKey,
                                                    value: groupKey,
                                                    result: resourceData
                                                });
                                                chefNodeCount++;
                                                instanceStateList.push(resourceData.resourceDetails.state);
                                                if (chefNodeCount === chefNodes.length) {
                                                    callback(null, resourceList);
                                                }
                                            })
                                        }
                                    })
                                })
                            } else {
                                callback(null, resourceList);
                            }
                        })
                    }
                } else {
                    queryObj['orgId'] = service.masterDetails.orgId;
                    queryObj['serverId'] = service.masterDetails.configId;
                    queryObj['isDeleted'] = false;
                    chefDao.getChefNodes(queryObj, function (err, chefNodes) {
                        if (err) {
                            logger.error("Error in fetching Chef Node Details for Query:", queryObj, err);
                        } else if (chefNodes.length > 0) {
                            var chefNodeCount = 0;
                            identifierCount++;
                            chefNodes.forEach(function (chefNode) {
                                var query = {
                                    $or: [{
                                        'resourceDetails.publicIp': chefNode.ip
                                    },
                                        {
                                            'resourceDetails.privateIp': chefNode.ip
                                        },
                                        {
                                            'configDetails.nodeName': chefNode.name
                                        },
                                        {
                                            'resourceDetails.platformId': chefNode.platformId
                                        }],
                                    isDeleted: false
                                }
                                ec2Model.getInstanceData(query, function (err, data) {
                                    if (err) {
                                        logger.error("Error in finding Resource Details for Query : ", query, err);
                                    }
                                    if (data.length > 0) {
                                        ec2Model.updateInstanceData(data[0]._id, {
                                            'resourceDetails.bootStrapState': 'success',
                                            'resourceDetails.hardware': chefNode.hardware
                                        }, function (err, data) {
                                            if (err) {
                                                logger.error("Error in updating BootStrap State:", err);
                                            }
                                        });
                                        data[0].resourceDetails.bootStrapState = 'success';
                                        data[0].resourceDetails.hardware = chefNode.hardware;
                                        resourceList.push({
                                            type: chefKey,
                                            value: service.identifiers.chef[chefKey],
                                            result: data[0]
                                        });
                                        chefNodeCount++;
                                        if (data[0].resourceDetails.state !== 'terminated' || data[0].resourceDetails.state !== 'deleted') {
                                            instanceStateList.push(data[0].resourceDetails.state);
                                        }
                                        if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                            callback(null, resourceList);
                                            serviceMapVersion(service, resourceList, instanceStateList);
                                        }
                                    } else {
                                        var commonService = require('_pr/services/commonService');
                                        commonService.syncChefNodeWithResources(chefNode, service, function (err, resourceData) {
                                            if (err) {
                                                logger.error("Error in syncing Chef Node with Resources: ", err);
                                            }
                                            resourceList.push({
                                                type: chefKey,
                                                value: service.identifiers.chef[chefKey],
                                                result: resourceData
                                            });
                                            chefNodeCount++;
                                            instanceStateList.push(resourceData.resourceDetails.state);
                                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length && chefNodeCount === chefNodes.length) {
                                                callback(null, resourceList);
                                                serviceMapVersion(service, resourceList, instanceStateList);
                                            }
                                        })
                                    }
                                })
                            })
                        } else {
                            identifierCount++;
                            if (keyCount === Object.keys(service.identifiers).length && identifierCount === Object.keys(service.identifiers.chef).length) {
                                callback(null, resourceList);
                                serviceMapVersion(service, resourceList, instanceStateList);
                            }
                        }
                    })
                }
            })
        }
    });
}

function serviceMapVersion(service,resources,instanceStateList){
    logger.debug(" Server Map Version is Started ");
    var filterResourceList = [];
    async.waterfall([
        function(next){
            if(resources.length > 0){
                var count = 0;
                resources.forEach(function(node){
                    if(node.result.category !== 'managed' && node.result.resourceDetails.state !== 'terminated') {
                        instanceStateList.push('authentication_error');
                        var resourceObj = {
                            id: node.result._id + '',
                            type: node.result.resourceType,
                            state: node.result.resourceDetails.state,
                            category: node.result.category,
                            platformId: node.result.resourceDetails.platformId,
                            authentication: node.result.authentication,
                            bootStrapState: node.result.resourceDetails.bootStrapState
                        }
                        if (node.result.resourceDetails.bootStrapState === 'bootStrapping') {
                            instanceStateList.push('bootStrapping');
                        }
                        if(node.type ==='groups'){
                            resourceObj[node.type] = [node.value];
                        }else {
                            var obj = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                            resourceObj[node.type] = obj[node.type];
                        }
                        var findCheck = false;
                        for (var i = 0; i < filterResourceList.length; i++) {
                            if (JSON.stringify(filterResourceList[i].id) === JSON.stringify(resourceObj.id)) {
                                var filterObj = filterResourceList[i];
                                if(node.type ==='groups'){
                                    var groupList = filterObj[node.type];
                                    if(groupList.indexOf(node.value) === -1){
                                        groupList.push(node.value);
                                        filterObj[node.type] = groupList;
                                    }
                                }else {
                                    var resourceVal = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                                    filterObj[node.type] = resourceVal[node.type];
                                }
                                filterResourceList.splice(i, 1);
                                filterResourceList.push(filterObj);
                                findCheck = true;
                            }
                        }
                        if (findCheck === false) {
                            filterResourceList.push(resourceObj);
                        }
                        count++;
                        if(count === resources.length){
                            next(null, filterResourceList);
                        }
                        if(node.result.authentication ==='failed'  && node.result.resourceType ==='EC2'  && node.result.resourceDetails.state ==='stopped' ){
                            var commonService = require('_pr/services/commonService');
                            commonService.startResource(node.result,function(err,state){
                                if(err){
                                    logger.error(err);
                                }else{
                                    logger.debug(state);
                                }
                            })
                        }
                    }else if(service.masterDetails.bgId === node.result.masterDetails.bgId
                        && service.masterDetails.projectId === node.result.masterDetails.projectId
                        && service.masterDetails.envId === node.result.masterDetails.envId
                        && service.masterDetails.configId === node.result.configDetails.id && node.result.resourceDetails.state !== 'terminated') {
                        var resourceObj = {
                            id: node.result._id + '',
                            type: node.result.resourceType,
                            state: node.result.resourceDetails.state,
                            category: node.result.category,
                            platformId: node.result.resourceDetails.platformId,
                            authentication: node.result.authentication,
                            bootStrapState: node.result.resourceDetails.bootStrapState
                        }
                        if(node.result.resourceDetails.bootStrapState === 'failed'){
                            instanceStateList.push('bootStrap_failed');
                        }
                        if(node.result.resourceDetails.bootStrapState === 'bootStrapping'){
                            instanceStateList.push('bootStrapping');
                        }
                        if(node.type ==='groups'){
                            resourceObj[node.type] = [node.value];
                        }else {
                            var obj = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                            resourceObj[node.type] = obj[node.type];
                        }
                        var findCheck = false;
                        for (var i = 0; i < filterResourceList.length; i++) {
                            if (JSON.stringify(filterResourceList[i].id) === JSON.stringify(resourceObj.id)) {
                                var filterObj = filterResourceList[i];
                                if(node.type ==='groups'){
                                    var groupList = filterObj[node.type];
                                    if(groupList.indexOf(node.value) === -1){
                                        groupList.push(node.value);
                                        filterObj[node.type] = groupList;
                                    }
                                }else {
                                    var resourceVal = apiUtil.getResourceValueByKey(node.type, node.result, node.value);
                                    filterObj[node.type] = resourceVal[node.type];
                                }
                                filterResourceList.splice(i, 1);
                                filterResourceList.push(filterObj);
                                findCheck = true;
                            }
                        }
                        if (findCheck === false) {
                            filterResourceList.push(resourceObj);
                        }
                        count++;
                        if(count === resources.length){
                            next(null, filterResourceList);
                        }
                    }else{
                        logger.debug("Un-Matched Resource or Terminated:");
                        count++;
                        if(count === resources.length){
                            next(null, filterResourceList);
                        }
                    }

                });
            }else{
                next(null,resources);
            }
        },
        function(filterObj,next){
            if(resources.length === 0){
                instanceStateList.push('initializing');
            }
            var serviceState = getServiceState(instanceStateList);
            var checkEqualFlag = false;
            if(service.resources.length === filterObj.length){
                service.resources.forEach(function(resource){
                    checkEqualFlag = false;
                    filterObj.forEach(function(filterResource){
                        if(JSON.stringify(resource.id) === JSON.stringify(filterResource.id)){
                            checkEqualFlag = true;
                        }
                    })
                })
            }
            if(checkEqualFlag){
                service.updatedOn = new Date().getTime();
                services.updateServiceById(service.id,{state:serviceState,resources:filterObj},function(err,data){
                    if(err){
                        logger.error("Error in updating Service:",err);
                        next(err,null);
                        return;
                    }else{
                        logger.debug("Successfully updated Service");
                        next(null,data);
                        return;
                    }
                })
            }else{
                service.resources = filterObj;
                service.state = serviceState;
                service.version = service.version + 0.1;
                service.version = parseFloat(service.version).toFixed(1);
                service.createdOn = new Date().getTime();
                delete service._id;
                delete service.id;
                services.createNew(service,function(err,data){
                    if(err){
                        logger.error("Error in creating Service:",err);
                        next(err,null);
                        return;
                    }else{
                        logger.debug("Successfully created Service");
                        next(null,data);
                        return;
                    }
                })
            }
        }

    ],function(err,results){
        if(err){
            logger.error("Error in Server Map Version : ",err);
            return;
        }else{
            logger.debug(" Server Map Version is Done ");
            return;
        }
    })

}

function getServiceState(serviceStateList){
    if(serviceStateList.indexOf('error') !== -1){
        return 'Error';
    }else if(serviceStateList.indexOf('authentication_error') !== -1 || serviceStateList.indexOf('unknown') !== -1 ){
        return 'Authentication_Error';
    }else if(serviceStateList.indexOf('bootStrap_failed') !== -1){
        return 'BootStrap_Failed';
    }else if(serviceStateList.indexOf('bootStrapping') !== -1 || serviceStateList.indexOf('initializing') !== -1){
        return 'Initializing';
    }else if(serviceStateList.indexOf('stopped') !== -1){
        return 'Stopped';
    }else if(serviceStateList.indexOf('shutting-down') !== -1){
        return 'Shut-Down';
    }else if(serviceStateList.indexOf('pending') !== -1){
        return 'Pending';
    }else{
        return 'Running';
    }
}

saeService.updateServiceVersion = function updateServiceVersion(resource,authenticationCheck,bootStrapCheck,callback){
    var bootStrapState = 'bootStrapping',instanceCategory = resource.category;
    if(resource.resourceDetails.bootStrapState === 'success'){
        bootStrapState = 'success';
        instanceCategory = 'managed';
    }
    async.waterfall([
        function(next){
            services.getServices({resources:{$elemMatch:{id:resource._id+''}}},next);
        },
        function(serviceList,next){
            async.parallel({
                resourceSync: function (callback) {
                    var queryObj = {
                        category: instanceCategory
                    };
                    if(authenticationCheck === true && bootStrapCheck === true){
                        queryObj.authentication = 'success';
                        queryObj.resourceDetails.bootStrapState = 'success';
                        queryObj.resourceDetails.state = 'running';
                    }else if(authenticationCheck === true && bootStrapCheck === false){
                        queryObj.authentication = 'success';
                    }else{
                        queryObj.resourceDetails.bootStrapState = 'success';
                    }
                    resourceModel.updateResourceById(resource._id, queryObj, callback)
                },
                serviceSync: function (callback) {
                    if (serviceList.length > 0) {
                        var count = 0;
                        serviceList.forEach(function (service) {
                            var authenticationFailedCount = 0, authenticationSuccessCount = 0,
                                serviceState = 'Initializing', awsCheck = false;
                            if (service.identifiers.aws && service.identifiers.aws !== null) {
                                awsCheck = true;
                            }
                            service.resources.forEach(function (instance) {
                                if (instance.authentication === 'failed') {
                                    authenticationFailedCount = authenticationFailedCount + 1;
                                }
                                if (instance.authentication === 'success') {
                                    authenticationSuccessCount = authenticationSuccessCount + 1;
                                }
                            });
                            if (authenticationFailedCount > 1) {
                                serviceState = 'Authentication_Error';
                            } else if (authenticationFailedCount === 1 && awsCheck === true) {
                                serviceState = 'Initializing';
                            } else if (authenticationFailedCount === 1 && awsCheck === false) {
                                serviceState = 'Running';
                            } else {
                                serviceState = 'Initializing';
                            }
                            services.updateService({
                                'name': service.name,
                                'resources': {$elemMatch: {id: resource._id+''}}
                            }, {
                                'resources.$.bootStrapState': bootStrapState,
                                'resources.$.authentication': 'success',
                                'resources.$.category': instanceCategory,
                                'state': serviceState
                            }, function (err, result) {
                                if (err) {
                                    logger.error("Error in updating Service State:", err);
                                }
                                count++;
                                if(count === serviceList.length){
                                    callback(null,serviceList);
                                }
                            });
                        });
                    }else {
                        callback(null, serviceList);
                    }
                }
            },function(err,results){
                if(err){
                    next(err,null);
                }else{
                    next(null,results);
                }
            })
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

