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
			/*event to update the instance tab when the logs window is closed,
			Maybe after any action say chefClientRun.*/
			$rootScope.$emit('WZ_INSTANCES_REFRESH_CURRENT');
			console.log(resolveMessage);
		},function(rejectMessage) {
			console.log(rejectMessage);
			$scope.errorMessage = rejectMessage;
		},function(notifyMessage) {
			if(notifyMessage.fullLogs) {
				$scope.logListInitial = notifyMessage.logs;
				$scope.isInstanceLogsLoading = false;
			} else {
				if(notifyMessage.logs.length){
					$scope.logListDelta.push.apply($scope.logListDelta, notifyMessage.logs);
				}
			}
		});

		angular.extend($scope, {
			logList: [],
			cancel: function() {
				instanceLogs.stopLogsPolling();
				$modalInstance.dismiss('cancel');
			}
		});
	}]);
})(angular);