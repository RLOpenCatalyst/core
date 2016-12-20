/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.bots')
		.controller('blueprintLogCtrl', ['$q', '$scope', 'workzoneServices', '$timeout', 'orchestrationSetting', 'toastr', function ($q, $scope, workzoneServices, $timeout, orchestrationSetting, toastr) {
			console.log(items);
			var _instance = items.cpInstance;
			$scope.instanceName = _instance.name;
			var _actionItem = items.actionHistoryData;
			var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function(logObj) {
					if (logObj instanceof Array && logObj.length) {
						return logObj[logObj.length - 1].timestamp;
					}
				},
				logsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getActionHistoryLogs(_instance._id,_actionItem._id)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logListDelta.push.apply($scope.logListDelta, response.data);
								}
							});
					}, instanceSetting.logCheckTimer * 100);
				},
				stopPolling: function() {
					$interval.cancel($scope.timerObject);
				}
			};

			angular.extend($scope, {
				logListInitial: [],
				logListDelta: [],
				cancel: function() {
					helper.stopPolling();
					$modalInstance.dismiss('cancel');
				},
				timerObject: undefined
			});

			workzoneServices.getActionHistoryLogs(_instance._id,_actionItem._id).then(function(response) {
				helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
				$scope.logListInitial = response.data;
				helper.logsPolling();
			});

			$scope.$on('$destroy', function() {
				$interval.cancel($scope.timerObject);
			});
		}
	]);
})(angular);
