/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.azureARM', ['apis.workzone', 'ngAnimate', 'ui.bootstrap','utility.array'])
		.controller('AzureARMCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, workzoneUIUtils) {
			$rootScope.$on('WZ_ENV_CHANGE_START', function(){
				$scope.isAzureARMPageLoading = true;
				$scope.arms = [];
			});
			$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				$scope.arms = data.arms;
				$scope.isAzureARMPageLoading = false;
                workzoneUIUtils.makeTabScrollable('azureARMPage');
			});
			angular.extend($scope, {
				removeARMDeployment: function(arm,index) {
					var modalInstance=$modal.open({
						animation:true,
						templateUrl:'src/partials/sections/dashboard/workzone/azureARM/popups/removeARMDeployment.html',
						controller:'removeARMDeploymentCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve:{
							items:function(){
								return arm;
							}
						}
					});

					modalInstance.result.then(function(){                                
						//$scope.stacks=arrayUtil.deleteObjectById($scope.deployments,arms._id);
						$scope.arms.splice(index,1);
					},function(){
						
					});
				},
				getStackStateColor: function(stackState) {
					var colorRepresentationClass = '';
					switch (stackState) {
						case "CREATE_IN_PROGRESS":
							colorRepresentationClass = '';
							break;
						case "CREATE_FAILED":
							colorRepresentationClass = 'red';
							break;
						case "CREATE_COMPLETE":
							colorRepresentationClass = 'green';
							break;
						default:
							colorRepresentationClass = 'orange';
					}
					return colorRepresentationClass;
				}
			});
		}
	]);
})(angular);