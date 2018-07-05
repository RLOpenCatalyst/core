/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */

(function (angular) {
	"use strict";
	angular.module('workzone.application').controller('applicationHistoryCtrl', ['$scope', '$rootScope', 'workzoneServices','uiGridOptionsServices', 'workzoneUIUtils', function ($scope, $rootScope, workzoneServices, uiGridOptiSer, workzoneUIUtils) {
		var gridOpt=uiGridOptiSer.options();
		var gridBottomSpace = 5;
		angular.extend($scope, {
			pagiOptionsHistory :gridOpt.pagination,
			historGgridData:[],
			requestParams :$scope.$parent.requestParams,
			viewAppCardLogs: function (logs) {
				$rootScope.$emit('VIEW-APP-LOGS',logs);
			},
			getHistoryData :function(envParams, envNames) {
			$scope.isBusyShow=true;
			$scope.historyGridOptions=angular.extend(gridOpt.gridOption,{
				columnDefs:[
					{ name:'appName',field:'applicationName',displayName:'App Name'},
					{ name:'App-Instance',field:'applicationInstanceName',displayName:'App-Instance'},
					{ name:'Version',field:'applicationVersion',displayName:'Version'},
					{ name:'Host-Name',field:'hostName',displayName:'Host Name'},
					{ name:'applicationNodeIP',field:'applicationNodeIP',displayName:'Node IP'},
					{ name:'Last Deploy',displayName:'Last Deploy',cellTemplate:'<span ng-bind-html="row.entity.applicationLastDeploy | timestampToLocaleTime"></span>'},
					{ name:'Container Name',displayName:'Container Name',cellTemplate:'<span>{{row.entity.containerId || "NA"}}</span>'},
					{ name:'applicationType',field:'applicationType',displayName:'App Type'},
					{ name:'Action',width:70,enableSorting: false,displayName:'Logs',cellTemplate:'<i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.viewAppCardLogs(row.entity)"></i>'},
				],
				onRegisterApi: function(gridApi) {
					$scope.gridApi=gridApi;
					gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
						if( sortColumns[0] &&  sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction){
							$scope.pagiOptionsHistory.sortBy = sortColumns[0].field;
							$scope.pagiOptionsHistory.sortOrder = sortColumns[0].sort.direction;
							getApplicationHistoryService(envParams, envNames ,$scope.pagiOptionsHistory);
						}
					});
					gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
						$scope.pagiOptionsHistory.page=newPage;
						$scope.pagiOptionsHistory.pageSize=pageSize;
						getApplicationHistoryService(envParams, envNames,$scope.pagiOptionsHistory);
					});
				}
			});
			$scope.pagiOptionsHistory.page=1;
			getApplicationHistoryService(envParams, envNames,$scope.pagiOptionsHistory);
		}});
		function getApplicationHistoryService(envParams, envNames,pagiOptionsHistory){
			workzoneServices.getApplicationHistoryForEnv(envNames.env, envParams.proj,pagiOptionsHistory).then(function (response) {
				$scope.historyGridOptions.data= response.data.appDeploy;
				$scope.historGgridData=response.data.appDeploy;
				if(pagiOptionsHistory.page === 1){
					$scope.historyGridOptions.paginationCurrentPage = 1;
				}
				$scope.historyGridOptions.totalItems = response.data.metaData.totalRecords;
			});
		}
		$rootScope.$on('REFRESH-HISTORY',function(){
			getApplicationHistoryService($scope.requestParams.params, $scope.requestParams.paramNames,$scope.pagiOptionsHistory);
		});
		$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams, requestParamNames) {
			$scope.requestParams={params:requestParams,paramNames:requestParamNames};
			$scope.envDetails = requestParams;
			$scope.orgName = requestParamNames.org;
			$scope.selectedEnv = requestParamNames.env;
			$scope.getHistoryData($scope.requestParams.params, $scope.requestParams.paramNames);
			$scope.gridHeight = workzoneUIUtils.makeTabScrollable('applicationPage')-gridBottomSpace;
			workzoneUIUtils.makeTabScrollable('applicationPage');
		});
	}]);
})(angular);