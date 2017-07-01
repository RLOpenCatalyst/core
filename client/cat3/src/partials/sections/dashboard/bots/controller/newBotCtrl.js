/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('newBotCtrl',['$scope', '$rootScope', '$state', '$timeout', 'genericServices', 'botsCreateService', 'responseFormatter', 'toastr','$modal',
        function($scope, $rootScope, $state, $timeout, genericServices, botsCreateService, responseFormatter, toastr,$modal){
            var treeNames = ['BOTs','BOTs Create'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var botsData = {};
            $scope.botType = 'chef';
            $scope.botActionType = 'Task';
            $scope.chefrunlist = [];
            $scope.cookbookAttributes = [];
            $scope.jenkinsParamsList = [];
            $scope.botCategory = 'User Management';
            $scope.blueprintType = 'chef';
            $scope.jenkinsServer = {};
            $scope.scriptType = '';
            $scope.scriptParamsObj = {};
            $scope.scriptParamShow = false;
            $scope.isParameterized = {
                flag: false
            };
            //for obtaining the runlist and attributes
            $rootScope.$on('WZ_ORCHESTRATION_REFRESH_CURRENT', function(event,reqParams) {
                $scope.chefrunlist = reqParams.list;
                $scope.cookbookAttributes = reqParams.cbAttributes;
            });
            //for getting the org id and name
            if($rootScope.organObject && $rootScope.organObject.length > 0) {
                $scope.orgNewEnt = {
                    org:$rootScope.organObject[0]
                };
            }
            // for obtaining the jenkins parameters
            $rootScope.$on('JENKINS_PARAMETER', function(event,reqParams) {
                if(reqParams) {
                    $scope.jenkinsParamsList.push(reqParams);
                }
            });

            //for obtaining the script parameters 
            $rootScope.$on('SCRIPT_PARAMETER', function(event,reqParams) {
                if(reqParams && $scope.scriptObject) {
                    $scope.scriptParamsObj[$scope.scriptObject.scriptId] = $scope.scriptParamsObj[$scope.scriptObject.scriptId].concat(reqParams);
                }
            });

            angular.extend($scope, {    
                botTypes: {
                    'chef':{name:'Chef'},
                    'blueprint':{name:'Blueprint'},
                    'script':{name:'Script'},
                    'jenkins':{name:'Jenkins'},
                    'meta':{name:'Meta'}
                },
                updateCookbook : function() {
                    genericServices.editRunlist($scope.chefrunlist,$scope.cookbookAttributes);
                },
                getJenkinsList : function() {
                    botsCreateService.getJenkinsServerDetails().then(function(response){
                        var data;
                        if (response.data) {
                            data = response.data;
                        } else {
                            data = response;
                        }
                        $scope.jenkinsServerList = responseFormatter.formatJenkinsServerList(data);
                    });
                },
                getJenkinsJobList: function () {
                    if ($scope.jenkinsServer) {
                        $scope.isJenkinsJobLoading = true;
                        botsCreateService.getJenkinsServerJobList($scope.jenkinsServer.id).then(function (response) {
                            if (response.data) {
                                $scope.jenkinServerJobList = response.data;
                            } else {
                                $scope.jenkinServerJobList = response;
                            }
                            $scope.isJenkinsJobLoading = false;
                        });
                    }
                },
                changeJenkinsJob: function () {
                    if($scope.jenkinsServer.id && $scope.jenkinsJobSelected){
                        $scope.isJenkinsJobURLLoading = true;
                        botsCreateService.getJenkinsJobDetails($scope.jenkinsServer.id, $scope.jenkinsJobSelected).then(function (response) {
                            var data;
                            if (response.data) {
                                data = response.data;
                            } else {
                                data = response;
                            }
                            $scope.jobURL = data.url;
                            $scope.isJenkinsJobURLLoading = false;
                        });
                    }
                },
                checkForBotType : function() {
                    if($scope.botType === 'jenkins') {
                        $scope.getJenkinsList();
                    } else if ($scope.botType === 'blueprint') {
                        $scope.getBlueprintList();
                    }
                },
                changeNodeScriptList: function() {
                    if($scope.scriptType !==""){
                        botsCreateService.getScriptList($scope.scriptType).then(function (response) {
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
                addJenkinsParameters: function () {
                    genericServices.addJenkinsParameters();
                },
                removeJenkinsParameters: function (params) {
                    var idx = $scope.jenkinsParamsList.indexOf(params);
                    $scope.jenkinsParamsList.splice(idx,1);
                },
                addScriptParameters: function (scriptObject) {
                    genericServices.addScriptParameters(scriptObject);
                    $scope.scriptObject = scriptObject;
                },
                addRemoveScriptTable : function(scriptObj){
                    $scope.scriptParamShow = false;
                    $scope.checkedScript = scriptObj;
                    if(!$scope.checkedScript._isScriptSelected){
                        $scope.scriptParamsObj[scriptObj.scriptId] = [];
                    }
                },
                showScriptParams : function(scriptObj){
                    $scope.scriptParamShow = true;
                    $scope.selectedScript = scriptObj;
                    if(!$scope.scriptParamsObj[scriptObj.scriptId]){
                        $scope.scriptParamsObj[scriptObj.scriptId] = [];
                    }
                },
                removeScriptParams: function (scriptObject,params) {
                    var idx = $scope.scriptParamsObj[scriptObject].indexOf(params);
                    $scope.scriptParamsObj[scriptObject].splice(idx,1);
                },
                getBlueprintList: function () {
                    botsCreateService.getBlueprintList($scope.orgNewEnt.org.orgid,$scope.blueprintType,null).then(function (response) {
                        if(response.blueprints) {
                            $scope.blueprintList = response.blueprints;
                            $scope.blueprintDetails = $scope.blueprintList[0];
                        }
                    });
                },
                postCreateBots : function() {
                    botsData = {
                        name: $scope.botName,
                        desc: $scope.botDesc,
                        standardTime: $scope.manualExecutionTime,
                        type: $scope.botType,
                        action: $scope.botActionType,
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
                    } else if($scope.botType === 'jenkins') {
                        botsData.jenkinsServerId = $scope.jenkinsServer.id;
                        botsData.jenkinsServerName = $scope.jenkinsServer.name
                        botsData.jobName = $scope.jenkinsJobSelected;
                        botsData.isParameterized = $scope.isParameterized.flag;
                        botsData.parameterized = $scope.jenkinsParamsList;
                        botsData.autoSyncFlag = true;
                        botsData.jobURL = $scope.jobURL;
                    } else if($scope.botType === 'blueprint') {
                        botsData.blueprintType = $scope.blueprintType;
                        botsData.blueprintId = $scope.blueprintDetails._id;
                        botsData.blueprintName = $scope.blueprintDetails.name;
                    } else if($scope.botType === 'script') {
                        botsData.scriptDetails = [];
                        botsData.scriptTypeName = $scope.scriptType;
                        for (var k = 0; k < $scope.scriptTaskList.length; k++) {
                            if ($scope.scriptTaskList[k]._isScriptSelected) {
                                var scriptId = $scope.scriptTaskList[k].scriptId;
                                var obj = {
                                    scriptId: scriptId,
                                    scriptParameters:[]
                                };
                                if($scope.scriptParamsObj[scriptId]){
                                    obj.scriptParameters = $scope.scriptParamsObj[scriptId];
                                }
                                botsData.scriptDetails.push(obj);
                            }
                        }
                    } else if($scope.botType === 'meta') {
                        if($scope.zipfile) {
                        }
                    }
                    botsCreateService.postCreateBots(reqbody).then(function(){
                        toastr.success('BOT created successfully');
                        $state.go('dashboard.bots.library');
                    });
                }
            });
        }
    ]);
})(angular);