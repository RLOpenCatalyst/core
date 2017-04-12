/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('newBotCtrl',['$scope', '$rootScope', '$state', '$timeout', 'genericServices', 'botsCreateService', 'responseFormatter', 'toastr','$http','$modal',
        function($scope, $rootScope, $state, $timeout, genericServices, botsCreateService, responseFormatter, toastr,$http,$modal){
            var treeNames = ['BOTs','BOTs Create'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var botsData = {};
            $scope.botType = 'chef';
            $scope.botSubTypeValue = 'Task';
            $scope.chefrunlist = [];
            $scope.cookbookAttributes = [];
            $scope.botCategory = 'User Management';

            $rootScope.$on('WZ_ORCHESTRATION_REFRESH_CURRENT', function(event,reqParams) {
                $scope.chefrunlist = reqParams.list;
                $scope.cookbookAttributes = reqParams.cbAttributes;
            });

            if($rootScope.organObject && $rootScope.organObject.length > 0) {
                $scope.orgNewEnt = {
                    org:$rootScope.organObject[0]
                };
            }

            angular.extend($scope, {    
                botTypes: {
                    'chef':{name:'Chef'},
                    'blueprint':{name:'Blueprint'},
                    'script':{name:'Script'}
                },
                updateCookbook : function() {
                    genericServices.editRunlist($scope.chefrunlist,$scope.cookbookAttributes);
                },
                changeNodeScriptList: function() {
                    if($scope.scriptTypeSelelct !==""){
                        botsCreateService.getScriptList($scope.scriptTypeSelelct).then(function (response) {
                            var data;
                            if (response.data) {
                                data = response.data;
                            } else {
                                data = response;
                            }
                            $scope.scriptSelectAll = true;
                            $scope.scriptTaskList = responseFormatter.identifyAvailableScript(data,[]);
                            $scope.isScriptInstanceLoading = false;
                        });
                    }
                },
                addScriptParams: function (scriptObject) {
                    $modal.open({
                        templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/addScriptParams.html',
                        controller: 'addScriptParamsCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function () {
                                return scriptObject;
                            }
                        }
                    }).result.then(function (addScriptParams) {
                        $scope.scriptParamsObj[scriptObject._id] = $scope.scriptParamsObj[scriptObject._id].concat(addScriptParams);
                    }, function () {
                        console.log('Dismiss time is ' + new Date());
                    });
                },
                showScriptParams : function(scriptObj){
                    $scope.scriptParamShow = true;
                    $scope.selectedScript = scriptObj;
                    if(!$scope.scriptParamsObj[scriptObj._id]){
                        $scope.scriptParamsObj[scriptObj._id] = [];
                    }
                },
                postCreateBots : function() {
                    botsData = {
                        //name: $scope.botName,
                        //desc: $scope.botDesc,
                        standardTime: $scope.manualExecutionTime,
                        type: $scope.botType,
                        subType: $scope.botSubTypeValue,
                        category: $scope.botCategory,
                        orgId:$scope.orgNewEnt.org.orgid,
                        orgName:$scope.orgNewEnt.org.name
                    };
                    var reqbody = {
                        bots: botsData
                    };
                    if($scope.botType === 'chef') {
                        botsData.runlist=[];
                        botsData.attributes = [];
                        if($scope.chefrunlist){
                            botsData.runlist = responseFormatter.formatSelectedChefRunList($scope.chefrunlist);    
                            botsData.attributes = responseFormatter.formatSelectedCookbookAttributes($scope.cookbookAttributes);
                        }
                    }
                    if($scope.yamlfile){//will be true if a file chosen by user 
                        var formData = new FormData();
                        formData.append('file',  $scope.yamlfile);
                        $http.post('/fileUpload', formData, { transformRequest: angular.identity,headers: {'Content-Type': undefined}}).then(function (response) {
                            if(response) {
                                botsData.fileId = response.data.fileId;
                                botsCreateService.postCreateBots(reqbody).then(function(){
                                    toastr.success('BOT created successfully');
                                    $state.go('dashboard.bots.library');
                                });
                            }
                        });
                    }
                }
            });
        }
    ]);
})(angular);