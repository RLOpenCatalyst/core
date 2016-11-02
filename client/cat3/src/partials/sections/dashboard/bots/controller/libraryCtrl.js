/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots', ['library.params'])
        .controller('libraryCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'workzoneServices', 'toastr', 'workzoneUIUtils', function ($scope, $rootScope, $state, genSevs, confirmbox, workzoneServices, toastr, workzoneUIUtils) {
            var treeNames = ['Bots','Library'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var lib=this;
            lib.gridOptions={
                gridOption:{
                    paginationPageSizes: [10, 25, 50, 75],
                    paginationPageSize: 10,
                    enableColumnMenus:false,
                    multiSelect :false,
                },
                columnDefs: [
                    { name:'Icon', width:100,field:'botType' ,cellTemplate:'<img src="images/devops-roles/devopsRole3.png" ng-show="row.entity.botType==\'Task\'" alt="row.entity.botType" class="task-type-img" />'+
                        '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.botType==\'Check\'" alt="row.entity.botType" class="task-type-img" />'
                        ,cellTooltip: true},
                    { name: 'bot Type',field:'botType'},
                    { name: 'bot Name',field:'name'},
                    { name: 'description',field:'shortDesc'},
                    { name: 'bot History',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="History" ng-click="grid.appScope.botLogs(row.entity);"><i class="fa fa-header white"></i></span>'},
                    { name: 'bot Action',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>' +
                        '<span class="btn btn-danger control-panel-button" title="Delete" ng-click="grid.appScope.deleteBot(row.entity);"><i class="fa fa-trash-o white"></i></span>'}
                ],
                data:[]
            };
            var gridBottomSpace = 40;
            $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
            //$scope.cookbookAttributes = responseFormatter.formatSavedCookbookAttributes(taskConfig.attributes);
            $scope.launchInstance = function(launch){
                if(launch.launcType === 'task'){
                    genSevs.executeTask(launch);
                } else if(launch.launcType === 'bp') {
                    genSevs.lunchBlueprint(launch);
                }
            };
            $scope.botLogs = function(bot){
                genSevs.botHistory(bot);
            };
            $scope.deleteBot = function(bot) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    actionButtonStyle: 'cat-btn-delete',
                    headerText: 'Delete Bot',
                    bodyText: 'Are you sure you want to delete this bot?'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    workzoneServices.deleteBot(bot._id).then(function(response) {
                        if (response.data.deleteCount.ok) {
                            toastr.success('Successfully deleted');
                            $scope.removeTask();
                        }
                    }, function(data) {
                        toastr.error('error:: ' + data.toString());
                    });
                });
            };
            $scope.removeTask = function() {
                /*need to set the totalItems(less) when there is only 1 task available. Need to repaint
                the grid on delete.*/
                $scope.gridOptions.totalItems = $scope.gridOptions.totalItems -1;
                $timeout(function() {
                    //$scope.taskListGridView();
                },100);
            }
            lib.init =function(){
                lib.gridOptions.data=[];
                var param={
                    url:'/blueprints/serviceDelivery/?serviceDeliveryCheck=true'
                    //url:'src/partials/sections/dashboard/bots/data/bp.json'
                };
                genSevs.promiseGet(param).then(function (result) {
                    angular.forEach(result,function (val) {
                        angular.extend(val,{launcType:'bp'});
                        lib.gridOptions.data.push(val);
                    });
                });
                var param2={
                   url:'/tasks/serviceDelivery/?serviceDeliveryCheck=true'
                   // url:'src/partials/sections/dashboard/bots/data/t.json'
                };
                genSevs.promiseGet(param2).then(function (resultTask) {
                    angular.forEach(resultTask,function (val) {
                        angular.extend(val,{launcType:'task'});
                        lib.gridOptions.data.push(val);
                    });
                });
            };
            lib.init();
        }]);
})(angular);