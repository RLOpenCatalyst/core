/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('audittrailCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'workzoneServices', 'toastr', 'workzoneUIUtils', '$modal', 
    function ($scope, $rootScope, $state, genSevs, confirmbox, workzoneServices, toastr, workzoneUIUtils, $modal) {
        var treeNames = ['Bots','Audit Trail'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var audit=this;
        audit.gridOptions={
            gridOption:{
                paginationPageSizes: [10, 25, 50, 75],
                paginationPageSize: 10,
                enableColumnMenus:false,
                multiSelect :false,
            },
            columnDefs: [
                { name: 'Start Time',field:'startedOn',
                    cellTemplate:'<span title="{{row.entity.startedOn  | timestampToLocaleTime}}">{{row.entity.startedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'End Time',field:'endedOn',
                    cellTemplate:'<span title="{{row.entity.endedOn  | timestampToLocaleTime}}">{{row.entity.endedOn  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'BOT Type',displayName: 'BOT Type',field:'auditTrailConfig.type'},
                { name:'Task Type',field:'auditTrailConfig.executionType' ,cellTemplate:'<img src="images/orchestration/chef.png" ng-show="row.entity.auditTrailConfig.executionType==\'chef\'" alt="row.entity.taskType" title="Chef" class="task-type-img" />'+
                    '<img src="images/orchestration/jenkins.png" ng-show="row.entity.auditTrailConfig.executionType==\'jenkins\'" alt="row.entity.taskType" title="Jenkins" class="task-type-img" />'+
                    '<img src="images/orchestration/script.jpg" ng-show="row.entity.auditTrailConfig.executionType==\'script\'" alt="row.entity.auditTrailConfig.executionType" title="Script" class="task-type-img" />'+
                    '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.action==\'BOTs Blueprint Execution\'" alt="row.entity.botType" title="Blueprint" class="task-type-img" />',cellTooltip: true},
                { name: 'BOT Name',displayName: 'BOT Name',field:'auditTrailConfig.name'},
                { name: 'Status',field:'status',
                  cellTemplate:'<img class="bot-status-icon" src="images/instance-states/aws-started.png" ng-show="row.entity.status === \'success\'" title="{{row.entity.status}}">' +
                  '<img class="bot-status-icon" src="images/instance-states/aws-stopped.png" ng-show="row.entity.status === \'failed\'" title="{{row.entity.status}}">' + 
                  '<img class="bot-status-icon" src="images/instance-states/aws-inactive.png" ng-show="row.entity.status === \'running\'" title="{{row.entity.status}}">',
                  cellTooltip: true},
                { name: 'Org',field:'masterDetails.orgName'},
                { name: 'BU',field:'masterDetails.bgName'},
                { name: 'Project',field:'masterDetails.projectName'},
                { name: 'Env',field:'masterDetails.envName'},
                { name: 'User',field:'user'},
                { name: 'Logs',cellTemplate: '<span class="btn cat-btn-update control-panel-button" title="Logs" ng-click="grid.appScope.botAuditTrailLogs(row.entity);"><i class="fa fa-info white"></i></span>'}
            ],
            data:[]
        };
        var gridBottomSpace = 40;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botAuditTrailPage') - gridBottomSpace;
        
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
            audit.init();
        };

        audit.init =function(){
            audit.gridOptions.data=[];
            var param={
                url:'/audit-trail?filterBy=auditType:BOTs'
            };
            genSevs.promiseGet(param).then(function (response) {
                angular.forEach(response,function () {
                    audit.gridOptions.data=response.auditTrails;
                });
            });
        };
        audit.init();
    }]);
})(angular);