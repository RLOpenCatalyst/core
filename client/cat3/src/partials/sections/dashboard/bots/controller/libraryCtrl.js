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
        $scope.paginationParams.page = 1;
        $scope.paginationParams.pageSize = 10;
        $scope.paginationParams.sortBy = 'createdOn';
        $scope.paginationParams.sortOrder = 'desc';
            
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
                { name: 'Organization',field:'masterDetails.orgName',cellTooltip: true},
                { name: 'Total Runs',field:'executionCount'},
                   { name: 'BOT Action',width:200,displayName: 'BOT Action',cellTemplate:
                    // '<a class="cursor" title="History" ng-click="grid.appScope.botLogs(row.entity);"><i class="fa fa-header font-size-16"></i></a>'+
                    '<a class="cursor" title="History" ng-click="grid.appScope.botHistory(row.entity);"><i class="fa fa-header font-size-16"></i></a>'+
                    '<a class="cursor" title="Info" ng-click="grid.appScope.botInfo(row.entity);"><i class="fa fa-info font-size-16"></i></a>'+
                    //'<a class="cursor" title="Edit" ng-click="grid.appScope.createBot(row.entity);"><i class="fa fa-pencil font-size-16"></i></a>'+
                    '<a class="cursor" title="Schedule" ng-click="grid.appScope.botSchedule(row.entity);"><i class="fa fa-calendar font-size-16"></i></a>' +
                    '<a class="cursor" title="Execute" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play font-size-16"></i></a>' +
                    //'<a class="cursor" title="Report" ng-click="grid.appScope.botReport(row.entity);"><i class="fa fa-file-text font-size-16"></i></a>' + 
                    '<a class="cursor" title="Delete" ng-click="grid.appScope.deleteBot(row.entity);"><i class="fa fa-trash-o font-size-16"></i></a>'
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
        $scope.setFirstPageView = function(){
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page = 1;
        };
        $scope.setPaginationDefaults = function() {
            $scope.paginationParams.sortBy = 'createdOn';
            $scope.paginationParams.sortOrder = 'desc';
            if($scope.paginationParams.page !== 1){
                $scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
            }else{
                //$scope.botLibraryGridView();
            }
        };
        $scope.setPaginationDefaults();
        $scope.botLibraryGridView = function() {
            lib.gridOptions=[];
            var param={
                url:'/bots?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
                $scope.isBotLibraryPageLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };
        $scope.botLibraryGridView();
        $scope.searchBotNameCategory = function() {
            $scope.searchString = $scope.botLibrarySearch;
            lib.gridOptions=[];
            if($scope.totalBotsSelected) {
                var param={
                    url:'/bots?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                }
            } else if($scope.runningBotsselected) {
                var param={
                    url:'/bots?actionStatus=running&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                }
            } else if($scope.failedBotsselected) {
                var param={
                    url:'/bots?actionStatus=failed&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                }
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
                $scope.isBotLibraryPageLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };
        var gridBottomSpace = 265;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
        $scope.launchInstance = function(launch){
            if(launch.botLinkedCategory === 'Task'){
                genSevs.executeTask(launch);
            } else if(launch.botLinkedCategory === 'Blueprint') {
                genSevs.launchBlueprint(launch);
            }
        };
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

        $scope.botSchedule = function(bot) {
            $modal.open({
                templateUrl: 'src/partials/sections/dashboard/bots/view/botSchedule.html',
                controller: 'botScheduleCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    items: function () {
                        return bot
                    }
                }
            }).result.then(function () {
                
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
                        lib.summary();
                        if($scope.totalBotsSelected) {
                            $scope.botLibraryGridView();
                        } else if($scope.runningBotsselected) {
                            $scope.showBotsRunning();
                        } else if($scope.scheduledBotsSelected) {
                            $scope.showScheduledBots();
                        } else if($scope.failedBotsselected) {
                            $scope.showFailedBots();
                        } else {
                            $scope.botLibraryGridView();
                        }
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
            $scope.botLibrarySearch = '';
            lib.summary();
            if($scope.totalBotsSelected) {
                $scope.botLibraryGridView();
            } else if($scope.runningBotsselected) {
                $scope.showBotsRunning();
            } else if($scope.scheduledBotsSelected) {
                $scope.showScheduledBots();
            } else if($scope.failedBotsselected) {
                $scope.showFailedBots();
            } else {
                $scope.botLibraryGridView();
            }
        };
        $scope.showAllBots = function() {
            $scope.totalBotsSelected = true;
            $scope.runningBotsselected = false;
            $scope.failedBotsselected = false;
            $scope.scheduledBotsSelected = false;
            lib.summary();
            $scope.botLibraryGridView();
        };
        $scope.showBotsRunning = function() {
            $scope.runningBotsselected = true;
            $scope.totalBotsSelected = false;
            $scope.failedBotsselected = false;
            $scope.scheduledBotsSelected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/bots?actionStatus=running&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
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
            $scope.scheduledBotsSelected = false;
            lib.gridOptions.data=[];
            var param={
                url:'/bots?actionStatus=failed&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
            });
            lib.summary();
        };
        $scope.showScheduledBots = function() {
            $scope.failedBotsselected = false;
            $scope.runningBotsselected = false;
            $scope.totalBotsSelected = false;
            $scope.scheduledBotsSelected = true;
            lib.gridOptions.data=[];
            var param={
                url:'/bots?filterBy=isBotScheduled:true&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
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

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]).controller('botScheduleCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', '$timeout', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, $timeout) {
        if(items.isBotScheduled === true){
            $scope._isEventSelected = true;
            $scope.isScheduled = true;
        }else{
            $scope._isEventSelected = false;
            $scope.isScheduled = false;
        }
        $scope.scheduleDeatils = items;
        $scope.botId = items.botId;
        $scope.defaultSelection = function() {
            $scope.repeatsType = 'Minutes';//default selection.
            $scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            $scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
        };
        $scope.selectBotCheckbox = function(){
            if($scope.isScheduled === true || $scope.isScheduled === 'true') {
                $scope._isEventSelected = true;
            }else{
                $scope._isEventSelected = false;
            }
        }
        if(items.botScheduler){
            if(items.botScheduler.cronStartOn && items.botScheduler.cronEndOn) {
                var newStartOn = parseInt(items.botScheduler.cronStartOn);
                var newDate = new Date(newStartOn).toLocaleDateString();
                var datearray = newDate.split("/");
                var newdate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                $scope.schedulerStartOn = newdate;
                var newEndOn = parseInt(items.botScheduler.cronEndOn);
                var newEndData = new Date(newEndOn).toLocaleDateString();   
                var datearrayNew = newEndData.split("/");
                var newdateEnd = datearrayNew[1] + '/' + datearrayNew[0] + '/' + datearrayNew[2];
                $scope.schedulerEndOn = newdateEnd;
            } else {
                $scope.schedulerStartOn = items.botScheduler.cronStartOn;
                $scope.schedulerEndOn = items.botScheduler.cronEndOn;    
            }

            $scope.repeatBy = items.botScheduler.repeatBy || items.botScheduler.cronRepeatEvery.toString();
            $scope.repeatsType = items.botScheduler.repeats || items.botScheduler.cronFrequency;
            $scope.timeEventType = items.botScheduler.timeEventHour || (items.botScheduler.cronHour && items.botScheduler.cronHour !==null) ? items.botScheduler.cronHour.toString() : '';
            $scope.timeEventMinute = items.botScheduler.timeEventMinute || (items.botScheduler.cronMinute && items.botScheduler.cronMinute !==null) ? items.botScheduler.cronMinute.toString() : '';
            $scope.weekOfTheDay = items.botScheduler.weekOfTheDay ||  (items.botScheduler.cronWeekDay && items.botScheduler.cronWeekDay !==null) ?items.botScheduler.cronWeekDay.toString(): '';
            $scope.selectedDayOfTheMonth = items.botScheduler.selectedDayOfTheMonth || (items.botScheduler.cronDate && items.botScheduler.cronDate !==null) ?items.botScheduler.cronDate.toString() : '';
            $scope.selectedMonth =  items.botScheduler.selectedMonth || (items.botScheduler.cronMonth && items.botScheduler.cronMonth !==null)  ? items.botScheduler.cronMonth.toString() : '';
            /*$scope.currentDate = items.botScheduler.startDate;*/
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

        $scope.ok=function(){
            $scope.eventParams = {
                cronFrequency: $scope.repeatsType,
                cronRepeatEvery: $scope.repeatBy,
                cronStartOn: $scope.schedulerStartOn,
                cronEndOn: $scope.schedulerEndOn,
                cronHour: $scope.timeEventType,
                cronMinute: $scope.timeEventMinute,
                cronWeekDay: $scope.weekOfTheDay,
                cronDate: $scope.selectedDayOfTheMonth,
                cronMonth: $scope.selectedMonth
            };
            var reqBody = null;
            if($scope.isScheduled === true || $scope.isScheduled === 'true'){
                 reqBody = {
                    botScheduler:$scope.eventParams,
                    isBotScheduled:true
                }
            }else{
                 reqBody = {
                    botScheduler:{},
                    isBotScheduled:false
                }
            }
            var param={
                url:'/bots/' + $scope.botId + '/scheduler',
                data: reqBody
            };
            genSevs.promisePut(param).then(function (response) {
                if(response){
                    toastr.success('BOTs Scheduler successfully updated');
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                    $modalInstance.dismiss('cancel');
                }
            });
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]).controller('botHistoryCtrl',["items", '$scope', '$modalInstance', '$modal', '$timeout', 'uiGridOptionsClient', 'genericServices', 'workzoneServices',
        function(items, $scope, $modalInstance, $modal, $timeout, uiGridOptionsClient, genSevs, workzoneServices){
            //UI Grid for chef Task starts
            $scope.botHistory = items;
            $scope.botId = items.botId;
            $scope.taskHistoryChefData = [];
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
                console.log(hist);
                //if(hist.auditTrailConfig && (hist.auditTrailConfig.executionType == 'chef') || (hist.auditTrailConfig.executionType == 'jenkins') || (hist.auditTrailConfig.executionType == 'script')) {
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
               /* } else {
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceLogs.html',
                        controller: 'cpActionHistoryLogCtrl',
                        backdrop : 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return {
                                    actionHistoryData : hist,
                                    cpInstance: hist
                                };
                            }
                        }
                    });
                    modalInstance.result.then(function(selectedItem) {
                        $scope.selected = selectedItem;
                    }, function() {
                        console.log('Modal Dismissed at ' + new Date());
                    });
                };*/
            }

            $scope.cancel= function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ]).controller('confirmBotRunCtrl', ['$scope', '$modal', '$modalInstance', 'items', 'genericServices','toastr', '$rootScope', function ($scope, $modal, $modalInstance, items, genSevs, toastr, $rootScope) {
            $scope.botId = items.botId;
            $scope.isJobRunExecuting = false;

            var helper = {
                botLogModal: function(id,historyId,taskType) {
                    $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/bots/view/botExecutionLogs.html',
                        controller: 'botExecutionLogsCtrl as botExecLogCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return {
                                    taskId: id,
                                    historyId: historyId,
                                    taskType: taskType
                                };
                            }
                        }
                    });
                }
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.runJob = function () {
                $scope.isJobRunExecuting = true;
                var param={
                    url:'/bots/' + items.botId + '/execute'
                };
                genSevs.promisePost(param).then(function (response) {
                    $modalInstance.close(response.data);
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                    helper.botLogModal(items.botId, response.historyId, response.taskType);
                },
                function (error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                });
            };
        }
    ]);
})(angular);