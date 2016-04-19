/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.azureARM', ['apis.workzone', 'ngAnimate', 'ui.bootstrap','utility.array'])
		.controller('AzureARMCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', '$timeout', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, $timeout, workzoneUIUtils) {
			
			$scope.paginationParams = {
				pages: {
					page: 1,
					pageSize: 1
				}
			};
			// $scope.totalItems = 2;
			$scope.currentCardPage = $scope.paginationParams.pages.page;
			$scope.cardsPerPage = $scope.paginationParams.pages.pageSize;
			$scope.numofCardPages = 0; //Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;


			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				//$scope.isAzureARMPageLoading = true;
				$scope.requestParams=requestParams;
				//$scope.arms = [];
				$scope.azureListCardView();

			});
			$rootScope.$on('WZ_TAB_VISIT', function(event, tabName){
				if(tabName == 'azureARM'){
					//$scope.initGrids();
					//$scope.gridApi.core.refresh();
					//$scope.gridHeight = $scope.gridHeight - 1;
					//$scope.instancesListCardView();
					 $scope.isAzureARMPageLoading = true;
					 var tableData = $scope.tabData;
					$scope.tabData = [];
					 $timeout(function(){
					 	$scope.tabData = tableData;
					 	$scope.isAzureARMPageLoading = false;
					 }, 500);
				}
			});
			/*$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				//$scope.arms = data.arms;
				$scope.isAzureARMPageLoading = false;
                workzoneUIUtils.makeTabScrollable('azureARMPage');
			});*/
			$scope.cardPaginationArmChange = function() {
				$scope.paginationParams.pages = {
					page: $scope.currentCardPage,
					pageSize: $scope.cardsPerPage
				};
				//$scope.instancesGridOptions.paginationCurrentPage = $scope.currentCardPage;
				$scope.azureListCardView();
			}
			angular.extend($scope, {
				azureListCardView: function() {
					$scope.isAzureARMPageLoading = true;

					//$scope.tabData = [];
					$scope.arms = [];
					// service
					workzoneServices.getAllAzureList($scope.requestParams, $scope.paginationParams).then(function(result) {


						//$scope.instancesGridOptions.data = result.data.instances;
						$timeout(function() {
							console.log('setting total to' + result.data.metaData.totalRecords);
							$scope.totalCards = result.data.metaData.totalRecords;
							$scope.tabData = $scope.arms = result.data.azureArms;

							$scope.isAzureARMPageLoading = false;
							$scope.numofCardPages = Math.ceil($scope.totalCards / $scope.paginationParams.pages.pageSize);
						}, 100);
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