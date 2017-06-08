/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */
(function(angular) {
        "use strict";
        angular.module('dashboard.services')
            .controller('servicesDescriptionCtrl', ['$scope', '$rootScope', 'uiGridOptionsService','$modal', '$state', function($scope, $rootScope, uiGridOptionsService,$modal, $state) {
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
                        $scope.serviceResourceData.data = $scope.serviceSelected.resources;
                        var bpcolumnDefs = [];
                        var resourceGrid = [
                            {
                                name: 'State',
                                field: 'state',
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
                                cellTemplate:'<span ng-show="row.entity.authentication === \'failed\'"><a ng-click="grid.appScope.changeAuthenticationType(row.entity)" style="cursor:pointer;">failed</a></span>' + '<span ng-show="row.entity.authentication === \'success\'">success</span>' + '<span ng-show="row.entity.authentication === \'authenticating\'">authenticating</span>'
                            },
                            {
                                name: 'Boot-Strap',
                                cellTooltip: true,
                                field: 'bootStrapState',
                            }
                        ];
                        bpcolumnDefs = resourceGrid;                                
                        $scope.serviceResourceData.columnDefs = bpcolumnDefs;
                        angular.extend($scope.serviceResourceData, serviceInfoUIGridDefaults.gridOption);
                        if($scope.serviceResourceData.data) {
                            $scope.serviceResourceData.totalItems = $scope.serviceResourceData.data.length;
                        }
                        $scope.isResourceListLoading = false;
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
                    });
                }

                var serviceTab = {
                    tab: "Resources",
                    setTab: function(tabId) {
                        serviceTab.tab = tabId;
                    },
                    isSet: function(tabId) {
                        return serviceTab.tab === tabId;
                    },
                    templates: {
                        resources: {
                            "title": "Resources",
                            "url": "src/partials/sections/dashboard/services/tabs/resources.html"
                        },
                        readme: {
                            "title": "ReadMe",
                            "url": "src/partials/sections/dashboard/services/tabs/serviceReadme.html"
                        },
                        info: {
                            "title": "Service Info",
                            "url": "src/partials/sections/dashboard/services/tabs/serviceInfo.html"
                        }
                    }
                };
                $scope.tab = serviceTab;
                $scope.resourceListView();
            }]);
})(angular);