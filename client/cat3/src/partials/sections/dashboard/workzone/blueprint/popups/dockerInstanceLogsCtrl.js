/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */

(function (angular) {
	"use strict";
	 angular.module('workzone.blueprint')
	.controller('dockerInstanceLogsCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', 'instanceSetting', '$interval', 'instanceLogs', function($scope, $modalInstance, items, workzoneServices, instanceSetting, $interval, instanceLogs) {
		angular.extend($scope, {
			logList: []				
		});
		var promise = instanceLogs.showInstanceLogs(items._id);
		promise .then(function(resolveMessage) {
			console.log(resolveMessage);
			$modalInstance.dismiss('cancel');
		},function(rejectMessage) {
			console.log(rejectMessage);
			$scope.errorMessage = rejectMessage;
		},function(notifyMessage) {
			if(notifyMessage.fullLogs) {
				$scope.logList = notifyMessage.logs;
			} else {
				$scope.logList.push.apply($scope.logList, notifyMessage.logs);
			}
		});

		angular.extend($scope, {
			logList: [],
			cancel: function() {
				instanceLogs.stopLogsPolling();
			}
		});
	}]);
})(angular);