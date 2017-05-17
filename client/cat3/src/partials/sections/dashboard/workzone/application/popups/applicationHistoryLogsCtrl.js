/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.application')
		.controller('applicationHistoryLogsCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'workzoneEnvironment', 'items', function($scope, $modalInstance, workzoneServices, workzoneEnvironment, items) {
			angular.extend($scope, {
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
			});
			workzoneServices.getApplicationHistoryLogs(items._id).then(function(response) {
				$scope.logList = response.data;
			}, function(response) {
				$scope.logList = response.data;
			});
		}
	]);
})(angular);