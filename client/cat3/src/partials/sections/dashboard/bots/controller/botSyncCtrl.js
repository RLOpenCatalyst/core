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
            var botLibraryUIGridDefaults = uiGridOptionsService.options();
	        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
	        $scope.paginationParams=[];
	        $scope.numofCardPages = 0;
	        $scope.paginationParams.page = 1;
	        $scope.paginationParams.pageSize = 24;
	        $scope.paginationParams.sortBy = 'lastRunTime';
	        $scope.paginationParams.sortOrder = 'desc';
	        angular.extend(botLibraryUIGridDefaults.gridOption, {enableRowSelection: true,
                    enableSelectAll: true,
                    selectionRowHeaderWidth: 35,multiSelect:true,enableRowHeaderSelection: true
            });
            $scope.initGrids = function(){
	            $scope.botSyncGrid={};
	            $scope.botSyncGrid.columnDefs= [
	                { name: 'BOT Name',displayName:'BOT Name',field:'name',cellTooltip: true},
	                { name: 'BOT Id',displayName:'BOT Id',field:'id',cellTooltip: true},
	                { name: 'BOT Type',displayName:'BOT Type',field:'type',cellTooltip: true},
	                { name: 'Status',field:'status',cellTemplate:'<span ng-show="row.entity.status==\'new\'" class="materialGreen">New</span>' + '<span ng-show="row.entity.status==\'updated\'" class="materialBlue">Updated</span>' + '<span ng-show="row.entity.status==\'deleted\'" class="materialRed">Deleted</span>', cellTooltip: true},
	                { name: 'Category',field:'category', cellTooltip: true},
	                { name: 'Scheduled',field:'scheduled', cellTooltip: true}
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
	                $scope.botId = [];
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
	                        $scope.botServiceNowLibraryGridView();
	                    }
	                });
	                //Pagination for page and pageSize
	                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
	                    $scope.paginationParams.page = newPage;
	                    $scope.paginationParams.pageSize = pageSize;
	                    $scope.currentCardPage = newPage;
	                    $scope.botSyncGridView();
	                });
	            }
	        });

			$scope.botSyncGridView = function() {
				$scope.isBotSyncPageLoading = true;
	            botsCreateService.getGitHubSyncDetails().then(function (result) {
                    $scope.botSyncGrid.data =  result.botsData;
                    $scope.botSyncGrid.totalItems = result.metaData;
                    $scope.isBotTimeSavedPageLoading = false;
                    $scope.isBotSyncPageLoading = false;
	            });
			}
			$scope.botSyncGridView();
        }
    ]);
})(angular);