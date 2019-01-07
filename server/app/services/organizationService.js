
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
var masterUtil = require('_pr/lib/utils/masterUtil.js');
var async = require("async");
var appConfig = require('_pr/config');
var apiUtil = require('_pr/lib/utils/apiUtil.js');
var fileIo = require('_pr/lib/utils/fileio');
var d4dModelNew = require('_pr/model/d4dmasters/d4dmastersmodelnew.js');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider');
var digitalOceanProvider = require('_pr/model/classes/masters/cloudprovider/digitalOceanProvider');
var AWS = require('aws-sdk');
var ip = require('ip');
var request = require('request');
var credentialCryptography = require('_pr/lib/credentialcryptography');
const errorType = 'organizationService';

var organizationService = module.exports = {};

organizationService.getTreeForBtv = function getTreeForBtv(userName,source,callback) {
    var masterDetailList = [];
    var orgIds = [];
    var desPath = appConfig.tempDir + userName+ "_getTreeForbtv.json";
    fileIo.exists(desPath,function(existCheck) {
        if (existCheck === true && source === "organization") {
            fileIo.readFile(desPath, function (err, fileData) {
                if(err){
                    logger.error(err);
                    callback(err,null);
                    return;
                }else{
                    callback(null,fileData);
                    return;
                }
            })
        } else {
            async.waterfall([
                function (next) {
                    masterUtil.getLoggedInUser(userName, next);
                },
                function (userDetails, next) {
                    if (userDetails.loginname) {
                        masterUtil.getAllSettingsForUser(userName, next);
                    } else {
                        next('Invalid User.', null);
                    }
                },
                function (masterDetails, next) {
                    if (masterDetails.length > 0) {
                        masterDetailList = masterDetails;
                        d4dModelNew.d4dModelMastersOrg.find({
                            id: '1',
                            active: true,
                            rowid: {
                                $in: masterDetails[0].orgs
                            }
                        }, next)
                    } else {
                        next('getTeamsOrgBuProjForUser : is null', null);
                    }
                },
                function (orgList, next) {
                    if (orgList.length > 0) {
                        var orgTree = [];
                        for (var i = 0; i < orgList.length; i++) {
                            orgIds.push(orgList[i].rowid);
                            var orgObj = {
                                name: orgList[i].orgname,
                                text: orgList[i].orgname,
                                rowid: orgList[i].rowid,
                                href: 'javascript:void(0)',
                                icon: 'fa fa-building ',
                                nodes: [],
                                borderColor: '#000',
                                businessGroups: [],
                                selectable: false,
                                itemtype: 'org',
                                environments: []
                            }
                            orgTree.push(orgObj);
                            if (orgTree.length === orgList.length) {
                                next(null, orgTree);
                            }
                        }
                    } else {
                        next(null, orgList);
                    }
                },
                function (orgTree, next) {
                    if (orgTree.length > 0) {
                        var orgCount = 0;
                        var bgObjList = [];
                        for (var i = 0; i < orgTree.length; i++) {
                            (function (org) {
                                d4dModelNew.d4dModelMastersProductGroup.find({
                                    id: '2',
                                    orgname_rowid: {
                                        $in: [org.rowid]
                                    },
                                    rowid: {
                                        $in: masterDetailList[0].bunits
                                    }
                                }, function (err, bgList) {
                                    if (err) {
                                        next(err);
                                    } else if (bgList.length > 0) {
                                        orgCount++;
                                        async.forEach(bgList, function (bg, next0) {

                                            var bgObj = {
                                                name: bg.productgroupname,
                                                text: bg.productgroupname,
                                                rowid: bg.rowid,
                                                href: 'javascript:void(0)',
                                                projects: []
                                            };
                                            var nodeObj = {
                                                name: bg.productgroupname,
                                                text: bg.productgroupname,
                                                orgname: org.name,
                                                orgid: org.rowid,
                                                icon: 'fa fa-fw fa-1x fa-group',
                                                rowid: bg.rowid,
                                                borderColor: '#000',
                                                href: 'javascript:void(0)',
                                                nodes: [],
                                                selectable: false,
                                                itemtype: 'bg',
                                                projects: []
                                            };
                                            org.businessGroups.push(bgObj);
                                            org.nodes.push(nodeObj);
                                            bgObjList.push(bgObj);
                                            syncWorkZoneTreeWithProjectAndEnv(org.rowid, org.name, bg.rowid, bg.productgroupname, function (err, data) {
                                                if (err) {
                                                    next(err);
                                                }
                                                if (data.projectObj) {
                                                    bgObj.projects = data.projectObj;
                                                    nodeObj.projects = data.projectObj;
                                                }
                                                if (data.projectNodeObj) {
                                                    nodeObj.nodes = data.projectNodeObj;
                                                }
                                                next0();
                                            });
                                        }, function (err) {
                                            if (err) {
                                                next(err);
                                            } else {
                                                next(null, orgTree);
                                            }
                                        });
                                    } else {
                                        orgCount++;
                                        if (orgCount === orgTree.length && bgObjList.length === bgList.length) {
                                            next(null, orgTree);
                                        }
                                    }
                                });
                            })(orgTree[i]);
                        }
                    } else {
                        next(null, orgTree);
                    }
                },
                function (orgBgProjectTree, next) {
                    if (orgBgProjectTree.length > 0) {
                        var orgCount = 0;
                        var envObjList = [];
                        for (var i = 0; i < orgBgProjectTree.length; i++) {
                            (function (orgTree) {
                                orgCount++;
                                d4dModelNew.d4dModelMastersEnvironments.find({
                                    id: '3',
                                    orgname_rowid: {
                                        $in: [orgTree.rowid]
                                    }
                                }, function (err, envList) {
                                    if (err) {
                                        next(err);
                                    } else if (envList.length > 0) {
                                        for (var j = 0; j < envList.length; j++) {
                                            var envObj = {
                                                name: envList[j].environmentname,
                                                rowid: envList[j].rowid
                                            };
                                            orgTree.environments.push(envObj);
                                            envObjList.push(envObj);
                                            if (orgCount === orgBgProjectTree.length && envObjList.length === envList.length) {
                                                next(null, orgBgProjectTree);
                                            }
                                        }
                                    } else {
                                        orgTree.environments.push('');
                                        if (orgCount === orgBgProjectTree.length) {
                                            next(null, orgBgProjectTree);
                                        }
                                    }
                                })
                            })(orgBgProjectTree[i]);
                        }
                    } else {
                        next(null, orgBgProjectTree);
                    }
                }
            ], function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err,null);
                    return;
                }else {
                    callback(null,results);
                    if(existCheck === true) {
                        fileIo.removeFile(desPath, function (err, data) {
                            if (err) {
                                logger.error("Error in removing getTreeForBtv File");
                                return;
                            } else {
                                apiUtil.writeFile(desPath, results, function (err, data) {
                                    if (err) {
                                        logger.error("Error in writing getTreeForBtv File");
                                    }
                                    return;
                                })
                            }
                        });
                    }else{
                        apiUtil.writeFile(desPath, results, function (err, data) {
                            if (err) {
                                logger.error("Error in writing getTreeForBtv File");
                            }
                            return;
                        })
                    }
                }
            })
        }
    });
}

