/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpActionHistoryCtrl', ['$scope', '$rootScope', '$modal', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'workzoneServices', function($scope, $rootScope, $modal, $timeout, uiGridOptionsClient, uiGridConstants, workzoneServices) {
			var cpInstance = $scope.$parent.cpInstance;
			$scope.instInfo = cpInstance;
			$scope.tabData = [];
			var gridOptions = uiGridOptionsClient.options().gridOption;
			$scope.cpActionHistoryGridOptions = gridOptions;
			$scope.isActionHistoryPageLoading = true;
			
			$scope.initGrids = function(){
				$scope.cpActionHistoryGridOptions.data='tabData';
				$scope.cpActionHistoryGridOptions.columnDefs = [
					{ name:'Type',field:'name',cellTooltip: true, sort: { direction: 'uiGridConstants.ASC' }},
					{ name:'Status',field:'success',cellTooltip: true},
					{ name:'Data',
					  cellTemplate:'<ul><li title="{{actionKey}} : {{actionValue.join() || actionValue}}" ng-repeat="(actionKey, actionValue) in row.entity.actionData">{{actionKey}} : {{actionValue.join() || actionValue}}</li></ul>'},
					{ name:'Timestamp', field: 'timeStarted', 
					  cellTemplate:'<span title="{{row.entity.timeStarted  | timestampToLocaleTime}}">{{row.entity.timeStarted  | timestampToLocaleTime}}</span>'},
					{ name:'Users',field:'user',cellTooltip: true},
					{ name:'More Info',width: 120,
					  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.moreInfo(row.entity)"></i></div>'}
				];
			};
			angular.extend($scope, {
				cpActionHistoryListView: function() {
					// service to get the list of action history
					if (cpInstance._id) {
						workzoneServices.getInstanceActionLogs(cpInstance._id).then(function(result){
							$scope.tabData = [];
							
							$timeout(function() {
								$scope.tabData = result.data;
								$scope.isActionHistoryPageLoading = false;
							},100);
						}, function(){
							$scope.errorMessage = "No Records found";
						});
					}
				},
			});

			$scope.moreInfo = function(actionHistoryData){
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceLogs.html',
					controller: 'cpActionHistoryLogCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								actionHistoryData: actionHistoryData,
								cpInstance : cpInstance
							};
						}
					}
				});
				modalInstance.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
				}, function() {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			$scope.init = function(){
				$scope.initGrids();
				$scope.cpActionHistoryListView();
			};
			$scope.init();
		}]).controller('cpActionHistoryLogCtrl',['$scope', '$modalInstance', 'items', 'workzoneServices', 'instanceSetting', '$interval',function($scope, $modalInstance, items, workzoneServices, instanceSetting, $interval){
			if(items.actionHistoryData.auditType === 'BOTs') {
				$scope.botLogs = true;
			}
			var _instance = items.cpInstance;
			console.log(_instance);
			$scope.instanceName = _instance.name;
        	$scope.actionItem='';
			if($scope.botLogs) {
                $scope.actionItem = items.actionHistoryData.actionLogId;
			}
			else {
                $scope.actionItem = items.actionHistoryData;
			}
			var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function(logObj) {
					if (logObj instanceof Array && logObj.length) {
						return logObj[logObj.length - 1].timestamp;
					}
				},
				logsPolling: function() {
					$scope.timerObject = $interval(function() {
						if($scope.botLogs) {
							workzoneServices.getActionHistoryLogs(_instance.auditTrailConfig.nodeIds[0],$scope.actionItem)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logListDelta.push.apply($scope.logListDelta, response.data);
								}
							});
						} else {
							workzoneServices.getActionHistoryLogs(_instance._id,$scope.actionItem._id)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logListDelta.push.apply($scope.logListDelta, response.data);
								}
							});
						}
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
			if($scope.botLogs) {
				workzoneServices.getActionHistoryLogs(_instance.auditTrailConfig.nodeIds[0],$scope.actionItem)
				.then(function(response) {
					if (response.data.length) {
						helper.lastTimeStamp = helper.getlastTimeStamp(response);
						$scope.logListInitial = response.data;
						helper.logsPolling();
					}
				});
			} else {
				workzoneServices.getActionHistoryLogs(_instance._id,$scope.actionItem._id)
				.then(function(response) {
					if (response.data.length) {
						helper.lastTimeStamp = helper.getlastTimeStamp(response);
						$scope.logListInitial = response.data;
						helper.logsPolling();
					}
				});
			}

			/*workzoneServices.getActionHistoryLogs(_instance._id,$scope.actionItem._id).then(function(response) {
				helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
				$scope.logListInitial = response.data;
				helper.logsPolling();
			});*/

			$scope.$on('$destroy', function() {
				$interval.cancel($scope.timerObject);
			});
		}
	]);
})(angular);