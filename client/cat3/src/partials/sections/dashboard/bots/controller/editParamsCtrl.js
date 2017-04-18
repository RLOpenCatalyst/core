/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
        .controller('editParamsCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'botsCreateService', 'toastr', '$modal', function ($scope, $rootScope, $state, genSevs, botsCreateService, toastr, $modal) {
            var items;

            $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });

            if($scope.templateSelected) {
                items = $scope.templateSelected;
            }

            $scope.botName = items.name;
            $scope.botParams = items.inputFormFields;
            $scope.botEditParams = {};
            $scope.botType = items.type;
            $scope.subType = items.subType;
            $scope.botInfo = $scope.templateSelected;
            $scope.selectedInstanceList = [];
            $scope.selectedInstanceIds = [];
            $scope.originalInstanceList = [];
            $scope.originalBlueprintList = [];
            $scope.selectedBlueprintIds = [];
            $scope.selectedBlueprintList = [];
            $scope.executeTaskForSave = false;
            $scope.hideRightButton = true;
            $scope.scriptSelectForRemote = {
                flag: false
            };

            if($scope.botType === 'chef' || $scope.botType === 'blueprints') {
                $scope.botCheck = true;
            } else if($scope.botType === 'script') {
                $scope.botCheck = false;
            }

            $scope.botStatus = function() {
                if($scope.scriptSelectForRemote.flag){
                    $scope.botCheck = true;
                    $scope.getInstanceList();
                }else{
                    $scope.botCheck = false;
                }
            };

            if($rootScope.organObject && $rootScope.organObject[0].businessGroups &&  $rootScope.organObject[0].businessGroups.length > 0
                && $rootScope.organObject[0].businessGroups[0].projects && $rootScope.organObject[0].businessGroups[0].projects.length >0) {
                $scope.IMGNewEnt={
                    org:$rootScope.organObject[0],
                    buss:$rootScope.organObject[0].businessGroups[0],
                    proj:$rootScope.organObject[0].businessGroups[0].projects[0],
                    env:$rootScope.organObject[0].businessGroups[0].projects[0].environments[0],
                    blueprintType:items.subType
                };
            }

            $scope.getInstanceList = function() {
                botsCreateService.getCurrentOrgInstances($scope.IMGNewEnt.org.orgid).then(function(response){
                    $scope.originalInstanceList=[];
                    if(response){
                        angular.forEach(response, function(value) {
                            if($scope.selectedInstanceIds.indexOf(value._id) === -1) {
                                $scope.originalInstanceList.push(value);
                            }
                        });
                    }
                });
            };

            $scope.getBlueprintList = function() {
                botsCreateService.getBlueprintList($scope.IMGNewEnt.org.orgid,$scope.IMGNewEnt.blueprintType).then(function(response){
                    $scope.originalBlueprintList=[];
                    if(response){
                        angular.forEach(response, function(value) {
                            if($scope.selectedBlueprintIds.indexOf(value._id) === -1) {
                                $scope.originalBlueprintList.push(value);
                            }
                        });
                    }
                });
            };

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
                        genSevs.showLogsForBots(response);
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
                if(type === 'instance') {
                    if($scope.botType === 'script') {
                        reqBody.data = $scope.botEditParams;
                        if($scope.botCheck === true) {
                            reqBody.nodeIds = $scope.selectedInstanceIds;
                        }
                    } else if($scope.botType === 'chef') {
                        if($scope.selectedInstanceIds.length>0) {
                            reqBody.nodeIds = $scope.selectedInstanceIds;
                        } else {
                            return false;
                        }
                    }
                    $scope.botExecuteMethod(items.id,reqBody);
                } else if (type === 'blueprints') {
                    reqBody.blueprintIds = $scope.selectedBlueprintIds;
                    botsCreateService.getBlueprintDetails($scope.selectedBlueprintIds[0]).then(function(response){
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

            $scope.init = function() {
                if($scope.botType === 'chef') {
                    $scope.getInstanceList();
                } else if($scope.botType === 'blueprints') {
                    $scope.getBlueprintList();
                }
            };
            $scope.init();
        }]);
})(angular);
