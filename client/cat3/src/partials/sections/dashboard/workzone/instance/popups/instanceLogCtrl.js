/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	 angular.module('workzone.instance')
	.controller('instanceLogsCtrl', ['$scope', '$rootScope', '$modalInstance', 'items', 'workzoneServices', 'instanceSetting', '$interval', 'instanceLogs', function($scope, $rootScope , $modalInstance, items, workzoneServices, instanceSetting, $interval, instanceLogs) {
		$scope.instanceName = items.name;
		$scope.isInstanceLogsLoading = true;
		angular.extend($scope, {
			logList: []				
		});
		var promise = instanceLogs.showInstanceLogs(items._id);
		promise .then(function(resolveMessage) {
			//event to update the instance tab when docker cookbook is run and logs are closed.
			/*if(items.docker){
				$rootScope.$emit('WZ_INSTANCES_REFRESH_CURRENT');
			}*/
			console.log(resolveMessage);
			$modalInstance.dismiss('cancel');
		},function(rejectMessage) {
			console.log(rejectMessage);
			$scope.errorMessage = rejectMessage;
		},function(notifyMessage) {
			if(notifyMessage.fullLogs) {
				$scope.logList = notifyMessage.logs;
				$scope.isInstanceLogsLoading = false;
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