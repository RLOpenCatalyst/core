/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('libraryCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'toastr', 'workzoneUIUtils', '$modal', function ($scope, $rootScope, $state, genSevs, confirmbox, toastr, workzoneUIUtils, $modal) {
        var treeNames = ['BOTs','Library'];
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
                { name: 'BOT Type',displayName: 'BOT Type',field:'botType',cellTooltip: true},
                { name: 'BOT Name',displayName: 'BOT Name',field:'name',cellTooltip: true},
                { name: 'Category',field:'botCategory',cellTooltip: true},
                { name: 'description',field:'shortDesc',cellTooltip: true},
                { name: 'Total Runs',field:'executionCount'},
                { name: 'BOT History',displayName: 'BOT History',cellTemplate:'<span ng-show="row.entity.blueprintType">NA</span>'+
                    '<span class="btn cat-btn-update control-panel-button" title="History" ng-show="row.entity.taskType" ng-click="grid.appScope.botLogs(row.entity);"><i class="fa fa-header white"></i></span>'},
                { name: 'BOT Info',displayName: 'BOT Info',cellTemplate:
                    '<span class="btn cat-btn-update control-panel-button" title="Info" ng-click="grid.appScope.botInfo(row.entity);"><i class="fa fa-info white"></i></span>'},
                { name: 'BOT Action',displayName: 'BOT Action',cellTemplate:
                    '<span class="btn cat-btn-update control-panel-button" title="Schedule" ng-click="grid.appScope.botSchedule(row.entity);"><i class="fa fa-calendar white"></i></span>' +
                    '<span class="btn cat-btn-update control-panel-button" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>' +
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
        $scope.botInfo=function(bot) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/bots/view/botInfo.html',
                controller: 'botInfoCtrl',
                backdrop : 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return bot;
                    }
                }
            });
            modalInstance.result.then(function(selectedItem) {
                $scope.selected = selectedItem;
            }, function() {
                console.log('Modal Dismissed at ' + new Date());
            });
        };
        $scope.botSchedule = function() {
            $modal.open({
                templateUrl: 'src/partials/sections/dashboard/bots/view/botSchedule.html',
                controller: 'botScheduleCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    items: function () {
                        return {
                            chefJenkScriptTaskObj:$scope.chefJenkScriptTaskObj,
                            type:$scope.type
                        }
                    }
                }
            }).result.then(function (chefEventDetails) {
                $scope.isEventAvailable = true;
                $scope.chefJenkScriptTaskObj = chefEventDetails;
                var startTimeMinute,startTimeHour,dayOfWeek,selectedDayOfTheMonth,selectedMonth;
                startTimeMinute = $scope.chefJenkScriptTaskObj.startTimeMinute;
                startTimeHour = $scope.chefJenkScriptTaskObj.startTime;
                dayOfWeek = $scope.chefJenkScriptTaskObj.dayOfWeek;
                selectedDayOfTheMonth = $scope.chefJenkScriptTaskObj.selectedDayOfTheMonth;
                selectedMonth = $scope.chefJenkScriptTaskObj.monthOfYear;
                $scope.type = 'edit';
                $scope._isEventSelected = true;
                
                $scope.repeatPattern = 'Repeat Every -' +  $scope.chefJenkScriptTaskObj.repeats;   
                $scope.cronDetails = {
                    cronStartOn : $scope.chefJenkScriptTaskObj.cronStart,
                    cronEndOn : $scope.chefJenkScriptTaskObj.cronEnd,
                    cronRepeatEvery : $scope.chefJenkScriptTaskObj.repeatBy,
                    cronFrequency: $scope.chefJenkScriptTaskObj.repeats,
                    cronTime: typeof startTimeHour !=='undefined'? startTimeHour : new Date().getHours() + ':' + typeof startTimeMinute !=='undefined'? startTimeMinute:new Date().getMinutes(),
                    cronDays: $scope.chefJenkScriptTaskObj.dayOfWeek,
                    cronMonth: $scope.chefJenkScriptTaskObj.monthOfYear
                }
            }, function () {
                console.log('Dismiss time is ' + new Date());
            });
        };
        $scope.deleteBotTask = function(task) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete Bot',
                bodyText: 'Are you sure you want to delete this bots?'
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
                bodyText: 'Are you sure you want to delete this bots?'
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
                url:'/audit-trail/bots-summary'
            };
            genSevs.promiseGet(param).then(function (response) {
                $scope.botSummary = response;
                $scope.totalSavedTimeForBots = parseInt($scope.botSummary.totalSavedTimeForBots);
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
    }]).controller('botInfoCtrl',['$scope', 'items', '$modalInstance', function ($scope, items, $modalInstance) {
        $scope.botInfo = items;
        console.log(items);

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]).controller('botScheduleCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', '$timeout', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, $timeout) {
        console.log(items);
        $scope.defaultSelection = function() {
            $scope.repeatsType = 'Minutes';//default selection.
            $scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            $scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
        };
        if(items.type !== 'new'){
            if(items.chefJenkScriptTaskObj !==undefined){
                if(items.chefJenkScriptTaskObj.cronStartOn && items.chefJenkScriptTaskObj.cronEndOn) {
                    var newStartOn = parseInt(items.chefJenkScriptTaskObj.cronStartOn);
                    var newDate = new Date(newStartOn).toLocaleDateString();
                    var datearray = newDate.split("/");
                    var newdate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                    $scope.schedulerStartOn = newdate;
                    var newEndOn = parseInt(items.chefJenkScriptTaskObj.cronEndOn);
                    var newEndData = new Date(newEndOn).toLocaleDateString();   
                    var datearrayNew = newEndData.split("/");
                    var newdateEnd = datearrayNew[1] + '/' + datearrayNew[0] + '/' + datearrayNew[2];
                    $scope.schedulerEndOn = newdateEnd;
                } else {
                    $scope.schedulerStartOn = items.chefJenkScriptTaskObj.cronStart;
                    $scope.schedulerEndOn = items.chefJenkScriptTaskObj.cronEnd;    
                }
            
                $scope.repeatBy = items.chefJenkScriptTaskObj.repeatBy || items.chefJenkScriptTaskObj.cronRepeatEvery.toString();
                $scope.repeatsType = items.chefJenkScriptTaskObj.repeats || items.chefJenkScriptTaskObj.cronFrequency;
                $scope.timeEventType = items.chefJenkScriptTaskObj.startTime;
                $scope.timeEventMinute = items.chefJenkScriptTaskObj.startTimeMinute;
                $scope.weekOfTheDay = items.chefJenkScriptTaskObj.dayOfWeek;
                $scope.currentDate = items.chefJenkScriptTaskObj.startDate;
                $scope.selectedDayOfTheMonth = items.chefJenkScriptTaskObj.selectedDayOfTheMonth;
                $scope.selectedMonth = items.chefJenkScriptTaskObj.monthOfYear;
            } else {
                $scope.defaultSelection();
            }
        } else {
            $scope.defaultSelection();
        }

        $scope.dateChange= function () {
            var startDate =  Date.parse($scope.schedulerStartOn);
            var endDate =  Date.parse($scope.schedulerEndOn);
            if(startDate > endDate){
                $scope.validDateRange=true;
            } else {
                $scope.validDateRange=false;
            }
      
        };

        $scope.repeatCount = function(max, step) {
            step = step || 1;
            var input = [];
            for (var i = 1; i <= max; i += step) {
                input.push(i);
            }
            return input;
        };
        $scope.isDaySelected = {
            flag:true
        }
        
        $scope.daysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

        $scope.monthOfYear = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
        $scope.ok=function(){
            $scope.eventParams = {
                repeats: $scope.repeatsType,
                repeatBy: $scope.repeatBy,
                cronStart: $scope.schedulerStartOn,
                cronEnd: $scope.schedulerEndOn,
                startTime: $scope.timeEventType,
                startTimeMinute: $scope.timeEventMinute,
                dayOfWeek: $scope.weekOfTheDay,
                selectedDayOfTheMonth: $scope.selectedDayOfTheMonth,
                monthOfYear: $scope.selectedMonth
            };
            $modalInstance.close($scope.eventParams);
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);