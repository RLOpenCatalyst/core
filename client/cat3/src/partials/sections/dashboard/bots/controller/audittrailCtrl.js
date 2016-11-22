/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots')
    .controller('audittrailCtrl',['$scope', '$rootScope', '$http', '$state', 'genericServices', 'confirmbox', 'workzoneServices', 'toastr', 'workzoneUIUtils', '$modal', 
    function ($scope, $rootScope, $http, $state, genSevs, confirmbox, workzoneServices, toastr, workzoneUIUtils, $modal) {
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
                { name: 'BOT Type',field:'auditTrailConfig.type'},
                { name: 'BOT Name',field:'auditTrailConfig.name'},
                { name: 'Status',field:'status'},
                { name: 'Org',field:'masterDetails.orgName'},
                { name: 'BU',field:'masterDetails.bgName'},
                { name: 'Project',field:'masterDetails.projectName'},
                { name: 'Env',field:'masterDetails.envName'},
                { name: 'User',field:'user'},
                { name: 'Logs',cellTemplate: '<span class="btn cat-btn-update control-panel-button" title="Logs" ng-click="grid.appScope.botAuditTrailLogs(row.entity);"><i class="fa fa-info white"></i></span>'}
            ],
            data:[]
        };
        var gridBottomSpace = 5;
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
                        return {
                            actionId: hist.actionLogId,
                            name: hist.auditTrailConfig.name,
                            nodeIdsWithActionLog: hist.auditTrailConfig.nodeIdsWithActionLog,
                            nodeIds: hist.auditTrailConfig.nodeIds,
                            taskType: hist.auditTrailConfig.executionType
                        };
                    }
                }
            });
            modalInstance.result.then(function(selectedItem) {
                $scope.selected = selectedItem;
            }, function() {
                console.log('Modal Dismissed at ' + new Date());
            });
        };

        audit.init =function(){
            audit.gridOptions.data=[];
            var url = '/audit-trail?filterBy=auditType:BOTs';
            $http.get(url).then(function (data) {
                angular.forEach(data,function () {
                    audit.gridOptions.data=data.data.auditTrails;
                });
            });
        };
        audit.init();
    }]);
})(angular);