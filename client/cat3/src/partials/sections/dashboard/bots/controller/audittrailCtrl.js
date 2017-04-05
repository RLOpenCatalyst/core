/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('audittrailCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'workzoneServices', 'toastr', 'workzoneUIUtils', '$modal', 'uiGridOptionsService', '$timeout',
    function ($scope, $rootScope, $state, genSevs, confirmbox, workzoneServices, toastr, workzoneUIUtils, $modal, uiGridOptionsService, $timeout) {
        var treeNames = ['BOTs','Audit Trail'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var botAuditTrailUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = botAuditTrailUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.paginationParams.page = 1;
        $scope.paginationParams.pageSize = 10;
        $scope.paginationParams.sortBy = 'startedOn';
        $scope.paginationParams.sortOrder = 'desc';
        $scope.initGrids = function(){
            $scope.botAuditTrailGridOptions={};
            $scope.botAuditTrailGridOptions.columnDefs = [
                { name: 'Start Time',field:'startedOn',
                    cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'End Time',field:'endedOn',
                    cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'BOT Type',displayName: 'BOT Type',field:'auditTrailConfig.type'},
               /* { name:'Task Type',field:'auditTrailConfig.executionType' ,cellTemplate:'<img src="images/orchestration/chef.png" ng-show="row.entity.auditTrailConfig.executionType==\'chef\'" alt="row.entity.taskType" title="Chef" class="task-type-img" />'+
                    '<img src="images/orchestration/jenkins.png" ng-show="row.entity.auditTrailConfig.executionType==\'jenkins\'" alt="row.entity.taskType" title="Jenkins" class="task-type-img" />'+
                    '<img src="images/orchestration/script.jpg" ng-show="row.entity.auditTrailConfig.executionType==\'script\'" alt="row.entity.auditTrailConfig.executionType" title="Script" class="task-type-img" />'+
                    '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.action==\'BOTs Blueprint Execution\'" alt="row.entity.botType" title="Blueprint" class="task-type-img" />',cellTooltip: true},
                */{ name: 'BOT Name',displayName: 'BOT Name',field:'auditTrailConfig.name',cellTooltip: true},
                { name: 'Status',field:'status',
                  cellTemplate:'<img class="bot-status-icon" src="images/instance-states/aws-started.png" ng-show="row.entity.status === \'success\'" title="{{row.entity.status}}">' +
                  '<img class="bot-status-icon" src="images/instance-states/aws-stopped.png" ng-show="row.entity.status === \'failed\'" title="{{row.entity.status}}">' + 
                  '<img class="bot-status-icon" src="images/instance-states/aws-inactive.png" ng-show="row.entity.status === \'running\'" title="{{row.entity.status}}">',
                  cellTooltip: true},
                /*{ name: 'Organization',field:'masterDetails.orgName'},
                { name: 'Business Group',field:'masterDetails.bgName'},
                { name: 'Project',field:'masterDetails.projectName'},
                { name: 'Environment',field:'masterDetails.envName'},*/
                { name: 'User',field:'user'},
                { name: 'Logs',cellTemplate: '<span class="btn cat-btn-update control-panel-button" title="Logs" ng-click="grid.appScope.botAuditTrailLogs(row.entity);"><i class="fa fa-info white"></i></span>'}
            ];
            $scope.botAuditTrailGridOptions.data=[];
            angular.extend($scope.botAuditTrailGridOptions,botAuditTrailUIGridDefaults.gridOption);
        };
        $scope.initGrids();

        var gridBottomSpace = 70;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botAuditTrailPage') - gridBottomSpace;
        
        //for server side(external) pagination.
        angular.extend($scope.botAuditTrailGridOptions,botAuditTrailUIGridDefaults.gridOption, {
            onRegisterApi :function(gridApi) {
                $scope.gridApi = gridApi;
                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                    if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                        $scope.paginationParams.sortBy = sortColumns[0].field;
                        $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                        $scope.botAuditTrailGridView();
                    }
                });
                //Pagination for page and pageSize
                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                    $scope.paginationParams.page = newPage;
                    $scope.paginationParams.pageSize = pageSize;
                    $scope.botAuditTrailGridView();
                });
            },
        });

        $scope.searchBotAuditTrailName = function() {
            $scope.searchString = $scope.botAuditTrailSearch;
            $scope.botAuditTrailGridOptions.data=[];
                var param={
                    url:'/audit-trail?filterBy=auditType:BOTsNew&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
            };
            genSevs.promiseGet(param).then(function (result) {
                console.log(result);
                $timeout(function() {
                    $scope.botAuditTrailGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botAuditTrailGridOptions.data=result.auditTrails;
                }, 100);
                $scope.isBotAuditTrailPageLoading = false;
            }, function(error) {
                $scope.isBotAuditTrailPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };

        $scope.botAuditTrailLogs=function(hist) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/bots/view/botLogs.html',
                controller: 'botLogsCtrl',
                backdrop : 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return hist;
                    }
                }
            });
            modalInstance.result.then(function(selectedItem) {
                $scope.selected = selectedItem;
            }, function() {
                console.log('Modal Dismissed at ' + new Date());
            });
        };

        $scope.RefreshBotsAuditTrail = function() {
            $scope.botAuditTrailGridView();
            $scope.botAuditTrailSearch = '';
        };

        $scope.botAuditTrailGridView =function(){
            $scope.isBotAuditTrailPageLoading = true;
            $scope.botAuditTrailGridOptions.data=[];
            var param={
                url:'/audit-trail?filterBy=auditType:BOTsNew&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (response) {
                $timeout(function() {
                    $scope.botAuditTrailGridOptions.data=response.auditTrails;
                    $scope.botAuditTrailGridOptions.totalItems = response.metaData.totalRecords;
                    $scope.isBotAuditTrailPageLoading = false;
                }, 100);
            }, function(error) {
                $scope.isBotAuditTrailPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };
        $scope.botAuditTrailGridView();
    }]);
})(angular);