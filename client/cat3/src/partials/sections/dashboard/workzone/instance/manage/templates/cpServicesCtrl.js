/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function () {
    "use strict";
    angular.module('workzone.instance')
        .controller('cpServicesCtrl', ['$scope', '$rootScope', 'workzoneServices', '$modal', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'instanceFactories', function ($scope, $rootScope, workzoneServices, $modal, $timeout, uiGridOptionsClient, uiGridConstants, instanceFactories) {
            var cpInstance = $scope.$parent.cpInstance;
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
                            alert("Unable to delete service");
                        }
                    );
                },
                showActionHistory: function () {
                    $scope.$parent.activateTab('Logs');
                }
            };

            $scope.tabData = [];

            var gridOptions = uiGridOptionsClient.options().gridOption;
            $scope.cpServicesGridOptions = gridOptions;


            $scope.initGrids = function(){
                $scope.cpServicesGridOptions.data='tabData';
                $scope.cpServicesGridOptions.columnDefs = [
                    { name:'Service Name',field:'servicename',cellTooltip: true},
                    { name:'Actions',cellTemplate:'<span ng-repeat="actionItem in row.entity.actionData" class="cp-service-icon cursor {{actionItem.bg}}" ng-click="grid.appScope.serviceAction(row.entity, actionItem.actionType);">'+
                    '<i class="fa {{actionItem.icon}} white"></i></span>' ,cellTooltip: true, enableSorting: false},
                    { name:'Options',cellTemplate: '<span title="Delete" class="cp-service-icon btn-danger cursor" ng-click="grid.appScope.deleteService(row.entity, rowRenderIndex);">'+
                    '<i class="fa fa-trash-o white"></i></span>',cellTooltip: true, enableSorting: false}
                ];
            };
            angular.extend($scope, {
                cpServivcesListView: function() {
                    // service to get the list of action history
                    if (cpInstance.serviceIds && cpInstance.serviceIds.length) {
                        workzoneServices.postRetrieveServiceDetails(cpInstance.serviceIds).then(function (response) {
                            $timeout(function() {
                                $scope.tabData = instanceFactories.getAllServiceActionItems(response.data);
                            },100);
                        }, function () {
                            alert('An error occurred while getting service list');
                        });
                    }
                },
            });
            
            $scope.serviceAction = function (service, action) {
                helper.doServiceAction(cpInstance, service, action);
            };
            $scope.deleteService = function (service, index) {
                helper.doServiceDelete(cpInstance, service, index);
            };
            $scope.addNewService = function () {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/addNewService.html',
                    controller: 'addNewServiceCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        dataObj: function () {
                            return {
                                serviceIds: cpInstance.serviceIds,
                                inspectInstance: cpInstance,
                                serviceObject:$scope.tabData
                            };
                        }
                    }
                }).result.then(function (addedServices) {
                    $timeout(function() {
                        $scope.initGrids();
                        cpInstance.serviceIds = cpInstance.serviceIds.concat(addedServices);
                        $scope.cpServivcesListView();
                    },100);
                }, function () {
                    console.log('Modal Dismissed at ' + new Date());
                });
            };
            $scope.init = function(){
                $scope.initGrids();
                $scope.cpServivcesListView();
            };
            $rootScope.$on('WZ_CONTROLPANEL_TAB_VISIT', function(event, tabName){
                if(tabName === 'Services'){
                    $scope.isServicePageLoading = true;
                    var tableData = $scope.tabData;
                    $scope.tabData = [];
                    $timeout(function(){
                        $scope.tabData = tableData;
                        $scope.isServicePageLoading = false;
                    }, 100);
                }
            });

            $scope.init();
        }]).controller('addNewServiceCtrl', ['$scope', '$modalInstance', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'workzoneServices', 'dataObj', 'cacheServices', 'instanceFactories', function ($scope, $modalInstance, $timeout, uiGridOptionsClient, uiGridConstants, workzoneServices, dataObj, cacheServices, instanceFactories) {
        
            $scope.serviceIds = dataObj.serviceIds;
            var cpInstance = dataObj.inspectInstance;
            var cacheKey = 'chefServerServices_' + cpInstance.chef.serverId;
            var services = cacheServices.getFromCache(cacheKey);
            var tabData = dataObj.serviceObject;

            $scope.tabAddServicesData = [];
            var gridOptions = uiGridOptionsClient.options().gridOption;
            $scope.cpAddNewServicesGridOptions = gridOptions;
            var helperAddService = {
                filterService: function(allServ,preseServ){
                    var newData=[];
                    var PreValArry=[];
                    angular.forEach(preseServ,function(PreVal){
                        PreValArry.push(PreVal.rowid);
                    });
                    angular.forEach(allServ,function(val){
                        if(PreValArry.indexOf(val.rowid) == -1){
                            newData.push(val);
                        }
                    });
                    return newData;
                }
            };

            $scope.initAddServicesGrids = function(){
                $scope.cpAddNewServicesGridOptions.data='tabAddServicesData';
                $scope.cpAddNewServicesGridOptions.columnDefs = [
                    { name:'Select',cellTemplate:'<input type="checkbox" ng-click="grid.appScope.toggleSelection(row.entity.rowid)" />',cellTooltip: true},
                    { name:'Name',field:'servicename',cellTooltip: true},
                    { name:'Actions',cellTemplate:'<span ng-repeat="actionItem in row.entity.actionData" class="cp-service-icon {{actionItem.bg}}">'+
                    '<i class="fa {{actionItem.icon}} white"></i></span>',cellTooltip: true}
                ];
            };
            angular.extend($scope, {
                cpAddNewServivcesListView: function() {
                    // service to get the list of action history
                    $scope.isAddnewServicePageLoading = true;
                    if (services) {
                        $scope.isAddnewServicePageLoading = false;
                        $scope.tabAddServicesData = helperAddService.filterService(services, tabData);
                    }else {
                        workzoneServices.getChefServerDetails(cpInstance.chef.serverId).then(function (allServices) {
                            $timeout(function(){
                                $scope.tabAddServicesData = helperAddService.filterService(allServices.data, tabData);
                                workzoneServices.getServiceCommand().then(function (response) {
                                    var servicesCmd = response.data;
                                    for (var k = 0; k < servicesCmd.length; k++) {
                                        if (servicesCmd[k].chefserverid !== cpInstance.chef.serverId) {
                                            $scope.tabAddServicesData.push(servicesCmd[k]);
                                        }
                                    }
                                    $scope.isAddnewServicePageLoading = false;
                                    $scope.tabAddServicesData = instanceFactories.getAllServiceActionItems($scope.tabAddServicesData);
                                    cacheServices.addToCache(cacheKey, allServices.data);
                                }, function () {
                                    alert('An error occurred while getting service commands');
                                });
                            },100);
                        }, function () {
                            alert('An error occurred while getting service list');
                        });
                    }
                },
            });

            $scope.initAddServices = function(){
                $scope.initAddServicesGrids();
                $scope.cpAddNewServivcesListView();
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
})();