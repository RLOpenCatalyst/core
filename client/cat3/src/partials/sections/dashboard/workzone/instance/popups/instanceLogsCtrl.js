/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	 angular.module('workzone.instance')
		.controller('instanceLogsCtrl', ['$scope', '$rootScope', '$modalInstance', 'items', 'workzoneServices', 'instanceSetting', 'instanceLogs', function($scope, $rootScope , $modalInstance, items, workzoneServices, instanceSetting, instanceLogs) {
			$scope.instanceName = items.name;
			$scope.isInstanceLogsLoading = true;
			angular.extend($scope, {
				logListInitial: [],
				logListDelta: []			
			});
			var promise = instanceLogs.showInstanceLogs(items._id);
			promise .then(function(resolveMessage) {
				console.log(resolveMessage);
			},function(rejectMessage) {
				console.log(rejectMessage);
				$scope.errorMessage = rejectMessage;
			},function(notifyMessage) {
				if(notifyMessage.fullLogs) {
					$scope.logListInitial = notifyMessage.logs;
					$scope.isInstanceLogsLoading = false;
				} else {
					$scope.logListDelta.push.apply($scope.logListDelta, notifyMessage.logs);
				}
				instanceLogs.scrollBottom();
			});

			angular.extend($scope, {
				logList: [],
				cancel: function() {
					instanceLogs.stopLogsPolling();
					$modalInstance.dismiss('cancel');
				}
			});
		}
	]);
})(angular);