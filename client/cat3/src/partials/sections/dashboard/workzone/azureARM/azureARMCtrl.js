/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.azureARM', ['apis.workzone', 'ui.bootstrap','utility.array'])
		.controller('AzureARMCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', '$timeout', 'uiGridOptionsService', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, $timeout, uiGridOptionsService, workzoneUIUtils) {
			$scope.isAzureARMPageLoading = true;
			var gridBottomSpace = 5;
			var armPaginationDefault = uiGridOptionsService.options();
			$scope.paginationParams = armPaginationDefault.pagination;
			$scope.paginationParams.sortBy = 'created';
			$scope.paginationParams.sortOrder = 'desc';
			$scope.currentCardPage = armPaginationDefault.pagination.page;
			$scope.cardsPerPage = armPaginationDefault.pagination.pageSize = 30;
			$scope.numofCardPages = 0; //Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;

			$scope.setFirstPageView = function() {
				$scope.paginationParams.page = 1;
			};

			

			$rootScope.$on('WZ_AzureARM_SHOW_LATEST', function(){
				//TO DO: Set sort params to show latest CFT in first page.
				//$scope.paginationParams.sortBy = 'status';
				//$scope.paginationParams.sortOrder = 'desc';
				$scope.setFirstPageView();
				$scope.azureListCardView();
			});

			$rootScope.$on('WZ_AzureARM_REFRESH_CURRENT', function(){
				$scope.azureListCardView();
			});
			
			$scope.cardPaginationArmChange = function() {
				$scope.paginationParams.page = $scope.currentCardPage;
				$scope.paginationParams.pageSize = $scope.cardsPerPage;
				$scope.azureListCardView();
			};

			$scope.refreshCurrentPage = function(){
				$rootScope.$emit('WZ_AzureARM_REFRESH_CURRENT');    
			};

			angular.extend($scope, {
				azureListCardView: function() {
					$scope.isAzureARMPageLoading = true;
					$scope.arms = [];
					// service to get the list of azureArm
					workzoneServices.getPaginatedARM($scope.envParams, $scope.paginationParams).then(function(result) {
						$scope.totalCards = result.data.metaData.totalRecords;
						if($scope.totalCards > $scope.paginationParams.pageSize) {
							$scope.isAzureARMPaginationShow = true;
						} else {
							$scope.isAzureARMPaginationShow = false;
						}
						$scope.isAzureARMPageLoading = false;
						$scope.arms = result.data.azureArms;
						$scope.numofCardPages = Math.ceil($scope.totalCards / $scope.paginationParams.pageSize);
					},function(error) {
						$scope.isAzureARMPageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
					});
				},
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
						$scope.arms.splice(index,1);
						//refreshes the arm list once the arm is deleted.
						$scope.azureListCardView();
					},function(){
						
					});
				},
				getStackStateColor: function(stackState) {
					var colorRepresentationClass = '';
					switch (stackState) {
						case "Failed":
						case "Canceled":
						case "Deleted":
							colorRepresentationClass = 'red';
							break;
						case "Succeeded":
							colorRepresentationClass = 'green';
							break;
						default:
							colorRepresentationClass = 'red';
					}
					return colorRepresentationClass;
				}
			});
			
			$scope.init = function () {
				$scope.isAzureARMPageLoading = true;
				$scope.currentCardPage = $scope.paginationParams.page = 1;
				$scope.envParams = $rootScope.requestParams;
				$scope.azureListCardView();
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('azureARMPage') - gridBottomSpace;
			}
			$scope.init();
		}
	]);
})(angular);