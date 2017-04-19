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



// This file act as a Util class which contains Settings related all business logics.

var logger = require('_pr/logger')(module);
var d4dModelNew = require('../../model/d4dmasters/d4dmastersmodelnew.js');
var ObjectId = require('mongoose').Types.ObjectId;
var permissionsetDao = require('../../model/dao/permissionsetsdao');
var d4dModel = require('../../model/d4dmasters/d4dmastersmodel.js');
var configmgmtDao = require('../../model/d4dmasters/configmgmt.js');
var appConfig = require('_pr/config');
var Cryptography = require('../utils/cryptography');
var chefSettings = appConfig.chef;
var AppDeploy = require('_pr/model/app-deploy/app-deploy');
var async = require('async');
var cicdDashboardService = require('_pr/services/cicdDashboardService');

var MasterUtil = function () {
    // Return All Orgs specific to User
    this.getOrgs = function (loggedInUser, callback) {
        var orgList = [];
        d4dModelNew.d4dModelMastersUsers.find({
            loginname: loggedInUser
        }, function (err, users) {
            if (err) {
                logger.debug("Unable to fetch User.");
                callback(err, null);
            }
            logger.debug("Able to get User: ", JSON.stringify(users));
            if (users) {
                var count = 0;
                var usrCount = 0;
                var errOccured = false;
                for (var x = 0; x < users.length; x++) {
                    (function (countUser) {
                        if (users[countUser].id === '7') {
                            usrCount++;
                            var orgIds = users[countUser].orgname_rowid;
                            logger.debug("orgIds: ", typeof orgIds[0]);
                            if (typeof orgIds[0] === 'undefined') {
                                d4dModelNew.d4dModelMastersOrg.find({
                                    id: "1",
                                    active: true
                                }, function (err, orgs) {
                                    count++;
                                    if (err) {
                                        logger.debug("Unable to fetch Org.", err);
                                        errOccured = true;
                                        return;
                                    }
                                    if (orgs) {
                                        for (var y = 0; y < orgs.length; y++) {
                                            (function (countOrg) {
                                                if (orgs[countOrg].id === '1') {
                                                    logger.debug("Able to get Org.", JSON.stringify(orgs[countOrg]));
                                                    orgList.push(orgs[countOrg]);
                                                }
                                            })(y);
                                        }

                                    }
                                    if (count === usrCount) {
                                        logger.debug("Returned Orgs: ", JSON.stringify(orgList));
                                        callback(errOccured, orgList);
                                    }


                                });
                            } else {

                                logger.debug("Org orgIds for query: ", orgIds);
                                d4dModelNew.d4dModelMastersOrg.find({
                                    rowid: {
                                        $in: orgIds
                                    },
                                    active: true
                                }, function (err, orgs) {
                                    count++;
                                    if (err) {
                                        logger.debug("Unable to fetch Org.", err);
                                        errOccured = true;
                                        return;
                                    }
                                    if (orgs) {
                                        for (var y = 0; y < orgs.length; y++) {
                                            (function (countOrg) {
                                                if (orgs[countOrg].id === '1') {
                                                    logger.debug("Able to get Org.", JSON.stringify(orgs[countOrg]));
                                                    orgList.push(orgs[countOrg]);
                                                }
                                            })(y);
                                        }
                                    }
                                    logger.debug('count ==>', count, "user length = >", usrCount);
                                    if (count === usrCount) {
                                        logger.debug("Returned Orgs: ", JSON.stringify(orgList));
                                        callback(errOccured, orgList);
                                    }
                                });
                            }
                        }
                    })(x);
                }
            } else {
                callback(null, orgList);
            }
        });
    }

    // Return all BusinessGroups specific to User
    this.getBusinessGroups = function (orgList, callback) {

        var productGroupList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersProductGroup.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, bgs) {
            if (err) {
                callback(err, null);
            }
            if (bgs) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < bgs.length; i++) {
                        (function (bgCount) {
                            if (bgs[bgCount].id === '2') {
                                logger.debug("Returned BG: ", JSON.stringify(bgs[bgCount]));
                                names = configmgmtDao.convertRowIDToValue(bgs[bgCount].orgname_rowid, rowidlist)
                                bgs[bgCount].orgname = names;
                                productGroupList.push(bgs[bgCount]);
                            }
                        })(i);
                    }
                    logger.debug("productGroupList: ", JSON.stringify(productGroupList));
                    callback(null, productGroupList);
                    return;
                });
            } else {
                callback(null, productGroupList);
                return;
            }
        });
    }

    this.getBusinessGroupsByOrgId = function (orgId, callback) {
        d4dModelNew.d4dModelMastersProductGroup.find({
            orgname_rowid: orgId,
            id: '2'
        }, function (err, productGroupData) {
            if (err) {
                logger.debug("getBusinessGroupsByOrgId: " + err);
                callback(err, null);
            }
            callback(null, productGroupData);

        });
    };

    this.getProjectsBybgId = function (bgId, callback) {
        d4dModelNew.d4dModelMastersProjects.find({
            productgroupname_rowid: bgId,
            id: '4'
        }, function (err, projectData) {
            if (err) {
                logger.debug("getProjectsBybgId: " + err);
                callback(err, null);
            }
            callback(null, projectData);

        });
    };

    this.getEnvironmentsByprojectId = function (projectId, callback) {
        d4dModelNew.d4dModelMastersEnvironments.find({
            projectname_rowid: {$regex: projectId},
            id: '3'
        }, function (err, environmentData) {
            if (err) {
                logger.debug("getEnvironmentsByprojectId: " + err);
                callback(err, null);
            }
            callback(null, environmentData);

        });
    };

    // Return all Environments specific to User
    this.getEnvironments = function (orgList, callback) {
        var envList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersEnvironments.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, envs) {
            if (err) {
                callback(err, null);
            }
            if (envs) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < envs.length; i++) {
                        (function (envCount) {
                            if (envs[envCount].id === '3') {
                                names = configmgmtDao.convertRowIDToValue(envs[envCount].orgname_rowid, rowidlist)
                                envs[envCount].orgname = names;
                                names = configmgmtDao.convertRowIDToValue(envs[envCount].configname_rowid, rowidlist)
                                envs[envCount].configname = names;
                                envList.push(envs[envCount]);
                            }
                        })(i);
                    }
                    logger.debug("Returned ENVs: ", JSON.stringify(envList));
                    callback(null, envList);
                    return;
                });
            } else {
                callback(null, envList);
                return;
            }
        });
    }

    // Return all Projects specific to User
    this.getProjects = function (orgList, callback) {
        var projectList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersProjects.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, projects) {
            if (err) {
                callback(err, null);
            }
            if (projects) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    var allEnvs = '';
                    for (var i = 0; i < projects.length; i++) {
                        (function (projectCount) {
                            if (projects[projectCount].id === '4') {
                                names = configmgmtDao.convertRowIDToValue(projects[projectCount].orgname_rowid, rowidlist);
                                bgnames = configmgmtDao.convertRowIDToValue(projects[projectCount].productgroupname_rowid, rowidlist);
                                projects[projectCount].orgname = names;
                                projects[projectCount].productgroupname = bgnames;
                                projectList.push(projects[projectCount]);
                            }
                        })(i);
                    }
                    logger.debug("Returned Projects: ", JSON.stringify(projectList));
                    callback(null, projectList);
                    return;
                });
            } else {
                callback(null, projectList);
                return;
            }
        });
    }
    this.getBusinessGroupsByOrgId = function (orgId, callback) {
        d4dModelNew.d4dModelMastersProductGroup.find({
            orgname_rowid: orgId,
            id: '2'
        }, function (err, productGroupData) {
            if (err) {
                logger.debug("getBusinessGroupsByOrgId: " + err);
                callback(err, null);
            }
            callback(null, productGroupData);

        });
    };

    this.getProjectsBybgId = function (bgId, callback) {
        d4dModelNew.d4dModelMastersProjects.find({
            productgroupname_rowid: bgId,
            id: '4'
        }, function (err, projectData) {
            if (err) {
                logger.debug("getProjectsBybgId: " + err);
                callback(err, null);
            }
            callback(null, projectData);

        });
    };

    // Return all ConfigManagement specific to User
    this.getCongifMgmts = function (orgList, callback) {
        var congifMgmtList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersConfigManagement.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, configMgmt) {
            if (configMgmt) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < configMgmt.length; i++) {
                        if (configMgmt[i].id === '10') {
                            names = configmgmtDao.convertRowIDToValue(configMgmt[i].orgname_rowid, rowidlist)
                            configMgmt[i].orgname = names;
                            congifMgmtList.push(configMgmt[i]);
                        }
                    }
                    callback(null, congifMgmtList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }
        });
    }
    // Return all Dockers
    this.getDockers = function (orgList, callback) {
        var dockerList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersDockerConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, dockers) {
            if (dockers) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < dockers.length; i++) {
                        if (dockers[i].id === '18') {
                            names = configmgmtDao.convertRowIDToValue(dockers[i].orgname_rowid, rowidlist)
                            dockers[i].orgname = names;
                            dockerList.push(dockers[i]);
                        }
                    }
                    callback(null, dockerList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    // Return all Templates
    this.getTemplates = function (orgList, callback) {
        var templateList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersTemplatesList.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, templates) {
            if (err) {
                callback(err, null);
            }
            if (templates) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < templates.length; i++) {
                        if (templates[i].id === '17') {
                            names = configmgmtDao.convertRowIDToValue(templates[i].orgname_rowid, rowidlist)
                            templates[i].orgname = names;
                            templateList.push(templates[i]);
                        }
                    }
                    callback(null, templateList);
                    return;
                });
            } else {
                callback(null, templateList);
                return;
            }

        });
    }

    // Return all TemplateTypes
    this.getTemplateTypes = function (orgList, callback) {
        logger.debug("getTemplateTypes called. ", JSON.stringify(orgList));
        var templateTypeList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersDesignTemplateTypes.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, templateTypes) {
            if (err) {
                callback(err, null);
            }
            if (templateTypes) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < templateTypes.length; i++) {
                        if (templateTypes[i].id === '16') {
                            names = configmgmtDao.convertRowIDToValue(templateTypes[i].orgname_rowid, rowidlist)
                            templateTypes[i].orgname = names;
                            templateTypeList.push(templateTypes[i]);
                        }
                    }
                    callback(null, templateTypeList);
                    return;
                });
            } else {
                callback(null, templateTypeList);
                return;
            }

        });
    }


    this.getFilterTemplateTypes = function (id, callback) {
        var templateTypeList = [];
        d4dModelNew.d4dModelMastersDesignTemplateTypes.find({
            id: id
        }, function (err, templateTypes) {
            if (err) {
                callback(err, null);
            }else if (templateTypes.length > 0) {
                templateTypes.forEach(function(templateType){
                    var templateTypeObj = {
                        templatetypename: templateType.templatetypename,
                        designtemplateicon_filename: templateType.designtemplateicon_filename,
                        rowid: templateType.rowid,
                        id: templateType.id,
                        active: templateType.active,
                        templatetype: templateType.templatetype
                    }
                    var findTempCheck =false;
                    if(templateTypeList.length > 0) {
                        templateTypeList.forEach(function (template) {
                            if (template.templatetypename === templateTypeObj.templatetypename) {
                                findTempCheck = true;
                            }
                        })
                        if(findTempCheck === false){
                            templateTypeList.push(templateTypeObj);
                        }
                    }else{
                        templateTypeList.push(templateTypeObj);
                    }
                })
                callback(null, templateTypeList);
                return;
            } else {
                callback(null, templateTypeList);
                return;
            }

        });
    }

    // Return all ServiceCommands
    this.getServiceCommands = function (orgList, callback) {
        var serviceCommandList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersServicecommands.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, serviceCommands) {
            if (serviceCommands) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < serviceCommands.length; i++) {
                        if (serviceCommands[i].id === '19') {
                            names = configmgmtDao.convertRowIDToValue(serviceCommands[i].orgname_rowid, rowidlist)
                            serviceCommands[i].orgname = names;
                            serviceCommandList.push(serviceCommands[i]);
                        }
                    }
                    callback(null, serviceCommandList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getDashboardServerByHost = function(dashboardServer,callback){
        cicdDashboardService.getcicdDashboardServerByHost(dashboardServer,callback);

    }

    // Return all Jenkins
    this.getJenkins = function (orgList, callback) {
        var jenkinList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelJenkinsConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, jenkins) {
            if (jenkins) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < jenkins.length; i++) {
                        if (jenkins[i].id === '20') {
                            names = configmgmtDao.convertRowIDToValue(jenkins[i].orgname_rowid, rowidlist)
                            jenkins[i].orgname = names;
                            jenkinList.push(jenkins[i]);
                        }
                    }
                    callback(null, jenkinList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    // Return all Sonarqube configured
    this.getSonarqube = function (orgList, callback) {
        var sonarqubeList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelSonarqubeConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, sonarqube) {
            if (sonarqube) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < sonarqube.length; i++) {
                        if (sonarqube[i].id === '31') {
                            names = configmgmtDao.convertRowIDToValue(sonarqube[i].orgname_rowid, rowidlist)
                            sonarqube[i].orgname = names;
                            sonarqubeList.push(sonarqube[i]);
                        }
                    }
                    callback(null, sonarqubeList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getCICDDashboard = function (orgList, callback) {
        var cicdList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersCICDDashboard.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, cicd) {
            if (cicd) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < cicd.length; i++) {
                        if (cicd[i].id === '30') {
                            names = configmgmtDao.convertRowIDToValue(cicd[i].orgname_rowid, rowidlist)
                            cicd[i].orgname = names;
                            cicdList.push(cicd[i]);
                        }
                    }
                    callback(null, cicdList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getBotRemoteServerDetails = function(orgList, callback) {
        var botRemoteServerList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersBOTsRemoteServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, remoteServerList) {
            if (remoteServerList) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < remoteServerList.length; i++) {
                        if (remoteServerList[i].id === '32') {
                            var names = configmgmtDao.convertRowIDToValue(remoteServerList[i].orgname_rowid, rowidlist) 
                            remoteServerList[i].orgname = names;
                            botRemoteServerList.push(remoteServerList[i]);
                        }
                    }
                    callback(null, botRemoteServerList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }
        });
    }

    this.getAnsibleServerDetails = function(orgList, callback) {
        var ansibleServerList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersAnsibleServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, remoteServerList) {
            if (remoteServerList) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < remoteServerList.length; i++) {
                        if (remoteServerList[i].id === '32') {
                            var names = configmgmtDao.convertRowIDToValue(remoteServerList[i].orgname_rowid, rowidlist)
                            remoteServerList[i].orgname = names;
                            ansibleServerList.push(remoteServerList[i]);
                        }
                    }
                    callback(null, ansibleServerList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }
        });
    }



    // Return all Bitbucket
    this.getBitbucket = function(orgList, callback) {
        var bitbucketList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelBitbucketConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, bitbucket) {
            if (bitbucket) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < bitbucket.length; i++) {
                        if (bitbucket[i].id === '27') {
                            names = configmgmtDao.convertRowIDToValue(bitbucket[i].orgname_rowid, rowidlist)
                            bitbucket[i].orgname = names;
                            bitbucketList.push(bitbucket[i]);
                        }
                    }
                    callback(null, bitbucketList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getOctopus = function(orgList, callback) {
        var octopusList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelOctopusConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, octopus) {
            if (octopus) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < octopus.length; i++) {
                        if (octopus[i].id === '28') {
                            names = configmgmtDao.convertRowIDToValue(octopus[i].orgname_rowid, rowidlist)
                            octopus[i].orgname = names;
                            octopusList.push(octopus[i]);
                        }
                    }
                    callback(null, octopusList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getFunctionalTest = function(orgList, callback) {
        var functionaltestList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelFunctionalTestConfig.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, functionaltest) {
            if (functionaltest) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < functionaltest.length; i++) {
                        if (functionaltest[i].id === '29') {
                            names = configmgmtDao.convertRowIDToValue(functionaltest[i].orgname_rowid, rowidlist)
                            functionaltest[i].orgname = names;
                            functionaltestList.push(functionaltest[i]);
                        }
                    }
                    callback(null, functionaltestList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getBotRemoteServerDetails = function(orgList, callback) {
        var botRemoteServerList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersBOTsRemoteServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, remoteServerList) {
            if (remoteServerList) {
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < remoteServerList.length; i++) {
                        if (remoteServerList[i].id === '32') {
                            var names = configmgmtDao.convertRowIDToValue(remoteServerList[i].orgname_rowid, rowidlist)
                            remoteServerList[i].orgname = names;
                            botRemoteServerList.push(remoteServerList[i]);
                        }
                    }
                    callback(null, botRemoteServerList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    this.getBotRemoteServerDetailByOrgId = function(orgId, callback) {
        d4dModelNew.d4dModelMastersBOTsRemoteServer.findOne({
            orgname_rowid: orgId,
            id:'32',
            active:true
        }, function(err, remoteServerDetails) {
            if (err){
                logger.error(err);
                callback(err, null);
                return;
            }else{
                callback(null,remoteServerDetails);
                return;
            }
        });
    }
    
    this.getJira = function(orgList, callback) {
        var jiraList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersJira.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function(err, jira) {
            if (jira) {
                
                configmgmtDao.getRowids(function(err, rowidlist) {
                    for (var i = 0; i < jira.length; i++) {
                        logger.debug(jira[i].id);
                        if (jira[i].id === '23') {

                            names = configmgmtDao.convertRowIDToValue(jira[i].orgname_rowid, rowidlist)
                            jira[i].orgname = names;
                            jiraList.push(jira[i]);
                        }
                    }
                    callback(null, jiraList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    // Return All Orgs specific to User
    this.getActiveOrgs = function (loggedInUser, callback) {
        var orgList = [];
        d4dModelNew.d4dModelMastersUsers.find({
            loginname: loggedInUser
        }, function (err, users) {
            if (err) {
                logger.debug("Unable to fetch User.");
                callback(err, null);
            }
            logger.debug("Able to get User: ", JSON.stringify(users));
            if (users) {
                var count = 0;
                var usrCount = 0;
                var errOccured = false;
                for (var x = 0; x < users.length; x++) {
                    (function (countUser) {
                        if (users[countUser].id === '7') {
                            usrCount++;
                            var orgIds = users[countUser].orgname_rowid;
                            logger.debug("orgIds: ", typeof orgIds[0]);
                            if (typeof orgIds[0] === 'undefined') {
                                d4dModelNew.d4dModelMastersOrg.find({
                                    id: "1",
                                    active: true
                                }, function (err, orgs) {
                                    count++;
                                    if (err) {
                                        logger.debug("Unable to fetch Org.", err);
                                        errOccured = true;
                                        return;
                                    }
                                    if (orgs) {
                                        for (var y = 0; y < orgs.length; y++) {
                                            (function (countOrg) {
                                                if (orgs[countOrg].id === '1') {
                                                    logger.debug("Able to get Org.", JSON.stringify(orgs[countOrg]));
                                                    orgList.push(orgs[countOrg]);
                                                }
                                            })(y);
                                        }

                                    }
                                    if (count === usrCount) {
                                        logger.debug("Returned Orgs: ", JSON.stringify(orgList));
                                        callback(errOccured, orgList);
                                    }


                                });
                            } else {

                                logger.debug("Org orgIds for query: ", orgIds);
                                d4dModelNew.d4dModelMastersOrg.find({
                                    rowid: {
                                        $in: orgIds
                                    },
                                    active: true
                                }, function (err, orgs) {
                                    count++;
                                    if (err) {
                                        logger.debug("Unable to fetch Org.", err);
                                        errOccured = true;
                                        return;
                                    }
                                    if (orgs) {
                                        for (var y = 0; y < orgs.length; y++) {
                                            (function (countOrg) {
                                                if (orgs[countOrg].id === '1') {
                                                    logger.debug("Able to get Org.", JSON.stringify(orgs[countOrg]));
                                                    orgList.push(orgs[countOrg]);
                                                }
                                            })(y);
                                        }
                                    }
                                    logger.debug('count ==>', count, "user length = >", usrCount);
                                    if (count === usrCount) {
                                        logger.debug("Returned Orgs: ", JSON.stringify(orgList));
                                        callback(errOccured, orgList);
                                    }
                                });
                            }
                        }
                    })(x);
                }
            } else {
                callback(null, orgList);
            }
        });
    }

    this.getAllActiveOrg = function (callback) {
        var orgList = [];
        d4dModelNew.d4dModelMastersOrg.find({
            id: "1",
            active: true
        }, function (err, orgs) {
            if (err) {
                callback(err, null);
            }
            if (orgs.length) {
                for (var j1 = 0; j1 < orgs.length; j1++) {
                    if (orgs[j1].id === '1') {
                        orgList.push(orgs[j1]);
                    }
                }
                callback(null, orgList);
            } else {
                callback(null, orgList);
            }
        });
    }

    this.getUserRoles = function (callback) {
        var userRoleList = [];
        d4dModelNew.d4dModelMastersUserroles.find({
            id: "6"
        }, function (err, userRoles) {
            if (err) {
                callback(err, null);
            }
            if (userRoles) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var j1 = 0; j1 < userRoles.length; j1++) {
                        if (userRoles[j1].id === '6') {
                            names = configmgmtDao.convertRowIDToValue(userRoles[j1].orgname_rowid, rowidlist)
                            userRoles[j1].orgname = names;
                            userRoleList.push(userRoles[j1]);
                        }
                    }
                    callback(null, userRoleList);
                    return;
                });
            } else {
                callback(null, userRoleList);
            }

        });
    }

    // Return all Users whose are associated to loggedIn User
    this.getUsers = function (loggedInUser, callback) {
        var userList = [];
        d4dModelNew.d4dModelMastersUsers.find({
            loginname: loggedInUser
        }, function (err, users) {
            if (users) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].id === '7') {
                            names = configmgmtDao.convertRowIDToValue(users[i].orgname_rowid, rowidlist)
                            users[i].orgname = names;
                            userList.push(users[i]);
                        }
                    }
                    callback(null, userList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    // Return all Users whose are associated to loggedIn User
    this.getUsersForOrg = function (orgList, callback) {
        var userList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersUsers.find({
            orgname_rowid: {
                $in: rowIds
            },
            "id": "7"
        }, function (err, users) {
            if (users) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].id === '7') {
                            names = configmgmtDao.convertRowIDToValue(users[i].orgname_rowid, rowidlist)
                            users[i].orgname = names;
                            userList.push(users[i]);
                        }
                    }
                    callback(null, userList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }

    // Return all Users whose are associated to loggedIn User
    this.getUsersForOrgOrAll = function (orgList, callback) {
        var userList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersUsers.find({
            $or: [{
                    orgname_rowid: {
                        $in: rowIds
                    }
                }, {
                    orgname_rowid: [""]
                }]
        }, function (err, users) {
            if (users) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < users.length; i++) {
                        if (users[i].id === '7') {
                            names = configmgmtDao.convertRowIDToValue(users[i].orgname_rowid, rowidlist)
                            users[i].orgname = names;
                            userList.push(users[i]);
                        }
                    }
                    callback(null, userList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }

        });
    }


    this.getTeams = function (orgList, callback) {
        var teamList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersTeams.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, teams) {
            if (err) {
                callback(err, null);
            }
            logger.debug("Able to fetch Team: ", JSON.stringify(teams));
            if (teams) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < teams.length; i++) {
                        if (teams[i].id === '21') {
                            names = configmgmtDao.convertRowIDToValue(teams[i].orgname_rowid, rowidlist)
                            teams[i].orgname = names;
                            var projectName = teams[i].projectname_rowid.split(",");
                            for (var x = 0; x < projectName.length; x++) {
                                projectnames = configmgmtDao.convertRowIDToValue(projectName[x], rowidlist);
                                if (teams[i].projectname.indexOf(projectnames) === -1) {
                                    teams[i].projectname = teams[i].projectname + "," + projectnames;
                                }
                            }
                            teamList.push(teams[i]);
                        }
                    }
                    callback(null, teamList);
                    return;
                });
            } else {
                callback(null, teamList);
                return;
            }
        });
    }

    this.getOrgById = function(orgId, callback) {
        var orgList = [];
        logger.debug("Incomming orgid: ", orgId);
        d4dModelNew.d4dModelMastersOrg.find({
            _id: new ObjectId(orgId)
        }, function(err, orgs) {
            if (orgs) {
                for (var i = 0; i < orgs.length; i++) {
                    if (orgs[i].id === '1') {
                        orgList.push(orgs[i]);
                    }
                }
                callback(null, orgList);
            } else {
                callback(err, null);
            }
        });
    }

    this.getOrgByRowId = function (orgId, callback) {
        var orgList = [];
        d4dModelNew.d4dModelMastersOrg.find({
            rowid: orgId,
            id: '1'
        }, function (err, orgs) {
            if (orgs) {
                for (var i = 0; i < orgs.length; i++) {
                    if (orgs[i].id === '1') {
                        orgList.push(orgs[i]);
                    }
                }
                callback(null, orgList);
            } else {
                callback(err, null);
            }
        });
    }

    // Now not in use
    getOrgsByRowIds = function (orgIds, callback) {
        var orgList = [];
        logger.debug("Incomming orgid: ", orgIds);
        d4dModelNew.d4dModelMastersOrg.find({
            rowid: {
                $in: orgIds
            }
        }, function (err, orgs) {
            if (orgs) {
                for (var i = 0; i < orgs.length; i++) {
                    if (orgs[i].id === '1') {
                        orgList.push(orgs[i]);
                    }
                }
                callback(null, orgList);
            } else {
                callback(err, null);
            }
        });
    }

    // Return only loggedIn User.
    this.getLoggedInUser = function (loggedInUser, callback) {
        var anUser;
        d4dModelNew.d4dModelMastersUsers.find({
            loginname: loggedInUser
        }, function (err, users) {
            if (users) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].id === '7') {
                        anUser = users[i];
                    }
                }
                callback(null, anUser);
            } else {
                callback(err, null);
            }

        });
    }

    // Return all settings for User.
    this.getAllSettingsForUser = function (loggedInUser, callback) {
        var returnObj = [];
        var catObj = {};
        d4dModelNew.d4dModelMastersUsers.find({
            loginname: loggedInUser,
            id: '7'
        }, function (err, users) {
            if (err) {
                callback(err, null);
                return;
            } else if (users.length > 0) {
                for (var i = 0; i < users.length; i++) {
                    (function (user) {
                        catObj = {
                            userid: user.rowid,
                            teams: [],
                            orgs: [],
                            projects: [],
                            bunits: []
                        };
                        d4dModelNew.d4dModelMastersTeams.find({
                            loginname_rowid: {
                                $regex: user.rowid
                            },
                            id: "21"
                        }, function (err, teams) {
                            if (err) {
                                callback(err, null);
                                return;
                            } else if (teams.length > 0) {
                                var orgIdList = [], bgIdList = [], projectIdList = [];
                                for (var j = 0; j < teams.length; j++) {
                                    (function (team) {
                                        if (catObj.teams.indexOf(team.rowid) === -1) {
                                            catObj.teams.push(team.rowid);
                                            async.waterfall([
                                                function (next) {
                                                    d4dModelNew.d4dModelMastersOrg.find({
                                                        rowid: {
                                                            $in: team.orgname_rowid
                                                        },
                                                        id: "1",
                                                        active: true
                                                    }, function (err, orgs) {
                                                        if (err) {
                                                            callback(err, null);
                                                            return;
                                                        } else if (orgs.length > 0) {
                                                            var orgCount = 0;
                                                            for (var k = 0; k < orgs.length; k++) {
                                                                (function (org) {
                                                                    orgCount++;
                                                                    if (orgIdList.indexOf(org.rowid) === -1) {
                                                                        orgIdList.push(org.rowid);
                                                                    }
                                                                })(orgs[k]);
                                                                if (orgCount === orgs.length) {
                                                                    next(null, orgIdList);
                                                                    return;
                                                                }
                                                            }
                                                        } else {
                                                            next(null, orgIdList);
                                                            return;
                                                        }
                                                    });
                                                },
                                                function (orgIds, next) {
                                                    catObj.orgs = orgIds;
                                                    async.parallel({
                                                        bgIds: function (callback) {
                                                            d4dModelNew.d4dModelMastersProductGroup.find({
                                                                orgname_rowid: {
                                                                    $in: orgIds
                                                                },
                                                                id: "2"
                                                            }, function (err, bgs) {
                                                                if (err) {
                                                                    callback(err, null);
                                                                } else if (bgs.length > 0) {
                                                                    var bgCount = 0;
                                                                    for (var l = 0; l < bgs.length; l++) {
                                                                        (function (bg) {
                                                                            bgCount++;
                                                                            if (bgIdList.indexOf(bg.rowid) === -1) {
                                                                                bgIdList.push(bg.rowid);
                                                                            }
                                                                        })(bgs[l]);
                                                                        if (bgCount === bgs.length) {
                                                                            callback(null, bgIdList);
                                                                            return;
                                                                        }
                                                                    }
                                                                } else {
                                                                    callback(null, bgIdList);
                                                                    return;
                                                                }
                                                            });
                                                        },
                                                        projectIds: function (callback) {
                                                            d4dModelNew.d4dModelMastersProjects.find({
                                                                orgname_rowid: {
                                                                    $in: orgIds
                                                                },
                                                                id: "4"
                                                            }, function (err, projects) {
                                                                if (err) {
                                                                    callback(err, null);
                                                                } else if (projects.length > 0) {
                                                                    var projectCount = 0;
                                                                    for (var m = 0; m < projects.length; m++) {
                                                                        (function (project) {
                                                                            projectCount++;
                                                                            if (projectIdList.indexOf(project.rowid) === -1) {
                                                                                projectIdList.push(project.rowid);
                                                                            }
                                                                        })(projects[m]);
                                                                        if (projectCount === projects.length) {
                                                                            callback(null, projectIdList);
                                                                            return;
                                                                        }
                                                                    }
                                                                } else {
                                                                    callback(null, projectIdList);
                                                                    return;
                                                                }
                                                            });
                                                        }

                                                    }, function (err, results) {
                                                        if (err) {
                                                            next(err, null);
                                                        }
                                                        catObj.projects = results.projectIds;
                                                        catObj.bunits = results.bgIds;
                                                        next(null, catObj);
                                                    })
                                                }], function (err, results) {
                                                if (err) {
                                                    callback(err, null);
                                                }
                                                returnObj.push(catObj);
                                                catObj = {};
                                                if (returnObj.length === teams.length) {
                                                    callback(null, returnObj);
                                                    return;
                                                }
                                            })
                                        }
                                    })(teams[j]);
                                }
                            } else {
                                logger.debug("No Team in Catalyst")
                                callback(null, returnObj);
                                return;
                            }
                        });
                    })(users[i]);
                }

            } else {
                logger.debug("No User in Catalyst")
                callback(null, users);
                return;
            }
        });
    };

    // check valid user permission
    this.checkPermission = function (username, callback) {
        logger.debug("User for permission: ", JSON.stringify(username));
        this.getLoggedInUser(username, function (err, anUser) {
            if (err) {
                callback(err, null);
            }
            if (anUser) {
                permissionsetDao.getPermissionSet(anUser.userrolename, function (err, permissionSet) {
                    if (err) {
                        callback(err, null);
                    }
                    if (permissionSet) {
                        callback(null, permissionSet);
                    } else {
                        callback(null, []);
                    }
                });
            } else {
                callback(null, []);
            }
        });

    }

    // Now not in use
    this.getJsonForNewTree = function (loggedInUser, callback) {
        var jsonTree = [];
        var businessGroups = [];
        var projects = [];
        var environments = [];
        var orgObj = {};
        this.getLoggedInUser(loggedInUser, function (err, anUser) {
            if (err) {
                callback(err, null);
            }
            if (anUser) {
                this.getOrgsByRowIds(anUser.orgname_rowid, function (err, orgList) {
                    if (err) {
                        callback(err, null);
                    }
                    if (orgList) {
                        for (var i = 0; i < orgList.length; i++) {
                            (function (orgCount) {
                                if (orgList[orgCount].id === "1") {
                                    orgObj = {
                                        name: orgList[orgCount].name,
                                        orgid: orgList[orgCount].rowid,
                                        rowid: orgList[orgCount].rowid,
                                        businessGroups: [],
                                        environments: []
                                    };
                                    d4dModelNew.d4dModelMastersProductGroup.find({
                                        orgname_rowid: orgList[orgCount].rowid
                                    }, function (err, bgs) {
                                        if (err) {
                                            callback(err, null);
                                        }
                                        if (bgs) {
                                            for (var x = 0; x < bgs.length; x++) {
                                                (function (bgCount) {
                                                    if (bgs[bgCount].id === "2") {
                                                        businessGroups.push(bgs[bgCount]);
                                                        d4dModelNew.d4dModelMastersProjects.find({
                                                            productgroupname_rowid: bgs[bgCount].rowid
                                                        }, function (err, project) {
                                                            if (err) {
                                                                callback(err, null);
                                                            }
                                                            if (project) {
                                                                for (var p = 0; p < project.length; p++) {
                                                                    (function (pCount) {
                                                                        if (project[pCount].id === "4") {
                                                                            projects.push({
                                                                                "name": bgs[bgCount].projectname,
                                                                                "rowid": project[pCount].rowid,
                                                                                "environments": project[pCount].environmentname
                                                                            });
                                                                        }
                                                                    })(p);
                                                                }
                                                                businessGroups.push(projects);
                                                            } else {
                                                                callback(null, jsonTree);
                                                            }
                                                        })
                                                    }

                                                })(x);
                                            }
                                            orgObj.businessGroups = businessGroups;
                                        } else {
                                            callback(null, jsonTree);
                                        }
                                    });
                                    d4dModelNew.d4dModelMastersEnvironments.find({
                                        orgname_rowid: orgList[orgCount].rowid
                                    }, function (err, envs) {
                                        if (err) {
                                            callback(err, null);
                                        }
                                        if (envs) {
                                            for (var e = 0; e < envs.length; e++) {
                                                (function (envCount) {
                                                    if (envs[envCount].id === "3") {
                                                        environments.push({
                                                            "name": envs[envCount].environmentname,
                                                            "rowid": envs[envCount].rowid
                                                        });
                                                    }
                                                })(e);
                                            }
                                            orgObj.environments = environments;
                                        } else {
                                            callback(null, jsonTree);
                                        }
                                    })
                                }
                            })(i);
                            jsonTree.push(orgObj);
                        }

                        callback(null, jsonTree);
                    } else {
                        callback(null, jsonTree);
                    }
                })
            }
        })
    }

    // check valid user permission
    this.getProjectsForOrg = function (orgId, callback) {
        var projectList = [];
        d4dModelNew.d4dModelMastersProjects.find({
            orgname_rowid: orgId
        }, function (err, projects) {
            if (err) {
                callback(err, null);
            }
            if (projects) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < projects.length; i++) {
                        (function (projectCount) {
                            if (projects[projectCount].id === '4') {
                                names = configmgmtDao.convertRowIDToValue(projects[projectCount].orgname_rowid, rowidlist);
                                bgnames = configmgmtDao.convertRowIDToValue(projects[projectCount].productgroupname_rowid, rowidlist);
                                projects[projectCount].orgname = names;
                                projects[projectCount].productgroupname = bgnames;
                                var envs = projects[projectCount].environmentname_rowid.split(",");
                                for (var e = 0; e < envs.length; e++) {
                                    envnames = configmgmtDao.convertRowIDToValue(envs[e], rowidlist);
                                    allEnvs = allEnvs + "," + envnames;
                                }
                                allEnvs = allEnvs.substring(1);
                                projects[projectCount].environmentname = allEnvs;
                                projectList.push(projects[projectCount]);
                            }
                        })(i);
                    }
                    logger.debug("Returned Projects: ", JSON.stringify(projectList));
                    callback(null, projectList);
                    return;
                });
            } else {
                callback(null, projectList);
                return;
            }
        });

    }

    // Return all TemplateTypes
    this.getTemplateTypesById = function (anId, callback) {
        logger.debug("getTemplateTypesById called. ", JSON.stringify(anId));
        var templateTypeList = [];
        d4dModelNew.d4dModelMastersDesignTemplateTypes.find({
            rowid: anId
        }, function (err, templateTypes) {
            if (err) {
                callback(err, null);
            }
            if (templateTypes) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < templateTypes.length; i++) {
                        if (templateTypes[i].id === '16') {
                            names = configmgmtDao.convertRowIDToValue(templateTypes[i].orgname_rowid, rowidlist);
                            templateTypes[i].orgname = names;
                            templateTypeList.push(templateTypes[i]);
                        }
                    }
                    callback(null, templateTypeList);
                    return;
                });
            } else {
                callback(null, templateTypeList);
                return;
            }

        });
    }

    this.updateAllSettings = function (orgId, orgName, callback) {
        d4dModelNew.d4dModelMastersOrg.find({
            rowid: orgId
        }, function (err, org) {
            if (err) {
                callback(err, null);
                return;
            }
            d4dModelNew.d4dModelMastersProductGroup.update({
                orgname_rowid: orgId,
                id: '2'
            }, {
                $set: {
                    orgname: orgName
                }
            }, function (err, aBody) {
                if (err) {
                    logger.debug("Error to update Settings.");
                }

                d4dModelNew.d4dModelMastersProjects.update({
                    orgname_rowid: orgId,
                    id: '4'
                }, {
                    $set: {
                        orgname: orgName
                    }
                }, function (err, aBody) {
                    if (err) {
                        logger.debug("Error to update Settings.");
                    }

                    d4dModelNew.d4dModelMastersEnvironments.update({
                        orgname_rowid: orgId,
                        id: '3'
                    }, {
                        $set: {
                            orgname: orgName
                        }
                    }, function (err, aBody) {
                        if (err) {
                            logger.debug("Error to update Settings.");
                        }

                        d4dModelNew.d4dModelMastersConfigManagement.update({
                            orgname_rowid: orgId,
                            id: '10'
                        }, {
                            $set: {
                                orgname: orgName
                            }
                        }, function (err, aBody) {
                            if (err) {
                                logger.debug("Error to update Settings.");
                            }
                            d4dModelNew.d4dModelMastersDockerConfig.update({
                                orgname_rowid: orgId,
                                id: '18'
                            }, {
                                $set: {
                                    orgname: orgName
                                }
                            }, function (err, aBody) {
                                if (err) {
                                    logger.debug("Error to update Settings.");
                                }
                                d4dModelNew.d4dModelMastersUsers.update({
                                    orgname_rowid: orgId,
                                    id: '7'
                                }, {
                                    $set: {
                                        orgname: orgName
                                    }
                                }, function (err, aBody) {
                                    if (err) {
                                        logger.debug("Error to update Settings.");
                                    }
                                    d4dModelNew.d4dModelMastersUserroles.update({
                                        orgname_rowid: orgId,
                                        id: '6'
                                    }, {
                                        $set: {
                                            orgname: orgName
                                        }
                                    }, function (err, aBody) {
                                        if (err) {
                                            logger.debug("Error to update Settings.");
                                        }
                                        d4dModelNew.d4dModelMastersDesignTemplateTypes.update({
                                            orgname_rowid: orgId,
                                            id: '16'
                                        }, {
                                            $set: {
                                                orgname: orgName
                                            }
                                        }, function (err, aBody) {
                                            if (err) {
                                                logger.debug("Error to update Settings.");
                                            }
                                            d4dModelNew.d4dModelMastersTemplatesList.update({
                                                orgname_rowid: orgId,
                                                id: '17'
                                            }, {
                                                $set: {
                                                    orgname: orgName
                                                }
                                            }, function (err, aBody) {
                                                if (err) {
                                                    logger.debug("Error to update Settings.");
                                                }
                                                d4dModelNew.d4dModelMastersServicecommands.update({
                                                    orgname_rowid: orgId,
                                                    id: '19'
                                                }, {
                                                    $set: {
                                                        orgname: orgName
                                                    }
                                                }, function (err, aBody) {
                                                    if (err) {
                                                        logger.debug("Error to update Settings.");
                                                    }
                                                    d4dModelNew.d4dModelJenkinsConfig.update({
                                                        orgname_rowid: orgId,
                                                        id: '20'
                                                    }, {
                                                        $set: {
                                                            orgname: orgName
                                                        }
                                                    }, function (err, aBody) {
                                                        if (err) {
                                                            logger.debug("Error to update Settings.");
                                                        }
                                                        d4dModelNew.d4dModelMastersTeams.find({
                                                            orgname_rowid: orgId,
                                                            id: '21'
                                                        }, function (err, teams) {
                                                            if (err) {
                                                                logger.debug("Error to get Settings.");
                                                            }

                                                            d4dModelNew.d4dModelMastersTeams.update({
                                                                orgname_rowid: {
                                                                    $in: orgId
                                                                },
                                                                id: '21'
                                                            }, {
                                                                $set: {
                                                                    orgname: orgName
                                                                }
                                                            }, function (err, aBody) {
                                                                if (err) {
                                                                    logger.debug("Error to update Settings.");
                                                                }
                                                                callback(null, aBody);
                                                                return;
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }); // bu
        });
    }

    this.updateTeam = function (orgId, callback) {
        var teamName = '';
        var teamDescription = '';
        configmgmtDao.getRowids(function (err, rowidlist) {
            d4dModelNew.d4dModelMastersTeams.find({
                orgname_rowid: orgId,
                id: '21'
            }, function (err, teams) {
                if (err) {
                    logger.debug("Error to get Settings.");
                }
                for (var t = 0; t < teams.length; t++) {
                    names = configmgmtDao.convertRowIDToValue(teams[t].orgname_rowid, rowidlist);
                    var currentTeamName = teams[t].teamname;
                    if (currentTeamName.substr(currentTeamName.indexOf("_")) === "_Admins") {
                        teamName = names + "_Admins";
                        teamDescription = "Team For " + teamName;
                    } else if (currentTeamName.substr(currentTeamName.indexOf("_")) === "_DEV") {
                        teamName = names + "_DEV";
                        teamDescription = "Team For " + teamName;
                    } else if (currentTeamName.substr(currentTeamName.indexOf("_")) === "_QA") {
                        teamName = names + "_QA";
                        teamDescription = "Team For " + teamName;
                    } else if (currentTeamName.substr(currentTeamName.indexOf("_")) === "_DevOps") {
                        teamName = names + "_DevOps";
                        teamDescription = "Team For " + teamName;
                    }
                    if (currentTeamName.substr(currentTeamName.indexOf("_")) === "_Admins" || currentTeamName.substr(currentTeamName.indexOf("_")) === "_DEV" || currentTeamName.substr(currentTeamName.indexOf("_")) === "_QA" || currentTeamName.substr(currentTeamName.indexOf("_")) === "_DevOps") {
                        d4dModelNew.d4dModelMastersTeams.update({
                            rowid: teams[t].rowid,
                            id: '21'
                        }, {
                            $set: {
                                teamname: teamName,
                                descriptions: teamDescription
                            }
                        }, function (err, aBody) {
                            if (err) {
                                logger.debug("Error to update Settings.");
                            }
                            logger.debug("Settings Updated: ", JSON.stringify(aBody));
                        });
                    }

                }
            });
        });
    };

    this.getBusinessGroupsByOrgId = function (orgId, callback) {
        d4dModelNew.d4dModelMastersProductGroup.find({
            orgname_rowid: orgId,
            id: '2'
        }, function (err, productGroupData) {
            if (err) {
                logger.debug("getBusinessGroupsByOrgId: " + err);
                callback(err, null);
            }
            callback(null, productGroupData);

        });
    };
    this.getProjectsBybgId = function (bgId, callback) {
        d4dModelNew.d4dModelMastersProjects.find({
            productgroupname_rowid: bgId,
            id: '4'
        }, function (err, projectData) {
            if (err) {
                logger.debug("getProjectsBybgId: " + err);
                callback(err, null);
            }
            callback(null, projectData);

        });
    };

    this.getUsersForAllOrg = function (callback) {
        logger.debug("getUsersForAllOrg called. ");
        d4dModelNew.d4dModelMastersUsers.find({
            id: "7",
            orgname_rowid: {
                $in: [""]
            }
        }, function (err, users) {
            if (err) {
                callback(err, null);
                return;
            }
            logger.debug("Got users for Org All.", JSON.stringify(users));
            if (users.length > 0) {
                callback(null, users);
                return;
            } else {
                callback(null, []);
                return;
            }

        });
    }

    var getPermissionForCategory = function (category, permissionto, permissionset) {
        var perms = [];
        if (permissionset) {
            for (var i = 0; i < permissionset.length; i++) {
                var obj = permissionset[i].permissions;
                for (var j = 0; j < obj.length; j++) {
                    if (obj[j].category == category) {
                        var acc = obj[j].access.toString().split(',');
                        for (var ac in acc) {
                            if (perms.indexOf(acc[ac]) < 0)
                                perms.push(acc[ac]);
                        }

                    }
                }
            }
            if (perms.indexOf(permissionto) >= 0) {
                return (true);
            } else
                return (false);
        } else {
            return (false);
        }
    };

    // Check wheather permission is there for user or not.
    this.hasPermission = function (category, permissionto, sessionUser, callback) {
        var retVal = '';
        retVal = getPermissionForCategory(category, permissionto, sessionUser.permissionset);
        callback(null, retVal);
    };

    // Return all Puppet Servers specific to User
    this.getPuppetServers = function (orgList, callback) {
        var congifMgmtList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersPuppetServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, configMgmt) {
            if (configMgmt) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < configMgmt.length; i++) {
                        if (configMgmt[i].id === '25') {
                            names = configmgmtDao.convertRowIDToValue(configMgmt[i].orgname_rowid, rowidlist)
                            configMgmt[i].orgname = names;
                            congifMgmtList.push(configMgmt[i]);
                        }
                    }
                    callback(null, congifMgmtList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }
        });
    }
    this.getServerDetails = function (jsonData, callBack) {
        var serverDetail = [];
        d4dModelNew.d4dModelMastersDockerConfig.find({
            orgname_rowid: jsonData.orgId,
            id: jsonData.dockerId
        }, function (err, dockerData) {
            if (err) {
                callBack(err, null);
                return;
            }
            serverDetail = dockerData;
            d4dModelNew.d4dModelMastersNexusServer.find({
                orgname_rowid: jsonData.orgId,
                id: jsonData.nexusId
            }, function (err, nexusData) {
                if (err) {
                    callBack(err, null);
                    return;
                }
                for (var i = 0; i < nexusData.length; i++) {
                    serverDetail.push(nexusData[i])
                }
                callBack(null, serverDetail);
            })
        })
    }





    this.getDockerServer = function (jsonData, callBack) {
        d4dModelNew.d4dModelMastersDockerConfig.find({
            orgname_rowid: jsonData.orgId,
            id: jsonData.dockerId
        }, function (err, dockerData) {
            if (err) {
                callBack(err, null);
                return;
            }
            callBack(null, dockerData);
        })
    }

    this.getNexusServer = function (jsonData, callBack) {
        d4dModelNew.d4dModelMastersNexusServer.find({
            orgname_rowid: jsonData.orgId,
            id: jsonData.nexusId
        }, function (err, nexusData) {
            if (err) {
                callBack(err, null);
                return;
            }
            callBack(null, nexusData);
        })
    }




    // Return all Nexus Servers specific to User
    this.getNexusServers = function (orgList, callback) {
        var congifMgmtList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersNexusServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, configMgmt) {
            if (configMgmt) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < configMgmt.length; i++) {
                        if (configMgmt[i].id === '26') {
                            names = configmgmtDao.convertRowIDToValue(configMgmt[i].orgname_rowid, rowidlist)
                            configMgmt[i].orgname = names;
                            congifMgmtList.push(configMgmt[i]);
                        }
                    }
                    callback(null, congifMgmtList);
                    return;
                });
            } else {
                callback(err, null);
                return;
            }
        });
    }

    // Return all Puppet Servers specific to User
    this.getAllCongifMgmts = function (orgList, callback) {
        var congifMgmtList = [];
        var rowIds = [];
        for (var x = 0; x < orgList.length; x++) {
            rowIds.push(orgList[x].rowid);
        }
        logger.debug("org rowids: ", rowIds);
        d4dModelNew.d4dModelMastersPuppetServer.find({
            orgname_rowid: {
                $in: rowIds
            }
        }, function (err, configMgmt) {
            d4dModelNew.d4dModelMastersConfigManagement.find({
                orgname_rowid: {
                    $in: rowIds
                }
            }, function (err, chefmgmt) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    if (configMgmt) {
                        for (var i = 0; i < configMgmt.length; i++) {
                            if (configMgmt[i].id === '25') {
                                names = configmgmtDao.convertRowIDToValue(configMgmt[i].orgname_rowid, rowidlist)
                                configMgmt[i].orgname = names;
                                congifMgmtList.push(configMgmt[i]);
                            }
                        }
                    }
                    if (chefmgmt) {
                        for (var j = 0; j < chefmgmt.length; j++) {
                            if (chefmgmt[j].id === '10') {
                                names = configmgmtDao.convertRowIDToValue(chefmgmt[j].orgname_rowid, rowidlist)
                                chefmgmt[j].orgname = names;
                                congifMgmtList.push(chefmgmt[j]);
                            }
                        }
                    }
                    callback(null, congifMgmtList);
                });
            });
        });
    }

    // Return all Puppet Servers specific to User
    this.getAllCongifMgmtsForOrg = function (orgId, callback) {
        logger.debug("Entered..", orgId);
        var congifMgmtList = [];
        d4dModelNew.d4dModelMastersPuppetServer.find({
            orgname_rowid: orgId
        }, function (err, configMgmt) {
            d4dModelNew.d4dModelMastersConfigManagement.find({
                orgname_rowid: orgId
            }, function (err, chefmgmt) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    if (configMgmt) {
                        for (var i = 0; i < configMgmt.length; i++) {
                            if (configMgmt[i].id === '25') {
                                names = configmgmtDao.convertRowIDToValue(configMgmt[i].orgname_rowid, rowidlist)
                                configMgmt[i].orgname = names;
                                congifMgmtList.push(configMgmt[i]);
                            }
                        }
                    }
                    if (chefmgmt) {
                        for (var j = 0; j < chefmgmt.length; j++) {
                            if (chefmgmt[j].id === '10') {
                                names = configmgmtDao.convertRowIDToValue(chefmgmt[j].orgname_rowid, rowidlist)
                                chefmgmt[j].orgname = names;
                                congifMgmtList.push(chefmgmt[j]);
                            }
                        }
                    }
                    callback(null, congifMgmtList);
                });
            });
        });
    }

    // Return all Puppet Servers specific to User
    this.getCongifMgmtsById = function (anId, callback) {
        logger.debug("Entered..", anId);
        d4dModelNew.d4dModelMastersPuppetServer.find({
            rowid: anId,
            id: "25"
        }, function (err, configMgmt) {
            if (err) {
                callback(err, null);
                return;
            }
            configmgmtDao.getRowids(function (err, rowidlist) {
                if (err) {
                    callback(err, null);
                    return;
                }
                if (configMgmt.length) {
                    names = configmgmtDao.convertRowIDToValue(configMgmt[0].orgname_rowid, rowidlist);
                    configMgmt[0].orgname = names;
                    if (configMgmt[0].userpemfile_filename) {
                        configMgmt[0].pemFileLocation = appConfig.puppet.puppetReposLocation + configMgmt[0].orgname_rowid[0] + '/' + configMgmt[0].folderpath + configMgmt[0].userpemfile_filename
                    }
                    callback(null, configMgmt[0]);
                    return;
                }
                d4dModelNew.d4dModelMastersConfigManagement.find({
                    rowid: anId,
                    id: "10"
                }, function (err, chefmgmt) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    if (chefmgmt.length) {
                        chefmgmt[0] = chefmgmt[0].toObject();
                        names = configmgmtDao.convertRowIDToValue(chefmgmt[0].orgname_rowid, rowidlist);
                        chefmgmt[0].orgname = names;

                        chefmgmt[0].chefRepoLocation = chefSettings.chefReposLocation + chefmgmt[0].orgname_rowid[0] + '/' + chefmgmt[0].loginname + '/';
                        chefmgmt[0].userpemfile = chefSettings.chefReposLocation + chefmgmt[0].orgname_rowid[0] + '/' + chefmgmt[0].folderpath + chefmgmt[0].userpemfile_filename;
                        chefmgmt[0].validatorpemfile = chefSettings.chefReposLocation + chefmgmt[0].orgname_rowid[0] + '/' + chefmgmt[0].folderpath + chefmgmt[0].validatorpemfile_filename;
                        callback(null, chefmgmt[0]);
                    } else {
                        callback(null, null);
                    }
                });
            });
        });
    }

    // Return Environment Name
    this.getEnvironmentName = function (envId, callback) {
        logger.debug("org rowids: ", envId);
        d4dModelNew.d4dModelMastersEnvironments.find({
            rowid: envId,
            "id": 3
        }, function (err, envs) {
            if (err) {
                callback(err, null);
            }
            if (envs.length) {
                logger.debug("Got Environment: ", JSON.stringify(envs));
                callback(null, envs[0].environmentname);
                return;
            } else {
                callback(null, null);
                return;
            }
        });
    };

    this.getChefDetailsByOrgId = function (orgId, callback) {
        d4dModelNew.d4dModelMastersConfigManagement.find({
            orgname_rowid: orgId,
            "id": '10'
        }, function (err, chefDetails) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, chefDetails);
            }
        });
    };

    this.getEnvironmentByEnvId = function (envId, callback) {
        logger.debug("org rowids: ", envId);
        d4dModelNew.d4dModelMastersEnvironments.find({
            rowid: envId,
            "id": 3
        }, function (err, envs) {
            if (err) {
                callback(err, null);
            }
            callback(null, envs[0]);
            return;
        });
    }

    // Return Project Name
    this.getProjectName = function (projectId, callback) {
        logger.debug("Project rowids: ", projectId);
        d4dModelNew.d4dModelMastersProjects.find({
            rowid: projectId
        }, function (err, projects) {
            if (err) {
                callback(err, null);
            }
            if (projects.length) {
                logger.debug("Got Environment: ", JSON.stringify(projects));
                callback(null, projects[0].projectname);
                return;
            } else {
                callback(null, null);
                return;
            }
        });
    }

    // Get all appData informations.
    this.getAppDataWithDeployList = function (envName, projectId, callback) {
        logger.debug("projectId: ", projectId);
        AppDeploy.getAppDeployListByEnvId(projectId, envName, function (err, data) {
            if (err) {
                logger.debug("App deploy fetch error.", err);
            }
            callback(null, data);
        });
    };

    // Get AppDeploy by name.
    this.getAppDataByName = function (envName, appName, projectId, callback) {
        d4dModelNew.d4dModelMastersProjects.find({
            appdeploy: {
                $elemMatch: {
                    applicationname: appName
                }
            },
            rowid: projectId
        }, function (err, anAppData) {
            if (err) {
                logger.debug("Got error while fetching appData: ", err);
                callback(err, null);
            }
            if (anAppData.length) {
                var appData = [];

                AppDeploy.getAppDeployByNameAndEnvId(appName, envName, function (err, data) {
                    if (err) {
                        logger.debug("App deploy fetch error.", err);
                    }
                    if (data.length) {
                        for (var i = 0; i < data.length; i++) {
                            var dummyData = {
                                _id: data[i]._id,
                                applicationName: data[i].applicationName,
                                applicationInstanceName: data[i].applicationInstanceName,
                                applicationVersion: data[i].applicationVersion,
                                applicationNodeIP: data[i].applicationNodeIP,
                                applicationLastDeploy: data[i].applicationLastDeploy,
                                applicationStatus: data[i].applicationStatus,
                                projectId: anAppData[0].rowid,
                                envId: data[i].envId,
                                description: anAppData[0].description,
                                applicationType: data[i].applicationType,
                                containerId: data[i].containerId,
                                hostName: data[i].hostName
                            };
                            appData.push(dummyData);
                        }
                        callback(null, appData);
                    } else {
                        callback(null, data);
                    }
                });
            } else {
                logger.debug("Else part..");
                callback(null, anAppData);
            }
        });
    };

    // Return particular Projects specific to User
    this.getParticularProject = function (projectId, callback) {
        var projectList = [];
        d4dModelNew.d4dModelMastersProjects.find({
            id: "4",
            rowid: projectId
        }, function (err, projects) {
            if (err) {
                callback(err, null);
            }
            if (projects) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    var allEnvs = '';
                    for (var i = 0; i < projects.length; i++) {
                        (function (projectCount) {
                            if (projects[projectCount].id === '4') {
                                names = configmgmtDao.convertRowIDToValue(projects[projectCount].orgname_rowid, rowidlist);
                                bgnames = configmgmtDao.convertRowIDToValue(projects[projectCount].productgroupname_rowid, rowidlist);
                                projects[projectCount].orgname = names;
                                projects[projectCount].productgroupname = bgnames;
                                projectList.push(projects[projectCount]);
                            }
                        })(i);
                    }
                    logger.debug("Returned Projects: ", JSON.stringify(projectList));
                    callback(null, projectList);
                    return;
                });
            } else {
                callback(null, projectList);
                return;
            }
        });
    }

    this.updateParticularProject = function (projectData, callback) {
        d4dModelNew.d4dModelMastersProjects.update({
            id: "4",
            rowid: projectData.projectId
        }, {
            $set: {
                environmentname: projectData.envNames,
                environmentname_rowid: projectData.envIds
            }
        }, {
            upsert: false
        }, function (err, projects) {
            if (err) {
                callback(err, null);
            } else {
                callback(null, projects);
            }
        });
    }



    // Return Docker
    this.getDockerById = function (anId, callback) {
        d4dModelNew.d4dModelMastersDockerConfig.find({
            rowid: anId,
            id: "18"
        }, function (err, dockers) {
            if (err) {
                logger.debug("Error to get Docker: ", err);
                callback(err, null);
                return;
            }
            callback(null, dockers);
            return;
        });
    }

    // Return all Templates for Org and TemplateType
    this.getTemplatesByOrgAndTemplateType = function (orgId, templateType, callback) {
        var templateList = [];
        var rowIds = [];
        rowIds.push(orgId);
        d4dModelNew.d4dModelMastersTemplatesList.find({
            orgname_rowid: {
                $in: rowIds
            },
            templatetypename: templateType
        }, function (err, templates) {
            if (err) {
                callback(err, null);
            }
            if (templates) {
                configmgmtDao.getRowids(function (err, rowidlist) {
                    for (var i = 0; i < templates.length; i++) {
                        if (templates[i].id === '17') {
                            names = configmgmtDao.convertRowIDToValue(templates[i].orgname_rowid, rowidlist)
                            templates[i].orgname = names;
                            templateList.push(templates[i]);
                        }
                    }
                    callback(null, templateList);
                    return;
                });
            } else {
                callback(null, templateList);
                return;
            }
        });
    }


    // Get all appDeploy informations for project.
    // Note: This method logic has to change with stored procedure for better performance.
    // For now due to time constraints implementing with for loop.(Gobinda)
    this.getAppDeployListForProject = function getAppDeployListForProject(projectId, callback) {
        logger.debug("projectId: ", projectId);
        d4dModelNew.d4dModelMastersProjects.find({
            rowid: projectId,
            id: '4'
        }, function (err, project) {
            if (err) {
                logger.error("Failed to get project. ", err);
                return callback(err, null);
            }
            if (project.length) {
                AppDeploy.getAppDeployByProjectId(projectId, function (err, appData) {
                    if (err) {
                        logger.debug("App deploy fetch error.", err);
                        return callback(err, null);
                    }
                    if (appData.length) {
                        var filterArray = [];
                        var finalJson = [];
                        for (var j = 0; j < appData.length; j++) {
                            var str = appData[j].applicationName + "@" + appData[j].applicationVersion;
                            if (filterArray.length === 0) {
                                filterArray.push(str);
                            }
                            if (filterArray.indexOf(str) === -1) {
                                filterArray.push(str);
                            }
                        }
                        logger.debug("created array: ", JSON.stringify(filterArray));
                        var count = 0;
                        for (var k = 0; k < filterArray.length; k++) {
                            (function (k) {
                                var arrayValue = filterArray[k].split("@");
                                logger.debug("name: ", arrayValue[0]);
                                logger.debug("Version: ", arrayValue[1]);
                                AppDeploy.getAppDeployByAppNameAndVersion(projectId, arrayValue[0], arrayValue[1], function (err, filteredData) {
                                    count++;
                                    if (err) {
                                        logger.error("Failed to get filteredData: ", err);
                                        return;
                                    }
                                    logger.debug("filteredData array: ", JSON.stringify(filteredData));
                                    if (filteredData.length) {
                                        var applicationName = filteredData[0].applicationName;
                                        var applicationVersion = filteredData[0].applicationVersion;
                                        var projectId = filteredData[0].projectId;
                                        var applicationInstanceName = [];
                                        var applicationNodeIP = [];
                                        var applicationLastDeploy = [];
                                        var applicationStatus = [];
                                        var containerId = [];
                                        var hostName = [];
                                        var envId = [];
                                        var appLog = [];
                                        for (var l = 0; l < filteredData.length; l++) {
                                            applicationInstanceName.push(filteredData[l].applicationInstanceName);
                                            applicationNodeIP.push(filteredData[l].applicationNodeIP);
                                            applicationLastDeploy.push(filteredData[l].applicationLastDeploy);
                                            applicationStatus.push(filteredData[l].applicationStatus);
                                            containerId.push(filteredData[l].containerId);
                                            hostName.push(filteredData[l].hostName);
                                            envId.push(filteredData[l].envId);
                                            appLog.push(filteredData[l].appLogs);
                                        }
                                        var tempJson = {
                                            "applicationName": applicationName,
                                            "applicationVersion": applicationVersion,
                                            "projectId": projectId,
                                            "applicationInstanceName": applicationInstanceName,
                                            "applicationNodeIP": applicationNodeIP,
                                            "applicationLastDeploy": applicationLastDeploy,
                                            "applicationStatus": applicationStatus,
                                            "containerId": containerId,
                                            "hostName": hostName,
                                            "envId": envId,
                                            "appLogs": appLog
                                        };
                                        finalJson.push(tempJson);
                                        if (filterArray.length === count) {
                                            logger.debug("Send finalJson: ", JSON.stringify(finalJson));
                                            return callback(null, finalJson);
                                        }
                                    } else {
                                        return;
                                    }
                                });
                            })(k);
                        }

                    } else {
                        return callback(null, []);
                    }
                });
            } else {
                return callback(null, null);
            }
        });
    };

    // update project with app name
    this.updateProject = function (projectId, appName, callback) {
        var appDescription = appName + " deployed.";
        var count = 0;
        d4dModelNew.d4dModelMastersProjects.find({
            rowid: projectId,
            id: '4'
        }, function (err, project) {
            if (err) {
                logger.debug("Failed to find Project", err);
                return;
            }
            if (project.length) {
                var appdeploy = project[0].appdeploy;
                if (appdeploy.length) {
                    for (var i = 0; i < appdeploy.length; i++) {
                        if (appdeploy[i].applicationname === appName) {
                            count++;
                        }
                    }
                    if (!count) {
                        d4dModelNew.d4dModelMastersProjects.update({
                            rowid: projectId,
                            id: '4'
                        }, {
                            $push: {
                                "appdeploy": {
                                    applicationname: appName,
                                    appdescription: appDescription
                                }
                            }
                        }, {
                            upsert: false
                        }, function (err, data) {
                            if (err) {
                                logger.debug('Err while updating d4dModelMastersProjects' + err);
                                callback(err, null);
                                return;
                            }
                            logger.debug('Updated project ');
                            callback(null, data);
                            return;
                        });
                    } else {
                        callback(null, []);
                        return;
                    }
                } else {
                    d4dModelNew.d4dModelMastersProjects.update({
                        rowid: projectId,
                        id: '4'
                    }, {
                        $push: {
                            "appdeploy": {
                                applicationname: appName,
                                appdescription: appDescription
                            }
                        }
                    }, {
                        upsert: false
                    }, function (err, data) {
                        if (err) {
                            logger.debug('Err while updating d4dModelMastersProjects' + err);
                            callback(err, null);
                            return;
                        }
                        logger.debug('Updated project ');
                        callback(null, data);
                        return;
                    });
                }
            }
        });
    };

    this.getTemplateById = function (templateId, callback) {
        d4dModelNew.d4dModelMastersTemplatesList.find({
            rowid: templateId
        }, function (err, templates) {
            if (err) {
                return callback(err);
            }
            return callback(null, templates);
        });
    };
    
    this.getSensuCookbooks = function(){
        var cookbooks = ['recipe[sensu-client]','recipe[sensu_check_load]','recipe[sensu_check_disk]','recipe[sensu_check_cpu]','recipe[sensu_check_memory]'];
        return cookbooks;
    };

    //return cookbook attributes object for sensu-client
    this.getSensuCookbookAttributes = function (monitorDetails, instanceId) {
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        var decryptedPassword = cryptography.decryptText(monitorDetails.parameters.transportProtocolParameters.password, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);

        var sensuAttributes = {
            'rabbitmq_host': monitorDetails.parameters.transportProtocolParameters.host,
            'rabbitmq_port': monitorDetails.parameters.transportProtocolParameters.port,
            'rabbitmq_username': monitorDetails.parameters.transportProtocolParameters.user,
            'rabbitmq_password': decryptedPassword,
            'rabbitmq_vhostname': monitorDetails.parameters.transportProtocolParameters.vhost,
            'instance-id': instanceId
        };
        logger.debug("sensuAttributes-------->", JSON.stringify(sensuAttributes));
        return sensuAttributes;
    };
}

module.exports = new MasterUtil();