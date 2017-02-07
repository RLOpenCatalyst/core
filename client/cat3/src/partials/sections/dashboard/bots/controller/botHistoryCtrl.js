/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jan 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botHistoryCtrl',['$scope', '$rootScope', '$modal', '$timeout', 'uiGridOptionsClient', 'genericServices',
        function($scope, $rootScope, $modal, $timeout, uiGridOptionsClient, genSevs){
            
            var items;

            $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });

            if($scope.templateSelected) {
                items = $scope.templateSelected;
            } 
        
            $scope.botHistory = items;
            $scope.botId = items.botId;
            $scope.taskHistoryChefData = [];
            $scope.taskHistoryJenkinsData = [];
            $scope.taskHistoryBlueprintData = [];
            $scope.paginationParams = [];
            var gridOptionsChef = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryChefGridOptions = gridOptionsChef;

            $scope.initChefGrids = function(){
                $scope.taskHistoryChefGridOptions.data='taskHistoryChefData';
                $scope.taskHistoryChefGridOptions.columnDefs = [
                    { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                    { name:'User',field:'user',cellTooltip: true},
                    { name:'Logs',width: 70,
                        cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                    { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                    { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                    { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>'},
                    { name:'Manual Time',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} mins</span>', cellTooltip: true},
                    { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status == \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryChefListView: function() {
                    $scope.taskHistoryChefData = [];
                    var param={
                        url:'/bots/' + $scope.botId + '/bots-history'
                    };
                    genSevs.promiseGet(param).then(function (response) {
                        $timeout(function() {
                            if(response.botHistory){
                                $scope.taskHistoryChefData = response.botHistory;
                                $scope.ischefTaskHistoryPageLoading = false;
                            }else if(response){
                                $scope.taskHistoryChefData = response;
                                $scope.ischefTaskHistoryPageLoading = false;
                            }
                        },100);
                    }, function(){
                        $scope.errorMessage = "No Chef History Records found";
                        $scope.ischefTaskHistoryPageLoading = false;
                    });
                },
                getExecutionTime: function(endTime, startTime) {
                    $scope.executionTimeinMS = endTime-startTime;
                    $scope.executionTime = $scope.executionTimeinMS/(60000);
                    return +(Math.round($scope.executionTime + "e+1")  + "e-1");
                },
                getSavedTime: function(endTime, startTime) {
                    var executionTime = $scope.getExecutionTime(endTime, startTime);
                    $scope.savedTime = items.manualExecutionTime-executionTime;
                    return $scope.savedTime;
                }
            });
            $scope.initchef = function(){
                $scope.initChefGrids();
                $scope.taskHistoryChefListView();
                $scope.getExecutionTime();
                $scope.getSavedTime();
            };
            //UI Grid for chef Task ends

            //UI Grid for jenkins Task starts
            $scope.taskHistoryJenkinsData = [];
            var gridOptionsJenkins = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryJenkinsGridOptions = gridOptionsJenkins;

            $scope.initJenkinsGrids = function(){
                $scope.taskHistoryJenkinsGridOptions.data='taskHistoryJenkinsData';
                $scope.taskHistoryJenkinsGridOptions.columnDefs = [
                    { name:'Job Number',field:'auditTrailConfig.jenkinsBuildNumber',cellTemplate:'<a target="_blank" title="Jenkins" ng-href="{{grid.appScope.bot.botConfig.jobURL}}/{{row.entity.auditTrailConfig.jenkinsBuildNumber}}">{{row.entity.auditTrailConfig.jenkinsBuildNumber}}</a>', sort:{ direction: 'desc'}, cellTooltip: true},
                    { name:'Job Output',cellTemplate:'<span><a target="_blank" title="{{jobResultUrlName}}" class="fa fa-file-text bigger-120 btn cat-btn-update btn-sg tableactionbutton marginbottomright3" ng-repeat="jobResultUrlName in row.entity.auditTrailConfig.jobResultURL" ng-href="{{jobResultUrlName}}"></a></span>',cellTooltip: true},
                    { name:'Log Info',width: 90,cellTemplate:'<span title="Jenkins Log" class="fa fa-list bigger-120 btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.historyLogs(row.entity);"></span>',cellTooltip: true},
                    { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status.toUpperCase()}}">{{row.entity.status.toUpperCase()}}</div>'},
                    { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                    { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                    { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>'},
                    { name:'Manual Time',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} mins</span>', cellTooltip: true},
                    { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryJenkinsListView: function() {
                    $scope.taskHistoryJenkinsData = [];
                    var param={
                        url:'/bots/' + $scope.botId + '/bots-history'
                    };
                    genSevs.promiseGet(param).then(function (response) {
                        $timeout(function() {
                            if(response.botHistory){
                                $scope.taskHistoryJenkinsData = response.botHistory;
                                $scope.isjenkinsTaskHistoryPageLoading = false;
                            }else if(response){
                                $scope.taskHistoryJenkinsData = response;
                                console.log($scope.taskHistoryJenkinsData);
                                $scope.isjenkinsTaskHistoryPageLoading = false;
                            }
                        },100);
                    }, function(){
                        $scope.errorMessage = "No Jenkins History Records found";
                        $scope.isjenkinsTaskHistoryPageLoading = false;
                    });
                },
            });
            $scope.initjenkins = function(){
                $scope.initJenkinsGrids();
                $scope.taskHistoryJenkinsListView();
                $scope.getExecutionTime();
                $scope.getSavedTime();
            };
            //UI Grid for jenkins Task ends

            //UI Grid for script Task starts
            $scope.taskHistoryScriptData = [];
            var gridOptionsScript = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryScriptGridOptions = gridOptionsScript;

            $scope.initScriptGrids = function(){
                $scope.taskHistoryScriptGridOptions.data='taskHistoryScriptData';
                $scope.taskHistoryScriptGridOptions.columnDefs = [
                    { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                    { name:'User',field:'user',cellTooltip: true},
                    { name:'Logs',width: 70,
                        cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                    { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                    { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                    { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>'},
                    { name:'Manual Time',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} mins</span>', cellTooltip: true},
                    { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryScriptListView: function() {
                    $scope.taskHistoryScriptData = [];
                    var param={
                        url:'/bots/' + $scope.botId + '/bots-history'
                    };
                    genSevs.promiseGet(param).then(function (response) {
                        $timeout(function() {
                            if(response.botHistory){
                                $scope.taskHistoryScriptData = response.botHistory;
                                $scope.isscriptTaskHistoryPageLoading = false;
                            }else if(response){
                                $scope.taskHistoryScriptData = response;
                                $scope.isscriptTaskHistoryPageLoading = false;
                            }
                        },100);
                    }, function(){
                        $scope.errorMessage = "No Script History Records found";
                        $scope.isscriptTaskHistoryPageLoading = false;
                    });
                },
            });
            $scope.initscript = function(){
                $scope.initScriptGrids();
                $scope.taskHistoryScriptListView();
                $scope.getExecutionTime();
                $scope.getSavedTime();
            };
            //UI Grid for script Task ends

            //UI Grid for Blueprint starts
            $scope.botHistoryBlueprintData = [];
            var gridOptionsScript = uiGridOptionsClient.options().gridOption;
            $scope.botHistoryBlueprintGridOptions = gridOptionsScript;

            $scope.initBlueprintGrids = function(){
                $scope.botHistoryBlueprintGridOptions.data='botHistoryBlueprintData';
                $scope.botHistoryBlueprintGridOptions.columnDefs = [
                    { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                    { name:'User',field:'user',cellTooltip: true},
                    { name:'Logs',width: 70,
                        cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                    { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                    { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                    { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>'},
                    { name:'Manual Time',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} mins</span>', cellTooltip: true},
                    { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                botHistoryBlueprintListView: function() {
                    $scope.botHistoryBlueprintData = [];
                    var param={
                        url:'/bots/' + $scope.botId + '/bots-history'
                    };
                    genSevs.promiseGet(param).then(function (response) {
                        $timeout(function() {
                            if(response.botHistory){
                                $scope.botHistoryBlueprintData = response.botHistory;
                                $scope.isBlueprintBotHistoryPageLoading = false;
                            }else if(response){
                                $scope.botHistoryBlueprintData = response;
                                $scope.isBlueprintBotHistoryPageLoading = false;
                            }
                        },100);
                    }, function(){
                        $scope.errorMessage = "No Script History Records found";
                        $scope.isBlueprintBotHistoryPageLoading = false;
                    });
                },
            });
            $scope.initblueprint = function(){
                $scope.initBlueprintGrids();
                $scope.botHistoryBlueprintListView();
                $scope.getExecutionTime();
                $scope.getSavedTime();
            };
            //UI Grid for Blueprint ends

            $scope.bot=items;
            switch ($scope.bot.botLinkedSubCategory){
                case 'chef' :
                    $scope.ischefTaskHistoryPageLoading = true;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initchef();
                    break;
                case 'jenkins' :
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = true;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initjenkins();
                    break;
                case 'script':
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = true;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initscript();
                    break;
                case 'instance_launch':
                case 'aws_cf':
                case 'docker':
                case 'azure_launch':
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = true;
                    $scope.initblueprint();
                    break;
            }

            $scope.historyLogs=function(hist) {
                if(hist.auditHistoryId || (hist.auditTrailConfig.nodeIdsWithActionLog[0] && hist.auditTrailConfig.nodeIdsWithActionLog[0].actionLogId)) {
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/bots/view/botExecutionLogs.html',
                        controller: 'botExecutionLogsCtrl as botExecLogCtrl',
                        backdrop : 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return {
                                    taskId : hist.auditId,
                                    historyId : hist.auditHistoryId ? hist.auditHistoryId : hist.auditTrailConfig.nodeIdsWithActionLog[0] && hist.auditTrailConfig.nodeIdsWithActionLog[0].actionLogId,
                                    taskType:hist.auditTrailConfig.executionType
                                };
                            }
                        }
                    });
                    modalInstance.result.then(function(selectedItem) {
                        $scope.selected = selectedItem;
                    }, function() {
                        console.log('Modal Dismissed at ' + new Date());
                    });
                } else {
                    toastr.error("Logs are getting generated. Please wait");
                }
            }

            $scope.cancel= function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ]);
})(angular);