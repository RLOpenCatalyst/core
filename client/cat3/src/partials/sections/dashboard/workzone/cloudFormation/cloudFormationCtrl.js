/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.cloudFormation', ['apis.workzone', 'ui.bootstrap','utility.array'])
		.service('CftSetting', [function() {
			return {
				stackEventsPollerTime: 200
			};
		}])
		.controller('cloudFormationCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', 'arrayUtil', '$timeout','uiGridOptionsService', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, arrayUtil, $timeout, uiGridOptionsService, workzoneUIUtils) {
			var gridBottomSpace = 5;
			var cftPaginationDefault = uiGridOptionsService.options();
			$scope.paginationParams = cftPaginationDefault.pagination;
			$scope.currentCardPage = cftPaginationDefault.pagination.page;
			$scope.cardsPerPage = cftPaginationDefault.pagination.pageSize = 30;
			$scope.numofCardPages = 0; //Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;

			$scope.setFirstPageView = function() {
				$scope.currentCardPage = $scope.paginationParams.page = 1;
			};

			

			$rootScope.$on('WZ_CFT_SHOW_LATEST', function(){
				//TO DO: Set sort params to show latest CFT in first page.
				//$scope.paginationParams.sortBy = 'status';
				//$scope.paginationParams.sortOrder = 'desc';
				$scope.setFirstPageView();
				$scope.cftListCardView();
			});

			$rootScope.$on('WZ_CFT_REFRESH_CURRENT', function(){
				$scope.cftListCardView();
			});

			$scope.cardPaginationCftChange = function() {
				$scope.paginationParams.page = $scope.currentCardPage;
				$scope.paginationParams.pageSize = $scope.cardsPerPage;
				$scope.cftListCardView();
			};

			$scope.refreshCurrentPage = function(){
				$rootScope.$emit('WZ_CFT_REFRESH_CURRENT');    
			};

			angular.extend($scope, {
				cftListCardView: function() {
					$scope.isCloudFormationPageLoading = true;
					$scope.stacks = [];
					// service to get the list of containers.
					workzoneServices.getPaginatedCFT($scope.envParams, $scope.paginationParams).then(function(result) {
						$scope.totalCards = result.data.metaData.totalRecords;
						if($scope.totalCards > $scope.paginationParams.pageSize) {
							$scope.isCloudFormationPaginationShow = true;
						} else {
							$scope.isCloudFormationPaginationShow = false;
						}
						$scope.isCloudFormationPageLoading = false;
						$scope.stacks = result.data.cftList;
						$scope.numofCardPages = Math.ceil($scope.totalCards / $scope.paginationParams.pageSize);
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
							colorRepresentationClass = 'orange';
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
						//refreshes the list once the cft is deleted.
						$scope.cftListCardView();                                
						$scope.stacks=arrayUtil.deleteObjectById($scope.stacks,stack._id);
					},function(){
						
					});
				}
			});
			$scope.init = function () {
				$scope.isCloudFormationPageLoading = true;
				$scope.setFirstPageView();
				$scope.envParams = $rootScope.requestParams;
				$scope.cftListCardView();
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('cloudFormationPage') - gridBottomSpace;
			}
			$scope.init();
		}
	]);
})(angular);