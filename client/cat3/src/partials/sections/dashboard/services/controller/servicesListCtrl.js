/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.services')
    .controller('servicesListCtrl',['$scope', '$rootScope', 'moment', '$state', 'genericServices','$filter', 'toastr', 'servicesCreateService', '$modal', 'uiGridOptionsService', '$timeout', function ($scope, $rootScope, moment, $state, genericServices, $filter, toastr, servicesCreateService, $modal, uiGridOptionsService, $timeout) {
        var treeNames = ['Services','Service List'];
        $rootScope.$emit('treeNameUpdate', treeNames);

        var serviceLibraryUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = serviceLibraryUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.paginationParams.page = 1;
        $scope.paginationParams.pageSize = 25;
        $scope.paginationParams.sortBy = 'createdOn';
        $scope.paginationParams.sortOrder = 'desc';
        $scope.initGrids = function(){
            $scope.serviceGrid={};
            $scope.serviceGrid.columnDefs= [
            	{ name: 'Name',field:'name',cellTooltip: true},
                { name: 'Type',field:'type',cellTooltip: true},
                { name: 'Created On',field:'createdOn',cellTemplate:'<span title="{{row.entity.createdOn  | timestampToLocaleTime}}">{{row.entity.createdOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                { name: 'State',field:'state', cellTooltip: true},
                { name: 'Version',field:'version', cellTooltip: true}
            ];
            $scope.serviceGrid.data=[];
            angular.extend($scope.serviceGrid,serviceLibraryUIGridDefaults.gridOption);
        };
    	$scope.initGrids();

    	/*APIs registered are triggered as ui-grid is configured 
        for server side(external) pagination.*/
        angular.extend($scope.serviceGrid,serviceLibraryUIGridDefaults.gridOption, {
            onRegisterApi :function(gridApi) {
                $scope.gridApi = gridApi;
                gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                    if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                        $scope.paginationParams.sortBy = sortColumns[0].field;
                        $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                        $scope.serviceGridView();
                    }
                });
                //Pagination for page and pageSize
                gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                    $scope.paginationParams.page = newPage;
                    $scope.paginationParams.pageSize = pageSize;
                    $scope.currentCardPage = newPage;
                    $scope.serviceGridView();
                });
            }
        });

		$scope.serviceGridView = function() {
			$scope.isServiceLibraryPageLoading = true;
            servicesCreateService.getServices().then(function (result) {
                $scope.serviceGrid.data =  result.services;
                $scope.serviceGrid.totalItems = result.metaData;
                $scope.isServiceLibraryPageLoading = false;
            });
		}
		$scope.serviceGridView();
        
    }]);
})(angular);