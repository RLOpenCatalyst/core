/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.orchestration')
		.service('orchestrationSetting', [function() {
			return {
				orchestrationLogsPollerInterval: 5000
			};
		}])
		.controller('jenkinsLogCtrl', ['$scope', 'workzoneServices', '$interval', 'orchestrationSetting', '$controller','$timeout', function($scope, workzoneServices, $interval, orchestrationSetting, $controller,$timeout) {
			var items = $scope.parentItemDetail;
			$scope.getJenkinsHistoryDetails = {};  
			angular.extend($scope, {
				logs: {},
				timerObject: '',
				cancel: function() {
					helper.stopPolling();
				}
			});      
			var resetAll =  function(){
				$scope.getJenkinsHistoryDetails = {}; 
				helper.stopPolling();
			};
			var init = function(){
				workzoneServices.getTaskHistoryItem(items.taskId, items.historyId).then(function(response) {
						$scope.getJenkinsHistoryDetails = response.data; //to store the response so that the jenkinsServerID,jobName and buildNumber can be passed to fetch the logs.
						$scope.getJenkinsLogDetails(response.data);
				});
			};
			var helper = {
				eventsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getJenkinsLogs($scope.getJenkinsHistoryDetails.jenkinsServerId, $scope.getJenkinsHistoryDetails.jobName, $scope.getJenkinsHistoryDetails.buildNumber)
							.then(function(response) {
								if (response.data) {
									$scope.logs.output = helper.formatLogs(response.data.output);
								} else {
									$scope.logs.output = helper.formatLogs(response.output);
								}

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
			$scope.getJenkinsLogDetails = function(historyItem) {
				$scope.isJenkinsLogLoading = true;
				$timeout(function(){
					workzoneServices.getJenkinsLogs(historyItem.jenkinsServerId, historyItem.jobName, historyItem.buildNumber).then(function(response) {
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
			};
			init();
			// on task change event in the parent controller
			$scope.$on('parentChangeCompTask', function (event, args) {
				items = args;
				resetAll();
				init();
			});
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