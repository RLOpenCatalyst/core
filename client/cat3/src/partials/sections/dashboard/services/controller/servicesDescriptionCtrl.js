/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */
(function(angular) {
        "use strict";
        angular.module('dashboard.services')
            .controller('servicesDescriptionCtrl', ['$scope', '$rootScope', 'uiGridOptionsService','$modal', '$state', 'servicesCreateService', function($scope, $rootScope, uiGridOptionsService,$modal, $state, servicesCreateService) {
                var treeNames = ['Services', 'Service Description'];
                $rootScope.$emit('treeNameUpdate', treeNames);
                $scope.serviceSelected = $state.params.serviceDetail;

                var serviceInfoUIGridDefaults = uiGridOptionsService.options();
                $scope.paginationParams = serviceInfoUIGridDefaults.pagination;
                $scope.paginationParams = [];
                $scope.paginationParams.page = 1;
                serviceInfoUIGridDefaults.gridOption.paginationPageSize = 25;
                serviceInfoUIGridDefaults.gridOption.paginationPageSizes = [25,50,75];

                /*APIs registered are triggered as ui-grid is configured 
                for server side(external) pagination.*/
                $scope.serviceResourceData = angular.extend(serviceInfoUIGridDefaults.gridOption, {
                    onRegisterApi: function(gridApi) {
                        $scope.gridApi = gridApi;
                        //Sorting for sortBy and sortOrder
                        gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
                            if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
                                $scope.paginationParams.sortBy = sortColumns[0].field;
                                $scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
                                $scope.resourceListView();
                            }
                        });
                        //Pagination for page and pageSize
                        gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
                            $scope.paginationParams.page = newPage;
                            $scope.paginationParams.pageSize = pageSize;
                            $scope.resourceListView();
                        });
                    }
                });

                angular.extend($scope, {
                    resourceListView: function() {
                        $scope.isResourceListLoading = true;
                        $scope.serviceResourceData.data = [];
                        if($scope.serviceSelected.name) {
                            servicesCreateService.getResources($scope.serviceSelected.name).then(function(response){
                                $scope.serviceResourceData.data = response.resources;
                                var bpcolumnDefs = [];
                                var resourceGrid = [
                                    {
                                        name: 'State',
                                        cellTemplate:'<i title="{{row.entity.state}}" class="text-green fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'running\'"></i>' +
                                        '<i title="{{row.entity.state}}" class="text-red fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'stopped\'"></i>' + '<i title="{{row.entity.state}}" class="text-black fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'terminated\'"></i>' + '<i title="{{row.entity.state}}" class="text-red fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.state === \'deleted\'"></i>' + '<span title="{{row.entity.state}}" ng-show="row.entity.state === \'unknown\'">-</span>',
                                        cellTooltip: true
                                    },
                                    {
                                        name: 'Instance Id',
                                        field: 'platformId',
                                        cellTooltip: true
                                    },
                                    {
                                        name: 'Type',
                                        field: 'type',
                                        cellTooltip: true
                                    },
                                    {
                                        name: 'Category',
                                        field: 'category',
                                        cellTooltip: true
                                    },
                                    {
                                        name: 'Authentication',
                                        cellTooltip: true,
                                        cellTemplate:'<i title="{{row.entity.authentication}}" class="fa fa-fw fa-check-circle fa-2x" ng-show="row.entity.authentication === \'success\'"></i>' +
                                        '<i title="{{row.entity.authentication}}" class="text-gray fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.authentication === \'authenticating\'"></i>' + '<i title="{{row.entity.authentication}}" class="text-gray fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.authentication === \'pending\'"></i>' + '<i style="cursor:pointer;" title="{{row.entity.authentication}}" class="fa fa-fw fa-repeat fa-2x" ng-show="row.entity.authentication === \'failed\'" ng-click="grid.appScope.changeAuthenticationType(row.entity)"></i>'
                                    },
                                    {
                                        name: 'Bootstrap',
                                        cellTooltip: true,
                                        cellTemplate: '<i title="{{row.entity.bootStrapState}}" class="fa fa-fw fa-check-circle fa-2x" ng-show="row.entity.bootStrapState === \'success\'"></i>' +
                                        '<i title="{{row.entity.bootStrapState}}" class="text-gray fa fa-fw fa-circle-o fa-2x" ng-show="row.entity.bootStrapState === \'bootStrapping\'"></i>' + '<i title="{{row.entity.bootStrapState}}" class="fa fa-fw fa-repeat fa-2x" ng-show="row.entity.bootStrapState === \'failed\'"></i>'
                                    }
                                ];
                                bpcolumnDefs = resourceGrid;                                
                                $scope.serviceResourceData.columnDefs = bpcolumnDefs;
                                angular.extend($scope.serviceResourceData, serviceInfoUIGridDefaults.gridOption);
                                if($scope.serviceResourceData.data) {
                                    $scope.serviceResourceData.totalItems = $scope.serviceResourceData.data.length;
                                }
                                $scope.isResourceListLoading = false;
                            });
                        }
                    }
                    
                });

                $scope.changeAuthenticationType = function(serviceObject) {
                    $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/services/popups/serviceAuthentication.html',
                        controller: 'servicesAuthenticationCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return {
                                    serviceSelected: $scope.serviceSelected,
                                    resourceObj: serviceObject
                                }
                            }
                        }
                    }).result.then(function(response) {
                        if(response) {
                            $scope.resourceListView();
                        }
                    }, function() {
                        console.log("Dismiss at " + new Date());
                    });
                }

                var serviceTab = {
                    tab: "ReadMe",
                    setTab: function(tabId) {
                        serviceTab.tab = tabId;
                    },
                    isSet: function(tabId) {
                        return serviceTab.tab === tabId;
                    },
                    templates: {
                        readme: {
                            "title": "ReadMe",
                            "url": "src/partials/sections/dashboard/services/tabs/serviceReadme.html"
                        },
                        resources: {
                            "title": "Resources",
                            "url": "src/partials/sections/dashboard/services/tabs/resources.html"
                        },
                        info: {
                            "title": "Service Info",
                            "url": "src/partials/sections/dashboard/services/tabs/serviceInfo.html"
                        }
                    }
                };

                $scope.refreshResources = function() {
                    $scope.resourceListView();    
                }

                $scope.tab = serviceTab;
                $scope.resourceListView();
            }]);
})(angular);