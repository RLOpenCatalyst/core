/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.bots')
		.controller('botChefLogCtrl', ['$q', '$scope', 'workzoneServices', '$timeout', 'orchestrationSetting', 'toastr','genericServices', function ($q, $scope, workzoneServices, $timeout, orchestrationSetting, toastr,genSevs) {
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
			/*var resetAll = function(){
				$scope.isInstanceListLoading = true;
				chefLogData.chefHistoryItem = {};
				chefLogData.nodeIdsWithActionLog = {};
				helper.stopPolling(); //Ensuring polling is stopped, eventhough the scope values for instance id and actionlog id are updated on change
				helper.lastTimeStamp = '';
			};*/
			var init = function () {
				//get the details of one chef history entry
				var param = {
					url : '/bots/' + items.taskId + '/bot-history/' + items.historyId
				};
				genSevs.promiseGet(param).then(function (response) {
					chefLogData.createInstanceList(response);
				});
			};
			chefLogData.createInstanceList = function (historyItem) {
				var nodeIds = [];
				if(historyItem.nodeIds){
					nodeIds = historyItem.nodeIds;
				}else{
					for(var i = 0; i < historyItem.auditTrailConfig.nodeIdsWithActionLog.length;i++){
						nodeIds.push(historyItem.auditTrailConfig.nodeIdsWithActionLog[i].nodeId);
					}
				}
				var nodeIdWithActionLogs = [];
				var requestObj = {
					"instanceIds": nodeIds
				};
				workzoneServices.postRetrieveDetailsForInstanceNames(requestObj).then(function (response) {
					var _jobInstances = response.data;
					var nodeIdsWithActionId = historyItem.nodeIdsWithActionLog ? historyItem.nodeIdsWithActionLog : historyItem.auditTrailConfig.nodeIdsWithActionLog;
					for (var k = 0; k < nodeIdsWithActionId.length; k++) {
						for (var l = 0; l < _jobInstances.length; l++) {
							if (nodeIdsWithActionId[k].nodeId === _jobInstances[l]._id) {
								nodeIdsWithActionId[k].uiNodeName = _jobInstances[l].name;
							}
						}
					}
					nodeIdWithActionLogs = nodeIdsWithActionId;
					chefLogData.chefHistoryItem = historyItem; //saved as we need timestamps from the historyItem
					chefLogData.nodeIdsWithActionLog = nodeIdWithActionLogs; //this can now be used to show instance dropdown
					if (chefLogData.nodeIdsWithActionLog[0]) {
						$scope.isInstanceListLoading = false;
						selectFirstInstance(chefLogData.nodeIdsWithActionLog[0]);
					}
				}, function (error) {
					$scope.isInstanceListLoading = false;
					toastr.error(error);
					$scope.errorMessage = "";
				});
			};
			chefLogData.instanceChange = function () {
				$scope.isLogsLoading = true;
				helper.stopPolling(); //Ensuring polling is stopped, eventhough the scope values for instance id and actionlog id are updated on change
				helper.lastTimeStamp = '';
				if (chefLogData.chefHistoryItem.startedOn && chefLogData.chefHistoryItem.endedOn) {
					var urlParams = '';
					urlParams = 'timestamp=' + chefLogData.chefHistoryItem.startedOn  + '&timestampEnded=' + chefLogData.chefHistoryItem.endedOn;
					var param = {
						url : "/instances/" + $scope.selectedInstance.nodeId + '/actionLogs/' + $scope.selectedInstance.actionLogId +
							'/logs?' + urlParams
						};
					genSevs.promiseGet(param).then(function (response) {
						$scope.isLogsLoading = false;
						var logData = {
							logs: response,
							fullLogs: true
						};
						$scope.logListInitial = logData.logs;
						helper.scrollBottom();
					});

				} else if (chefLogData.chefHistoryItem.startedOn && !chefLogData.chefHistoryItem.endedOn) {
					var urlParams = 'timestamp=' + chefLogData.chefHistoryItem.startedOn;
					var param = {
						url : "/instances/" + $scope.selectedInstance.nodeId + '/actionLogs/' + $scope.selectedInstance.actionLogId +
							'/logs?' + urlParams
						};
					genSevs.promiseGet(param).then(function (response) {
						$scope.isLogsLoading = false;
						helper.lastTimeStamp = helper.getlastTimeStamp(response) || chefLogData.chefHistoryItem.startedOn;
						helper.logsPolling();
						var logData = {
							logs: response,
							fullLogs: true
						};
						$scope.logListInitial = logData.logs;
						helper.scrollBottom();
					});
				}
			};
			init();
			return chefLogData;
		}
		]);
})(angular);