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
var services = require('_pr/model/services/services.js');
var fileUpload = require('_pr/model/file-upload/file-upload');
var fileIo = require('_pr/lib/utils/fileio');
var monitors = require('_pr/model/monitors/monitors');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var monitorsModel = require('_pr/model/monitors/monitors.js');
const jsYml= require('js-yaml');
var uuid = require('node-uuid');
var resourceModel = require('_pr/model/resources/resources');
var commonService = require('_pr/services/commonService');
var appConfig = require('_pr/config');
var ObjectId = require('mongoose').Types.ObjectId;

var serviceMapService = module.exports = {};

serviceMapService.getAllServicesByFilter = function getAllServicesByFilter(reqQueryObj,callback){
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(reqQueryObj, 'services', next);
        },
        function(paginationReq,next){
            if(paginationReq.filterBy && paginationReq.filterBy.isDeleted){
               paginationReq.filterBy.isDeleted = paginationReq.filterBy.isDeleted === 'true' ? true : false;
            }
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            if(reqQueryObj.version && reqQueryObj.version === 'latest'){
                services.getLastVersionOfEachService(queryObj.queryObj, function (err, data) {
                    if (err) {
                        next(err, null);
                    } else if (data.length > 0) {
                        services.getAllServicesByFilter(queryObj, function (err, filterData) {
                            if (err) {
                                next(err, null);
                            } else {
                                var pages = Math.ceil(data.length / queryObj.options.limit);
                                if(queryObj.options.page > pages){
                                    var response = {
                                        docs: [],
                                        total: data.length,
                                        limit: queryObj.options.limit,
                                        page: queryObj.options.page,
                                        pages:pages
                                    };
                                    next(null, response);
                                }else{
                                    var response = {
                                        docs: filterData,
                                        total: data.length,
                                        limit: queryObj.options.limit,
                                        page: queryObj.options.page,
                                        pages:pages
                                    };
                                    next(null, response);
                                }

                            }
                        });
                    } else {
                        var pages = Math.ceil(data.length / queryObj.options.limit);
                        if(queryObj.options.page > pages){
                            var response = {
                                docs: [],
                                total: data.length,
                                limit: queryObj.options.limit,
                                page: queryObj.options.page,
                                pages:pages
                            };
                            next(null, response);
                        }else{
                            var response = {
                                docs: filterData,
                                total: data.length,
                                limit: queryObj.options.limit,
                                page: queryObj.options.page,
                                pages:pages
                            };
                            next(null, response);
                        }
                    }
                })
            }else{
                if(reqQueryObj.version){
                    queryObj.queryObj.version = parseFloat(reqQueryObj.version);
                }
                if(reqQueryObj.resourceId){
                    queryObj.queryObj.resources = {$elemMatch: {id: reqQueryObj.resourceId}};
                }
                services.getServicesWithPagination(queryObj,next);
            }
        },
        function(services,next){
            changeServiceResponse(services,next);
        },
        function(serviceList,next){
            apiUtil.paginationResponse(serviceList, reqData, next);
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
serviceMapService.deleteServiceById = function deleteServiceById(serviceId,callback){
    async.waterfall([
        function(next){
            services.getServiceById(serviceId,next);
        },
        function(servicesData,next){
            if(servicesData.length > 0){
                services.updateService({name:servicesData[0].name},{isDeleted:true,state:'Deleted'},next);
            }else{
                var err =  new Error();
                err.code = 500;
                err.message = "No Service is available in DB against Id "+serviceId;
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

serviceMapService.getAllServiceVersionByName = function getAllServiceVersionByName(serviceName,reqQueryObj,callback){
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(reqQueryObj, 'versions', next);
        },
        function(paginationReq,next){
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function(queryObj,next){
            queryObj.queryObj.name = serviceName;
            services.getServicesWithPagination(queryObj,next);
        },
        function(services,next){
            if(services.docs.length > 0){
                var versionList = [];
                services.docs.forEach(function(service){
                    versionList.push(service.version);
                });
                services.docs = versionList;
                next(null,services);
            }else{
                next(null,services);
            }
        },
        function(serviceList,next){
            apiUtil.paginationResponse(serviceList, reqData, next);
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

serviceMapService.createNewService = function createNewService(servicesObj,callback){
    if(servicesObj.ymlFileId && servicesObj.ymlFileId !== null) {
        services.createNew(servicesObj, function (err, servicesData) {
            if (err) {
                logger.error("services.createNew is Failed ==>", err);
                callback(err, null);
                return;
            } else {
                callback(null, servicesData);
                return;
            }
        });
    }else{
        services.getServices({name:servicesObj.name},function(err,data) {
            if (err) {
                logger.error("Error in getting Services against Service Name: ", servicesObj.name, err);
                return callback(err, null);
            } else if (data.length > 0) {
                return callback({code: 400, message: "Service Name is already associated with other Services.Please enter unique Service Name."}, null);
            } else if(servicesObj.source ==='file') {
                fileUpload.getReadStreamFileByFileId(servicesObj.fileId, function (err, fileDetail) {
                    if (err) {
                        logger.error("Error in reading YML File.");
                        var error =new Error();
                        error.code = 500;
                        error.message = "Error in reading YML File."
                        return callback(error, null);
                    } else {
                        try {
                            var result = jsYml.safeLoad(fileDetail.fileData);
                            if (result !== null) {
                                    servicesObj.identifiers = result;
                                    servicesObj.type = 'Service';
                                    servicesObj.ymlFileId = servicesObj.fileId;
                                    servicesObj.createdOn = new Date().getTime();
                                    getMasterDetails(servicesObj.masterDetails, function (err, result) {
                                        if (err) {
                                            logger.error("Unable to Master Details");
                                            callback(err, null);
                                            return;
                                        } else {
                                            monitorsModel.getById(servicesObj.monitorId, function (err, monitor) {
                                                servicesObj.masterDetails = result;
                                                servicesObj.masterDetails.monitor = monitor;
                                                servicesObj.state = 'Initializing';
                                                servicesObj.version = 1.0;
                                                services.createNew(servicesObj, function (err, servicesData) {
                                                    if (err) {
                                                        logger.error("services.createNew is Failed ==>", err);
                                                        callback(err, null);
                                                        return;
                                                    } else {
                                                        callback(null, servicesData);
                                                        return;
                                                    }
                                                });
                                            });
                                        }
                                    });
                                } else {
                                var err = new Error("There is no data present YML.")
                                err.code = 403;
                                callback(err, null);
                            }
                        } catch(err){
                            return callback({code:500,message:'Invalid YAML : '+err.message}, null);
                        }
                    }
                });
            }else{
                try {
                    var result = jsYml.safeLoad(servicesObj.fileData);
                    if (result !== null) {
                        var fileId = uuid.v4();
                        var ymlFolderName = appConfig.tempDir;
                        var ymlFileName = fileId + '.yaml'
                        var path = require('path');
                        var mkdirp = require('mkdirp');
                        var ymlFolder = path.normalize(ymlFolderName);
                        mkdirp.sync(ymlFolder);
                        async.waterfall([
                            function (next) {
                                fileIo.writeFile(ymlFolder + '/' + ymlFileName, servicesObj.fileData, null, next);
                            },
                            function (next) {
                                fileUpload.uploadFile(ymlFileName, ymlFolder + '/' + ymlFileName, null, next);
                            }
                        ], function (err, results) {
                            if (err) {
                                logger.error(err);
                                callback(err, null);
                                fileIo.removeFile(ymlFolder + '/' + ymlFileName, function (err, removeCheck) {
                                    if (err) {
                                        logger.error(err);
                                        logger.debug("Successfully remove YML file");
                                        return callback(err,null);
                                    }
                                });
                            } else {
                                servicesObj.identifiers = result;
                                servicesObj.type = 'Service';
                                servicesObj.ymlFileId = results;
                                servicesObj.createdOn = new Date().getTime();
                                getMasterDetails(servicesObj.masterDetails, function (err, result) {
                                    if (err) {
                                        logger.error("Unable to Master Details");
                                        callback(err, null);
                                        return;
                                    } else {
                                        monitorsModel.getById(servicesObj.monitorId, function (err, monitor) {
                                            servicesObj.masterDetails = result;
                                            servicesObj.masterDetails.monitor = monitor;
                                            servicesObj.state = 'Initializing';
                                            servicesObj.version = 1.0;
                                            services.createNew(servicesObj, function (err, servicesData) {
                                                if (err) {
                                                    logger.error("services.createNew is Failed ==>", err);
                                                    callback(err, null);
                                                    return;
                                                } else {
                                                    callback(null, servicesData);
                                                    return;
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        var err = new Error("There is no data present YML.")
                        err.code = 403;
                        callback(err, null);
                    }
                } catch(err){
                    return callback({code:500,message:'Invalid YAML : '+err.message}, null);
                }
            }
        });
    }
}

serviceMapService.updateServiceById = function updateServiceById(serviceId,data,callback){
    async.waterfall([
        function(next){
            services.getServiceById(serviceId,next);
        },
        function(servicesData,next){
            if(servicesData.length > 0){
                services.updateServiceById(serviceId,data,next);
            }else{
                logger.debug("No Service is available in DB against serviceId");
                next(null,null);
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

serviceMapService.updateService = function updateService(filterQuery,data,callback){
    async.waterfall([
        function(next){
            services.getServices(filterQuery,next);
        },
        function(servicesData,next){
            if(servicesData.length > 0){
                services.updateService(filterQuery,data,next);
            }else{
                var err =  new Error();
                err.code = 500;
                err.message = "No Service is available in DB against filterQuery "+filterQuery;
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

serviceMapService.resourceAuthentication = function resourceAuthentication(resourceId,credentials,callback){
    resourceModel.getResourceById(resourceId,function(err,resourceDetail) {
        if (err) {
            var error = new Error();
            error.code = 500;
            error.message = "Error in getting Resource Details By Id: " + resourceId + ' : ' + err;
            callback(error, null);
        }
        if (resourceDetail !== null) {
            callback(null, {code: 202, message: "Authentication is in Progress"});
            services.updateService({
                'resources': {$elemMatch: {id: resourceId}}
            }, {
                'resources.$.authentication': 'authenticating',
            }, function (err, result) {
                if (err) {
                    logger.error("Error in updating Service State:", err);
                }
            })
            resourceModel.updateResourceById(resourceId, {
                'authentication': 'authenticating'
            }, function (err, data) {
                if (err) {
                    logger.error("Error in updating BootStrap State:", err);
                }
            });
            checkCredentialsForResource(resourceDetail, resourceId, credentials, function (err, data) {
                if (err) {
                    logger.error("Error in checking Authentication Credentials:", err);
                }
            })
        } else {
            var err = new Error();
            err.code = 500;
            err.message = "No Resource is available in DB against resourceId: " + resourceId;
            callback(err, null);
        }
    });
}

serviceMapService.getServices = function getServices(filterQuery,callback){
    async.waterfall([
        function(next){
            services.getServices(filterQuery,next);
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


serviceMapService.deleteResourceFromServices = function deleteResourceFromServices(resourceId,callback){
    async.waterfall([
        function(next){
            services.getServices({resources:{$elemMatch:{id:resourceId}}},next);
        },
        function(serviceList,next){
            async.parallel({
                resourceSync: function (callback) {
                    resourceModel.updateResourceById(resourceId, {
                        isDeleted: true
                    }, callback)
                },
                serviceSync: function (callback) {
                    if (serviceList.length > 0) {
                        var count = 0;
                        serviceList.forEach(function (service) {
                            if (service.resources.length === 1) {
                                service.resources = [];
                                service.state = 'Initializing';
                                service.version = service.version + 0.1;
                                service.version = parseFloat(service.version).toFixed(1);
                                services.createNew(service, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    count++;
                                    if (count === serviceList.length) {
                                        callback(null, serviceList);
                                    }
                                })
                            } else {
                                var resourceCount = 0, serviceStateList = [];
                                service.resources.forEach(function (resource) {
                                    resourceCount++;
                                    if (resource.id === resourceId) {
                                        service.resources.splice(resourceCount - 1, 1);
                                    }
                                    if (resource.authentication === 'failed') {
                                        serviceStateList.push('authentication_error');
                                    } else if (resource.bootStrapState === 'failed') {
                                        serviceStateList.push('bootStrap_failed');
                                    } else if (resource.bootStrapState === 'bootStrapping') {
                                        serviceStateList.push('bootStrapping');
                                    } else {
                                        serviceStateList.push(resource.state);
                                    }
                                });
                                service.state = getServiceState(serviceStateList);
                                service.version = service.version + 0.1;
                                service.version = parseFloat(service.version).toFixed(1);
                                services.createNew(service, function (err, data) {
                                    if (err) {
                                        logger.error(err);
                                    }
                                    count++;
                                    if (count === serviceList.length) {
                                        callback(null, serviceList);
                                    }
                                })
                            }

                        })
                    } else {
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

serviceMapService.getAllServiceResourcesByName = function getAllServiceResourcesByName(serviceName,filterQuery,callback){
    async.waterfall([
        function (next) {
            var queryObj = {
                name:serviceName
            }
            if(filterQuery.version && filterQuery.version === 'latest'){
                services.getLastVersionOfEachService(queryObj,next);
            }else{
                queryObj.version = parseFloat(filterQuery.version);
                services.getServices(queryObj,next);
            }
        },
        function(serviceList,next) {
            if (serviceList.length > 0) {
                var filterObj = {
                    version:filterQuery.version?filterQuery.version:serviceList[0].version.toFixed(1),
                    state:serviceList[0].state,
                    resources:[]
                }
                serviceList[0].resources.forEach(function (resource) {
                    if (Object.keys(filterQuery).length > 1) {
                        Object.keys(filterQuery).forEach(function (key) {
                            if (key === 'groups') {
                                var groupValList = resource[key];
                                if (groupValList.indexOf(filterQuery[key]) !== -1) {
                                    filterObj.resources.push(resource);
                                }
                            } else {
                                if (filterQuery[key] === resource[key]) {
                                    filterObj.resources.push(resource);
                                } else {
                                    filterObj.resources.push(resource);
                                }
                            }
                        })
                    } else {
                        filterObj.resources.push(resource);
                    }
                });
                next(null, filterObj);
            } else {
                next(null, {});
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

serviceMapService.getServiceByName = function getServiceByName(serviceName,queryParam,callback){
    async.waterfall([
        function(next){
            var query = {
                name:serviceName
            };
            if(queryParam.isDeleted){
                query.isDeleted = queryParam.isDeleted ==='true'? true : false;
            }
            if(queryParam.version && queryParam.version === 'latest'){
                services.getLastVersionOfEachService(query,next);
            }else if(queryParam.version){
                query.version = parseFloat(queryParam.version);
                services.getServices(query,next);
            }else{
                services.getServices(query,next);
            }
        },
        function(serviceList,next){
            changeServiceResponse(serviceList,next);
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

function changeServiceResponse(services,callback){
    var serviceList  = [],resultList =[];
    if(services.docs && services.docs.length > 0){
        serviceList = services.docs;
    }else{
        serviceList = services;
    }
    if(serviceList.length > 0){
        var count = 0;
        for(var  i = 0 ; i < serviceList.length; i++){
            (function(service){
                formattedServiceResponse(service,function(err,data){
                    if(err){
                        logger.error("Error in formatted Service Response:");
                    }
                    count++;
                    if(data !== null) {
                        resultList.push(data);
                    }
                    if(count === serviceList.length){
                        if(services.docs && services.docs.length > 0){
                            services.docs = resultList;
                        }else{
                            services = resultList;
                        }
                        return callback(null,services);
                    }
                })
            })(serviceList[i]);
        }
    }else{
        return callback(null,serviceList);
    }
}

function formattedServiceResponse(service,callback){
    var serviceObj = {
        id:service.id,
        name:service.name,
        type:service.type,
        desc:service.desc,
        state:service.state,
        createdOn:service.createdOn,
        updatedOn:service.updatedOn,
        version:service.version
    }
    getMasterDetails(service.masterDetails,function(err,data){
            if(err){
                return callback(err,null);
            }
            serviceObj.masterDetails = data;
            serviceObj.masterDetails.monitor = service.masterDetails.monitor;
            if(service.ymlFileId){
                fileUpload.getReadStreamFileByFileId(service.ymlFileId,function(err,file){
                    if (err) {
                        logger.error("Error in fetching YAML Documents for : " + service.name + " " + err);
                        return callback(err,null);
                    }else {
                        serviceObj.ymlFileName = file !== null ? file.fileName : file;
                        serviceObj.ymlFileData = file !== null ? file.fileData : file;
                        return callback(null, serviceObj);
                    }
                });
            }else{
                return callback(null, serviceObj);
            }
    });
}

function getMasterDetails(masterDetail,callback){
    var settingDetail = {};
    masterUtil.getOrgByRowId(masterDetail.orgId,function(err,orgs) {
        if (err) {
            logger.error("Error in fetching Org Details for : " + masterDetail.orgId + " " + err);
            return callback(err, null);
        }
        settingDetail.orgId = masterDetail.orgId;
        settingDetail.orgName = orgs.length > 0 ? orgs[0].orgname : null;
        masterUtil.getBusinessGroupName(masterDetail.bgId, function (err, businessGroupName) {
            if (err) {
                logger.error("Error in fetching Bg Name for : " + masterDetail.bgId + " " + err);
                return callback(err, null);
            }
            settingDetail.bgId = masterDetail.bgId;
            settingDetail.bgName = businessGroupName;
            masterUtil.getProjectName(masterDetail.projectId, function (err, projectName) {
                if (err) {
                    logger.error("Error in fetching Project Name for : " + masterDetail.projectId + " " + err);
                    return callback(err, null);
                }
                settingDetail.projectId = masterDetail.projectId;
                settingDetail.projectName = projectName;
                masterUtil.getEnvironmentName(masterDetail.envId, function (err, envName) {
                    if (err) {
                        logger.error("Error in fetching Env Name for : " + masterDetail.envId + " " + err);
                        return callback(err, null);
                    }
                    settingDetail.envId = masterDetail.envId;
                    settingDetail.envName = envName;
                    masterUtil.getChefDetailsById(masterDetail.configId, function (err, chefDetails) {
                        if (err) {
                            logger.error("Error in fetching Org Details for : " + masterDetail.configId + " " + err);
                            return callback(err, null);
                        }
                        settingDetail.configId = masterDetail.configId;
                        settingDetail.configName = chefDetails !== null ? chefDetails[0].configname : null;
                        callback(null,settingDetail);
                    });
                });
            });
        });
    });
}

function getServiceState(serviceStateList){
    if(serviceStateList.indexOf('error') !== -1){
        return 'Error';
    }else if(serviceStateList.indexOf('authentication_error') !== -1 || serviceStateList.indexOf('unknown') !== -1 ){
        return 'Authentication_Error';
    }else if(serviceStateList.indexOf('bootStrap_failed') !== -1){
        return 'BootStrap_Failed';
    }else if(serviceStateList.indexOf('bootStrapping') !== -1){
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

function checkCredentialsForResource(resource,resourceId,credentials,callback) {
    var bootStrapState = 'bootStrapping', instanceCategory = resource.category;
    if (resource.resourceDetails.bootStrapState === 'success') {
        bootStrapState = 'success';
        instanceCategory = 'managed';
    }
    var nodeDetail = {
        nodeIp: resource.resourceDetails.publicIp && resource.resourceDetails.publicIp !== null ? resource.resourceDetails.publicIp : resource.resourceDetails.privateIp,
        nodeOs: resource.resourceDetails.os
    }
    commonService.checkNodeCredentials(nodeDetail, credentials, function (err, credentialFlag) {
        if (err || credentialFlag === false) {
            logger.error("Invalid Resource Credentials", err);
            callback(err, null);
            services.updateService({
                'resources': {$elemMatch: {id: resourceId}}
            }, {
                'resources.$.authentication': 'failed',
                'state': 'Authentication_Error'
            }, function (err, result) {
                if (err) {
                    logger.error("Error in updating Service State:", err);
                }
            });
            resourceModel.updateResourceById(resourceId, {
                'authentication': 'failed',
            }, function (err, data) {
                if (err) {
                    logger.error("Error in updating BootStrap State:", err);
                }
            });
        } else {
            async.waterfall([
                function (next) {
                    serviceMapService.getServices({resources: {$elemMatch: {id: resourceId}}}, next);
                },
                function (serviceList, next) {
                    async.parallel({
                        resourceSync: function (callback) {
                            var queryObj = {
                                'authentication': 'success',
                                'resourceDetails.bootStrapState': bootStrapState,
                                'category': instanceCategory
                            }
                            resourceModel.updateResourceById(resourceId, queryObj, callback)
                        },
                        serviceSync: function (callback) {
                            if (serviceList.length > 0) {
                                var count = 0;
                                serviceList.forEach(function (service) {
                                    var authenticationFailedCount = 0,serviceState = 'Initializing', awsCheck = false;
                                    if (service.identifiers.aws && service.identifiers.aws !== null) {
                                        awsCheck = true;
                                    }
                                    for(var i = 0; i < service.resources.length; i++){
                                        if (service.resources[i].authentication === 'failed' || service.resources[i].authentication === 'authenticating') {
                                            authenticationFailedCount = authenticationFailedCount + 1;
                                        }
                                    }
                                    if (authenticationFailedCount > 1) {
                                        serviceState = 'Authentication_Error';
                                    } else if (authenticationFailedCount === 1 && awsCheck === true) {
                                        serviceState = 'Initializing';
                                    } else if (authenticationFailedCount === 1 && awsCheck === false) {
                                        serviceState = 'Running';
                                    } else {
                                        serviceState = 'Initializing';
                                    }
                                    serviceMapService.updateService({
                                        '_id': ObjectId(service._id),
                                        'resources': {$elemMatch: {id: resource._id + ''}}
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
                                        if (count === serviceList.length) {
                                            callback(null, serviceList);
                                        }
                                    });
                                });
                            } else {
                                callback(null, serviceList);
                            }
                        }
                    }, function (err, results) {
                        if (err) {
                            next(err, null);
                        } else {
                            next(null, results);
                        }
                    })
                }
            ], function (err, results) {
                if (err) {
                    callback(err, null);
                    return;
                } else if(results.serviceSync && results.serviceSync.length > 0) {
                    commonService.bootstrapInstance(resource, resourceId, credentials, results.serviceSync[0], function (err, res) {
                        if (err) {
                            logger.error(err);
                            callback(err, null);
                            return;
                        } else {
                            return callback(null, res);
                        }
                    });
                }else{
                    return callback(null, results);
                }
            });
        }
    });
}