organizationService.getTreeNew = function getTreeNew(userName,source,callback) {
    var masterDetailList = [];
    var orgIds = [];
    var desPath = appConfig.tempDir + userName + "_getTreeNew.json";
    fileIo.exists(desPath,function(existCheck){
        if(existCheck === true && source === "organization"){
            fileIo.readFile(desPath,function(err,fileData){
                if(err){
                    logger.error(err);
                    callback(err,null);
                    return;
                }else{
                    callback(null,fileData);
                    return;
                }
            })
        }else {
            async.waterfall([
                function (next) {
                    masterUtil.getLoggedInUser(userName, next);
                },
                function (userDetails, next) {
                    if (userDetails.loginname) {
                        masterUtil.getAllSettingsForUser(userName, next);
                    } else {
                        next('Invalid User.', null);
                    }
                },
                function (masterDetails, next) {
                    if (masterDetails.length > 0) {
                        masterDetailList = masterDetails;
                        d4dModelNew.d4dModelMastersOrg.find({
                            id: '1',
                            active: true,
                            rowid: {
                                $in: masterDetails[0].orgs
                            }
                        }, next)
                    } else {
                        next('getTeamsOrgBuProjForUser : is null', null);
                    }
                },
                function (orgList, next) {
                    if (orgList.length > 0) {
                        var orgTree = [];
                        for (var i = 0; i < orgList.length; i++) {
                            orgIds.push(orgList[i].rowid);
                            var orgObj = {
                                name: orgList[i].orgname,
                                orgid: orgList[i].rowid,
                                rowid: orgList[i].rowid,
                                businessGroups: [],
                                environments: [],
                            }
                            orgTree.push(orgObj);
                            if (orgTree.length === orgList.length) {
                                next(null, orgTree);
                            }
                        }
                    } else {
                        next(null, orgList);
                    }
                },
                function (orgTree, next) {
                    if (orgTree.length > 0) {
                        var orgCount = 0;
                        var bgObjList = [];
                        for (var i = 0; i < orgTree.length; i++) {
                            (function (org) {
                                d4dModelNew.d4dModelMastersProductGroup.find({
                                    id: '2',
                                    orgname_rowid: {
                                        $in: [org.rowid]
                                    },
                                    rowid: {
                                        $in: masterDetailList[0].bunits
                                    }
                                }, function (err, bgList) {
                                    if (err) {
                                        next(err);
                                    } else if (bgList.length > 0) {
                                        orgCount++;
                                        for (var j = 0; j < bgList.length; j++) {
                                            (function (bg) {
                                                var bgObj = {
                                                    name: bg.productgroupname,
                                                    rowid: bg.rowid,
                                                    projects: []
                                                }
                                                syncDesignTreeWithProjectAndEnv(org.rowid, bg.rowid, function (err, data) {
                                                    if (err) {
                                                        next(err);
                                                    }
                                                    bgObj.projects = data;
                                                    org.businessGroups.push(bgObj);
                                                    bgObjList.push(bgObj);
                                                    if (orgCount === orgTree.length && bgObjList.length === bgList.length) {
                                                        next(null, orgTree);
                                                    }
                                                })
                                            })(bgList[j]);
                                        }
                                    } else {
                                        orgCount++;
                                        if (orgCount === orgTree.length && bgObjList.length === bgList.length) {
                                            next(null, orgTree);
                                        }
                                    }
                                })
                            })(orgTree[i]);
                        }
                    } else {
                        next(null, orgTree);
                    }
                },
                function (orgBgProjectTree, next) {
                    if (orgBgProjectTree.length > 0) {
                        var orgCount = 0;
                        var envObjList = [];
                        for (var i = 0; i < orgBgProjectTree.length; i++) {
                            (function (orgTree) {
                                orgCount++;
                                d4dModelNew.d4dModelMastersEnvironments.find({
                                    id: '3',
                                    orgname_rowid: {
                                        $in: [orgTree.rowid]
                                    }
                                }, function (err, envList) {
                                    if (err) {
                                        next(err);
                                    } else if (envList.length > 0) {
                                        for (var j = 0; j < envList.length; j++) {
                                            var envObj = {
                                                name: envList[j].environmentname,
                                                rowid: envList[j].rowid
                                            }
                                            orgTree.environments.push(envObj);
                                            envObjList.push(envObj);
                                            if (orgCount === orgBgProjectTree.length && envObjList.length === envList.length) {
                                                next(null, orgBgProjectTree);
                                            }
                                        }
                                    } else {
                                        orgTree.environments.push('');
                                        if (orgCount === orgBgProjectTree.length) {
                                            next(null, orgBgProjectTree);
                                        }
                                    }
                                });
                            })(orgBgProjectTree[i]);
                        }
                    } else {
                        next(null, orgBgProjectTree);
                    }
                }
            ], function (err, results) {
                if (err) {
                    logger.error(err);
                    callback(err,null);
                    return;
                }else {
                    callback(null,results);
                    if(existCheck === true) {
                        fileIo.removeFile(desPath, function (err, data) {
                            if (err) {
                                logger.error("Error in removing getTreeNew File");
                                return;
                            } else {
                                apiUtil.writeFile(desPath, results, function (err, data) {
                                    if (err) {
                                        logger.error("Error in writing getTreeNew File");
                                    }
                                    return;
                                })
                            }
                        });
                    }else{
                        apiUtil.writeFile(desPath, results, function (err, data) {
                            if (err) {
                                logger.error("Error in writing getTreeNew File");
                            }
                            return;
                        })
                    }
                }
            })
        }
    })
}

