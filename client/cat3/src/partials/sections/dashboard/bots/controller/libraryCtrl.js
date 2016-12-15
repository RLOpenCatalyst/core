/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('libraryCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'confirmbox', 'toastr', 'workzoneUIUtils', '$modal', 'uiGridOptionsService', '$timeout', function ($scope, $rootScope, $state, genSevs, confirmbox, toastr, workzoneUIUtils, $modal, uiGridOptionsService, $timeout) {
        var treeNames = ['BOTs','Library'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var lib=this;
        $scope.totalBotsSelected = true;
        var botLibraryUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.paginationParams.sortBy = 'createdOn';
        $scope.paginationParams.sortOrder = 'desc';
        console.log($scope.paginationParams.sortBy);
            
        $scope.initGrids = function(){
            $scope.botLibGridOptions={};
            $scope.botLibGridOptions.columnDefs= [
                    { name:'Task Type', field:'botLinkedSubCategory' ,cellTemplate:'<img src="images/orchestration/chef.png" ng-show="row.entity.botLinkedSubCategory==\'chef\'" alt="row.entity.taskType" title="Chef" class="task-type-img" />'+
                        '<img src="images/orchestration/jenkins.png" ng-show="row.entity.botLinkedSubCategory==\'jenkins\'" alt="row.entity.botLinkedSubCategory" title="Jenkins" class="task-type-img" />'+
                        '<img src="images/orchestration/script.jpg" ng-show="row.entity.botLinkedSubCategory==\'script\'" alt="row.entity.taskType" title="Script" class="task-type-img" />'+
                        '<img src="images/devops-roles/devopsRole1.png" ng-show="row.entity.botLinkedCategory==\'Blueprint\'" alt="row.entity.botType" title="Blueprint" class="task-type-img" />',cellTooltip: true},
                    { name: 'BOT Type',displayName: 'BOT Type',field:'botLinkedCategory',cellTooltip: true},
                    { name: 'BOT Name',displayName: 'BOT Name',field:'botName',cellTooltip: true},
                    { name: 'Category',field:'botCategory',cellTooltip: true},
                    { name: 'description',field:'botDesc',cellTooltip: true},
                    { name: 'Org',field:'masterDetails.orgName',cellTooltip: true},
                    { name: 'Total Runs',field:'executionCount'},
                    { name: 'BOT History',displayName: 'BOT History',cellTemplate:'<span ng-show="row.entity.blueprintType">NA</span>'+
                        '<span class="btn cat-btn-update control-panel-button" title="History" ng-show="row.entity.botLinkedSubCategory" ng-click="grid.appScope.botHistory(row.entity);"><i class="fa fa-header white"></i></span>'},
                    { name: 'BOT Info',displayName: 'BOT Info',cellTemplate:
                        '<span class="btn cat-btn-update control-panel-button" title="Info" ng-click="grid.appScope.botInfo(row.entity);"><i class="fa fa-info white"></i></span>'},
                    { name: 'BOT Action',displayName: 'BOT Action',cellTemplate:
                        '<span class="btn cat-btn-update control-panel-button" title="Schedule" ng-click="grid.appScope.botSchedule(row.entity);"><i class="fa fa-calendar white"></i></span>' +
                        '<span class="btn cat-btn-update control-panel-button" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>' +
                        '<span class="btn btn-danger control-panel-button" title="Delete Bot" ng-click="grid.appScope.deleteBot(row.entity);"><i class="fa fa-trash-o white"></i></span>'
                    }
                ]
            $scope.botLibGridOptions.data=[];
            angular.extend($scope.botLibGridOptions,botLibraryUIGridDefaults.gridOption);
        };
        $scope.initGrids();
        /*APIs registered are triggered as ui-grid is configured 
        for server side(external) pagination.*/
        angular.extend($scope.botLibGridOptions,botLibraryUIGridDefaults.gridOption, {
            onRegisterApi :function(gridApi) {
                $scope.gridApi = gridApi;
                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                    if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                        $scope.paginationParams.sortBy = sortColumns[0].field;
                        $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                        $scope.botLibraryGridView();
                    }
                });
                //Pagination for page and pageSize
                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                    $scope.paginationParams.page = newPage;
                    $scope.paginationParams.pageSize = pageSize;
                    $scope.botLibraryGridView();
                });
            },
        });
        $scope.setPaginationDefaults = function() {
            $scope.paginationParams.sortBy = 'createdOn';
            $scope.paginationParams.sortOrder = 'desc';
            /*if($scope.paginationParams.page !== 1){
                $scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
            }else{
                $scope.botLibraryGridView();
            }*/
        };
        $scope.setPaginationDefaults();
        $scope.botLibraryGridView = function() {
            lib.gridOptions=[];
            var param={
                url:'/bots?page=1&pageSize=10&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    console.log(result);
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
                $scope.isBotLibraryPageLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                console.log(error);
                $scope.errorMessage = "No Records found";
            });
        };
        var gridBottomSpace = 250;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
        $scope.launchInstance = function(launch){
            console.log(launch.botLinkedCategory);
            /*if(launch.launcType === 'task'){
                genSevs.executeTask(launch);
            } else if(launch.launcType === 'bp') {
                genSevs.launchBlueprint(launch);
            }*/
            if(launch.botLinkedCategory === 'Task'){
                genSevs.executeTask(launch);
            } else if(launch.botLinkedCategory === 'Blueprint') {
                genSevs.launchBlueprint(launch);
            }
        };
        /*$scope.botLogs = function(bot){
            genSevs.botHistory(bot);
        };*/
        $scope.botHistory=function(bot) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/bots/view/botHistory.html',
                controller: 'botHistoryCtrl',
                backdrop : 'static',
                size: 'lg',
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
        $scope.deleteBot = function(bot) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete Bot',
                bodyText: 'Are you sure you want to delete this bots?'
            };
            confirmbox.showModal({}, modalOptions).then(function() {
                var param={
                    url:'/bots/' + bot.botId
                };
                genSevs.promiseDelete(param).then(function (response) {
                    if (response) {
                        toastr.success('Successfully deleted');
                        if($scope.totalBotsSelected) {
                            $scope.botLibraryGridView();
                        } else if($scope.runningBotsselected) {
                            $scope.showBotsRunning();
                        } else if($scope.failedBotsselected) {
                            $scope.showFailedBots();
                        } else {
                            $scope.botLibraryGridView();
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
            $scope.botLibraryGridView();
        });
        $scope.RefreshBotsLibrary = function() {
            $scope.totalBotsSelected = true;
            $scope.runningBotsselected = false;
            $scope.failedBotsselected = false;
            lib.summary();
            $scope.botLibraryGridView();
        };
        $scope.showBotsRunning = function() {
            $scope.runningBotsselected = true;
            $scope.totalBotsSelected = false;
            $scope.failedBotsselected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/bots?actionStatus=running?page=1&pageSize=10&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
            });
            lib.summary();
        };
        $scope.showFailedBots = function() {
            $scope.failedBotsselected = true;
            $scope.runningBotsselected = false;
            $scope.totalBotsSelected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/bots?actionStatus=failed?page=1&pageSize=10&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
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
    }]).controller('botHistoryCtrl',["items", '$scope', '$modalInstance', '$modal', '$timeout', 'uiGridOptionsClient', 'genericServices', 'workzoneServices',
        function(items, $scope, $modalInstance, $modal, $timeout, uiGridOptionsClient, genSevs, workzoneServices){
            //UI Grid for chef Task starts
            console.log(items);
            $scope.botHistory = items;
            $scope.botId = items.botId;
            $scope.taskHistoryChefData = [];
            var gridOptionsChef = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryChefGridOptions = gridOptionsChef;

            $scope.initChefGrids = function(){
                $scope.taskHistoryChefGridOptions.data='taskHistoryChefData';
                $scope.taskHistoryChefGridOptions.columnDefs = [
                { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                { name:'Message', field: 'message', 
                  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
                { name:'User',field:'user',cellTooltip: true},
                { name:'Logs',width: 70,
                  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},{ name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                { name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.timestampEnded">{{grid.appScope.getExecutionTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>'},
                { name:'Manual Time',cellTemplate: '<span>{{row.entity.manualExecutionTime}} mins</span>', cellTooltip: true},
                { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status == \'success\'">{{grid.appScope.getSavedTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryChefListView: function() {
                    $scope.taskHistoryChefData = [];
                    /*var param={
                        url:'/bots/:$scope.botId/bots-history'
                    };*/
                    workzoneServices.getHistory(items.botId).then(function(response) {
                        console.log(response);
                        $timeout(function() {
                            if(response.data){
                                $scope.taskHistoryChefData = response.data;
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
                    genSevs.getHistory(items._id).then(function(response) {
                        $timeout(function() {
                            if(response.data){
                                $scope.taskHistoryChefData = response.data;
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

            //$scope.initchef();
            //UI Grid for chef Task ends

            //UI Grid for jenkins Task starts
            $scope.taskHistoryJenkinsData = [];
            var gridOptionsJenkins = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryJenkinsGridOptions = gridOptionsJenkins;

            $scope.initJenkinsGrids = function(){
                $scope.taskHistoryJenkinsGridOptions.data='taskHistoryJenkinsData';
                $scope.taskHistoryJenkinsGridOptions.columnDefs = [
                { name:'Job Number',field:'buildNumber',cellTemplate:'<a target="_blank" title="Jenkins" ng-href="{{grid.appScope.task.taskConfig.jobURL}}/{{row.entity.buildNumber}}">{{row.entity.buildNumber}}</a>', sort:{ direction: 'desc'}, cellTooltip: true},
                { name:'Job Output',cellTemplate:'<span><a target="_blank" title="{{jobResultUrlName}}" class="fa fa-file-text bigger-120 btn cat-btn-update btn-sg tableactionbutton marginbottomright3" ng-repeat="jobResultUrlName in row.entity.jobResultURL" ng-href="{{jobResultUrlName}}"></a></span>',cellTooltip: true},
                { name:'Log Info',width: 90,cellTemplate:'<span title="Jenkins Log" class="fa fa-list bigger-120 btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.historyLogs(row.entity);"></span>',cellTooltip: true},
                { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status.toUpperCase()}}">{{row.entity.status.toUpperCase()}}</div>'},
                { name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>',cellTooltip: true},
                { name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>',cellTooltip: true},
                { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.timestampEnded">{{grid.appScope.getExecutionTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>'},
                { name:'Manual Time',cellTemplate: '<span>{{row.entity.manualExecutionTime}} mins</span>', cellTooltip: true},
                { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryJenkinsListView: function() {
                    $scope.taskHistoryJenkinsData = [];
                    var param={
                        url:'/bots/:$scope.botId/bots-history'
                    };
                    workzoneServices.getHistory(items.botId).then(function(response) {
                        console.log(response);
                        $timeout(function() {
                            if(response.data){
                                $scope.taskHistoryJenkinsData = response.data;
                                $scope.isjenkinsTaskHistoryPageLoading = false;
                            }else if(response){
                                $scope.taskHistoryJenkinsData = response;
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
            //$scope.initjenkins();
            //UI Grid for jenkins Task ends

            //UI Grid for script Task starts
            $scope.taskHistoryScriptData = [];
            var gridOptionsScript = uiGridOptionsClient.options().gridOption;
            $scope.taskHistoryScriptGridOptions = gridOptionsScript;

            $scope.initScriptGrids = function(){
                $scope.taskHistoryScriptGridOptions.data='taskHistoryScriptData';
                $scope.taskHistoryScriptGridOptions.columnDefs = [
                { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                { name:'Message', field: 'message', 
                  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
                { name:'User',field:'user',cellTooltip: true},
                { name:'Logs',width: 70,
                  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                  { name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                { name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.timestampEnded">{{grid.appScope.getExecutionTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>'},
                { name:'Manual Time',cellTemplate: '<span>{{row.entity.manualExecutionTime}} mins</span>', cellTooltip: true},
                { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                taskHistoryScriptListView: function() {
                    $scope.taskHistoryScriptData = [];
                    /*var param={
                        url:'/bots/:$scope.botId/bots-history'
                    };*/
                    workzoneServices.getHistory(items.botId).then(function(response) {
                        console.log(response);
                        $timeout(function() {
                            if(response.data){
                                $scope.taskHistoryScriptData = response.data;
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
            //$scope.initscript();
            //UI Grid for script Task ends

            //UI Grid for Blueprint starts
            $scope.botHistoryBlueprintData = [];
            var gridOptionsScript = uiGridOptionsClient.options().gridOption;
            $scope.botHistoryBlueprintGridOptions = gridOptionsScript;

            $scope.initBlueprintGrids = function(){
                $scope.botHistoryBlueprintGridOptions.data='botHistoryBlueprintData';
                $scope.botHistoryBlueprintGridOptions.columnDefs = [
                { name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
                { name:'Message', field: 'message', 
                  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
                { name:'User',field:'user',cellTooltip: true},
                { name:'Logs',width: 70,
                  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
                  { name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
                { name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name:'Execution Time',cellTemplate:'<span ng-if="row.entity.timestampEnded">{{grid.appScope.getExecutionTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>'},
                { name:'Manual Time',cellTemplate: '<span>{{row.entity.manualExecutionTime}} mins</span>', cellTooltip: true},
                { name:'Saved Time',cellTemplate:'<span ng-if="row.entity.status === \'success\'">{{grid.appScope.getSavedTime(row.entity.timestampEnded,row.entity.timestampStarted)}} mins</span>' +
                    '<span ng-if="row.entity.status !== \'success\'" title="NA">NA</span>', cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                botHistoryBlueprintListView: function() {
                    $scope.botHistoryBlueprintData = [];
                    /*var param={
                        url:'/bots/:$scope.botId/bots-history'
                    };*/
                    workzoneServices.getHistory(items.botId).then(function(response) {
                        console.log(response);
                        $timeout(function() {
                            if(response.data){
                                $scope.botHistoryBlueprintData = response.data;
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
            //$scope.initblueprint();
            //UI Grid for Blueprint ends

            $scope.bot=items;
            switch ($scope.bot.botLinkedSubCategory){
                case 'chef' :
                    $scope.ischefTaskHistoryPageLoading = true;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.iscompositeTaskHistoryPageLoading = false;
                    $scope.ispuppetTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initchef();
                    break;
                case 'jenkins' :
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = true;
                    $scope.iscompositeTaskHistoryPageLoading = false;
                    $scope.ispuppetTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initjenkins();
                    break;
                case 'script':
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.iscompositeTaskHistoryPageLoading = false;
                    $scope.ispuppetTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = true;
                    $scope.isBlueprintBotHistoryPageLoading = false;
                    $scope.initscript();
                    break;
                case 'instance_launch':
                    $scope.ischefTaskHistoryPageLoading = false;
                    $scope.isjenkinsTaskHistoryPageLoading = false;
                    $scope.iscompositeTaskHistoryPageLoading = false;
                    $scope.ispuppetTaskHistoryPageLoading = false;
                    $scope.isscriptTaskHistoryPageLoading = false;
                    $scope.isBlueprintBotHistoryPageLoading = true;
                    $scope.initblueprint();
                    break;
            }

            $scope.historyLogs=function(hist) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
                    controller: 'orchestrationLogCtrl as orchLogCtrl',
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
            $scope.cancel= function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ]);
})(angular);