/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
   "use strict";
	angular.module('workzone.application')
		.controller('applicationCardDetailsCtrl', ['$scope','$rootScope', '$modal', '$modalInstance', 'workzoneServices', 'workzoneEnvironment', 'items','uiGridOptionsServices', function($scope,$rootScope, $modal, $modalInstance, workzoneServices, workzoneEnvironment, items,uiGridOptiSer) {
			$scope.applicationsDetails = items;
			var appDetail = {
				gridOptions:uiGridOptiSer.options().gridOption
			}
			angular.extend($scope, {
				cancel: function () {
					$modalInstance.dismiss('cancel');
				},
				viewAppCardLogs: function (nodeIp) {
					$rootScope.$emit('VIEW-APP-LOGS',nodeIp);
				},
			});

			appDetail.init = function () {
				appDetail.gridOptions.useExternalPagination= false;
				appDetail.gridOptions.useExternalSorting=false;
				appDetail.gridOptions.columnDefs= [
						{name: 'Node IP', field: 'applicationNodeIP', displayName: 'Node IP'},
						{name: 'Last Deploy', field: 'applicationLastDeploy', displayName: 'Last Deploy'},
						{name: 'Status', field: 'applicationStatus', displayName: 'Status'},
						{
							name: 'Action',
							width: 70,
							enableSorting: false,
							displayName: 'Logs',
							cellTemplate: '<i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.viewAppCardLogs(row.entity)"></i>'
						},
					];
				workzoneServices.getCardHistoryList($scope.applicationsDetails).then(function (response) {
					appDetail.gridOptions.data = response.data;
				});
			};
			appDetail.init();
			return appDetail;
}]);
})();