function syncDesignTreeWithProjectAndEnv(orgId, bgId, callback) {
    var projectObjList = [];
    d4dModelNew.d4dModelMastersProjects.find({
        id: '4',
        orgname_rowid: {
            $in: [orgId]
        },
        productgroupname_rowid: bgId
    }, function (err, projectList) {
        if (err) {
            callback(err, null);
            ;
        } else if (projectList.length > 0) {
            for (var i = 0; i < projectList.length; i++) {
                if (projectList[i].environmentname_rowid && projectList[i].environmentname_rowid !== '') {
                    var envIds = projectList[i].environmentname_rowid.split(',');
                    var envNames = projectList[i].environmentname.split(',');
                    var envObjList = [];
                    for (var j = 0; j < envIds.length; j++) {
                        envObjList.push({
                            name: envNames[j],
                            rowid: envIds[j],
                        });
                    }
                    if (envObjList.length === envIds.length) {
                        var projectObj = {
                            name: projectList[i].projectname,
                            rowId: projectList[i].rowid,
                            environments: envObjList
                        }
                        projectObjList.push(projectObj);
                        projectObj = {};
                        if (projectObjList.length === projectList.length) {
                            callback(null, projectObjList);
                        }
                    }
                } else {
                    var projectObj = {
                        name: projectList[i].projectname,
                        rowId: projectList[i].rowid,
                        environments: [""]
                    }
                    projectObjList.push(projectObj);
                    projectObj = {};
                    if (projectObjList.length === projectList.length) {
                        callback(null, projectObjList);
                    }
                }

            }
        } else {
            callback(null, projectObjList);
        }
    })
}

