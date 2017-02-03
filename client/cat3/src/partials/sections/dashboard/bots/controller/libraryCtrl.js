/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jan 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('libraryCtrl',['$scope', '$rootScope', '$state', 'genericServices','$filter', 'confirmbox', 'toastr', 'workzoneUIUtils', '$modal', 'uiGridOptionsService', '$timeout', 'workzoneServices', function ($scope, $rootScope, $state, genSevs, $filter, confirmbox, toastr, workzoneUIUtils, $modal, uiGridOptionsService, $timeout, workzoneServices) {
        var treeNames = ['BOTs','Library'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var lib=this;
        $rootScope.isOpenSidebar = false;
        $scope.totalBotsSelected = true;
        $scope.botCategoryList = [];
        workzoneServices.getBotCategoryList().then(function (catList) {
            $scope.botCategoryList=catList.data;
        });
        var botLibraryUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.numofCardPages = 0;
        $scope.paginationParams.page = 1;
        $scope.paginationParams.pageSize = 18;
        $scope.paginationParams.sortBy = 'createdOn';
        $scope.paginationParams.sortOrder = 'desc';
        $scope.botLibrarySearch = '';
        $scope.showLoadMore = false;
        $scope.showRecords = false;
            
        $scope.initGrids = function(){
            $scope.botLibGridOptions={};
            $scope.botLibGridOptions.columnDefs= [
                { name:'Category Type', field:'botCategory' ,cellTemplate:'<img src="images/bots/activeDirectory.png" ng-show="row.entity.botCategory==\'Active Directory\'" alt="row.entity.botCategory" title="Active Directory" class="task-type-img" />'+
                    '<img src="images/bots/userManagement.png" ng-show="row.entity.botCategory==\'User Management\'" alt="row.entity.botCategory" title="User Management" class="task-type-img" />'+
                    '<img src="images/bots/applicationDeployment.png" ng-show="row.entity.botCategory==\'Application Deployment\'" alt="row.entity.botCategory" title="Application Deployment" class="task-type-img" />'+
                    '<img src="images/bots/installation.png" ng-show="row.entity.botCategory==\'Installation\'" alt="row.entity.botCategory" title="Installation" class="task-type-img" />'+
                    '<img src="images/bots/monitoring.png" ng-show="row.entity.botCategory==\'Monitoring\'" alt="row.entity.botCategory" title="Monitoring" class="task-type-img" />'+
                    '<img src="images/bots/openDJ.png" ng-show="row.entity.botCategory==\'OpenDJ LDAP\'" alt="row.entity.botCategory" title="OpenDJ-LDAP" class="task-type-img" />'+
                    '<img src="images/bots/serviceManagement.png" ng-show="row.entity.botCategory==\'Service Management\'" alt="row.entity.botCategory" title="Service Management" class="task-type-img" />'+
                    '<img src="images/bots/upgrade.png" ng-show="row.entity.botCategory==\'Upgrade\'" alt="row.entity.botCategory" title="Upgrade" class="task-type-img" />',cellTooltip: true},
                { name: 'BOT Name',displayName: 'BOT Name',field:'botName',cellTooltip: true},
                { name: 'Category',field:'botCategory',cellTooltip: true},
                { name: 'BOT Type',displayName: 'BOT Type',field:'botType',cellTooltip: true},
                { name: 'Description',field:'botDesc',cellTooltip: true},
                { name: 'BOT Created From',displayName: 'BOT Created From',field:'botLinkedCategory',cellTooltip: true},
                { name: 'Organization',field:'masterDetails.orgName',cellTooltip: true},
                { name: 'Last Run',field:'lastRunTime ',cellTemplate:'<span title="{{row.entity.lastRunTime  | timestampToLocaleTime}}">{{row.entity.lastRunTime  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'Total Runs',field:'executionCount'},
                   { name: 'BOT Action',width:200,displayName: 'BOT Action',cellTemplate:
                    '<a title="History"><i class="fa fa-header font-size-16 cursor" ng-click="grid.appScope.botHistory(row.entity);"></i></a>'+
                    '<a title="Info"><i class="fa fa-info font-size-16 cursor" ng-click="grid.appScope.botInfo(row.entity);"></i></a>'+
                    '<a title="Schedule"><i class="fa fa-calendar font-size-16 cursor" ng-click="grid.appScope.botSchedule(row.entity);"></i></a>' +
                    '<a title="Execute"><i class="fa fa-play font-size-16 cursor" ng-click="grid.appScope.launchInstance(row.entity);"></i></a>' +
                    '<a title="Delete"><i class="fa fa-trash-o font-size-16 cursor" ng-click="grid.appScope.deleteBot(row.entity);"></i></a>'
                }
            ];
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
                    $scope.currentCardPage = newPage;
                    $scope.botLibraryGridView();
                });
            },
        });

        $scope.cardPaginationChange = function() {
            $scope.isBotLibraryPageLoading = true;
            $scope.paginationParams.page = $scope.paginationParams.page + 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            $scope.botLibraryGridView();
        };

        $scope.setFirstPageView = function(){
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page = 1;
        };
        $scope.setPaginationDefaults = function() {
            $scope.paginationParams.sortBy = 'lastRunTime';
            $scope.paginationParams.sortOrder = 'desc';
            if($scope.paginationParams.page !== 1){
                $scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
            }
        };
        $scope.setPaginationDefaults();
        $scope.tabData = [];
        $scope.botLibraryGridView = function() {
            lib.gridOptions=[];
            var param={
                url:'/bots?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    //$scope.botSummary = result.botSummary;
                    if(result.metaData.totalRecords >= 18) {
                        $scope.showLoadMore = true;
                        $scope.showRecords = true;
                    }
                    if($scope.isCardViewActive){
                        $scope.botLibGridOptions.data = $scope.botLibGridOptions.data.concat(result.bots);
                        for(var i=0;i<result.bots.length;i++){
                            if(result.bots[i].botCategory === 'Active Directory') {
                                $scope.botIcon = 'images/bots/activeDirectory.png';
                            } else if(result.bots[i].botCategory === 'User Management') {
                                $scope.botIcon = 'images/bots/userManagement.png';
                            } else if(result.bots[i].botCategory === 'Service Management') {
                                $scope.botIcon = 'images/bots/serviceManagement.png';
                            } else if(result.bots[i].botCategory === 'Upgrade') {
                                $scope.botIcon = 'images/bots/upgrade.png';
                            } else if(result.bots[i].botCategory === 'Monitoring') {
                                $scope.botIcon = 'images/bots/monitoring.png';
                            } else if(result.bots[i].botCategory === 'Installation') {
                                $scope.botIcon = 'images/bots/installation.png';
                            } else if(result.bots[i].botCategory === 'OpenDJ LDAP') {
                                $scope.botIcon = 'images/bots/openDJ.png';
                            } else if(result.bots[i].botCategory === 'Application Deployment') {
                                $scope.botIcon = 'images/bots/applicationDeployment.png';
                            }
                        }
                        if(result.metaData.totalRecords == $scope.botLibGridOptions.data.length) {
                            $scope.showLoadMore = false;
                        }
                    } else {
                        $scope.botLibGridOptions.data =  result.bots;
                    }
                    $scope.statusBar = "Showing " + ($scope.botLibGridOptions.data.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.botLibGridOptions.data.length) + " of " + $filter('number')(result.metaData.totalRecords) + " entries";
                    //$scope.filterBy();
                }, 100);
                $scope.isBotLibraryPageLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };
       // $scope.botLibraryGridView();
        $scope.botTemplateClick = function(templateDetail) {
            templateDetail.selected = true;
            $scope.nextEnabled = true;
            $rootScope.templateSelected = templateDetail;
            $rootScope.$emit('BOTS_TEMPLATE_SELECTED',templateDetail);
        };
        $scope.searchBotNameCategory = function() {
            $scope.searchString = $scope.botLibrarySearch;
            $scope.searchText = true;
            lib.gridOptions=[];
            //if($scope.totalBotsSelected) {
                var param={
                    url:'/bots?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            /*} else if($scope.runningBotsselected) {
                var param={
                    url:'/bots?actionStatus=running&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            } else if($scope.scheduledBotsselected) {
                var param={
                    url:'/bots?filterBy=isBotScheduled:true&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            } else if($scope.failedBotsselected) {
                var param={
                    url:'/bots?actionStatus=failed&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            }*/
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data =  result.bots;
                    if(result.metaData.totalRecords >= 18) {
                        $scope.showLoadMore = true;
                        $scope.showRecords = true;
                    }
                    if(result.metaData.totalRecords == $scope.botLibGridOptions.data.length) {
                        $scope.showLoadMore = false;
                        $scope.showRecords = false;
                    }
                    $scope.statusBar = "Showing " + ($scope.botLibGridOptions.data.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.botLibGridOptions.data.length) + " of " + $filter('number')(result.metaData.totalRecords) + " entries";
                }, 100);
                $scope.isBotLibraryPageLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };
        $scope.clearBotSearchText = function() {
            $scope.botLibrarySearch = '';
            $scope.botLibGridOptions.data = [];
            $scope.searchText = false;
            $scope.paginationParams.page = 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            $scope.paginationParams.pageSize = 18;
            if($scope.totalBotsSelected) {
               $scope.showAllBots();
            } else if($scope.runningBotsselected) {
                $scope.showBotsRunning();
            }else if($scope.scheduledBotsselected) {
                $scope.showBotsScheduled();
            } else if($scope.failedBotsselected) {
                $scope.showBotsFailed();
            }
        };

        /*$scope.filterBy = function() {
            if($scope.botLibFilter === 'botType') {
                $scope.filterByBotType = true;
                $scope.filterByTaskType = false;
                $scope.filterByCategory = false;
                $scope.subFilterBy = false;
            } else if($scope.botLibFilter === 'taskType') {
                $scope.filterByTaskType = true;
                $scope.filterByBotType = false;
                $scope.filterByCategory = false;
                $scope.subFilterBy = false;
            } else if($scope.botLibFilter === 'category') {
                $scope.filterByCategory = true;
                $scope.filterByBotType = false;
                $scope.filterByTaskType = false;
                $scope.subFilterBy = false;
            } else {
                $scope.subFilterBy = true;
                $scope.filterByBotType = false;
                $scope.filterByTaskType = false;
                $scope.filterByCategory = false;
                //$scope.showAllBots();
            }
        };*/

        /*$rootScope.applyFilter = function() {
            lib.gridOptions=[];
            if ($scope.botLibFilter) {
                var param={
                    url:'/bots?filterBy=botType:'+$scope.botLibFilterBot+'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
            } else if($scope.botLibType) {
                var param={
                    url:'/bots?filterBy=botLinkedSubCategory:'+$scope.botLibFilterTask+'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
            } else if($scope.botLibCategory) {
                var param={
                    url:'/bots?filterBy=botCategory:'+$scope.botLibFilterCategory+'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                }; 
            } else {
                $scope.RefreshBotsLibrary();
            }
            genSevs.promiseGet(param).then(function (result) {
                $timeout(function() {
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    $scope.botLibGridOptions.data=result.bots;
                }, 100);
                $scope.isBotLibraryPageLoading = false;
                $scope.isOpenSidebar = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };*/
        
        $scope.setCardView = function() {
            $scope.botLibGridOptions.data = [];
            $scope.isCardViewActive = true;
            $scope.botsCardViewSelection = "bots-tab-active";
            $scope.botsTableViewSelection = "";
            $scope.paginationParams.page = 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            $scope.paginationParams.pageSize = 18;
            $scope.botLibraryGridView();
        };

        $scope.botsTableView = function() {
            $scope.isCardViewActive = false;
            $scope.botsTableViewSelection = "bots-tab-active";
            $scope.botsCardViewSelection = "";
            $scope.paginationParams.pageSize = 10;
            $scope.botLibraryGridView();
        };

        var gridBottomSpace = 250;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;
        $scope.launchInstance = function(launch){
            if(launch.botLinkedCategory === 'Task'){
                genSevs.executeTask(launch);
            } else if(launch.botLinkedCategory === 'Blueprint') {
                genSevs.launchBlueprint(launch);
            }
        };
        $rootScope.botHistory = '';
        $scope.botHistory=function(bot) {
            $rootScope.botHistory = bot;
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/bots/view/botHistory.html',
                controller: 'botHistoryCtrl',
                backdrop : 'static',
                size: 'lg',
                scope: $scope,
                keyboard: false
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
                console.log(selectedItem);
                $scope.selected = selectedItem;
            }, function() {
                console.log('Modal Dismissed at ' + new Date());
            });
        };

        $rootScope.botSchedule = '';
        $scope.botSchedule = function(bot) {
            $rootScope.botSchedule = bot;
            $modal.open({
                templateUrl: 'src/partials/sections/dashboard/bots/view/botSchedule.html',
                controller: 'botScheduleCtrl',
                backdrop: 'static',
                keyboard: false
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
                bodyText: 'Are you sure you want to delete this BOT?'
            };
            confirmbox.showModal({}, modalOptions).then(function() {
                var param={
                    url:'/bots/' + bot.botId
                };
                genSevs.promiseDelete(param).then(function (response) {
                    if (response) {
                        toastr.success('Successfully deleted.');
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

        $scope.clearFilter = function(name) {
            if(name === $scope.botLibCategory) {
                $scope.botLibCategory = false;
            } else if(name === $scope.botLibAction) {
                $scope.botLibAction = false;
            } else {
                $scope.botLibType = false;
            }
        };

        $scope.RefreshBotsLibrary = function() {
            $scope.botLibAction = '';
            $scope.botLibCategory = '';
            $scope.botLibType = '';
            $scope.botLibGridOptions.data = [];
            $scope.numofCardPages = 0;
            $scope.paginationParams.page = 1;
            $scope.paginationParams.pageSize = 9;
            $scope.paginationParams.sortBy = 'createdOn';
            $scope.paginationParams.sortOrder = 'desc';
           // $scope.botLibFilterCategory = 'Active Directory';
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
        $scope.setCardView();
    }]).controller('botInfoCtrl',['$scope', 'items', '$modalInstance', function ($scope, items, $modalInstance) {
        $scope.botInfo = items;
        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]).controller('confirmBotRunCtrl', ['$scope', '$modal', '$modalInstance', 'items', 'genericServices','toastr', '$rootScope', function ($scope, $modal, $modalInstance, items, genSevs, toastr, $rootScope) {
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