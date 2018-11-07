/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
        .controller('editParamsCtrl',['$scope', '$rootScope', '$state', 'responseFormatter', 'genericServices', 'botsCreateService', 'toastr', '$modal', function ($scope, $rootScope, $state, responseFormatter, genSevs, botsCreateService, toastr, $modal) {
            var items;
            $scope.gitRepository=[];
            $scope.cloudProviders=[];

            $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });
            $scope.getRepository= function (Source,cloud) {
                var param={
                    url:'/botSource/' + Source
                };
                genSevs.promiseGet(param).then(function (response) {
                    if(response){
                        $scope.gitRepository=response;
                    }
                });
                 var cloudParam={
                    url:'/cloudProviders/' + cloud
                };
                genSevs.promiseGet(cloudParam).then(function (response) {
                    if(response){
                        $scope.cloudProviders=response;
                    }
                });
            }

            if($scope.templateSelected) {
                items = $scope.templateSelected;
                var cloud='';
                var source='';
                if(items && items.inputFormFields){
                    angular.forEach(items.inputFormFields, function(itm, key) {
                        if(itm && itm.name== 'source_repository'){
                            source=itm.default.toLowerCase();
                        }
                        if(itm && itm.name=='cloud_providers'){
                            cloud=itm.default.toLowerCase();
                        }
                    });
                }
                $scope.getRepository(source,cloud);
            }

            if($rootScope.organObject) {
                $scope.IMGNewEnt={
                    org:$rootScope.organObject[0],
                    buss:$rootScope.organObject[0].businessGroups[0],
                    proj:$rootScope.organObject[0].businessGroups[0].projects[0],
                    env:$rootScope.organObject[0].businessGroups[0].projects[0].environments[0],
                    blueprintType:items.subType,
                    blueprintName:items.execution.name
                };
            }

            $scope.botName = items.name;
            $scope.botParams = items.inputFormFields;
            $scope.botEditParams = {};
            $scope.botType = items.type;
            $scope.subType = items.subType;
            $scope.botInfo = $scope.templateSelected;
            $scope.executionDetails = items.execution;
            $scope.selectedInstanceList = [];
            $scope.selectedInstanceIds = [];
            $scope.originalInstanceList = [];
            $scope.originalBlueprintList = [];
            $scope.selectedBlueprintIds = [];
            $scope.selectedBlueprintList = [];
            $scope.jenkinsParamsList = [];
            $scope.executeTaskForSave = false;
            $scope.jenkinsServerSelect = '';
            $scope.hideRightButton = true;
            $scope.showAttributeList = false;
            $scope.scheduleAlternate = {flag:false};


            if($scope.botType === 'jenkins' && items.inputFormFields[1].default) {
                $scope.jobName = items.inputFormFields[1].default;
            }
            $scope.scriptSelectForRemote = {
                flag: false
            };
            $scope.jenkinsShowParam = {
                flag: false
            }

            if($scope.botType === 'blueprints') {
                $scope.botCheck = true;
            } else if($scope.botType === 'script' || $scope.botType === 'chef') {
                $scope.botCheck = false;
            }

            if($scope.botType ==='jenkins' && items.isParameterized === true) {
                for(var i=0;i<items.execution.length;i++) {
                    if('parameterized' in items.execution[i] && items.execution[i].parameterized !== null) {
                        $scope.showParametersForJenkins = true;
                        $scope.parameterList = items.execution[i].parameterized;
                    }
                }
            }

            $scope.selectValue = function(name,value){
                var list=$scope.parameterList;
                for(var i=0;i<list.length;i++){
                    if(list[i].name===name){
                        list[i].defaultValue=[value];
                    }
                }
            }

            if($scope.botType ==='chef') {
                for(var i=0;i<items.execution.length;i++) {
                    if('attributes' in items.execution[i] && items.execution[i].attributes !== null) {
                        $scope.showAttributeList = true;
                        $scope.attributeList = items.execution[i].attributes;
                    }
                }
            }

            $scope.getInstanceList = function() {
                if($scope.IMGNewEnt){
                    botsCreateService.getCurrentOrgInstances($scope.IMGNewEnt.org.orgid).then(function(response){  
                    $scope.originalInstanceList=[];
                        if(response.instances){
                            angular.forEach(response.instances, function(value) {
                                if($scope.selectedInstanceIds.indexOf(value._id) === -1) {
                                    $scope.originalInstanceList.push(value);
                                }
                            });
                        }
                    });
                }
            };

            $scope.getBlueprintList = function() {
                if($scope.IMGNewEnt){
                    botsCreateService.getBlueprintList($scope.IMGNewEnt.org.orgid,$scope.IMGNewEnt.blueprintType,$scope.IMGNewEnt.blueprintName).then(function(response){
                        $scope.originalBlueprintList=[];
                        if(response.blueprints){
                            $scope.originalBlueprintList = response.blueprints;
                        }
                    });
                }
            };

            $scope.botStatus = function() {
                if($scope.scriptSelectForRemote.flag){
                    $scope.botCheck = true;
                    $scope.getInstanceList();
                }else{
                    $scope.botCheck = false;
                }

            };

            $scope.settingalternative = function() {
                $scope.scheduleAlternate = true

            };

            //get jenkins server list 
            $scope.getJenkinsList =  function() {
                botsCreateService.getJenkinsServerDetails().then(function(response){
                    var data;
                    if (response.data) {
                        data = response.data;
                    } else {
                        data = response;
                    }
                    $scope.jenkinsServerList = responseFormatter.formatJenkinsServerList(data);
                });
            };
        
            if(items.type === 'blueprints') {
                $scope.getBlueprintList();
            } else if(items.type === 'jenkins') {
                $scope.getJenkinsList();
            }

            //to check whether the job exists in jenkins server or not
            $scope.checkForJenkinsServer = function() {
                $scope.disableJenkinsExecute = false;
                botsCreateService.getJenkinsServerJobList($scope.jenkinsServerSelect).then(function(response){
                    if (response) {
                        $scope.jenkinServerJobList = response;
                        for(var i=0;i<$scope.jenkinServerJobList.length;i++) {
                            if($scope.jenkinServerJobList[i].name === $scope.jobName) {
                                return true;    
                            }
                        }
                        $scope.disableJenkinsExecute = true;
                        toastr.error('This Job is not associated to this Jenkins server. Please select a different Jenkins Server');
                        return false;
                    } 
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
            }

            $scope.addInstanceBP = function (indexArr,type) {
                if(type === 'instance') {
                    $scope.selectedInstanceList.push($scope.originalInstanceList[indexArr]);
                    $scope.selectedInstanceIds.push($scope.originalInstanceList[indexArr]._id);
                    $scope.originalInstanceList.splice(indexArr,1);
                } else if(type === 'blueprints') {
                    $scope.selectedBlueprintList.push($scope.originalBlueprintList[indexArr]);
                    if($scope.selectedBlueprintList.length > 0) {
                        $scope.hideRightButton = false;
                    }
                    $scope.selectedBlueprintIds.push($scope.originalBlueprintList[indexArr]._id);
                    $scope.originalBlueprintList.splice(indexArr,1);
                }
            };

            $scope.instanceInfo = function($event,instanceDetails) {
                botsCreateService.getInstanceDetails(instanceDetails._id).then(function(){
                    $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/bots/view/instanceInfo.html',
                        controller: 'intanceInfoCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return instanceDetails;
                            }
                        }
                    }).result.then(function() {
                    }, function() {
                    });
                });
            };

            $scope.selectBpInfo = function ($event,bpDetails,bpType){
                $event.stopPropagation();
                genSevs.moreInfo(bpDetails,bpType);
            };

            $scope.deSelectInstanceBP = function ($event,id,type){
                $event.stopPropagation();
                if(type === 'instance') {
                    var ind = $scope.selectedInstanceIds.indexOf(id);
                    $scope.selectedInstanceList.splice(ind,1);
                    $scope.selectedInstanceIds.splice(ind,1);
                    $scope.getInstanceList();
                } else if(type === 'blueprints') {
                    var indD = $scope.selectedBlueprintIds.indexOf(id);
                    $scope.selectedBlueprintList.splice(indD,1);
                    $scope.selectedBlueprintIds.splice(indD,1);
                    if($scope.selectedBlueprintList.length === 0) {
                        $scope.hideRightButton = true;
                    }

                    $scope.getBlueprintList();
                }
            };

            $scope.botExecuteMethod = function(itemsId,reqBody) {
                botsCreateService.botExecute(itemsId,reqBody).then(function (response) {
                    if($scope.botType === 'jenkins') {
                        genSevs.showLogsForJenkins(response);
                    } else {
                        genSevs.showLogsForBots(response);
                    }
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                    botsCreateService.getBOTDetails(itemsId).then(function(response){
                        for(var i=0;i<response.bots.length;i++) {
                            var botObj = response.bots[i];
                            $rootScope.$emit('BOTS_DESCRIPTION_REFRESH', botObj);
                        }
                    });
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

            $scope.executeBot = function(type){
                $scope.executeTaskForSave = true;
                var reqBody = {};
                
                reqBody.type = $scope.botType;
                console.log("reqBody------",$scope.botType)
                if(type === 'instance') {
                    if($scope.botType === 'script') {
                       // if($scope.botEditParams && $scope.botEditParams.data)
                        reqBody.data = $scope.botEditParams;
                        if($scope.botCheck === true && $scope.selectedInstanceIds.length>0) {
                            reqBody.nodeIds = $scope.selectedInstanceIds;
                        }
                    } else if($scope.botType === 'chef') {
                        if($scope.botCheck === true && $scope.selectedInstanceIds.length>0) {
                            reqBody.nodeIds = $scope.selectedInstanceIds;
                        }
                        if($scope.attributeList) {
                            reqBody.attributes = $scope.attributeList;
                        }
                    } else if($scope.botType === 'jenkins') {
                        var jenkinsData = {
                            jenkinsServerId:$scope.jenkinsServerSelect,
                            jobName:items.inputFormFields[1].default,
                            jobResultURL:items.inputFormFields[2].default
                        };
                        reqBody.data = jenkinsData;
                        if($scope.parameterList) {
                            angular.element('.choiceParam').each(function(){
                                $scope.selectValue(this.name,this.value);
                            });
                            $scope.choiceParam = {};
                            for (var i = 0; i < $scope.parameterList.length; i++) {
                                $scope.choiceParam[$scope.parameterList[i].name] = $scope.parameterList[i].defaultValue[0];
                            }
                            reqBody.choiceParam =  $scope.choiceParam;
                        }
                    }
                    console.log("-------Data",reqBody)
                    $scope.botExecuteMethod(items.id,reqBody);
                } else if (type === 'blueprints') {
                    reqBody.blueprintIds = [$scope.originalBlueprintList[0]._id];
                    botsCreateService.getBlueprintDetails($scope.originalBlueprintList[0]._id).then(function(response){
                        $modal.open({
                            animate: true,
                            templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunchParams.html",
                            controller: "blueprintLaunchParamsCtrl as bPLP",
                            backdrop : 'static',
                            keyboard: false,
                            resolve: {
                                items: function() {
                                    return response;
                                }
                            }
                        }).result.then(function(blueprintObj) {
                            reqBody.monitorId = blueprintObj.monitorId;
                            reqBody.domainName = blueprintObj.domainName;
                            reqBody.envId = blueprintObj.launchEnv;
                            reqBody.tagServer = blueprintObj.tagServer;
                            reqBody.stackName = blueprintObj.stackName;
                            $scope.botExecuteMethod(items.id,reqBody);
                        }, function() {

                        });
                    })
                }
            };

            $scope.cancel= function() {
                $modalInstance.dismiss('cancel');
            };
        }]);
})(angular);