function syncWorkZoneTreeWithProjectAndEnv(orgId, orgName, bgId, bgName, callback) {
    var resultObj = {};
    var projectObjList = [], projectNodeObjList = [];
    d4dModelNew.d4dModelMastersProjects.find({
        id: '4',
        orgname_rowid: {
            $in: [orgId]
        },
        productgroupname_rowid: bgId
    }, function (err, projectList) {
        if (err) {
            callback(err, null);
            ;
        } else if (projectList.length > 0) {
            for (var i = 0; i < projectList.length; i++) {
                (function (project) {
                    if (project.environmentname_rowid && project.environmentname_rowid !== '') {
                        var envIds = project.environmentname_rowid.split(',');
                        var envNames = project.environmentname.split(',');
                        var envNodeList = [], envObjList = [];
                        for (var j = 0; j < envIds.length; j++) {
                            envObjList.push({
                                name: envNames[j],
                                text: envNames[j],
                                rowid: envIds[j],
                            });
                            envNodeList.push({
                                text: envNames[j],
                                href: '#ajax/Dev.html?org=' + orgId + '&bg=' + bgId + '&projid=' + project.rowid + '&envid=' + envIds[j],
                                orgname: orgName,
                                orgid: orgId,
                                rowid: envIds[j],
                                projname: project.projectname,
                                bgname: bgName,
                                itemtype: 'env',
                                tooltip: envNames[j],
                                icon: 'fa fa-fw fa-1x fa-desktop'
                            });
                        }
                        if (envNodeList.length === envIds.length && envObjList.length === envIds.length) {
                            var projectObj = {
                                name: project.projectname,
                                text: project.projectname,
                                rowid: project.rowid,
                                environments: envObjList
                            }
                            var selectable = !!appConfig.features.appcard;
                            var nodeProjectObj = {
                                name: project.projectname,
                                text: project.projectname,
                                rowid: project.rowid,
                                orgname: orgName,
                                orgid: orgId,
                                bgname: bgName,
                                icon: 'fa fa-fw fa-1x fa-tasks',
                                nodes: envNodeList,
                                borderColor: '#000',
                                selectable: selectable,
                                itemtype: 'proj',
                                href: selectable ? '#ajax/ProjectSummary.html?org=' + orgId + '&bg=' + bgId + '&projid=' + project.rowid : 'javascript:void(0)',
                                environments: envObjList
                            }
                            projectObjList.push(projectObj);
                            projectNodeObjList.push(nodeProjectObj);
                            if (projectObjList.length === projectList.length && projectNodeObjList.length === projectList.length) {
                                resultObj = {
                                    projectObj: projectObjList,
                                    projectNodeObj: projectNodeObjList
                                }
                                callback(null, resultObj);
                            }
                        }
                    } else {
                        var projectObj = {
                            name: project.projectname,
                            text: project.projectname,
                            rowid: project.rowid,
                            environments: [""]
                        }
                        var selectable = !!appConfig.features.appcard;
                        var nodeProjectObj = {
                            name: project.projectname,
                            text: project.projectname,
                            rowid: project.rowid,
                            orgname: orgName,
                            orgid: orgId,
                            bgname: bgName,
                            icon: 'fa fa-fw fa-1x fa-tasks',
                            nodes: [],
                            borderColor: '#000',
                            selectable: selectable,
                            itemtype: 'proj',
                            href: 'javascript:void(0)',
                            environments: [""]
                        }
                        projectObjList.push(projectObj);
                        projectNodeObjList.push(nodeProjectObj);
                        if (projectObjList.length === projectList.length && projectNodeObjList.length === projectList.length) {
                            resultObj = {
                                projectObj: projectObjList,
                                projectNodeObj: projectNodeObjList
                            }
                            callback(null, resultObj);
                        }
                    }
                })(projectList[i]);
            }
        } else {
            callback(null, resultObj);
        }
    })
}

