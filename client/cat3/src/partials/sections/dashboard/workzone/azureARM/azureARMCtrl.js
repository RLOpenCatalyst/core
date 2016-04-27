/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.azureARM', ['apis.workzone', 'ngAnimate', 'ui.bootstrap','utility.array'])
		.controller('AzureARMCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', '$timeout', 'uiGridOptionsService', function($scope, workzoneServices, $modal, $rootScope, $timeout, uiGridOptionsService) {
			$scope.isAzureARMPageLoading = true;
			var armData = uiGridOptionsService.options();
			$scope.paginationParams = armData.pagination;
			$scope.currentCardPage = armData.pagination.page;
			$scope.cardsPerPage = armData.pagination.pageSize;
			$scope.numofCardPages = 0; //Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;


			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				$scope.isAzureARMPageLoading = true;
				$scope.envParams=requestParams;
				$scope.azureListCardView();

			});
			$scope.cardPaginationArmChange = function() {
				$scope.paginationParams.page = $scope.currentCardPage,
				$scope.paginationParams.pageSize = $scope.cardsPerPage;
				$scope.azureListCardView();
			};
			angular.extend($scope, {
				azureListCardView: function() {
					$scope.isAzureARMPageLoading = true;
					$scope.arms = [];
					// service to get the list of azureArm
					workzoneServices.getPaginatedARM($scope.envParams, $scope.paginationParams).then(function(result) {
						$scope.totalCards = result.data.metaData.totalRecords;
						$scope.isAzureARMPageLoading = false;
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