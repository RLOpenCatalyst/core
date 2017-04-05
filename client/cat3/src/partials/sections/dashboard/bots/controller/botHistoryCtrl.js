/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jan 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botHistoryCtrl',['$scope', '$rootScope', '$modal', '$timeout', 'uiGridOptionsService', 'genericServices', 'toastr',
        function($scope, $rootScope, $modal, $timeout, uiGridOptionsService, genSevs, toastr){
            
            var items;
            $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });

            $rootScope.$on('BOTS_DESCRIPTION_REFRESH', function(event,reqParams) {
                $scope.templateSelected = reqParams;
                $scope.taskHistoryListView();
                $scope.getExecutionTime();
                $scope.getSavedTime();
            });

            if($scope.templateSelected) {
                items = $scope.templateSelected; 
            } 

            $scope.botDetail = items;
            $scope.botId = items._id
            
            var botHistoryGrid = uiGridOptionsService.options();
            $scope.paginationParams = botHistoryGrid.pagination;
            $scope.paginationParams=[];
            $scope.paginationParams.page = 1;
            $scope.paginationParams.pageSize = 10;
            $scope.paginationParams.sortBy = 'startedOn';
            $scope.paginationParams.sortOrder = 'desc';
            $scope.taskHistoryData = {};

            /*APIs registered are triggered as ui-grid is configured 
            for server side(external) pagination.*/
            $scope.taskHistoryData = angular.extend(botHistoryGrid.gridOption, {
                onRegisterApi :function(gridApi) {
                    $scope.gridApi = gridApi;
                    //Sorting for sortBy and sortOrder
                    gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                        if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                            $scope.paginationParams.sortBy = sortColumns[0].field;
                            $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                            $scope.taskHistoryListView();
                        }
                    });
                    //Pagination for page and pageSize
                    gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                        $scope.paginationParams.page = newPage;
                        $scope.paginationParams.pageSize = pageSize;
                        $scope.taskHistoryListView();
                    });
                }
            });

            $scope.setFirstPageView = function(){
                $scope.taskHistoryData.paginationCurrentPage = $scope.paginationParams.page = 1;
            };
            $scope.setPaginationDefaults = function() {
                $scope.paginationParams.sortBy = 'startedOn';
                $scope.paginationParams.sortOrder = 'desc';
                if($scope.paginationParams.page !== 1){
                    $scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
                }
            };
            $scope.setPaginationDefaults();

            angular.extend($scope, {
                taskHistoryListView : function() {
                    var param = null;
                    var url;
                    url = '/botsNew/' + $scope.botId + '/bots-history?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder;
                    
                    if($scope.botDetail.serviceNowCheck == true){
                        param = {
                            url: '/botsNew/' + $scope.botId + '/bots-history?serviceNowCheck=true&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                        };
                    }else{
                        param = {
                            url: url
                        };
                    }
                    $scope.taskHistoryData.data = [];
                    genSevs.promiseGet(param).then(function(response) {
                        $timeout(function() {
                            if (response.botHistory) {
                                $scope.taskHistoryData.data = response.botHistory;
                                var bpcolumnDefs = [];
                                angular.forEach($scope.taskHistoryData.data, function(val){
                                    var auditType = val.auditTrailConfig.executionType;
                                    if(auditType === 'chef' || auditType === 'script') {
                                        var chefGrid = [
                                            { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                                            { name:'User',field:'user',cellTooltip: true},
                                            { name:'Logs',width: 70,
                                                cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                                            { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                                            { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                                            { name:'Execution Time (Mins)',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} </span>'},
                                            { name:'Manual Time (Mins)',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} </span>', cellTooltip: true},
                                            { name:'Saved Time (Mins)',cellTemplate:'<span ng-if="row.entity.status == \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} </span>' +
                                            '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                                        ];
                                        bpcolumnDefs = chefGrid;
                                    } else if(auditType === 'jenkins') {
                                        var jenkinsGrid = [
                                            { name:'Job Number',field:'auditTrailConfig.jenkinsBuildNumber',cellTemplate:'<a target="_blank" title="Jenkins" ng-href="{{grid.appScope.botDetail.botConfig.jobURL}}/{{row.entity.auditTrailConfig.jenkinsBuildNumber}}">{{row.entity.auditTrailConfig.jenkinsBuildNumber}}</a>', sort:{ direction: 'desc'}, cellTooltip: true},
                                            { name:'Job Output',cellTemplate:'<span><a target="_blank" title="{{jobResultUrlName}}" class="fa fa-file-text bigger-120 btn cat-btn-update btn-sg tableactionbutton marginbottomright3" ng-repeat="jobResultUrlName in row.entity.auditTrailConfig.jobResultURL" ng-href="{{jobResultUrlName}}"></a></span>',cellTooltip: true},
                                            { name:'Log Info',width: 90,cellTemplate:'<span title="Jenkins Log" class="fa fa-list bigger-120 btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.historyLogs(row.entity);"></span>',cellTooltip: true},
                                            { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status.toUpperCase()}}">{{row.entity.status.toUpperCase()}}</div>'},
                                            { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                                            { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                                            { name:'Execution Time (Mins)',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} </span>'},
                                            { name:'Manual Time (Mins)',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} </span>', cellTooltip: true},
                                            { name:'Saved Time (Mins)',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} </span>' +
                                            '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                                        ];
                                        bpcolumnDefs = jenkinsGrid;
                                    } else if (auditType === 'instance_launch' || auditType === 'aws_cf' || auditType === 'docker' || auditType === 'azure_launch' || auditType === 'blueprints') {
                                        var blueprintGrid = [
                                            { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                                            { name:'User',field:'user',cellTooltip: true},
                                            { name:'Logs',width: 70,
                                                cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                                            { name:'Start Time',field:'startedOn',cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                                            { name:'End Time',field:'endedOn',cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                                            { name:'Execution Time (Mins)',cellTemplate:'<span ng-if="row.entity.endedOn">{{grid.appScope.getExecutionTime(row.entity.endedOn,row.entity.startedOn)}} </span>'},
                                            { name:'Manual Time (Mins)',cellTemplate: '<span>{{row.entity.auditTrailConfig.manualExecutionTime}} </span>', cellTooltip: true},
                                            { name:'Saved Time (Mins)',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.endedOn,row.entity.startedOn)}} </span>' +
                                            '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                                        ];
                                        bpcolumnDefs = blueprintGrid;
                                    }
                                });
                                $scope.taskHistoryData.columnDefs = bpcolumnDefs;
                                angular.extend($scope.taskHistoryData,botHistoryGrid.gridOption);
                                $scope.ischefTaskHistoryPageLoading = false;
                                $scope.taskHistoryData.totalItems = response.metaData.totalRecords;
                            } else if (response) {
                                $scope.taskHistoryData = response;
                                $scope.ischefTaskHistoryPageLoading = false;
                            }
                        }, 100);
                    }, function() {
                        $scope.errorMessage = "No Chef History Records found";
                        $scope.ischefTaskHistoryPageLoading = false;
                    });
                }
            });

            $scope.getExecutionTime = function(endTime, startTime) {
                $scope.executionTimeinMS = endTime - startTime;
                $scope.executionTime = $scope.executionTimeinMS / (60000);
                return +(Math.round($scope.executionTime + "e+1") + "e-1");
            };
            $scope.getSavedTime = function(endTime, startTime) {
                var executionTime = $scope.getExecutionTime(endTime, startTime);
                $scope.savedTime = items.manualExecutionTime - executionTime;
                return $scope.savedTime;
            };

            
            $scope.taskHistoryListView();
            $scope.getExecutionTime();
            $scope.getSavedTime();
            
            $scope.historyLogs=function(hist) {
                if(hist.actionLogId){
                    var logDetails = {
                        actionId : hist.actionLogId,
                        botId: hist.auditId
                    }
                    $modal.open({
                        animate: true,
                        templateUrl: "src/partials/sections/dashboard/bots/view/botExecutionLogs.html",
                        controller: "botsExecutionLogsNewCtrl",
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return {
                                    logDetails : logDetails,
                                    isBotNew : items.isBotsNew
                                }
                            }
                        }
                    }).result.then(function() {
                        console.log('The modal close is not getting invoked currently. Goes to cancel handler');
                    }, function() {
                        console.log('Cancel Handler getting invoked');
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