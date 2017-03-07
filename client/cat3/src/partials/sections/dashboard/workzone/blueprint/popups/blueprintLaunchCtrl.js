/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.blueprint')
		.controller('blueprintLaunchCtrl', ['$scope', '$rootScope', '$modalInstance', 'bpItem', 'workzoneServices', 'workzoneEnvironment', 'instanceLogs', function($scope, $rootScope, $modalInstance, bpItem, workzoneServices, workzoneEnvironment, instanceLogs) {
		console.log(bpItem);
			if(bpItem.bp.blueprintType || bpItem.bp.botLinkedSubCategory) {
				$scope.isBPLogsLoading = true;
				$scope.isNewInstanceLogsPromise = false;
				var helper = {
					showNewInstanceLogs: function(newInstanceId){
						var promise = instanceLogs.showInstanceLogs(newInstanceId);
						$scope.isNewInstanceLogsPromise = true;
						promise.then(function(resolveMessage) {
							console.log(resolveMessage);
						},function(rejectMessage) {
							console.log(rejectMessage);
							$scope.logsErrorMessage = rejectMessage;
						},function(notifyMessage) {
							if(notifyMessage.fullLogs) {
								$scope.logListInitial = notifyMessage.logs;
								$scope.isInstanceLogsLoading = false;
							} else {
								if(notifyMessage.logs.length){
									$scope.logListDelta.push.apply($scope.logListDelta, notifyMessage.logs);
								}
							}
							instanceLogs.scrollBottom();
						});
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
							if (bpItem.bp.blueprintType === 'aws_cf' || bpItem.bp.botLinkedSubCategory === 'aws_cf') {
								msgStr = 'Stack Id : ' + $scope.launchResponse.stackId + '. You can view your stack in cloudformation tab';
							} else if (bpItem.bp.blueprintType === 'azure_arm' || bpItem.bp.botLinkedSubCategory === 'azure_arm') {
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
					logListInitial: [],
					logListDelta: [],
					cancel: function() {
						if($scope.isNewInstanceLogsPromise){
							instanceLogs.stopLogsPolling();
						}
						$modalInstance.dismiss('cancel');
					}
				});

				var envParams = workzoneEnvironment.getEnvParams();
				var versionsList = [];
				var versionOptional;
				if(bpItem.bp.blueprintConfig){
					if(bpItem.bp.blueprintConfig.infraManagerData && bpItem.bp.blueprintConfig.infraManagerData.versionsList){
						versionsList = bpItem.bp.blueprintConfig.infraManagerData.versionsList;
						versionOptional = versionsList[versionsList.length-1].ver;
					}
				}else{
					versionOptional = bpItem.bp.version ? bpItem.bp.version : 1;
				}
				var selectedVersionBpId = bpItem.bp.selectedVersionBpId;
				var monitorId = bpItem.monitorId;
				if(bpItem && bpItem.bp && bpItem.bp.selectedVersionBpId){
					selectedVersionBpId = bpItem.bp.selectedVersionBpId;
				} else if(bpItem.bp.botType){
					selectedVersionBpId = bpItem.bp.botId;
				} else{
					selectedVersionBpId = bpItem.bp._id;
				}
				var lEnv=null;
				if(envParams && envParams.env){
					lEnv=envParams.env;
				} 
				if(bpItem.launchEnv){
					lEnv=bpItem.launchEnv;
				}
				workzoneServices.launchBlueprint(selectedVersionBpId, versionOptional, lEnv, bpItem.stackName,bpItem.domainName,bpItem.tagServer,monitorId).then(function(bpLaunchResponse) {
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
						helper.showNewInstanceLogs($scope.launchResponse.id[0]);
						$scope.isNewInstanceLogsPromise = true;
					}
					//event to update the instance tab when blueprint is launched.
					$rootScope.$emit('WZ_INSTANCES_SHOW_LATEST');
					//event to update the Cloud Formation tab when blueprint is launched.
					if(bpLaunchResponse.data.stackId) {
						$rootScope.$emit('WZ_CFT_SHOW_LATEST');
					//event to update the AzureARM tab when blueprint is launched.
					} else if(bpLaunchResponse.data.armId) {
						$rootScope.$emit('WZ_AzureARM_SHOW_LATEST');
					}
				},function(bpLaunchError) {
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
			}
		}
	]);
})(angular);