/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.blueprint')
		.controller('blueprintLaunchCtrl', ['$scope', '$rootScope', '$modalInstance', 'bpItem', 'workzoneServices', 'workzoneEnvironment', 'instanceSetting', '$interval', function($scope, $rootScope, $modalInstance, bpItem, workzoneServices, workzoneEnvironment, instanceSetting, $interval) {
			$scope.isBPLogsLoading = true;
			var helper = {
				lastTimeStamp: '',
				getlastTimeStamp: function(logObj) {
					if (logObj instanceof Array && logObj.length) {
						return logObj[logObj.length - 1].timestamp;
					}
				},
				logsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getInstanceLogs($scope.launchResponse.id[0], '?timestamp=' + helper.lastTimeStamp)
							.then(function(response) {
								if (response.data.length) {
									helper.lastTimeStamp = helper.getlastTimeStamp(response);
									$scope.logList.push(response.data);
								}
							});
					}, instanceSetting.logCheckTimer);
				},
				stopPolling: function() {
					$interval.cancel($scope.timerObject);
				}
			};
			var messageHelper = {
				launchMessage:function(){
					var msgStr = '', isSuccess=false;
					if($scope.launchResponse.error){
						isSuccess = false;
						msgStr = $scope.launchResponse.error;
					}
					else{
						isSuccess = true;
						if (bpItem.bp.blueprintType === 'aws_cf') {
							msgStr = 'Stack Id : ' + $scope.launchResponse.stackId + '. You can view your stack in cloudformation tab';
						} else if (bpItem.bp.blueprintType === 'azure_arm') {
							msgStr = 'Deployment Id : ' + $scope.launchResponse.armId + '. You can view your deployment in ARM tab';
						} else {
							msgStr = 'Instance Id : ';
							msgStr += $scope.launchResponse.id.join(',');
							msgStr += '. You can monitor logs from the Launched Instances.';
						}
					}

					return {
						message: msgStr,
						isSuccess:isSuccess
					};
				}
			};

			angular.extend($scope, {
				logList: [],
				cancel: function() {
					helper.stopPolling();
					$modalInstance.dismiss('cancel');
				},
				timerObject: undefined,
			});

			var envParams = workzoneEnvironment.getEnvParams();
			var versionsList = [];
			var versionOptional;

			if(bpItem.bp.blueprintConfig.infraManagerData && bpItem.bp.blueprintConfig.infraManagerData.versionsList){
				versionsList = bpItem.bp.blueprintConfig.infraManagerData.versionsList;
				versionOptional = versionsList[versionsList.length-1].ver;
			}

			workzoneServices.launchBlueprint(bpItem.bp._id, versionOptional, envParams.env, bpItem.stackName).then(function(bpLaunchResponse) {
					$scope.isBPLogsLoading = false;
					var launchingInstance;
					if(bpLaunchResponse.data.id && bpLaunchResponse.data.id.length>0){
						launchingInstance = bpLaunchResponse.data;
					}else if(bpLaunchResponse.data.stackId || bpLaunchResponse.data.armId){
						launchingInstance = bpLaunchResponse.data;
					}
					$scope.launchResponse = launchingInstance;
					$scope.launchMessage = messageHelper.launchMessage();
					//Show logs and poll them, if only one id in array. For CFT, no polling, no id in response. It will be stackId.
					if($scope.launchResponse.id && $scope.launchResponse.id.length===1){
						workzoneServices.getInstanceLogs($scope.launchResponse.id[0]).then(function(response) {
							helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
							$scope.logList = response.data;
							helper.logsPolling();
						});
					}
					//event to update current selected environment data in all tabs
					$rootScope.$emit('WZ_REFRESH_ENV');
				},
				function(bpLaunchError) {
					$scope.isBPLogsLoading = false;
					var message = "Server Behaved Unexpectedly";

					if(bpLaunchError){
						message = bpLaunchError;
					}
					if(bpLaunchError.data){
						message = bpLaunchError.data;
					}
					if (bpLaunchError.data && bpLaunchError.data.message) {
						message = bpLaunchError.data.message;
					}else if(bpLaunchError.responseText){
						message = bpLaunchError.responseText;
					}
					$scope.launchResponse = {error:message};
					$scope.launchMessage = messageHelper.launchMessage();
				});

				$scope.$on('$destroy', function() {
					$interval.cancel($scope.timerObject);
				}
			);
		}
	]);
})();