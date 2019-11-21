/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('libraryCtrl',['$scope', '$rootScope', 'moment', '$state', 'genericServices','$filter', 'confirmbox', 'toastr', 'workzoneUIUtils', '$modal', 'uiGridOptionsService', '$timeout', 'botsCreateService', function ( $scope, $rootScope, moment, $state, genSevs, $filter, confirmbox, toastr, workzoneUIUtils, $modal, uiGridOptionsService, $timeout, botsCreateService) {

        var treeNames = ['BOTs','Library'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var lib=this;
        $scope.pageLoadBot=true;
        $rootScope.templateSelected = {};
        $rootScope.isOpenSidebar = false;
        $scope.totalBotsSelected = true;
        $scope.isBotDetailsLoading = true;
        $scope.botCategoryList = [];
        $scope.customSetDate = true;
        botsCreateService.getBotCategoryList().then(function (catList) {
            $scope.botCategoryList=catList.data;
        });
        var botLibraryUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.displayRunBots = [];
        $scope.tempData = [];
        $scope.numofCardPages = 0;
        $scope.paginationParams.page = 1;
        $scope.paginationParams.pageSize = 24;
        $scope.pageSizeNew = 10;
        $scope.paginationParams.sortBy = 'lastRunTime';
        $scope.paginationParams.sortOrder = 'desc';
        $scope.botLibrarySearch = '';
        $scope.showOriginalSpinner = true;
        $scope.noShowForServiceNow = true;
        $scope.ticketsResolveStartsOn = '';
        $scope.ticketsResolveEndsOn = '';
        $scope.botSummary = {};
        $scope.setClass='total';
        $scope.showLoadRecord = function() {
            $scope.showLoadMore = false;
            $scope.showRecords = false;
        };
        $scope.resetDateFields = function(){
            $scope.ticketsResolveStartsOn = '';
            $scope.ticketsResolveEndsOn = '';   
            $scope.StartsOn='';
            $scope.EndsOn='';        
        }
        $scope.showLoadRecord();
        $scope.initGrids = function(){
            $scope.botLibGridOptions={};
            $scope.botLibGridOptions.columnDefs= [
                { name:'Category', field:'category' ,cellTemplate:'<img src="images/bots/activeDirectory.png" ng-show="row.entity.category==\'Active Directory\'" alt="row.entity.category" title="Active Directory" class="task-type-img" />'+
                    '<img src="images/bots/userManagement.png" ng-show="row.entity.category==\'User Management\'" alt="row.entity.category" title="User Management" class="task-type-img" />'+
                    '<img src="images/bots/applicationDeployment.png" ng-show="row.entity.category==\'Application Deployment\' || row.entity.category==\'Application Management\'" alt="row.entity.category" title="Application Deployment" class="task-type-img" />'+
                    '<img src="images/bots/installation.png" ng-show="row.entity.category==\'Installation\'" alt="row.entity.category" title="Installation" class="task-type-img" />'+
                    '<img src="images/bots/monitoring.png" ng-show="row.entity.category==\'Monitoring\'" alt="row.entity.category" title="Monitoring" class="task-type-img" />'+
                    '<img src="images/bots/openDJ.png" ng-show="row.entity.category==\'OpenDJ LDAP\'" alt="row.entity.category" title="OpenDJ-LDAP" class="task-type-img" />'+
                    '<img src="images/bots/serviceManagement.png" ng-show="row.entity.category==\'Service Management\'" alt="row.entity.category" title="Service Management" class="task-type-img" />'+
                    '<img src="images/bots/upgrade.png" ng-show="row.entity.category==\'Upgrade\'" alt="row.entity.category" title="Upgrade" class="task-type-img" />',cellTooltip: true},
                { name: 'Name',displayName: 'Name',field:'name',cellTooltip: true},
                { name: 'Type',displayName: 'Type',field:'id',cellTooltip: true},
                { name: 'Description',field:'desc',cellTooltip: true},
             //   { name: 'BOT Created From',displayName: 'BOT Created From',field:'botLinkedCategory',cellTooltip: true},
                { name: 'Organization',field:'orgName',cellTooltip: true},
                { name: 'Last Run',field:'lastRunTime ',cellTemplate:'<span title="{{row.entity.lastRunTime  | timestampToLocaleTime}}">{{row.entity.lastRunTime  | timestampToLocaleTime}}</span>', cellTooltip: true},
                { name: 'Saved Time',field:'savedTime', cellTemplate:'<span title="{{row.entity.savedTime.hours ? row.entity.savedTime.hours : 0}}h {{row.entity.savedTime.minutes ? row.entity.savedTime.minutes : 0}}m">{{row.entity.savedTime.hours ? row.entity.savedTime.hours : 0}}h {{row.entity.savedTime.minutes ? row.entity.savedTime.minutes : 0}}m</span>', cellTooltip: true},
                { name: 'Total Runs',field:'executionCount'},
                   { name: 'BOT Action',width:100,displayName: 'Action',cellTemplate:'<a title="Execute"><i class="fa fa-play font-size-16 cursor" ui-sref="dashboard.bots.botsDescription({botDetail:row.entity,listType:1})" ></i></a>'
                }
            ];
            $scope.botLibGridOptions.data=[];
            angular.extend($scope.botLibGridOptions,botLibraryUIGridDefaults.gridOption);

            $scope.botServiceNowLibGridOptions = {};
            $scope.botServiceNowLibGridOptions.columnDefs = [
                { name: 'Ticket No.', displayName: 'Ticket No.', field: 'auditTrailConfig.serviceNowTicketRefObj.number', cellTemplate:'<a target="_blank" href="{{row.entity.auditTrailConfig.serviceNowTicketRefObj.ticketLink}}">{{row.entity.auditTrailConfig.serviceNowTicketRefObj.number}}</a>',cellTooltip: true},
                { name: 'Name', field:'auditTrailConfig.name',cellTooltip: true},
                { name: 'Category', displayName: 'Category', field:'auditTrailConfig.serviceNowTicketRefObj.category',cellTooltip: true},
                { name: 'Description', field:'auditTrailConfig.serviceNowTicketRefObj.shortDesc',cellTooltip: true},
                { name: 'Status', field:'auditTrailConfig.serviceNowTicketRefObj.state',cellTemplate:'<span style="vertical-align: text-top;">{{row.entity.auditTrailConfig.serviceNowTicketRefObj.state}}&nbsp;&nbsp;&nbsp;<i class="fa fa-info-circle cursor" style="vertical-align: bottom;" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></span>',cellTooltip: true},
                { name: 'Priority', field:'auditTrailConfig.serviceNowTicketRefObj.priority',cellTooltip: true},
                { name: 'Created At', field: 'auditTrailConfig.serviceNowTicketRefObj.createdOn ', cellTemplate:'<span title="{{row.entity.auditTrailConfig.serviceNowTicketRefObj.createdOn | timestampToLocaleTimeWith}}">{{row.entity.auditTrailConfig.serviceNowTicketRefObj.createdOn | timestampToLocaleTimeWith}}</span>', cellTooltip: true},
                { name: 'Resolved At', field: 'auditTrailConfig.serviceNowTicketRefObj.resolvedAt', cellTemplate:'<span title="{{row.entity.auditTrailConfig.serviceNowTicketRefObj.resolvedAt | timestampToLocaleTimeWith}}">{{row.entity.auditTrailConfig.serviceNowTicketRefObj.resolvedAt  | timestampToLocaleTimeWith}}</span>', cellTooltip: true}
            ];
            $scope.botServiceNowLibGridOptions.data=[];
            angular.extend($scope.botServiceNowLibGridOptions,botLibraryUIGridDefaults.gridOption);
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
            }
        });

        /*APIs registered are triggered as ui-grid is configured 
        for server side(external) pagination.*/

        angular.extend($scope.botServiceNowLibGridOptions,botLibraryUIGridDefaults.gridOption, {
            onRegisterApi :function(gridApi) {
                $scope.gridApi = gridApi;
                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                    if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                        $scope.paginationParams.sortBy = sortColumns[0].field;
                        $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                        $scope.botServiceNowLibraryGridView();
                    }
                });
                //Pagination for page and pageSize
                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                    $scope.paginationParams.page = newPage;
                    $scope.paginationParams.pageSize = pageSize;
                    $scope.pageSizeNew = pageSize;
                    $scope.currentCardPage = newPage;
                    $scope.botServiceNowLibraryGridView();
                });
            }
        });

        $scope.cardPaginationChange = function() {
            $scope.isBotLibraryPageLoading = true;
            $scope.paginationParams.page = $scope.paginationParams.page + 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            $scope.botStatus();
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

        $scope.imageForCard = function(result) {
            if(result.category === 'Active Directory' || result.category === 'Database Management') {
                result.imagePath = 'images/bots/activeDirectory.png';
            }else if(result.category === 'User Management') {
                result.imagePath = 'images/bots/userManagement.png';
            }else if(result.category === 'Service Management') {
                result.imagePath = 'images/bots/serviceManagement.png';
            }else if(result.category === 'Upgrade') {
                result.imagePath = 'images/bots/upgrade.png';
            }else if(result.category === 'Monitoring') {
                result.imagePath = 'images/bots/monitoring.png';
            }else if(result.category === 'Installation') {
                result.imagePath = 'images/bots/installation.png';
            }else if(result.category === 'OpenDJ LDAP') {
                result.imagePath = 'images/bots/openDJ.png';
            }else {
                result.imagePath = 'images/bots/applicationDeployment.png';
            }
        };

        $scope.botsDetails = function(result) {
            $scope.showLoadRecord();
            $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
            if(result.metaData.totalRecords >= 24) {
                $scope.showLoadMore = true;
                $scope.showRecords = true;
            }
            if(result.metaData.totalRecords === $scope.botLibGridOptions.data.length) {
                $scope.showLoadRecord();
            }
            $scope.statusBar = "Showing " + ($scope.botLibGridOptions.data.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.botLibGridOptions.data.length) + " of " + $filter('number')(result.metaData.totalRecords) + " entries";
            $scope.isBotLibraryPageLoading = false;
        };

        $scope.clearSearchString = function() {
            $scope.botLibrarySearch = '';
        };

        // Function is to get the response and then transform the data accordingly- By RLE0534

        $scope.dataTransform = function(param){

            genSevs.promiseGet(param).then(function (result) {
                $scope.botServiceNowLibGridOptions.totalItems = result.metaData.totalRecords;
                for(var i=0;i<result.auditTrails.length;i++) {

                    if(!result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj || !result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.number) {
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj = {
                            ticketNo: "-"
                        }
                        if(result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.ticketNo)
                            result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.number = result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.ticketNo;
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.category = result.auditTrails[i].auditTrailConfig.category;
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.shortDesc = result.auditTrails[i].auditTrailConfig.description;
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.state = result.auditTrails[i].status;
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.priority = "-";
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.createdOn = result.auditTrails[i].startedOn;
                        result.auditTrails[i].auditTrailConfig.serviceNowTicketRefObj.resolvedAt = result.auditTrails[i].endedOn;
                    }

                }
                $scope.botServiceNowLibGridOptions.data =result.auditTrails;
                $scope.tempData = $scope.botServiceNowLibGridOptions.data;
                $scope.isBotServiceNowPageLoading = false;
                // $scope.isBotLibraryPageLoading = false;
                $scope.isBotDetailsLoading = false;
            }, function(error) {
                $scope.isBotServiceNowPageLoading = false;
                $scope.isBotDetailsLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        }

        $scope.botServiceNowLibraryGridView = function(resetPage) {
            //$scope.isBotServiceNowPageLoading = true;
            //$scope.isBotDetailsLoading = true;
            //lib.gridOptions=[];
            //var datefilter = "";
            $scope.getBotSummary();
            if(resetPage){
                $scope.resetPageData();
            }
            if($scope.failedBotsselected)
                var param={
                    inlineLoader:true,
                    url:'/audit-trail?startdate='+ $scope.ticketsResolveStartsOn+ '&enddate='+ $scope.ticketsResolveEndsOn +'&page=' + $scope.botServiceNowLibGridOptions.paginationCurrentPage +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder + '&filterBy=actionStatus:failed'
                };
            else if($scope.scheduledBotsSelected)
                var param={
                    inlineLoader:true,
                    url:'/audit-trail?startdate='+ $scope.ticketsResolveStartsOn+ '&enddate='+ $scope.ticketsResolveEndsOn +'&filterBy=actionStatus:success&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=startedOn&sortOrder=' + $scope.paginationParams.sortOrder+'&type=snow'
                };
            else if($scope.runningBotsselected)
                var param={
                    inlineLoader:true,
                    url:'/audit-trail?startdate='+ $scope.ticketsResolveStartsOn+ '&enddate='+ $scope.ticketsResolveEndsOn +'&page=' + $scope.botServiceNowLibGridOptions.paginationCurrentPage +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=startedOn&sortOrder=' + $scope.paginationParams.sortOrder
                };

            $scope.dataTransform(param);
        };

        $scope.blueprintExecute = function(botsDetails) {
            if(botsDetails){
                botsCreateService.getBlueprintList(botsDetails.orgId,botsDetails.execution.subtype,botsDetails.execution.name).then(function(response){
                    $scope.originalBlueprintList=[];
                    if(response.blueprints.length>0){
                        $scope.originalBlueprintList = response.blueprints;
                        var reqBody = {};
                        reqBody.blueprintIds = [$scope.originalBlueprintList[0]._id];
                        reqBody.type = 'blueprints'
                        botsCreateService.getBlueprintDetails($scope.originalBlueprintList[0]._id).then(function(response){
                            $modal.open({
                                animate: true,
                                templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunchParams.html",
                                controller: "blueprintLaunchParamsCtrl as bPLP",
                                backdrop : 'static',
                                keyboard: false,
                                resolve: {
                                    items: function() {
                                        return response;
                                    }
                                }
                            }).result.then(function(blueprintObj) {
                                reqBody.monitorId = blueprintObj.monitorId;
                                reqBody.domainName = blueprintObj.domainName;
                                reqBody.envId = blueprintObj.launchEnv;
                                reqBody.tagServer = blueprintObj.tagServer;
                                reqBody.stackName = blueprintObj.stackName;
                                botsCreateService.botExecute(botsDetails.id,reqBody).then(function (response) {
                                    response.botId=botsDetails.id;
                                    genSevs.showLogsForBots(response);
                                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                                },
                                function (error) {
                                    if(error) {
                                        error = error.responseText || error;
                                        if (error.message) {
                                            toastr.error(error.message);
                                        } else {
                                            toastr.error(error);
                                        }
                                    }
                                });
                            }, function() {

                            });
                        })
                    } else {
                        toastr.error('No Matching Blueprint Found in the Database');
                        return false;
                    }
                });
            }
        }
        $scope.getBotSummary = function () {
            $scope.isBotDetailsLoading  = true;
            var param = {
                inlineLoader: true,
                url: '/audit-trail/bots-summary?startdate=' + $scope.ticketsResolveStartsOn+ '&enddate='+ $scope.ticketsResolveEndsOn
            };
            genSevs.promiseGet(param).then(function (result) {
                $scope.pageLoadBot=false;
                $scope.botSummary = result;
                $scope.totalRuns = result.totalRuns;
                $scope.timeSaved = result.totalSavedTimeForBots;
            }, function (error) {
                $scope.pageLoadBot=false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
            $scope.isBotDetailsLoading = false;
        }
        $scope.botLibraryGridView = function () {
            $rootScope.onBodyLoading = false;
            lib.gridOptions=[];
            var param={
                inlineLoader:true,
                url:'/bot?page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
            };
            genSevs.promiseGet(param).then(function (result) {
                    $scope.showLoadRecord();
                    $scope.botLibGridOptions.totalItems = result.metaData.totalRecords;
                    if(result.metaData.totalRecords >= 24) {
                        $scope.showLoadMore = true;
                        $scope.showRecords = true;
                    }
                    if($scope.isCardViewActive){
                        $scope.botLibGridOptions.data = $scope.botLibGridOptions.data.concat(result.bots);
                        for(var i=0;i<result.bots.length;i++){
                            $scope.imageForCard(result.bots[i]);
                        }
                        if(result.metaData.totalRecords == $scope.botLibGridOptions.data.length) {
                            $scope.showLoadMore = false;
                            $scope.showRecords = false;
                        }
                    } else {
                        $scope.botLibGridOptions.data =  result.bots;
                        $scope.showLoadMore = false;
                        $scope.showRecords = false;
                    }
                    $scope.statusBar = "Showing " + ($scope.botLibGridOptions.data.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.botLibGridOptions.data.length) + " of " + $filter('number')(result.metaData.totalRecords) + " entries";
                    $scope.isBotLibraryPageLoading = false;
                    $scope.isBotDetailsLoading = false;
            }, function(error) {
                $scope.isBotLibraryPageLoading = false;
                $scope.isBotDetailsLoading = false;
                toastr.error(error);
                $scope.errorMessage = "No Records found";
            });
        };


        $scope.botStatus = function() {
            if($scope.botLibAction || $scope.botLibType || $scope.botLibCategory) {
                $rootScope.applyFilter();
                return false;
            }
            if($scope.totalBotsSelected) {
                $scope.botLibraryGridView();
            } else if($scope.runningBotsselected || $scope.scheduledBotsSelected || $scope.failedBotsselected) {
                $scope.botServiceNowLibraryGridView();
            } else {
                $scope.botLibraryGridView();
            }
        };

        $scope.searchBotNameCategory = function(pageNumber) {
            $scope.isBotLibraryPageLoading = true;
            $scope.searchString = $scope.botLibrarySearch;
            $scope.searchText = true;
            $scope.showLoadMore = false;
            $scope.showRecords = false;
            lib.gridOptions=[];
            if(pageNumber) {
                $scope.botLibGridOptions.data = [];
                pageNumber = 1;
            }
            var param={};
            if($scope.totalBotsSelected) {
                 param={
                    inlineLoader: true,
                    url:'/bot?page=' + pageNumber +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            } else if($scope.runningBotsselected) {
                 param={
                    inlineLoader: true,
                    url:'/audit-trail?page=' + pageNumber +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=startedOn&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            } else if($scope.scheduledBotsSelected) {
                 //var datefilter = "";
                //  if($scope.ticketsResolveStartsOn){
                //      datefilter += '&ticketsdate=' + $scope.ticketsResolveStartsOn.toString("yyyyMMdd");
                //  }
                // if($scope.ticketsResolveStartsOn){
                //     datefilter += '&ticketedate=' + $scope.ticketsResolveEndsOn.toString("yyyyMMdd");
                // }
                 param={
                    inlineLoader: true,
                    url:'/audit-trail?actionStatus=success&page=' + pageNumber +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            } else if($scope.failedBotsselected) {
                 param={
                    inlineLoader: true,
                    url:'/audit-trail?actionStatus=failed&page=' + pageNumber +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=startedOn&sortOrder=' + $scope.paginationParams.sortOrder+'&search=' + $scope.searchString
                };
            }
            genSevs.promiseGet(param).then(function (result) {
                if($scope.isCardViewActive){
                    $scope.botLibGridOptions.data = result.bots;
                    for(var i=0;i<result.bots.length;i++){
                        $scope.imageForCard(result.bots[i]);
                    }
                } else {
                    $scope.botLibGridOptions.data = result.bots;
                }
                $scope.botsDetails(result);
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
            $scope.isBotLibraryPageLoading = true;
            $scope.searchText = false;
            $scope.showLoadMore = false;
            $scope.showRecords = false;
            $scope.paginationParams.page = 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            if($scope.isCardViewActive)
                $scope.paginationParams.pageSize = 24;
            else
                $scope.paginationParams.pageSize = 10;
            //$scope.paginationParams.pageSize = 24;
            $scope.botStatus();
        };

        $rootScope.applyFilter = function () {
            var param={};
            if ($scope.botLibAction) {
                param={
                    url:'/bot?filterBy=action:'+$scope.botLibAction +'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
                applyFilterAjax(param)
            } else if($scope.botLibType) {
                param={
                    url:'/bot?filterBy=type:'+$scope.botLibType+'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
                applyFilterAjax(param)
            } else if($scope.botLibCategory) {
                param={
                    url:'/bot?filterBy=category:'+$scope.botLibCategory+'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
                applyFilterAjax(param)
            } else if($scope.botLibCategory && $scope.botLibAction && $scope.botLibType){
                param={
                    url:'/bot?filterBy=action:'+$scope.botLibAction +'+type:'+ $scope.botLibType +'+category:'+ $scope.botLibCategory +'&page=' + $scope.paginationParams.page +'&pageSize=' + $scope.paginationParams.pageSize +'&sortBy=' + $scope.paginationParams.sortBy +'&sortOrder=' + $scope.paginationParams.sortOrder
                };
                applyFilterAjax(param)
            }

        };
function applyFilterAjax(param){
    genSevs.promiseGet(param).then(function (result) {
        if($scope.isCardViewActive){
            $scope.botLibGridOptions.data = result.bots;
            if(result.metaData.totalRecords >= 24) {
                $scope.showLoadMore = true;
                $scope.showRecords = true;
            }
            if(result.metaData.totalRecords === $scope.botLibGridOptions.data.length) {
                $scope.showLoadRecord();
            }
            for(var i=0;i<result.bots.length;i++){
                $scope.imageForCard(result.bots[i]);
            }
        } else {
            $scope.botLibGridOptions.data = result.bots;
        }
        $scope.botsDetails(result);
        $scope.isBotLibraryPageLoading = false;
        $scope.isOpenSidebar = false;
    }, function(error) {
        $scope.isBotLibraryPageLoading = false;
        toastr.error(error);
        $scope.errorMessage = "No Records found";
    });
}
        $scope.botSync = function(botsDetails) {
            $scope.activeClass = botsDetails;
            botsCreateService.syncIndividualBot(botsDetails.gitHubId,botsDetails.id).then(function(response){
                $scope.activeClass = {};
            });
        };

        $scope.setResolveDates = function(period){
            $scope.customSetDate=true;
            $scope.setClass=period;
            $scope.StartsOn;
            $scope.EndsOn;
            $scope.botLibGridOptions.data = $scope.tempData;
            $scope.isBotServiceNowPageLoading = true;
            var formatD = function(dt){

                var dd = dt.getDate();
                var mm = dt.getMonth()+1;
                //January is 0!
                var yyyy = dt.getFullYear();
                if(dd<10){dd='0'+dd}
                if(mm<10){mm='0'+mm}
                return(mm+'/'+dd+'/'+yyyy);
            }

            var curr = new Date();
            

            if(period == 'today'){
                $scope.ticketsResolveStartsOn = formatD(curr);
                $scope.ticketsResolveEndsOn = formatD(curr);
            }
            if(period == 'week'){
                var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
                var last = first + 6; // last day is the first day + 6
                $scope.ticketsResolveStartsOn = formatD(new Date(curr.setDate(first)));
                $scope.ticketsResolveEndsOn = formatD(new Date(curr.setDate(last)));


            }
            if(period == 'month'){
                var mon = curr.getMonth(),
                    yr = curr.getFullYear();
                $scope.ticketsResolveStartsOn = formatD(new Date(yr,mon,1));
                $scope.ticketsResolveEndsOn = formatD(new Date(yr,mon + 1,0));
            }

            $scope.showScheduledBotsFilterDate();
        }
        
        $scope.setCardView = function(pageReset) {
            $scope.isBotLibraryPageLoading = true;
            $scope.showLoadRecord();
            $scope.isCardViewActive = true;
            $scope.botsCardViewSelection = "bots-tab-active";
            $scope.botsTableViewSelection = "";
            if(pageReset) {
                $scope.botLibGridOptions.data = [];
                $scope.paginationParams.page = 1;
                $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            }
            $scope.paginationParams.pageSize = 24;
            if($scope.botLibrarySearch){
                $scope.searchBotNameCategory();    
            } else {
                $scope.botStatus();
            }
        };

        $scope.botsTableView = function(pageReset) {
            $scope.isBotLibraryPageLoading = true;
            $scope.isCardViewActive = false;
            $scope.botsCardViewSelection = "";
            if(pageReset=='reportBot'){
                $scope.botsTableViewReport = "bots-tab-active";
                $scope.botsReportView=true;
            } else {
                $scope.botsTableViewSelection = "bots-tab-active";
                if(pageReset) {
                $scope.botLibGridOptions.data = [];
                $scope.paginationParams.page = 1;
                $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            }
            $scope.paginationParams.pageSize = $scope.pageSizeNew;
            if($scope.botLibrarySearch){
                $scope.searchBotNameCategory();    
            } else {
                $scope.botStatus();
            }
            }
            
            
        };



        var gridBottomSpace = 250;
        $scope.gridHeight = workzoneUIUtils.makeTabScrollable('botLibraryPage') - gridBottomSpace;


        $rootScope.$on('BOTS_LIBRARY_REFRESH', function() {
            $scope.showLoadRecord();
            $scope.isBotLibraryPageLoading = true;
            $scope.botLibGridOptions.data = [];
            $scope.paginationParams.page = 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            if($scope.botLibrarySearch){
                $scope.searchBotNameCategory();    
            } else {
                $scope.botStatus();
            }
        });

        $scope.clearFilter = function(name) {
            if(name === $scope.botLibCategory) {
                $scope.botLibCategory = '';
            } else if(name === $scope.botLibAction) {
                $scope.botLibAction = '';
            } else {
                $scope.botLibType = '';
            }
            $scope.botStatus();
        };

        //Function to resetting the data for the "botServiceNowLibGridOptions" object accordingly - By RLE5034

        $scope.resetPageData = function(){
            $scope.botServiceNowLibGridOptions.data = [];
            $scope.paginationParams.page = 1;
            $scope.botServiceNowLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
        }

        $scope.RefreshBotsLibrary = function() {
            $scope.isBotDetailsLoading = true;

            $scope.getBotSummary();
            //Fixing the refresh button when a list is selected.
            if($scope.failedBotsselected){
                $scope.showFailedBots(true);
                return;
            }
            if($scope.totalBotsSelected){
                $scope.showAllBots();
                return;
            }
            if($scope.runningBotsselected){
                $scope.showBotsRunning(true);
                return;
            }
            if($scope.scheduledBotsSelected){
                $scope.showScheduledBots(true);
                return;
            }
            //end fix.

            $scope.noShowForServiceNow = true;
            $scope.showLoadMore = false;
            $scope.showRecords = false;
            $scope.botLibGridOptions.data = [];
            $scope.showLoadRecord();
            $scope.botLibAction = '';
            $scope.botLibCategory = '';
            $scope.botLibType = '';
            $scope.numofCardPages = 0;
            $scope.paginationParams.page = 1;
            $scope.botLibGridOptions.paginationCurrentPage = $scope.paginationParams.page;
            if($scope.isCardViewActive)
                $scope.paginationParams.pageSize = 24;
            else
                $scope.paginationParams.pageSize = 10;
            //$scope.paginationParams.pageSize = 24;
            $scope.paginationParams.sortBy = 'lastRunTime';
            $scope.paginationParams.sortOrder = 'desc';
            $scope.botLibrarySearch = '';
            //lib.summary();
            $scope.botStatus();
        };
        $scope.showAllBots = function() {
            //$scope.isCardViewActive = true;
            $scope.noShowForServiceNow = true;
            $scope.clearSearchString();
            $scope.isBotLibraryPageLoading = true;
            $scope.botLibGridOptions.data = [];
            $scope.showLoadRecord();
            $scope.paginationParams.page = 1;
            $scope.totalBotsSelected = true;
            $scope.runningBotsselected = false;
            $scope.failedBotsselected = false;
            $scope.scheduledBotsSelected = false;
            $scope.isBotDetailsLoading = true;
            if($scope.isCardViewActive)
                $scope.paginationParams.pageSize = 24;
            else
                $scope.paginationParams.pageSize = 10;
            //$scope.paginationParams.pageSize = 24;
            $scope.botLibraryGridView();
        };

        //Transition from "Running Bots" to "Total Runs", Which shows total number of (bots running + bot succeed)

        $scope.showBotsRunning = function(resetPage) {
            $scope.isOpenSidebar = false;
            $scope.noShowForServiceNow = false;
            $scope.clearSearchString();
            $scope.isBotLibraryPageLoading = false;
            $scope.isBotServiceNowPageLoading = true;
            $scope.showForServiceNow = true;
            $scope.showLoadRecord();
            $scope.runningBotsselected = true;
            $scope.totalBotsSelected = false;
            $scope.failedBotsselected = false;
            $scope.scheduledBotsSelected = false;
            $scope.paginationParams.pageSize = $scope.pageSizeNew;
            lib.gridOptions.data=[];
            if(resetPage){
                $scope.resetPageData();
            }
            $scope.botServiceNowLibraryGridView();
        };

        // Transition from "Failed Bots" to "Failed Runs"- By RLE0534

        $scope.showFailedBots = function(resetPage) {
            $scope.isOpenSidebar = false;
            $scope.noShowForServiceNow = false;
            $scope.clearSearchString();
            $scope.isBotLibraryPageLoading = false;
            $scope.isBotServiceNowPageLoading = true;
            $scope.showLoadRecord();
            $scope.failedBotsselected = true;
            $scope.runningBotsselected = false;
            $scope.totalBotsSelected = false;
            $scope.scheduledBotsSelected = false;
            $scope.showForServiceNow = true;
            $scope.paginationParams.pageSize = $scope.pageSizeNew;
            lib.gridOptions.data=[];
            if(resetPage){
                $scope.resetPageData();
            }
            $scope.botServiceNowLibraryGridView();

        };

        $scope.showScheduledBots = function(resetPage) {
            $scope.isOpenSidebar = false;
            $scope.getBotSummary();
            //$scope.resetDateFields();
            $scope.clearSearchString();
            $scope.isBotServiceNowPageLoading = true;
            $scope.showLoadRecord();
            $scope.failedBotsselected = false;
            $scope.runningBotsselected = false;
            $scope.totalBotsSelected = false;
            $scope.scheduledBotsSelected = true;
            $scope.noShowForServiceNow = false;
            $scope.showForServiceNow = true;
            $scope.paginationParams.pageSize = $scope.pageSizeNew;
            if (resetPage) {
                $scope.resetPageData();
            }
            lib.gridOptions.data = [];
            $scope.botServiceNowLibraryGridView();
            //lib.gridOptions=[];
            //var datefilter = "";
        }

        $scope.historyLogs=function(hist) {
            if(hist.actionLogId){
                var logDetails = {
                    actionId : hist.actionLogId,
                    botId: hist.auditId
                }
                var jenkinsLogDetails = {
                    jenkinsServerId:hist.actionLogId,
                    jobName: hist.auditTrailConfig.jenkinsJobName,
                    buildNumber: hist.auditTrailConfig.jenkinsBuildNumber
                }
                if(hist.auditCategory === 'jenkins') {
                    genSevs.showLogsForJenkins(jenkinsLogDetails);
                } else {
                    genSevs.showLogsForBots(logDetails);
                }

            } else {
                toastr.error("Logs are getting generated. Please wait");
            }
        }
        // Filter function added for Ticket Resolved and Failed Runs - By RLE0534

        $scope.resetFields = function(){            
            $scope.customSetDate=true;
            $scope.resetDateFields();
            $scope.botServiceNowLibraryGridView();
          
        }
        $scope.dateChange= function(dates,types){
            if(types=='EndsOn'){
                dates=dates.split('/')
                $scope.ticketsResolveEndsOn=dates[1]+'/'+dates[0]+'/'+dates[2];
            }
            if(types=='StartsOn'){
                dates=dates.split('/')
                $scope.ticketsResolveStartsOn=dates[1]+'/'+dates[0]+'/'+dates[2];
            }
        }
        $scope.showScheduledBotsFilterDate = function() {
            if(!$scope.ticketsResolveStartsOn){
                if(!$scope.ticketsResolveEndsOn){
                    $scope.isBotServiceNowPageLoading = false;
                    $scope.isBotDetailsLoading = false;
                    toastr.error('Please select the dates','Error');
                    return;
                }
                //datefilter += '&ticketsdate=' + $scope.ticketsResolveStartsOn.toString("yyyyMMdd");
            }
            if($scope.ticketsResolveStartsOn){
                if(!$scope.ticketsResolveEndsOn){
                    $scope.isBotServiceNowPageLoading = false;
                    $scope.isBotDetailsLoading = false;
                    toastr.error('End Date not set','Error');
                    return;
                }
                //datefilter += '&ticketsdate=' + $scope.ticketsResolveStartsOn.toString("yyyyMMdd");
            }
            if($scope.ticketsResolveEndsOn){
                if(!$scope.ticketsResolveStartsOn){
                    $scope.isBotServiceNowPageLoading = false;
                    $scope.isBotDetailsLoading = false;
                    toastr.error('Start Date not set','Error');
                    return;
                }
                //datefilter += '&ticketedate=' + $scope.ticketsResolveEndsOn.toString("yyyyMMdd");
            }
            $scope.tempData = $scope.botServiceNowLibGridOptions.data;
            $scope.botServiceNowLibraryGridView('resetPage');

        };
        $scope.getBotSummary();
        $scope.setCardView();


    }]);
})(angular);