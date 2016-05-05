/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpLogsCtrl', ['$scope', 'workzoneServices', 'instanceSetting', '$interval', 'instanceLogs', function($scope, workzoneServices, instanceSetting, $interval, instanceLogs) {
			$scope.iscpLogsLoading = true;
			var cpInstance = $scope.$parent.cpInstance;
			angular.extend($scope, {
				logList: []		
			});
			var promise = instanceLogs.showInstanceLogs(cpInstance._id);
			promise .then(function(resolveMessage) {
				console.log(resolveMessage);
			},function(rejectMessage) {
				console.log(rejectMessage);
			},function(notifyMessage) {
				if(notifyMessage.fullLogs) {
					$scope.isCpLogsLoading = false;
					$scope.logList = notifyMessage.logs;
					$scope.iscpLogsLoading = false;
				} else {
					$scope.logList.push.apply($scope.logList, notifyMessage.logs);
				}
			});
		}
	]);
})();