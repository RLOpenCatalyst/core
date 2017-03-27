/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
    .controller('editParamsCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'blueprintCreateService', 'toastr', '$modalInstance', 'items', 'responseFormatter', '$modal', function ($scope, $rootScope,  genSevs, workzoneServices, blueprintCreateService,toastr, $modalInstance, items, responseFormatter, $modal) {
        var appDeployCreate = this;
        appDeployCreate={
            newEnt:[],
            serverRepos:[],
            groupOptions:[],
            repositoryOptions:[],
            artifactsOptions:[],
            versionsOptions:[],
            tagOptions:[],
            artifactsVersion:[],
            errorMsg:{}
        };
        $scope.botName = items.botName;
        $scope.taskType = items.botLinkedSubCategory;
        $scope.botCategory = items.botCategory;
        $scope.taggingServerList=[];
        $scope.envOptions=[];
        workzoneServices.getTaggingServer().then(function (topSer) {
            $scope.taggingServerList=topSer.data;
        });
        $scope.chefAttributesFlag = false;
        $scope.scriptParamsFlag = false;
        if(items.botConfig && items.botConfig.runlist && items.botConfig.runlist.length) {
            $scope.chefAttributesFlag = true;
        }
        if(items.botLinkedSubCategory === 'script' && items.botConfig) {
            for (var i=0; i<items.botConfig.scriptDetails.length; i++) {
                if(items.botConfig.scriptDetails[i].scriptParameters.length > 0) {
                    $scope.scriptParamsFlag = true;
                }
            }
        }
        $scope.isChefattributesLoading = true;

        $scope.totalCount = 0;
        $scope.countInit = function() {
           return $scope.totalCount++;
        };

        if (items.botLinkedSubCategory === 'chef') {
            $scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(items.botConfig.runlist);
            var nodesList = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
            $scope.chefattributes = [];
            $scope.chefattributes = responseFormatter.formatSavedCookbookAttributes(items.botConfig.attributes);
            workzoneServices.getCookBookListForOrg(items.masterDetails.orgId).then(function(data){
                var runlist = [];
                for (var i = 0; i < nodesList.length; i++) {
                    if (nodesList[i].className === "cookbook" || nodesList[i].className === "deploy") {
                        runlist.push(nodesList[i].value);
                    }
                }
                if (runlist.length > 0) {
                    workzoneServices.getcookBookAttributes(runlist, data.data.serverId).then(function (response) {
                        var data;
                        if (response.data) {
                            data = response.data;
                        } else {
                            data = response;
                        }
                        /*Scope apply done to force refresh screen after receiving the AJAX response*/
                        $scope.$apply(function () {
                            if ($scope.chefattributes) {
                                for (var j = 0; j < data.length; j++) {
                                    for (var attrItem in data[j].attributes) {
                                        if ($scope.chefattributes[attrItem]) {
                                            data[j].attributes[attrItem].default = $scope.chefattributes[attrItem];
                                        }
                                    }
                                }
                            }
                            $scope.chefattributes = data;
                            $scope.cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                            $scope.isChefattributesLoading = false;
                        });
                    });
                }
            });
        }
        if(items.botCategory === 'Application Deployment') {
            
            appDeployCreate.init = function () {
                blueprintCreateService.getNexusServerList().then(function(data){
                    appDeployCreate.serverRepos = data;
                });
                blueprintCreateService.getDockerList().then(function(data){
                    appDeployCreate.serverRepos = appDeployCreate.serverRepos.concat(data);
                });
                workzoneServices.getInstanceDetails(items.botConfig.nodeIds[0]).then(function(response){
                    appDeployCreate.newEnt.hostIP = response.data.instanceIP;
                })
            };

            appDeployCreate.getRepository = function(){
                if (appDeployCreate.newEnt.nexusDockerServer){
                    appDeployCreate.newEnt.serverType = appDeployCreate.serverRepos[appDeployCreate.newEnt.nexusDockerServer].configType;
                } else {
                    appDeployCreate.newEnt.serverType = '';
                }
                $scope.isLoadingNexus = true;
                if(appDeployCreate.newEnt.serverType === 'nexus'){
                    // create group select box options
                    appDeployCreate.groupOptions = appDeployCreate.serverRepos[appDeployCreate.newEnt.nexusDockerServer].groupid;
                    blueprintCreateService.getNexusRepoList(appDeployCreate.serverRepos[appDeployCreate.newEnt.nexusDockerServer].rowid,items.masterDetails.projectId).then(function (data) {
                        appDeployCreate.repositoryOptions = data;
                        $scope.isLoadingNexus = false;
                    });
                } /*else if(appDeployCreate.newEnt.serverType === 'docker'){
                    blueprintCreateService.getRepoList(bpCreate.serverRepos[bpCreate.newEnt.nexusDockerServer].rowid).then(function (repositoryResult) {
                        $scope.isLoadingNexus = false;
                        blueprintCreation.repositoryOptions = repositoryResult.data[0].repositories.docker;
                        if(blueprintCreation.repositoryOptions.length === 0){
                            blueprintCreation.errorMsg= {
                                text: "Repository is not defined",
                                type: "warning",
                                repository:true,
                                role:"tooltip",
                                positions:"bottom"
                            };
                        }
                    });
                }*/
            };


            appDeployCreate.changeRepository = function(){
                if(appDeployCreate.newEnt.serverType === 'docker') {
                    var repository=appDeployCreate.newEnt.repositoryIMG.split('/');
                    appDeployCreate.newEnt.repository=appDeployCreate.newEnt.repositoryIMG;
                    var tagRep='';
                    if(appDeployCreate.newEnt.repositoryIMG && appDeployCreate.newEnt.repositoryIMG.indexOf('/') === -1){
                        tagRep='library';
                        appDeployCreate.newEnt.image=appDeployCreate.newEnt.repository;
                    } else {
                        tagRep=repository[0];
                        appDeployCreate.newEnt.image=repository[1];
                    }
                    $scope.isLoadingDocTag=true;
                    var requestObject={
                        dockerId:appDeployCreate.serverRepos[appDeployCreate.newEnt.nexusDockerServer].rowid,
                        repository:tagRep,
                        image:appDeployCreate.newEnt.image
                    };
                    workzoneServices.getDockerImageTags(requestObject).then(function(tagResult){
                        appDeployCreate.tagOptions = tagResult.data;
                        $scope.isLoadingDocTag=false;
                    });
                } else {
                    appDeployCreate.newEnt.repository = appDeployCreate.repositoryOptions[appDeployCreate.newEnt.repositoryInd].id;
                    appDeployCreate.newEnt.repositoryURL = appDeployCreate.repositoryOptions[appDeployCreate.newEnt.repositoryInd].resourceURI;
                }
            };

            appDeployCreate.getArtifacts= function(){
                $scope.isLoadingArtifacts = true;
                appDeployCreate.requestData={
                    nexus:appDeployCreate.serverRepos[appDeployCreate.newEnt.nexusDockerServer].rowid,
                    repositories:appDeployCreate.newEnt.repository,
                    group:appDeployCreate.newEnt.groupId
                };
                blueprintCreateService.getArtifacts(appDeployCreate.requestData).then(function (artifactsResult) {
                    var artVerObj=[];
                    appDeployCreate.atrifactForVersion = artifactsResult;
                    $scope.artifactsVersion = artifactsResult;
                    angular.forEach(artifactsResult,function(val){
                        artVerObj[val.version]=val;
                        appDeployCreate.artifactsVersion[val.artifactId]=artVerObj;
                        if (appDeployCreate.artifactsOptions.indexOf(val.artifactId) === -1) {
                            appDeployCreate.artifactsOptions.push(val.artifactId);
                        }
                    });
                    $scope.isLoadingArtifacts = false;
                });
            };
            appDeployCreate.getVersions= function(){
                $scope.isLoadingNexusVersion = true;
                appDeployCreate.requestData.artifactId = appDeployCreate.newEnt.artifact;
                    blueprintCreateService.getNexusVersions(appDeployCreate.requestData).then(function (versionsResult) {
                    appDeployCreate.versionsOptions = versionsResult;
                    $scope.isLoadingNexusVersion = false;
                });
            };
            appDeployCreate.getResourceURI = function(){
                $scope.isLoadingRepoVersion = true;
                angular.forEach($scope.artifactsVersion,function(val){
                    if(val.version === appDeployCreate.newEnt.version) {
                        appDeployCreate.newEnt.resourceURI = val.resourceURI;
                        $scope.isLoadingRepoVersion = false;
                    }
                });

            };
            appDeployCreate.init();
        }
        if (items.botConfig) {
            $scope.jenkinsparams = items.botConfig.parameterized;
            $scope.scriptparams = items.botConfig.scriptDetails;
        }
        $scope.parameters=[''];
        var cookbookAttributes = [];
        $scope.cookbookAttributes = [];
        var scriptParams = [];
        var choiceParam = {};
        $scope.jenparams = {};

        var helper = {
            botLogModal: function(id,historyId,taskType) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/bots/view/botExecutionLogs.html',
                    controller: 'botExecutionLogsCtrl as botExecLogCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return {
                                taskId: id,
                                historyId: historyId,
                                taskType: taskType
                            };
                        }
                    }
                });
            }
        };

        $scope.executeBot=function(){
            if (items.botConfig && items.botConfig.taskType === 'script') {
                /*for(var i = 0; i < $scope.scriptparams.length; i++){
                    var scriptObj = {};
                    var scriptParamList = [];
                    if($scope.scriptparams[i].scriptParameters.length > 0){
                        for(var j = 0; j<$scope.scriptparams[i].scriptParameters.length;j++){
                            scriptParamList.push($scope.scriptparams[i].scriptParameters[j].paramVal);
                        }
                        if($scope.scriptparams[i].scriptParameters.length === scriptParamList.length){
                            scriptObj[$scope.scriptparams[i].scriptId] = scriptParamList;
                            scriptParams.push(scriptObj);
                        }
                    }else{
                        scriptObj[$scope.scriptparams[i].scriptId] = [];
                        scriptParams.push(scriptObj);
                    }
                }*/

                scriptParams = $scope.scriptparams;
            }
            if (items.botConfig && items.botConfig.taskType === 'chef') {
                if($scope.botCategory === 'Application Deployment' && items.botConfig.runlist[0] === 'recipe[deploy_catalyst_3]') {
                    
                    var appDeploy = [
                        {
                        "name": "Nexus Repo Url",
                            "jsonObj": {
                                "rlcatalyst": {
                                    "nexusUrl": appDeployCreate.newEnt.resourceURI
                                }
                            }
                        },{
                            "name": "Version",
                            "jsonObj": {
                                "rlcatalyst": {
                                    "version": appDeployCreate.newEnt.version
                                }
                            }
                        },{
                            "name": "Callback URL for app data ",
                            "jsonObj": {
                                "deploy_catalyst_3": {
                                    "catalystCallbackUrl": "http://neocatalyst.rlcatalyst.com/app-deploy"
                                }
                            }
                        }, {
                            "name": "applicationNodeIP",
                            "jsonObj": {
                                "rlcatalyst": {
                                    "applicationNodeIP": appDeployCreate.newEnt.hostIP
                                }
                            }
                        }
                    ]
                    $scope.chefattributes = appDeploy
                    cookbookAttributes = $scope.chefattributes;
                } else {
                    cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                }
            }
            if (items.botConfig && items.botConfig.taskType === 'jenkins') {
                choiceParam = $scope.jenparams;
            }
            $scope.executeTask();
        };

        $scope.executeTask = function(){
            var reqBody = {};
            if (items.botConfig && items.botConfig.taskType === 'jenkins') {
                reqBody.choiceParam = choiceParam;
            } else if (items.botConfig && items.botConfig.taskType === 'chef'){
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.chefAttributesFlag && items.botCategory !== 'Application Deployment') {
                    reqBody.cookbookAttributes = cookbookAttributes;
                }
                if(items.botCategory === 'Application Deployment') {
                    reqBody.cookbookAttributes = cookbookAttributes;   
                }
            } else  if (items.botConfig && items.botConfig.taskType === 'script') {
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.scriptParamsFlag) {
                    reqBody.scriptParams = scriptParams;
                }
            }
            var param={
                inlineLoader:true,
                url:'/bots/' + items.botId + '/execute',
                data: reqBody
            };
            genSevs.promisePost(param).then(function (response) {
                $modalInstance.close(response.data);
                $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                helper.botLogModal(items.botId, response.historyId, response.taskType);
            },
            function (error) {
                if(error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                }
            });
        };

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
        return appDeployCreate;
    }]);
})(angular);