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
		.controller('cloudFormationCtrl', ['$scope', 'workzoneServices', '$modal', '$rootScope', 'arrayUtil', '$timeout', 'workzoneUIUtils', function($scope, workzoneServices, $modal, $rootScope, arrayUtil, $timeout, workzoneUIUtils) {
			
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
				$scope.isCloudFormationPageLoading = true;
				//$scope.stacks = [];
				$scope.requestParams=requestParams;
				$scope.cftListCardView();
			});
			$rootScope.$on('WZ_TAB_VISIT', function(event, tabName){
				if(tabName == 'CloudFormation'){
					//$scope.initGrids();
					//$scope.gridApi.core.refresh();
					//$scope.gridHeight = $scope.gridHeight - 1;
					//$scope.instancesListCardView();
					 $scope.isCloudFormationPageLoading = true;
					 var tableData = $scope.tabData;
					$scope.tabData = [];
					 $timeout(function(){
					 	$scope.tabData = tableData;
					 	$scope.isCloudFormationPageLoading = false;
					 }, 500);
				}
			});
			/*$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				$scope.isCloudFormationPageLoading = false;
				$scope.stacks = data.stacks;
                workzoneUIUtils.makeTabScrollable('cloudFormationPage');
			});*/
			$scope.cardPaginationCftChange = function() {
				$scope.paginationParams.pages = {
					page: $scope.currentCardPage,
					pageSize: $scope.cardsPerPage
				};
				//$scope.instancesGridOptions.paginationCurrentPage = $scope.currentCardPage;
				$scope.cftListCardView();
			}
			angular.extend($scope, {
				cftListCardView: function() {
					$scope.isCloudFormationPageLoading = true;

					//$scope.tabData = [];
					$scope.stacks = [];
					// service
					workzoneServices.getAllCftList($scope.requestParams, $scope.paginationParams).then(function(result) {


						//$scope.instancesGridOptions.data = result.data.instances;
						$timeout(function() {
							console.log('setting total to' + result.data.metaData.totalRecords);
							$scope.totalCards = result.data.metaData.totalRecords;
							$scope.tabData = $scope.stacks = result.data.cftList;

							$scope.isCloudFormationPageLoading = false;
							$scope.numofCardPages = Math.ceil($scope.totalCards / $scope.paginationParams.pages.pageSize);
						}, 100);
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