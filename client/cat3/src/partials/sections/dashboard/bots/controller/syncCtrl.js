/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('syncCtrl',['$scope', '$rootScope', '$state', '$timeout', 'genericServices', 'botsCreateService', 'uiGridOptionsService', 'toastr','$modal',
        function($scope, $rootScope, $state, $timeout, genericServices, botsCreateService, uiGridOptionsService, toastr,$modal){            
        	genericServices.getTreeNew().then(function (orgs) {
				$rootScope.organObject=orgs;
				$rootScope.organNewEnt=[];
				$rootScope.organNewEnt.org = orgs[0];
				$rootScope.organNewEnt.buss = orgs[0].businessGroups[0];
				$rootScope.organNewEnt.proj = orgs[0].businessGroups[0].projects[0];
			});
        	var botsSyncCtrl = this;
        	botsSyncCtrl.newEnt = [];
        	var treeNames = ['BOTs','BOTs Sync'];   
            $rootScope.$emit('treeNameUpdate', treeNames);
            var botLibraryUIGridDefaults = uiGridOptionsService.options();
	        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
	        botLibraryUIGridDefaults.gridOption.paginationPageSize = 25;
	        botLibraryUIGridDefaults.gridOption.paginationPageSizes = [25,50,75];
	        $scope.paginationParams=[];
	        $scope.paginationParams.page = 1;
	        $scope.paginationParams.pageSize = 25;
	        $scope.paginationParams.sortBy = 'executionCount';
	        $scope.paginationParams.sortOrder = 'desc';
	        angular.extend(botLibraryUIGridDefaults.gridOption, {enableRowSelection: true,
                    enableSelectAll: true,
                    selectionRowHeaderWidth: 35,multiSelect:true,enableRowHeaderSelection: true
            });

            $scope.botId = [];

            $scope.initGrids = function(){
	            $scope.botSyncGrid={};
	            $scope.botSyncGrid.columnDefs= [
	            	{ name: 'Status',field:'status',cellTemplate:'<span ng-show="row.entity.status==\'new\'" class="materialGreen">New</span>' + '<span ng-show="row.entity.status==\'modified\'" class="materialBlue">Updated</span>' + '<span ng-show="row.entity.status==\'deleted\'" class="materialRed">Deleted</span>', cellTooltip: true},
	                { name: 'BOT Name',displayName:'BOT Name',field:'name',cellTooltip: true},
	                { name: 'BOT Id',displayName:'BOT Id',field:'id',cellTooltip: true},
	                { name: 'BOT Type',displayName:'BOT Type',field:'type',cellTooltip: true},
	                { name: 'Category',field:'category', cellTooltip: true},
	                { name: 'Scheduled',field:'isScheduled',cellTemplate:'<span title="Scheduled" ng-show="row.entity.isScheduled===true"><i class="fa fa-lg fa-fw fa-clock-o"></i></span>' + '<span ng-show="row.entity.isScheduled==false">-</span>'}
	            ];
	            $scope.botSyncGrid.data=[];
	            angular.extend($scope.botSyncGrid,botLibraryUIGridDefaults.gridOption);
	        };
        	$scope.initGrids();

        	/*APIs registered are triggered as ui-grid is configured 
	        for server side(external) pagination.*/
	        angular.extend($scope.botSyncGrid,botLibraryUIGridDefaults.gridOption, {
	            onRegisterApi :function(gridApi) {
	                $scope.gridApi = gridApi;
	                gridApi.selection.on.rowSelectionChanged($scope,function(row){
                        if(row.isSelected){
                            $scope.botId.push(row.entity.id);
                        } else {
                            $scope.botId.splice(row.entity.id,1);
                        }

                    });
                    gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
                        angular.forEach(rows,function(row){
                            if(row.isSelected){
                                $scope.botId.push(row.entity.id);
                            } else {
                                $scope.botId.splice(row.entity.id,1);
                            }
                        });
                    });
	                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
	                    if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
	                        $scope.paginationParams.sortBy = sortColumns[0].field;
	                        $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
	                        $scope.botSyncGridView();
	                    }
	                });
	                //Pagination for page and pageSize
	                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
	                    $scope.paginationParams.page = newPage;
	                    $scope.paginationParams.pageSize = pageSize;
	                    $scope.actionStatus = 'list';
	                    $scope.botSyncGridView();
	                });
	            }
	        });

			$scope.setFirstPageView = function(){
                $scope.botSyncGrid.paginationCurrentPage = $scope.paginationParams.page = 1;
            };
            $scope.setPaginationDefaults = function() {
                $scope.paginationParams.sortBy = 'executionCount';
                $scope.paginationParams.sortOrder = 'desc';
                if($scope.paginationParams.page !== 1){
                    $scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
                }
            };
            $scope.setPaginationDefaults();

			$scope.botSyncGridView = function() {
				if(botsSyncCtrl.newEnt.gitHubId){
					$scope.isBotSyncPageLoading = true;
					$scope.isBotSyncDetailsLoading = true;
		            botsCreateService.getGitHubSyncDetails($scope.actionStatus,botsSyncCtrl.newEnt.gitHubId,$scope.paginationParams.page, $scope.paginationParams.pageSize, $scope.paginationParams.sortBy, $scope.paginationParams.sortOrder).then(function (result) {
	                    $scope.botSyncGrid.data =  result.githubsync;
	                    $scope.botSyncGrid.totalItems = result.metaData.totalRecords;
	                    $scope.botSyncGrid.botData = result.metaData;
	                    $scope.isBotSyncPageLoading = false;
	                    $scope.isBotSyncDetailsLoading = false;
		            });
				} else {
					$scope.botSyncGrid.data = [];
				}
			};
			$scope.getGitHubDetails = function() {
	        	botsCreateService.getGitHubDetails().then(function(response){
	        		$scope.gitHubDetails =  response.data;
	        		botsSyncCtrl.newEnt.gitHubId = response.data[0]._id;	
	        		$scope.actionStatus = 'cancel';
					botsCreateService.getGitHubSyncDetails($scope.actionStatus,botsSyncCtrl.newEnt.gitHubId,$scope.paginationParams.page, $scope.paginationParams.pageSize, $scope.paginationParams.sortBy, $scope.paginationParams.sortOrder).then(function (result) {
					});
					$scope.actionStatus = 'sync';
	        		$scope.botSyncGridView();
	        	});
	        };    

	        $scope.init = function () {
        		$scope.getGitHubDetails();
	        }

			$scope.searchBotNameCategory = function(pageNumber) {
	            $scope.isBotSyncPageLoading = true;
	            $scope.searchString = $scope.botSyncSearch;
	            $scope.searchText = true;
	            if(pageNumber) {
	                $scope.botSyncGrid.data = [];
	                pageNumber = 1;
	            }
	            $scope.actionStatus = 'list';
	            botsCreateService.getGitHubSyncDetailsSearch($scope.actionStatus,botsSyncCtrl.newEnt.gitHubId,$scope.paginationParams.page, $scope.paginationParams.pageSize, $scope.paginationParams.sortBy, $scope.paginationParams.sortOrder,$scope.searchString).then(function (result) {
	                $scope.botSyncGrid.data = result.githubsync;
	                $scope.botSyncGrid.totalItems = result.metaData.totalRecords;
	                $scope.botSyncGrid.botData = result.metaData;
	                $scope.isBotSyncPageLoading = false;
	            }, function(error) {
	                $scope.isBotSyncPageLoading = false;
	                toastr.error(error);
	                $scope.errorMessage = "No Records found";
	            });
	        };
        	$scope.clearBotSearchText = function() {
	            $scope.botSyncSearch = '';
	            $scope.botSyncGrid.data = [];
	            $scope.isBotSyncPageLoading = true;
	            $scope.searchText = false;
	            $scope.paginationParams.page = 1;
	            $scope.botSyncGrid.paginationCurrentPage = $scope.paginationParams.page;
	            botLibraryUIGridDefaults.gridOption.paginationPageSize = 25;
	            $scope.actionStatus = 'list';
	            $scope.botSyncGridView();
	        };
		
			$scope.postSyncBots = function() {
				var reqBody = $scope.botId;
				botsCreateService.postBotSync(botsSyncCtrl.newEnt.gitHubId,$scope.botId).then(function(response){
					toastr.success('GitHub Sync Successfull');
					$state.go('dashboard.bots.library');
				});
			}

			$rootScope.applyFilter = function() {
				$scope.isBotSyncPageLoading = true;
				$scope.actionStatus = 'list';
				botsCreateService.applyFilter($scope.actionStatus, botsSyncCtrl.newEnt.gitHubId, $scope.botSyncType, $scope.botSyncCategory, $scope.botSyncStatus, $scope.paginationParams.page, $scope.paginationParams.pageSize, $scope.paginationParams.sortBy, $scope.paginationParams.sortOrder,$scope.searchString).then(function(result){
					$scope.botSyncGrid.data = result.githubsync;
	                $scope.botSyncGrid.totalItems = result.metaData.totalRecords;
	                $scope.botSyncGrid.botData = result.metaData;
	                $scope.isBotSyncPageLoading = false;
				});
			}

			$scope.backToLibrary = function() {
				$state.go('dashboard.bots.library');
			}

			$scope.init();
        }
    ]);
})(angular);