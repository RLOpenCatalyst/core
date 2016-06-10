/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpLogsCtrl', ['$scope', 'workzoneServices', 'instanceLogs', function($scope, workzoneServices, instanceLogs) {
			$scope.iscpLogsLoading = true;
			var cpInstance = $scope.$parent.cpInstance;
			angular.extend($scope, {
				logListInitial: [],
				logListDelta: []	
			});
			var promise = instanceLogs.showInstanceLogs(cpInstance._id);
			promise .then(function(resolveMessage) {
				console.log(resolveMessage);
			},function(rejectMessage) {
				console.log(rejectMessage);
			},function(notifyMessage) {
				if(notifyMessage.fullLogs) {
					$scope.logListInitial = notifyMessage.logs;
					$scope.iscpLogsLoading = false;
				} else {
					$scope.logListDelta.push.apply($scope.logListDelta, notifyMessage.logs);
				}
				instanceLogs.scrollBottom();
			});
		}
	]);
})(angular);