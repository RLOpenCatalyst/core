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
var monitors = require('_pr/model/monitors/monitors');
var appConfig = require('_pr/config');
var fileIo = require('_pr/lib/utils/fileio');
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var monitorsModel = require('_pr/model/monitors/monitors.js');
const ymlJs= require('yamljs');
var uuid = require('node-uuid');
var Cryptography = require('_pr/lib/utils/cryptography');
var resourceModel = require('_pr/model/resources/resources');
var instancesDao = require('_pr/model/classes/instance/instance');
var commonService = require('_pr/services/commonService');

var serviceMapService = module.exports = {};

serviceMapService.getAllServicesByFilter = function getAllServicesByFilter(reqQueryObj,callback){
    var reqData = {};
    async.waterfall([
        function (next) {
            apiUtil.paginationRequest(reqQueryObj, 'services', next);
        },
        function(paginationReq,next){
            reqData = paginationReq;
            apiUtil.databaseUtil(paginationReq, next);
        },
        function (queryObj, next) {
            service.getLastVersionOfEachService(queryObj.queryObj,function(err,data){
                if(err){
                    next(err,null);
                }else if(data.length > 0){
                    services.getAllServicesByFilter(queryObj, function(err,filterData){
                        if(err){
                            next(err,null);
                        }else{
                            var response = {
                                docs:filterData,
                                total:data.length,
                                limit:queryObj.options.limit,
                                page:queryObj.options.page,
                                pages:Math.ceil(data.length / queryObj.options.limit)
                            };
                            next(null,response);
                        }
                    });
                }else{
                    var response = {
                        docs:data,
                        total:data.length,
                        limit:queryObj.options.limit,
                        page:queryObj.options.page,
                        pages:Math.ceil(data.length / queryObj.options.limit)
                    };
                    next(null,response);
                }
            })
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
                services.deleteServiceById(serviceId,next);
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

serviceMapService.getAllServiceVersionByName = function getAllServiceVersionByName(serviceName,callback){
    async.waterfall([
        function(next){
            services.getServices({name:serviceName},next);
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
            } else {
                fileUpload.getReadStreamFileByFileId(servicesObj.fileId, function (err, fileDetail) {
                    if (err) {
                        logger.error("Error in reading YML File.");
                        callback(err, null);
                        return;
                    } else {
                        var fileName = uuid.v4() + '_' + fileDetail.fileName;
                        var desPath = appConfig.tempDir + fileName;
                        fileIo.writeFile(desPath, fileDetail.fileData, false, function (err) {
                            if (err) {
                                logger.error("Unable to write file");
                                callback(err, null);
                                return;
                            } else {
                                ymlJs.load(desPath, function (result) {
                                    if (result !== null) {
                                        servicesObj.identifiers = result;
                                        servicesObj.type = 'Service';
                                        servicesObj.ymlFileId = servicesObj.fileId;
                                        servicesObj.createdOn = new Date().getTime();
                                        monitorsModel.getById(servicesObj.monitorId, function (err, monitor) {
                                            servicesObj.masterDetails.monitor = monitor;
                                            servicesObj.state = 'Initializing';
                                            services.createNew(servicesObj, function (err, servicesData) {
                                                if (err) {
                                                    logger.error("services.createNew is Failed ==>", err);
                                                    callback(err, null);
                                                    apiUtil.removeFile(desPath);
                                                    return;
                                                } else {
                                                    callback(null, servicesData);
                                                    apiUtil.removeFile(desPath);
                                                    return;
                                                }
                                            });
                                        });
                                    } else {
                                        var err = new Error("There is no data present YML.")
                                        err.code = 403;
                                        callback(err, null);
                                        apiUtil.removeFile(desPath);
                                    }
                                })
                            }
                        });
                    }
                });
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
                var err =  new Error();
                err.code = 500;
                err.message = "No Service is available in DB against serviceId "+serviceId;
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

serviceMapService.getLastVersionOfEachService = function getLastVersionOfEachService(filterBy,callback){
    async.waterfall([
        function(next){
            services.getLastVersionOfEachService(filterBy,next);
        },
        function(servicesData,next){
            if(servicesData.length > 0){
                next(null,servicesData);
            }else{
                logger.debug("No Service is available in DB: ");
                next(null,servicesData);
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

serviceMapService.resourceAuthentication = function resourceAuthentication(serviceId,resourceId,credentials,callback){
    async.waterfall([
        function(next){
            services.getServiceById(serviceId,next);
        },
        function(servicesData,next){
            if(servicesData.length >0){
                resourceModel.getResourceById(resourceId,function(err,resourceDetail){
                    if(err){
                        var error =  new Error();
                        error.code = 500;
                        error.message = "Error in getting Resource Details By Id: "+resourceId +' : '+ err;
                        next(error,null);
                    }
                    var nodeDetail = {
                        nodeIp:resourceDetail.resourceDetails.publicIp && resourceDetail.resourceDetails.publicIp !== null ? resourceDetail.resourceDetails.publicIp:resourceDetail.resourceDetails.privateIp,
                        nodeOs:resourceDetail.resourceDetails.hardware.os
                    }
                    if(credentials.type ==='password') {
                        commonService.checkNodeCredentials(credentials,nodeDetail,function(err,credentialFlag){
                            if(err || credentialFlag === false){
                                var error =  new Error();
                                error.code = 500;
                                error.message = "Invalid Resource Credentials";
                                next(error,null);
                            }else{
                                var cryptoConfig = appConfig.cryptoSettings;
                                var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                                var encryptedText = cryptography.encryptText(credentials.password, cryptoConfig.encryptionEncoding,
                                    cryptoConfig.decryptionEncoding);
                                credentials.password = encryptedText;
                                resourceModel.updateResourceById(resourceId,{'resourceDetails.credentials':credentials,'resourceDetails.state':'running'},function(err,data){
                                    if(err){
                                        var error =  new Error();
                                        error.code = 500;
                                        error.message = "Error in updating Resource Model : " + err;
                                        next(error,null);
                                    }else{
                                        instancesDao.updateInstanceByFilter({platformId:resourceDetail.resourceDetails.platformId,orgId:resourceDetail.masterDetails.orgId},{credentials:credentials,instanceState:'running'},function(err,data){
                                            if(err){
                                                logger.error("Error in updating Instance Data for Authentication");
                                            }
                                            next(null,data);
                                        })
                                    }
                                })
                            }
                        })
                    }else if(credentials.type ==='pemFile') {
                        fileUpload.getReadStreamFileByFileId(credentials.fileId,function(err,file){
                            if (err) {
                                logger.error("Error in fetching YML Documents for : " + credentials.fileId + " " + err);
                                return callback(err,null);
                            }else {
                                var resourceCredentials = {
                                    username:credentials.username,
                                    pemFileData:file.fileData,
                                    pemFileLocation:file.fileName
                                }
                                commonService.checkNodeCredentials(resourceCredentials,nodeDetail,function(err,credentialFlag){
                                    if(err || credentialFlag === false){
                                        var error =  new Error();
                                        error.code = 500;
                                        error.message = "Invalid Resource Credentials";
                                        next(error,null);
                                    }else{
                                        var cryptoConfig = appConfig.cryptoSettings;
                                        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
                                        var encryptedText = cryptography.encryptText(file.fileData, cryptoConfig.encryptionEncoding,
                                            cryptoConfig.decryptionEncoding);
                                        var queryObj = {
                                            'resourceDetails.credentials':{
                                                username:credentials.username,
                                                pemFileId:credentials.fileId
                                            },
                                            'resourceDetails.state':'running'
                                        }
                                        resourceModel.updateResourceById(resourceId,queryObj,function(err,data){
                                            if(err){
                                                var error =  new Error();
                                                error.code = 500;
                                                error.message = "Error in updating Resource Authentication : " + err;
                                                next(error,null);
                                            }else{
                                                instancesDao.getInstancesByFilter({platformId:resourceDetail.resourceDetails.platformId,orgId:resourceDetail.masterDetails.orgId},function(err,instances){
                                                    if(err){
                                                        logger.error("Error in getting Instance Details:",err);
                                                        return callback(err,null);
                                                    }else if(instances.length > 0){
                                                        var outputFilePath = appConfig.instancePemFilesDir + instances[0]._id;
                                                        fs.writeFile(outputFilePath, encryptedText, {
                                                        }, function(err) {
                                                            if (err) {
                                                                logger.debug(err);
                                                                callback(err, null);
                                                                return;
                                                            }else {
                                                                var queryObj = {
                                                                    credentials: {
                                                                        username: credentials.username,
                                                                        pemFileLocation: outputFilePath
                                                                    },
                                                                    instanceState:'running'
                                                                }
                                                                instancesDao.updateInstanceByFilter({
                                                                    platformId: resourceDetail.resourceDetails.platformId,
                                                                    orgId: resourceDetail.masterDetails.orgId
                                                                },queryObj, function (err, data) {
                                                                    if (err) {
                                                                        logger.error("Error in updating Instance Data for Authentication");
                                                                    }
                                                                    next(null, data);
                                                                })
                                                            }
                                                        });
                                                    }else{
                                                        next(null,data);
                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        });
                    }else{
                        var error =  new Error();
                        error.code = 500;
                        error.message = "Invalid Credential Type";
                        next(error,null);
                    }
                })

            }else{
                var err =  new Error();
                err.code = 500;
                err.message = "No Service is available in DB against serviceId "+serviceId;
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

serviceMapService.getServiceResources = function getServiceResources(serviceId,filterQuery,callback){
    async.waterfall([
        function(next){
            services.getServiceById(serviceId,next);
        },
        function(services,next){
            if(services.length > 0 && services.resources.length > 0){
                var resourceObj = {},filterResourceList = [];
                if(filterQuery.ami && filterQuery.ami !== null){
                    resourceObj['ami'] = filterQuery.ami;
                }
                if(filterQuery.ip && filterQuery.ip !== null){
                    resourceObj['ip'] = filterQuery.ip;
                }
                if(filterQuery.vpc && filterQuery.vpc !== null){
                    resourceObj['vpc'] = filterQuery.vpc;
                }
                if(filterQuery.subnet && filterQuery.subnet !== null){
                    resourceObj['subnet'] = filterQuery.subnet;
                }
                if(filterQuery.tags && filterQuery.tags !== null){
                    resourceObj['tags'] = filterQuery.tags;
                }
                if(filterQuery.keyPairName && filterQuery.keyPairName !== null){
                    resourceObj['keyPairName'] = filterQuery.keyPairName;
                }
                if(filterQuery.group && filterQuery.group !== null){
                    resourceObj['group'] = filterQuery.group;
                }
                if(filterQuery.roles && filterQuery.roles !== null){
                    resourceObj['roles'] = filterQuery.roles;
                }
                services.resources.forEach(function(resource){
                    var filterObj = {}
                    Object.keys(resource).forEach(function(key){
                        if(key !== 'id' || key !== 'state' ||  key !== 'type' ||  key !== 'name' || key !== 'platformId'){
                            filterObj[key] = resource[key];
                        }
                    })
                    if(JSON.stringify(resourceObj) === JSON.stringify(filterObj)){
                        filterResourceList.push(resource);
                    }
                })
                next(null,filterResourceList);
            }else{
                next(null,services.resources);
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



serviceMapService.getServiceById = function getServiceById(serviceId,callback){
    async.waterfall([
        function(next){
            services.getServiceById(serviceId,next);
        },
        function(services,next){
            changeServiceResponse(services,next);
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
        id:service._id,
        masterDetails:service.masterDetails,
        name:service.name,
        type:service.type,
        desc:service.desc,
        state:service.state,
        identifiers:service.identifiers,
        resources:service.resources,
        createdOn:service.createdOn,
        updatedOn:service.updatedOn,
        version:service.version.toFixed(1)
    }
    masterUtil.getOrgByRowId(service.masterDetails.orgId,function(err,orgs){
        if (err) {
            logger.error("Error in fetching Org Details for : " + service.masterDetails.orgId + " " + err);
            return callback(err,null);
        }
        serviceObj.masterDetails.orgName =  orgs.length > 0 ? orgs[0].orgname : null;
        masterUtil.getBusinessGroupName(service.masterDetails.bgId,function(err,businessGroupName) {
            if (err) {
                logger.error("Error in fetching Bg Name for : " + service.masterDetails.bgId + " " + err);
                return callback(err,null);
            }
            serviceObj.masterDetails.bgName = businessGroupName;
            masterUtil.getProjectName(service.masterDetails.projectId,function(err,projectName){
                if (err) {
                    logger.error("Error in fetching Project Name for : " + service.masterDetails.projectId + " " + err);
                    return callback(err,null);
                }
                serviceObj.masterDetails.projectName =  projectName;
                masterUtil.getEnvironmentName(service.masterDetails.envId,function(err,envName){
                    if (err) {
                        logger.error("Error in fetching Env Name for : " + service.masterDetails.envId + " " + err);
                        return callback(err,null);
                    }
                    serviceObj.masterDetails.envName =  envName;
                    masterUtil.getChefDetailsById(service.masterDetails.configId,function(err,chefDetails){
                        if (err) {
                            logger.error("Error in fetching Org Details for : " + service.masterDetails.configId + " " + err);
                            return callback(err,null);
                        }
                        serviceObj.masterDetails.configName =  chefDetails !== null ? chefDetails[0].configname : null;
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
                });
            });
        });
    });
}

