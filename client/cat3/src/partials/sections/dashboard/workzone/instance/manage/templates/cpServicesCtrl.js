/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function () {
    "use strict";
    angular.module('workzone.instance')
            .controller('cpServicesCtrl', ['$scope', 'workzoneServices', '$modal', 'instanceFactories', function ($scope, workzoneServices, $modal, instanceFactories) {
                    var cpInstance = $scope.$parent.cpInstance;
                    $scope.instInfo = cpInstance;
                    var helper = {
                        doServiceAction: function (inst, service, actionType) {
                            workzoneServices.getDoServiceActionOnInstance(inst._id, service.rowid, actionType).then(function () {
                                helper.showActionHistory();
                            }, function () {
                                helper.showActionHistory();
                            });
                        },
                        doServiceDelete: function (inst, service, idx) {
                            workzoneServices.deleteServiceOnInstance(inst._id, service.rowid).then(
                                    function () {
                                        $scope.serviceInfo.splice(idx, 1);
                                    },
                                    function () {}
                            );
                        },
                        showActionHistory: function () {
                            $scope.$parent.activateTab('Logs');
                        }
                    };

                    $scope.serviceInfo = [];
                    $scope.setSerivceInfo = function () {
                        if (cpInstance.serviceIds && cpInstance.serviceIds.length) {
                            workzoneServices.postRetrieveServiceDetails(cpInstance.serviceIds).then(function (response) {
                                $scope.serviceInfo = response.data;
                                $scope.serviceInfo = instanceFactories.getAllServiceActionItems($scope.serviceInfo);
                            }, function () {
                                alert('An error occurred while getting service list');
                            });
                        } else {
                            $scope.serviceInfo = [];
                        }
                    };
                    $scope.setSerivceInfo();

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
                                        inspectInstance: cpInstance
                                    };
                                }
                            }
                        }).result.then(function () {
                            $scope.setSerivceInfo();
                        }, function () {
                            console.log('Modal Dismissed at ' + new Date());
                        });
                    };

                    $scope.convertToWorkstation = function () {
                        $modal.open({
                            animation: true,
                            templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/convertToWorkstation.html',
                            controller: 'convertToWorkstationCtrl',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                selectedInstance: function () {
                                    return cpInstance;
                                }
                            }
                        }).result.then(function () {

                        }, function () {
                            console.log('Modal Dismissed at ' + new Date());
                        });
                    };

                }]).controller('addNewServiceCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'dataObj', 'cacheServices', 'instanceFactories', function ($scope, $modalInstance, workzoneServices, dataObj, cacheServices, instanceFactories) {

            $scope.serviceIds = dataObj.serviceIds;

            var cpInstance = dataObj.inspectInstance;

            var cacheKey = 'chefServerServices_' + cpInstance.chef.serverId;

            var services = cacheServices.getFromCache(cacheKey);

            if (services) {
                $scope.serviceInfo = services;
            } else {
                workzoneServices.getChefServerDetails(cpInstance.chef.serverId).then(function (response) {
                    $scope.serviceInfo = response.data;

                    workzoneServices.getServiceCommand().then(function (response) {
                        var servicesCmd = response.data;
                        for (var k = 0; k < servicesCmd.length; k++) {
                            if (servicesCmd[k].chefserverid !== cpInstance.chef.serverId) {
                                $scope.serviceInfo.push(servicesCmd[k]);
                            }
                        }
                        $scope.serviceInfo = instanceFactories.getAllServiceActionItems($scope.serviceInfo);

                        cacheServices.addToCache(cacheKey, $scope.serviceInfo);
                    }, function () {
                        alert('An error occurred while getting service list');
                    });
                }, function () {
                    alert('An error occurred while getting service list');
                });
            }

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
                    cpInstance.serviceIds = cpInstance.serviceIds.concat($scope.selection);
                    $modalInstance.close();
                });
            };
        }]).controller('convertToWorkstationCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'selectedInstance', function ($scope, $modalInstance, workzoneServices, selectedInstance) {
            workzoneServices.convertToWorkstation(selectedInstance._id).then(function (response) {
                $scope.message = response.level;
            });

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        }]);
})();