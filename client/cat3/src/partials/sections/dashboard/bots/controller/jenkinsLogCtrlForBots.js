/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2017
 */

(function(angular) {
	"use strict";
	angular.module('dashboard.bots')
		.service('orchestrationSetting', [function() {
			return {
				orchestrationLogsPollerInterval: 5000
			};
		}])
		.controller('jenkinsLogCtrlForBots', ['$scope', 'botsCreateService', 'items','$interval', 'orchestrationSetting', '$controller','$timeout', '$modalInstance', function($scope, botsCreateService, items, $interval, orchestrationSetting, $controller, $timeout, $modalInstance) {
			$scope.getJenkinsHistoryDetails = {};  
			angular.extend($scope, {
				logs: {},
				timerObject: '',
				cancel: function() {
					helper.stopPolling();
					$modalInstance.dismiss('cancel');
				}
			});      
			var helper = {
				eventsPolling: function() {
					$scope.timerObject = $interval(function() {
						botsCreateService.getJenkinsLogs(items.jenkinsServerId, items.jobName, items.buildNumber)
							.then(function(response) {
								if (response.data) {
									$scope.logs.output = helper.formatLogs(response.data.output);
								} else {
									$scope.logs.output = helper.formatLogs(response.output);
								}
								$scope.isJenkinsLogLoading = false;

							}, function(error) {
								$scope.logs = error.data.message;
							});
					}, orchestrationSetting.orchestrationLogsPollerInterval);
				},
				stopPolling: function() {
					$interval.cancel($scope.timerObject);
				},
				formatLogs: function(str) {
					return str.replace(/\r?\n/g, "<br />");
				}
			};

			$scope.isJenkinsLogLoading = true;
			$timeout(function(){
				botsCreateService.getJenkinsLogs(items.jenkinsServerId, items.jobName, items.buildNumber).then(function(response) {
					$scope.isJenkinsLogLoading = false;
					if (response.data) {
						$scope.logs.output = helper.formatLogs(response.data.output);
					} else {
						$scope.logs.output = helper.formatLogs(response.output);
					}
					helper.eventsPolling();

				}, function(error) {
					$scope.isJenkinsLogLoading = false;
					$scope.logs = error.data.message;
					//removed the error helper method as it was failing. Need to test this part again.
				});
			}, 10000);
			
			$scope.$on('$destroy', function() {
				$interval.cancel($scope.timerObject);
			});
			// broadcast the cancel function to the parent controller
			$scope.$on('closeWindow', function() {
				$scope.$parent.close = $scope.cancel();
			});
		}
	]);
})(angular);