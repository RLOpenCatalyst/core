/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('libraryCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'toastr', 'workzoneUIUtils', function ($scope, $rootScope, $state, genSevs, confirmbox, toastr, workzoneUIUtils) {
        var treeNames = ['Bots','Library'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var lib=this;
        $scope.totalBotsSelected = true;
        lib.gridOptions={
            gridOption:{
                paginationPageSizes: [10, 25, 50, 75],
                paginationPageSize: 10,
                enableColumnMenus:false,
                multiSelect :false,
            },
            columnDefs: [
                { name:'Task Type', field:'taskType' ,cellTemplate:'<img src="images/orchestration/chef.png" ng-show="row.entity.taskType==\'chef\'" alt="row.entity.taskType" title="Chef" class="task-type-img" />'+
                    '<img src="images/orchestration/jenkins.png" ng-show="row.entity.taskType==\'jenkins\'" alt="row.entity.taskType" title="Jenkins" class="task-type-img" />'+
                    '<img src="images/orchestration/script.jpg" ng-show="row.entity.taskType==\'script\'" alt="row.entity.taskType" title="Script" class="task-type-img" />'+
                    '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.blueprintType" alt="row.entity.botType" title="Blueprint" class="task-type-img" />',cellTooltip: true},
                { name: 'BOT Type',displayName: 'BOT Type',field:'botType'},
                { name: 'BOT Name',displayName: 'BOT Name',field:'name'},
                { name: 'Category',field:'botCategory'},
                { name: 'description',field:'shortDesc'},
                { name: 'BOT History',displayName: 'BOT History',cellTemplate:'<span ng-show="row.entity.blueprintType">NA</span>'+
                    '<span class="btn cat-btn-update control-panel-button" title="History" ng-show="row.entity.taskType" ng-click="grid.appScope.botLogs(row.entity);"><i class="fa fa-header white"></i></span>'},
                { name: 'BOT Action',displayName: 'BOT Action',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>' +
                    '<span class="btn btn-danger control-panel-button" title="Delete Task" ng-show="row.entity.taskType" ng-click="grid.appScope.deleteBotTask(row.entity);"><i class="fa fa-trash-o white"></i></span>' + 
                    '<span class="btn btn-danger control-panel-button" title="Delete Blueprint" ng-show="row.entity.blueprintType" ng-click="grid.appScope.deleteBotBP(row.entity);"><i class="fa fa-trash-o white"></i></span>'
                }
            ],
            data:[]
        };
        var gridBottomSpace = 190;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
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
        $scope.deleteBotTask = function(task) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete Bot',
                bodyText: 'Are you sure you want to delete this bot?'
            };
            confirmbox.showModal({}, modalOptions).then(function() {
                var param={
                    url:'/tasks/serviceDelivery/' + task._id
                };
                genSevs.promiseDelete(param).then(function (response) {
                    if (response) {
                        toastr.success('Successfully deleted');
                        if($scope.totalBotsSelected) {
                            lib.init();
                        } else if($scope.runningBotsselected) {
                            $scope.showBotsRunning();
                        } else if($scope.failedBotsselected) {
                            $scope.showFailedBots();
                        } else {
                            lib.init();
                        }
                        lib.summary();
                    }
                }, function(data) {
                    toastr.error('error:: ' + data.toString());
                });
            });
        };
        $scope.deleteBotBP = function(blueprint) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete Bot',
                bodyText: 'Are you sure you want to delete this bot?'
            };
            confirmbox.showModal({}, modalOptions).then(function() {
                var param={
                    url:'/blueprints/serviceDelivery/' + blueprint._id
                };
                genSevs.promiseDelete(param).then(function (response) {
                    if (response) {
                        toastr.success('Successfully deleted');
                        if($scope.totalBotsSelected) {
                            lib.init();
                        } else if($scope.runningBotsselected) {
                            $scope.showBotsRunning();
                        } else if($scope.failedBotsselected) {
                            $scope.showFailedBots();
                        } else {
                            lib.init();
                        }
                        lib.summary();
                    }
                }, function(data) {
                    toastr.error('error:: ' + data.toString());
                });
            });
        };
        $rootScope.$on('BOTS_LIBRARY_REFRESH', function() {
            lib.summary();
            lib.init();
        });
        $scope.RefreshBotsLibrary = function() {
            $scope.totalBotsSelected = true;
            $scope.runningBotsselected = false;
            $scope.failedBotsselected = false;
            lib.summary();
            lib.init();
        };
        $scope.showBotsRunning = function() {
            $scope.runningBotsselected = true;
            $scope.totalBotsSelected = false;
            $scope.failedBotsselected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/tasks?serviceDeliveryCheck=true&actionStatus=running'
            };
            genSevs.promiseGet(param).then(function (result) {
                angular.forEach(result,function (val) {
                    lib.gridOptions.data.push(val);
                });
            });
            lib.summary();
        };
        $scope.showFailedBots = function() {
            $scope.failedBotsselected = true;
            $scope.runningBotsselected = false;
            $scope.totalBotsSelected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/tasks?serviceDeliveryCheck=true&actionStatus=failed'
            };
            genSevs.promiseGet(param).then(function (result) {
                angular.forEach(result,function (val) {
                    lib.gridOptions.data.push(val);
                });
            });
            lib.summary();
        };
        lib.summary = function() {
            $scope.botSummary=[];
            var param={
                url:'/audit-trail/bot-summary'
            };
            genSevs.promiseGet(param).then(function (response) {
                $scope.botSummary = response;
            });
        };
        lib.summary();
        lib.init =function(){
            lib.gridOptions.data=[];
            var param={
                url:'/blueprints?serviceDeliveryCheck=true'
            };
            genSevs.promiseGet(param).then(function (result) {
                angular.forEach(result,function (val) {
                    angular.extend(val,{launcType:'bp'});
                    lib.gridOptions.data.push(val);
                });
            });
            var param2={
               url:'/tasks?serviceDeliveryCheck=true'
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