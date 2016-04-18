/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.cloudFormation', ['apis.workzone', 'ngAnimate', 'ui.bootstrap','utility.array'])
		.service('CftSetting', [function() {
			return {
				stackEventsPollerTime: 200
			};
		}])
		.controller('cloudFormationCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', 'arrayUtil', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, arrayUtil, workzoneUIUtils) {
			$rootScope.$on('WZ_ENV_CHANGE_START', function(){
				$scope.isCloudFormationPageLoading = true;
				$scope.stacks = [];
			});
			$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				$scope.isCloudFormationPageLoading = false;
				$scope.stacks = data.stacks;
                workzoneUIUtils.makeTabScrollable('cloudFormationPage');
			});
			angular.extend($scope, {
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
				},

				getInfo: function(stack) {
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/cloudFormation/popups/stackInfo.html',
						controller: 'stackInfoCtrl',
						backdrop : 'static',
						keyboard: false,
						size: 'lg',
						resolve: {
							items: function() {
								return stack._id;
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						
					});
				},

				removeCftStack: function(stack) {
					var modalInstance=$modal.open({
						animation:true,
						templateUrl:'src/partials/sections/dashboard/workzone/cloudFormation/popups/removeCFT.html',
						controller:'removeCFTCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve:{
							items:function(){
								return stack;
							}
						}
					});

					modalInstance.result.then(function(){                                
						$scope.stacks=arrayUtil.deleteObjectById($scope.stacks,stack._id);
					},function(){
						
					});
				}
			});
		}
	]);
})(angular);