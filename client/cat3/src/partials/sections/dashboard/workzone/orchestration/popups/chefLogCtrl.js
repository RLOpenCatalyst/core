/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.orchestration')
		.controller('chefLogCtrl', ['$q', '$scope', 'workzoneServices', '$timeout', 'orchestrationSetting', function ($q, $scope, workzoneServices, $timeout, orchestrationSetting) {
			/*This controller can be invoked from either of two flows - Chef Log History Item Logs OR Chef Task Execute
			 items object will contain only taskId and historyId. */
			var items = $scope.parentItemDetail;
			$scope.isInstanceListLoading = true;
			angular.extend($scope, {
				logListInitial: [],
				logListDelta: [],
				cancel: function () {
					helper.stopPolling();
				}
			});
			// broadcast the cancel function to the parent controller
			$scope.$on('closeWindow', function() {
				$scope.$parent.close = $scope.cancel();
			});
			var chefLogData = {
				chefHistoryItem: {},
				nodeIdsWithActionLog: {}
			};
			var timerObject;
			var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function (logObj) {
					if (logObj instanceof Array && logObj.length) {
						var lastTime = logObj[logObj.length - 1].timestamp;
						return lastTime;
					}
				},
				scrollBottom : function () {
					$timeout(function () {
						var elm = angular.element(".logsArea");
						elm.scrollTop(elm[0].scrollHeight);
					}, 100);
				},
				logsPolling: function () {
					timerObject = $timeout(function () {
						workzoneServices.getChefJobLogs($scope.selectedInstance.nodeId, $scope.selectedInstance.actionLogId, helper.lastTimeStamp).then(function (resp) {
							if (resp.data.length) {
								var logData = {
									logs: resp.data,
									fullLogs: false
								};
								helper.lastTimeStamp = helper.getlastTimeStamp(logData.logs);
								$scope.logListDelta.push.apply($scope.logListDelta, logData.logs);
								helper.scrollBottom();
							}
							helper.logsPolling();
						});
					}, orchestrationSetting.orchestrationLogsPollerInterval);
				},
				stopPolling: function () {
					$timeout.cancel(timerObject);
				}
			};
			var selectFirstInstance = function (firstInstance) {
				$scope.selectedInstance = firstInstance;
				chefLogData.instanceChange();
			};
			var resetAll = function(){
				$scope.isInstanceListLoading = true;
				chefLogData.chefHistoryItem = {};
				chefLogData.nodeIdsWithActionLog = {};
				helper.stopPolling(); //Ensuring polling is stopped, eventhough the scope values for instance id and actionlog id are updated on change
				helper.lastTimeStamp = '';
			};
			var init = function () {
				//get the details of one chef history entry
				workzoneServices.getTaskHistoryItem(items.taskId, items.historyId).then(function (response) {
					chefLogData.createInstanceList(response.data);
				});
			};
			//method to get the names of the nodes associated to the job and add it to the nodeIdsWithActionLog object.
			chefLogData.createInstanceList = function (historyItem) {
				var nodeIds = [];
				var bluePrintJob = false; //flag for blueprint job
				var bluePrintActionLogs = [];
				var nodeIdWithActionLogs = [];
				// if blueprint job, use blueprintExecutionResults
				if (historyItem.blueprintExecutionResults && historyItem.blueprintExecutionResults[0].result) {
					bluePrintJob = true;
					bluePrintActionLogs = historyItem.blueprintExecutionResults[0].result;
					for (var j = 0; j < bluePrintActionLogs.length; j++) {
						nodeIds.push(bluePrintActionLogs[j].instanceId);
					}
				} else { // if not blueprint job, use nodeIds
					nodeIds = historyItem.nodeIds;
				}
				var requestObj = {
					"instanceIds": nodeIds
				};
				workzoneServices.postRetrieveDetailsForInstanceNames(requestObj).then(function (response) {
					var _jobInstances = response.data;
					//if blueprint job, use blueprintExecutionResults
					if (bluePrintJob) {
						for (var i = 0; i < bluePrintActionLogs.length; i++) {
							bluePrintActionLogs[i].nodeId = bluePrintActionLogs[i].instanceId;
							for (var j = 0; j < _jobInstances.length; j++) {
								if (bluePrintActionLogs[i].instanceId === _jobInstances[j]._id) {
									bluePrintActionLogs[i].uiNodeName = _jobInstances[j].name;
								}
							}
						}
						nodeIdWithActionLogs = bluePrintActionLogs;
					} else {//if not blueprint job, use nodeIdsWithActionLog
						for (var k = 0; k < historyItem.nodeIdsWithActionLog.length; k++) {
							for (var l = 0; l < _jobInstances.length; l++) {
								if (historyItem.nodeIdsWithActionLog[k].nodeId === _jobInstances[l]._id) {
									historyItem.nodeIdsWithActionLog[k].uiNodeName = _jobInstances[l].name;
								}
							}
						}
						nodeIdWithActionLogs = historyItem.nodeIdsWithActionLog;
					}
					chefLogData.chefHistoryItem = historyItem; //saved as we need timestamps from the historyItem
					chefLogData.nodeIdsWithActionLog = nodeIdWithActionLogs; //this can now be used to show instance dropdown
					if (chefLogData.nodeIdsWithActionLog[0]) {
						$scope.isInstanceListLoading = false;
						selectFirstInstance(chefLogData.nodeIdsWithActionLog[0]);
					}
				},
				function (error) {
					$scope.isInstanceListLoading = false;
					console.log(error);
					$scope.errorMessage = "";
				});
			};
			//method called when user changes the instance name from the dropdown.
			chefLogData.instanceChange = function () {
				$scope.isLogsLoading = true;
				helper.stopPolling(); //Ensuring polling is stopped, eventhough the scope values for instance id and actionlog id are updated on change
				helper.lastTimeStamp = '';
				/* when task is completed, with success or failed:
				 - both timestampStarted and timestampEnded will be present
				 - we get full logs, no need to poll
				 */
				if (chefLogData.chefHistoryItem.timestampStarted && chefLogData.chefHistoryItem.timestampEnded) {
					workzoneServices.getChefJobLogs($scope.selectedInstance.nodeId, $scope.selectedInstance.actionLogId, chefLogData.chefHistoryItem.timestampStarted, chefLogData.chefHistoryItem.timestampEnded).then(function (response) {
						$scope.isLogsLoading = false;
						var logData = {
							logs: response.data,
							fullLogs: true
						};
						$scope.logListInitial = logData.logs;
						helper.scrollBottom();
					}, function (error) {
						$scope.isLogsLoading = false;
						console.log(error);
						$scope.errorMessage = "Unable to fetch logs for this instance";
					});
				}
				/* when task is pending or running: ie. during Execute flow or if history is viewed immediately after Execute
				 - only timestampStarted will be present. timestampEnded will be absent
				 - we need to poll for further logs
				 */
				else if (chefLogData.chefHistoryItem.timestampStarted && !chefLogData.chefHistoryItem.timestampEnded) {
					workzoneServices.getChefJobLogs($scope.selectedInstance.nodeId, $scope.selectedInstance.actionLogId, chefLogData.chefHistoryItem.timestampStarted).then(function (response) {
						$scope.isLogsLoading = false;
						helper.lastTimeStamp = helper.getlastTimeStamp(response.data) || chefLogData.chefHistoryItem.timestampStarted;
						helper.logsPolling();
						var logData = {
							logs: response.data,
							fullLogs: true
						};
						$scope.logListInitial = logData.logs;
						helper.scrollBottom();
					}, function (error) {
						$scope.isLogsLoading = false;
						console.log(error);
						$scope.errorMessage = "Unable to fetch logs for this instance";
					});
				}
			};
			init();
			// on task change event in the parent controller
			$scope.$on('parentChangeCompTask', function (event, args) {
				items = args;
				resetAll();
				init();
			});
			return chefLogData;
		}
	]);
})(angular);
