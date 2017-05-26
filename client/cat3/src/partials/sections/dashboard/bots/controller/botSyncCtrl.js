/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botSyncCtrl',['$scope', '$rootScope', '$state', '$timeout', 'genericServices', 'botsCreateService', 'uiGridOptionsService', 'toastr','$modal',
        function($scope, $rootScope, $state, $timeout, genericServices, botsCreateService, uiGridOptionsService, toastr,$modal){            
        	var treeNames = ['BOTs','BOTs Sync'];   
            $rootScope.$emit('treeNameUpdate', treeNames);
            $scope.actionStatus = 'sync';
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
	            	{ name: 'Status',field:'status',cellTemplate:'<span ng-show="row.entity.status==\'new\'" class="materialGreen">New</span>' + '<span ng-show="row.entity.status==\'updated\'" class="materialBlue">Updated</span>' + '<span ng-show="row.entity.status==\'deleted\'" class="materialRed">Deleted</span>', cellTooltip: true},
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
	                console.log(botLibraryUIGridDefaults.gridOption);
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
				if($scope.gitHubId){
					$scope.isBotSyncPageLoading = true;
					$scope.isBotSyncDetailsLoading = true;
	        		//$scope.paginationParams.pageSize = 25;
		            botsCreateService.getGitHubSyncDetails($scope.actionStatus,$scope.gitHubId,$scope.paginationParams.page, $scope.paginationParams.pageSize, $scope.paginationParams.sortBy, $scope.paginationParams.sortOrder).then(function (result) {
	                    $scope.botSyncGrid.data =  result.githubsync;
	                    $scope.botSyncGrid.totalItems = result.metaData.totalRecords;
	                    $scope.botSyncGrid.botData = result.metaData;
	                    $scope.isBotSyncPageLoading = false;
	                    $scope.isBotSyncDetailsLoading = false;
		            });
				}
			};
			$scope.getGitHubDetails = function() {
	        	botsCreateService.getGitHubDetails().then(function(response){
	        		$scope.gitHubDetails =  response.data;
	        		$scope.gitHubId = response.data[0]._id;		
	        		$scope.botSyncGridView();
	        	});
	        };    
			$scope.getGitHubDetails();
		
			$scope.postSyncBots = function() {
				var reqBody = $scope.botId;
				botsCreateService.postBotSync($scope.gitHubId,$scope.botId).then(function(response){
					toastr.success('GitHub Sync Successfull');
					$state.go('dashboard.bots.library');
				});
			}
        }
    ]);
})(angular);