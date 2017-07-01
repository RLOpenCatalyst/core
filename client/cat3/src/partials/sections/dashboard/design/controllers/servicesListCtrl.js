/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.design')
    .controller('servicesListCtrl',['$scope', '$rootScope', '$state', 'genericServices','confirmbox', 'toastr', 'servicesCreateService', '$modal', 'uiGridOptionsService', '$timeout', function ($scope, $rootScope, $state, genericServices, confirmbox, toastr, servicesCreateService, $modal, uiGridOptionsService, $timeout) {
        var treeNames = ['Design','Services','Service Library'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        $rootScope.filterhide= $state.params.filterhide;
        $rootScope.showForDesign = $state.params.showForDesign;
        var serviceLibraryUIGridDefaults = uiGridOptionsService.options();
        $scope.paginationParams = serviceLibraryUIGridDefaults.pagination;
        $scope.paginationParams=[];
        $scope.paginationParams.page = 1;
        serviceLibraryUIGridDefaults.gridOption.paginationPageSize = 25;
	    serviceLibraryUIGridDefaults.gridOption.paginationPageSizes = [25,50,75];
	    $scope.paginationParams.pageSize = 25;
        $scope.paginationParams.sortBy = 'createdOn';
        $scope.paginationParams.sortOrder = 'desc';
        $scope.initGrids = function(){
            $scope.serviceGrid={};
            $scope.serviceGrid.columnDefs= [
                { name: 'State',cellTemplate:'<i title="{{row.entity.state}}" class="text-gray fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'Initializing\'"></i>' + '<i title="{{row.entity.state}}" class="text-green fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'Running\'"></i>' +
                '<i title="{{row.entity.state}}" class="text-red fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'Stopped\'"></i>' + '<i title="{{row.entity.state}}" class="text-black fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'Terminated\'"></i>' + '<i title="{{row.entity.state}}" class="text-red fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'Authentication_Error\'"></i>', cellTooltip: true},
                { name: 'Name',field:'name',cellTooltip: true},
                { name: 'Description',field:'desc',cellTooltip: true},
                { name: 'Type',field:'type',cellTooltip: true},
                { name: 'Created On',field:'createdOn',cellTemplate:'<span title="{{row.entity.createdOn  | timestampToLocaleTime}}">{{row.entity.createdOn  | timestampToLocaleTime}}</span>',cellTooltip: true},
                { name: 'Version',field:'version', cellTooltip: true},
                { name: 'More Info',cellTemplate:'<a title="More Info"><i class="fa fa-info font-size-16 cursor" ui-sref="dashboard.design.servicesDescription({serviceDetail:row.entity,listType:1})" ></i></a>'},
                { name: 'Action',cellTemplate:'<span  title="Delete" class="fa fa-trash-o btn btn-danger btn-sg tableactionbutton btnDeleteTask white marginleft10" ng-click="grid.appScope.deleteService(row.entity)"></span>'}
            ];
            $scope.serviceGrid.data=[];
            angular.extend($scope.serviceGrid,serviceLibraryUIGridDefaults.gridOption);
        };
    	$scope.initGrids();

		$scope.serviceGridView = function() {
			$scope.isServiceLibraryPageLoading = true;
            servicesCreateService.getServices($scope.paginationParams.page,$scope.paginationParams.pageSize,$scope.paginationParams.sortBy,$scope.paginationParams.sortOrder).then(function (result) {
                $scope.serviceGrid.data =  result.services;
                $scope.serviceGrid.totalItems = result.metaData.totalRecords;
                $scope.isServiceLibraryPageLoading = false;
            });
		}
		$scope.serviceGridView();

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

		$scope.refreshServiceList = function() {
			$scope.isServiceLibraryPageLoading = true;
			$scope.serviceGrid.data = [];
			$scope.paginationParams.page = 1;
	        serviceLibraryUIGridDefaults.gridOption.paginationPageSize = 25;
		    serviceLibraryUIGridDefaults.gridOption.paginationPageSizes = [25,50,75];
		    $scope.paginationParams.pageSize = 25;
	        $scope.paginationParams.sortBy = 'createdOn';
	        $scope.paginationParams.sortOrder = 'desc';
			$scope.serviceGridView();
		}

		$scope.deleteService = function(serviceObj) {
			var modalOptions = {
				closeButtonText: 'Cancel',
				actionButtonText: 'Delete',
				actionButtonStyle: 'cat-btn-delete',
				headerText: 'Delete Service',
				bodyText: 'Are you sure you want to delete this Service?'
			};
			confirmbox.showModal({}, modalOptions).then(function() {
				servicesCreateService.deleteService(serviceObj.id).then(function(response) {
					console.log(response);
					if (response) {
						toastr.success('Successfully deleted');
						$scope.serviceGridView();
					}
				}, function(data) {
					toastr.error('error:: ' + data.toString());
				});
			});
		}
        
    }]);
})(angular);