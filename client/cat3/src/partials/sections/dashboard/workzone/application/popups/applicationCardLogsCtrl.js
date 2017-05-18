/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.application')
		.controller('applicationCardLogsCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'workzoneEnvironment', 'items', function($scope, $modalInstance, workzoneServices, workzoneEnvironment, items) {
			console.log(items);
			/*var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function(logObj) {
					if (logObj instanceof Array && logObj.length) {
						return logObj[logObj.length - 1].timestamp;
					}
				},
				logsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getAppCardLogs(items._id, '?timestamp=' + helper.lastTimeStamp)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logList.push(response.data);
								}
							});
					}, instanceSetting.logCheckTimer * 100);
				},
				stopPolling: function() {
					$interval.cancel($scope.timerObject);
				}
			};*/

			angular.extend($scope, {
				//logList: [],
				cancel: function() {
					//helper.stopPolling();
					$modalInstance.dismiss('cancel');
				},
				//timerObject: undefined
			});

			var projectId = workzoneEnvironment.getEnvParams().proj;

			workzoneServices.getAppCardLogs(items.applicationNodeIP, projectId).then(function(response) {
				//helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
				$scope.logList = response.data;
				console.log($scope.logList);
				//helper.logsPolling();
			}, function(error) {
				$scope.logList = error;
			});
		}
	]);
})(angular);