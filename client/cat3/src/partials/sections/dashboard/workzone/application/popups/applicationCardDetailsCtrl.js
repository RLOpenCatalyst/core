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
			angular.extend($scope, {
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
				viewAppCardLogs: function(nodeIp) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/application/popups/applicationCardLogs.html',
						controller: 'applicationCardLogsCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return nodeIp;
							}
						}
					}).
					result.then(function() {
						
					}, function() {
						
					});
				},
			});
		}
	]);
})();