organizationService.getProviderConfigForOrganisation= function getProviderConfigForOrganisation(data,callback){

    switch (data.providerType.toLowerCase()){
        case "aws" :
            AWSProvider.getAWSProviderById(data.providerid, function (err,result) {

            if (err) {
                logger.error("error in fetching provider details" + err);
                /*res.status(400).send({
                    message: "Error in fetching provider details"
                });*/
                callback(err,null);
            }
            else {
                credentialCryptography.decryptCredential(result, function (err, decryptedCredentials) {
                    if(err){
                        callback(err,null);
                    }
                    else{


                        console.log("provider details:" + decryptedCredentials)
                        var params = {};
                        params["region"] = data.region;
                        params["accessKeyId"] = decryptedCredentials.accessKey;
                        params["secretAccessKey"] = decryptedCredentials.secretKey;
                        var provType = result.providerType;

                        if (ip.isPrivate(data.fqdn)) {
                            var para = {
                                Filters: [
                                    {
                                        Name: "network-interface.addresses.private-ip-address",
                                        Values: [
                                            data.fqdn
                                        ]
                                    }
                                ]
                            };
                        } else {
                            var para = {
                                Filters: [
                                    {
                                        Name: 'ip-address',
                                        Values: [
                                            data.fqdn
                                        ]
                                    }
                                ]
                            }
                        }

                        var ec2 = new AWS.EC2(params);
                        ec2.describeInstances(para, function (err, instanceData) {
                            if (err) {
                                logger.error("Error", err.stack);
                                /*  res.status(400).send({
                                      message: "Credential Error: failed to login with provider details"
                                  });*/
                                callback(err,null);
                            } else {
                                var instance={}

                                instance["platformId"] = instanceData.Reservations[0].Instances[0].InstanceId;
                                instance["providerType"] = provType.toLowerCase();
                                callback(null,instance);
                            }
                        });
                    }

                });

            }
        });
            break;



        case "digitalocean" :
            digitalOceanProvider.getDigitalOceanProviderById(data.providerid,function(err,result){
                if (err) {
                    logger.error("error in fetching provider details" + err);

                    callback(err,null);
                }
                else{
                    var token = result.token;
                    var provType = result.providerType;
                    var url="https://api.digitalocean.com/v2/droplets";

                    var options = {
                        url: url,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer '+token
                        },
                        json: true,
                    };

                    request.get(options, function (err, httpResponse, body){

                        if(err){
                            logger.error("error in fetching provider details from digital ocean" + err);
                            callback(err,null);
                        }
                        else if(httpResponse.body.droplets.length == 0){
                            callback(null,null);
                        }else{
                            var resData= httpResponse.body.droplets;
                            var instance={};
                            for(var i=0;i< resData.length;i++){
                                if(resData[i].networks.v4[0].ip_address == "159.89.174.171"){

                                    instance["platformId"] = resData[i].id;
                                    instance["providerType"] = provType.toLowerCase();
                                    i=resData.length;
                                }
                            }
                            callback(null,instance);
                        }


                    });


                }

            });

            break;


        default:
            var err = {message:data.providerType +" provider type not supported "};
            callback(err,null);


    }

}


