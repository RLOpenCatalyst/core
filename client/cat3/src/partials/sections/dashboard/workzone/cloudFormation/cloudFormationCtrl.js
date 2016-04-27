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
		.controller('cloudFormationCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', 'arrayUtil', '$timeout', function($scope, workzoneServices, $modal, $rootScope, arrayUtil, $timeout) {
			
			$scope.paginationParams = {
				pages: {
					page: 1,
					pageSize: 1
				}
			};
			$scope.currentCardPage = $scope.paginationParams.pages.page;
			$scope.cardsPerPage = $scope.paginationParams.pages.pageSize;
			$scope.numofCardPages = 0; //Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;

			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				$scope.isCloudFormationPageLoading = true;
				$scope.envParams=requestParams;
				$scope.cftListCardView();
			});
			$scope.cardPaginationCftChange = function() {
				$scope.paginationParams.pages = {
					page: $scope.currentCardPage,
					pageSize: $scope.cardsPerPage
				};
				$scope.cftListCardView();
			};
			angular.extend($scope, {
				cftListCardView: function() {
					$scope.isCloudFormationPageLoading = true;
					$scope.stacks = [];
					// service to get the list of containers.
					workzoneServices.getPaginatedCFT($scope.envParams, $scope.paginationParams).then(function(result) {
						$scope.totalCards = result.data.metaData.totalRecords;
						$scope.isCloudFormationPageLoading = false;
						$scope.numofCardPages = Math.ceil($scope.totalCards / $scope.paginationParams.pages.pageSize);
					},function(error) {
						$scope.isCloudFormationPageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
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