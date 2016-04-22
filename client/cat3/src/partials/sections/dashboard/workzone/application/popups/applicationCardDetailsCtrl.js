/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.application')
		.controller('applicationCardDetailsCtrl', ['$scope', '$modal', '$modalInstance', 'workzoneServices', 'workzoneEnvironment', 'items', function($scope, $modal, $modalInstance, workzoneServices, workzoneEnvironment, items) {
			$scope.applicationsDetails = items;
			var appDetail = {}
			angular.extend($scope, {
				cancel: function () {
					$modalInstance.dismiss('cancel');
				},
				viewAppCardLogs: function (nodeIp) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/application/popups/applicationCardLogs.html',
						controller: 'applicationCardLogsCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function () {
								return nodeIp;
							}
						}
					}).result.then(function () {

					}, function () {

					});
				},
			});

			appDetail.init = function () {
				appDetail.gridOptions = {
					paginationPageSizes: [10, 20, 50, 75],
					paginationPageSize: 10,
					enableColumnMenus: false,
					enableScrollbars: true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 0,
					columnDefs: [
						{name: 'Node IP', field: 'applicationNodeIP', displayName: 'Node IP'},
						{name: 'Last Deploy', field: 'applicationLastDeploy', displayName: 'Last Deploy'},
						{name: 'Status', field: 'applicationStatus', displayName: 'Status'},
						{
							name: 'Action',
							width: 70,
							enableSorting: false,
							displayName: 'Logs',
							cellTemplate: '<i class="fa fa-info-circle cursor" title="More Info" ng-click="appInfo(app)"></i>'
						},
					],
					data:[{},{}]

				};
				// workzoneServices.getApplicationHistoryForEnv().then(function (response) {
				// 	appDetail.gridOptions.data = response.data;
				// });
			}
			appDetail.init();
			return appDetail;
}]);
})();