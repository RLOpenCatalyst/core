/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.instance')
		.controller('cpServicesCtrl', ['$scope', '$rootScope', 'workzoneServices', '$modal', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'instanceFactories','toastr', function ($scope, $rootScope, workzoneServices, $modal, $timeout, uiGridOptionsClient, uiGridConstants, instanceFactories,toastr) {
			var cpInstance = $scope.$parent.cpInstance;
			$scope.isServicePageLoading = true;
			var helper = {
				doServiceAction: function (inst, service, actionType) {
					$scope.inactiveGrid = true;
					workzoneServices.getDoServiceActionOnInstance(inst._id, service.rowid, actionType).then(function () {
						$scope.inactiveGrid = false;
						helper.showActionHistory();
					}, function () {
						$scope.inactiveGrid = false;
						helper.showActionHistory();
					});
				},
				doServiceDelete: function (inst, service, idx) {
					$scope.inactiveGrid = true;
					workzoneServices.deleteServiceOnInstance(inst._id, service.rowid).then(
						function () {
							$scope.inactiveGrid = false;
							cpInstance.serviceIds.splice(idx, 1);
							$scope.tabData.splice(idx, 1);  
						},
						function () {
							$scope.inactiveGrid = false;
							toastr.error("Unable to delete service");
						}
					);
				},
				showActionHistory: function () {
					$scope.$parent.$parent.activateTab('Logs');
				}
			};
			$scope.tabData = [];
			var gridOptions = uiGridOptionsClient.options().gridOption;
			$scope.cpServicesGridOptions = gridOptions;
			$scope.initGrids = function(){
				$scope.cpServicesGridOptions.data='tabData';
				$scope.cpServicesGridOptions.columnDefs = [
					{ name:'Service Name',field:'servicename',cellTooltip: true},
					{ name:'Actions',cellTemplate:'<span title="{{actionItem.actionType}}" ng-repeat="actionItem in row.entity.actionData" class="cp-service-icon cursor {{actionItem.bg}}" ng-click="grid.appScope.serviceAction(row.entity, actionItem.actionType);">'+
					'<i class="fa {{actionItem.icon}} white"></i></span>' ,cellTooltip: true, enableSorting: false},
					{ name:'Options',cellTemplate: '<span title="Delete" class="cp-service-icon btn-danger cursor" ng-click="grid.appScope.deleteService(row.entity, rowRenderIndex);">'+
					'<i class="fa fa-trash-o white"></i></span>',cellTooltip: true, enableSorting: false}
				];
			};
			angular.extend($scope, {
				cpServivceListView: function() {
					// service to get the list of action history
					if (cpInstance.serviceIds && cpInstance.serviceIds.length) {
						workzoneServices.postRetrieveServiceDetails(cpInstance.serviceIds).then(function (response) {
							$timeout(function() {
								$scope.tabData = instanceFactories.getAllServiceActionItems(response.data);
								$scope.isServicePageLoading = false;
							},100);
						}, function () {
							$scope.isServicePageLoading = false;
							toastr.error('An error occurred while getting service list');
						});
					}else{
						$scope.isServicePageLoading = false;
						$scope.tabData.length = 0;
					}
				},
			});
			$scope.serviceAction = function (service, action) {
				helper.doServiceAction(cpInstance, service, action);
			};
			$scope.deleteService = function (service, index) {
				helper.doServiceDelete(cpInstance, service, index);
			};
			$scope.addService = function () {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/addNewService.html',
					controller: 'addServiceCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						serviceTabItems: function () {
							return {
								serviceIds: cpInstance.serviceIds,
								inspectInstance: cpInstance,
								servicedataList: $scope.tabData
							};
						}
					}
				}).result.then(function (addedServices) {
					$scope.initGrids();
					cpInstance.serviceIds = cpInstance.serviceIds.concat(addedServices);
					$scope.cpServivceListView();
				}, function () {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			$scope.init = function(){
				$scope.initGrids();
				$scope.cpServivceListView();
			};
			$scope.init();
		}]).controller('addServiceCtrl', ['$scope', '$modalInstance', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'workzoneServices', 'serviceTabItems', 'cacheServices', 'instanceFactories', 'toastr',function ($scope, $modalInstance, $timeout, uiGridOptionsClient, uiGridConstants, workzoneServices, serviceTabItems, cacheServices, instanceFactories,toastr) {
			$scope.serviceIds = serviceTabItems.serviceIds;
			var cpInstance = serviceTabItems.inspectInstance;
			var cacheKey = 'chefServerServices_' + cpInstance.chef.serverId;
			var services = cacheServices.getFromCache(cacheKey);
			var tabData = serviceTabItems.servicedataList;
			$scope.tabAddServicesData = [];
			var gridOptions = uiGridOptionsClient.options().gridOption;
			$scope.cpAddServicesGridOptions = gridOptions;
			var helperAddService = {
				filterService: function(allServ,preseServ){
					var filteredServiceData=[];
					var prevalList=[];
					angular.forEach(preseServ,function(preVal){
						prevalList.push(preVal.rowid);
					});
					angular.forEach(allServ,function(val){
						if(prevalList.indexOf(val.rowid) === -1){
							filteredServiceData.push(val);
						}
					});
					return filteredServiceData;
				}
			};
			$scope.initAddServicesGrids = function(){
				$scope.cpAddServicesGridOptions.data='tabAddServicesData';
				$scope.cpAddServicesGridOptions.columnDefs = [
					{ name:'Select',cellTemplate:'<input type="checkbox" ng-click="grid.appScope.toggleSelection(row.entity.rowid)" />',cellTooltip: true},
					{ name:'Name',field:'servicename',cellTooltip: true},
					{ name:'Actions',cellTemplate:'<span title="{{actionItem.actionType}}" ng-repeat="actionItem in row.entity.actionData" class="cp-service-icon {{actionItem.bg}}">'+
					'<i class="fa {{actionItem.icon}} white"></i></span>',cellTooltip: true}
				];
			};
			angular.extend($scope, {
				cpAddServivcesListView: function() {
					var addServiceGridData = [];
					// service to get the list of action history
					$scope.isAddServicePageLoading = true;
					if (services) {
						$scope.isAddServicePageLoading = false;
						addServiceGridData = helperAddService.filterService(services, tabData);
						$scope.tabAddServicesData = addServiceGridData;
					}else {
						workzoneServices.getChefServerDetails(cpInstance.chef.serverId).then(function (allServices) {
							addServiceGridData = helperAddService.filterService(allServices.data, tabData);
							workzoneServices.getServiceCommand().then(function (response) {
								var servicesCmd = response.data;
								for (var k = 0; k < servicesCmd.length; k++) {
									if (servicesCmd[k].chefserverid !== cpInstance.chef.serverId) {
										addServiceGridData.push(servicesCmd[k]);
									}
								}
								$scope.isAddServicePageLoading = false;
								addServiceGridData = instanceFactories.getAllServiceActionItems(addServiceGridData);
								cacheServices.addToCache(cacheKey, allServices.data);
								$scope.tabAddServicesData = addServiceGridData;
							}, function () {
								$scope.tabAddServicesData = addServiceGridData;
								toastr.error('An error occurred while getting service commands');
							});
						}, function () {
							toastr.error('An error occurred while getting service list');
						});
					}
				},
			});
			$scope.initAddServices = function(){
				$scope.initAddServicesGrids();
				$scope.cpAddServivcesListView();
			};
			$scope.selection = [];
			// toggle selection for a given Service by name
			$scope.toggleSelection = function (serviceId) {
				var idx = $scope.selection.indexOf(serviceId);
				// is currently selected
				if (idx > -1) {
					$scope.selection.splice(idx, 1);
				}
				// is newly selected
				else {
					$scope.selection.push(serviceId);
				}
			};
			$scope.cancel = function () {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok = function () {
				var reqBody = {
					serviceIds: $scope.selection
				};
				workzoneServices.addInstanceService(cpInstance._id, reqBody).then(function () {
					$modalInstance.close($scope.selection);
				});
			};
			$scope.initAddServices();
		}
	]);
})(angular);