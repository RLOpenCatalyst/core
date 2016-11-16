/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots')
    .controller('audittrailCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'workzoneServices', 'toastr', 'workzoneUIUtils', '$modal', 
    function ($scope, $rootScope, $state, genSevs, confirmbox, workzoneServices, toastr, workzoneUIUtils, $modal) {
        //var treeNames = ['Bots','Library'];
        //$rootScope.$emit('treeNameUpdate', treeNames);
        var audit=this;
        audit.gridOptions={
            gridOption:{
                paginationPageSizes: [10, 25, 50, 75],
                paginationPageSize: 10,
                enableColumnMenus:false,
                multiSelect :false,
            },
            columnDefs: [
                { name: 'Start Time',field:'startedOn'},
                { name: 'End Time',field:'endedOn'},
                { name: 'bot Type',field:'botType'},
                { name: 'bot Name',field:'name'},
                { name: 'Status',field:'Status'},
                { name: 'Org',field:'orgName'},
                { name: 'BU',field:'bgName'},
                { name: 'Project',field:'ProjectName'},
                { name: 'Env',field:'envName'},
                { name: 'User',field:'user'},
                { name: 'Logs',cellTemplate: '<span class="btn cat-btn-update control-panel-button" title="Logs" ng-show="row.entity.taskType" ng-click="grid.appScope.botAuditTrailLogs(row.entity);"><i class="fa fa-info white"></i></span>'},
                /*{ name:'Task Type', width:100,field:'taskType' ,cellTemplate:'<img src="images/orchestration/chef.png" ng-show="row.entity.taskType==\'chef\'" alt="row.entity.taskType" title="Chef" class="task-type-img" />'+
                    '<img src="images/orchestration/jenkins.png" ng-show="row.entity.taskType==\'jenkins\'" alt="row.entity.taskType" title="Jenkins" class="task-type-img" />'+
                    '<img src="images/orchestration/script.jpg" ng-show="row.entity.taskType==\'script\'" alt="row.entity.taskType" title="Script" class="task-type-img" />'+
                    '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.blueprintType" alt="row.entity.botType" title="Blueprint" class="task-type-img" />'
                    ,cellTooltip: true},
                { name: 'Category',field:'botCategory'},
                { name: 'description',field:'shortDesc'},
                { name: 'bot History',cellTemplate:'<span ng-show="row.entity.blueprintType">NA</span>'+
                        '<span class="btn cat-btn-update control-panel-button" title="History" ng-show="row.entity.taskType" ng-click="grid.appScope.botLogs(row.entity);"><i class="fa fa-header white"></i></span>'},
                { name: 'bot Action',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>' +
                    '<span class="btn btn-danger control-panel-button" title="Delete Task" ng-show="row.entity.taskType" ng-click="grid.appScope.deleteBotTask(row.entity);"><i class="fa fa-trash-o white"></i></span>' + 
                    '<span class="btn btn-danger control-panel-button" title="Delete Blueprint" ng-show="row.entity.blueprintType" ng-click="grid.appScope.deleteBotBP(row.entity);"><i class="fa fa-trash-o white"></i></span>'
                }*/
            ],
            data:[]
        };
        var gridBottomSpace = 40;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
        
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
                            taskId : hist.taskId,
                            historyId : hist._id,
                            taskType:hist.taskType
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

        $rootScope.$on('BOTS_LIBRARY_REFRESH', function() {
            audit.init();
        });
        audit.init =function(){
            audit.gridOptions.data=[];
            var param={
                url:'/blueprints/serviceDelivery/?serviceDeliveryCheck=true'
                //url:'src/partials/sections/dashboard/bots/data/bp.json'
            };
            genSevs.promiseGet(param).then(function (result) {
                angular.forEach(result,function (val) {
                    angular.extend(val,{launcType:'bp'});
                    audit.gridOptions.data.push(val);
                });
            });
            var param2={
                //url:'/tasks/serviceDelivery/?serviceDeliveryCheck=true'
                url:'src/partials/sections/dashboard/bots/data/bots_audit-trail.json'
            };
            genSevs.promiseGet(param2).then(function (resultTask) {
                console.log(resultTask);
                angular.forEach(resultTask,function (val) {
                    angular.extend(val,{launcType:'task'});
                    audit.gridOptions.data.push(val);
                });
            });
        };
        audit.init();
    }]);
})(angular);