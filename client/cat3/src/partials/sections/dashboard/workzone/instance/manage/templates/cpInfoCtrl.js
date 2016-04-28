/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function() {
    "use strict";
    angular.module('workzone.instance')
        .controller('cpInfoCtrl', ['$scope', '$modal', 'workzoneServices', function($scope, $modal, workzoneServices) {
            /*Open only One Accordian-Group all a time*/
            $scope.oneAtATime = false;
            /*Opening all Accordian-group on load*/
            $scope.isFirstOpen = true;
            $scope.isSecondOpen = true;
            $scope.isThirdOpen = true;
            $scope.isFourthOpen = true;
            $scope.isFifthOpen = true;
            $scope.isSixthOpen = true;

            var cpInstance = $scope.$parent.cpInstance;
            var hardwareInfo = {},
                softwareInfo = {},
                cmInfo = {};
                
            var helper = {
                memoryCalculation: function(data) {
                    var memoryInitial = data;
                    if (memoryInitial === 'unknown' || memoryInitial.indexOf('MB') !== -1) {
                        return memoryInitial;
                    } else {
                        var memValue = memoryInitial.substring(0, memoryInitial.length - 2);
                        var memValueInMB = memValue / 1000;
                        var memValueRounded = Math.round(memValueInMB);
                        var memDisplay = memValueRounded + ' MB';
                        return memDisplay;
                    }
                }
            };

            $scope.instInfo = cpInstance;
            //$scope.bpInfo = TO DO
            //$scope.imageInfo = TO DO

            /*TODO: cpInstance.providerId should be replaced with data2blueprints[j].blueprintConfig.cloudProviderId
             when blueprint is available
             */
            if (cpInstance.providerId) {
                workzoneServices.getProviderDetails(cpInstance.providerId).then(function(response) {
                    $scope.providerInfo = response.data;
                });
            }

            //TO DO bpInfo, imageInfo and providerInfo is same as and can be replaced by the blueprint more info service

            $scope.appUrlInfo = cpInstance.appUrls;

            $scope.setTaskInfo = function() {
                if (cpInstance.taskIds && cpInstance.taskIds.length) {
                    workzoneServices.postRetrieveTasksDetails(cpInstance.taskIds).then(function(response) {
                        $scope.taskInfo = response.data;
                    });
                } else {
                    $scope.taskInfo = [];
                }
            };

            $scope.setTaskInfo();

            hardwareInfo.machine = cpInstance.hardware.architecture;
            hardwareInfo.memoryTotal = helper.memoryCalculation(cpInstance.hardware.memory.total);
            hardwareInfo.memoryFree = helper.memoryCalculation(cpInstance.hardware.memory.free);

            softwareInfo.os = cpInstance.hardware.platform;
            softwareInfo.version = cpInstance.hardware.platformVersion;

            cmInfo.bootstrap = cpInstance.bootStrapStatus;
            cmInfo.runlist = cpInstance.runlist.join();

            $scope.hardwareInfo = hardwareInfo;
            $scope.softwareInfo = softwareInfo;
            $scope.cmInfo = cmInfo;

            $scope.createAppUrl = function() {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/applicationUrl.html',
                    controller: 'applicationCreateCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return cpInstance;
                        }
                    }
                }).result.then(function(createdItem) {
                    $scope.appUrlInfo.push(createdItem);
                }, function() {
                    console.log('Modal Dismissed at ' + new Date());
                });
            };

            $scope.editAppUrl = function(appUrl) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/applicationUrl.html',
                    controller: 'applicationEditCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return {
                                instance: cpInstance,
                                selectedAppUrl: appUrl
                            };
                        }
                    }
                }).result.then(function(updatedItem) {
                    appUrl.name = updatedItem.name;
                    appUrl.url = updatedItem.url;
                }, function() {
                    console.log('AppUrl Edit modal dismissed');
                });
            };

            $scope.deleteAppUrl = function(_appUrl, index) {
                workzoneServices.deleteAppUrl(cpInstance._id, _appUrl._id).then(function() {
                    $scope.appUrlInfo.splice(index);
                }, function() {
                    alert("Unable to delete URL please try again later");
                });
            };
            $scope.inspect = function() {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/inspectSoftware.html',
                    controller: 'inspectSoftwareCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        inspectInstance: function() {
                            return cpInstance;
                        }
                    }
                }).result.then(function() {
                    console.log('Inspect modal closed');
                }, function() {
                    console.log('Inspect modal dismissed');
                });
            };
            $scope.assignJob = function() {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/assignJob.html',
                    controller: 'assignJobCtrl',
                    size: 'lg',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        inspectInstance: function() {
                            return cpInstance;
                        }
                    }
                }).result.then(function() {
                    $scope.setTaskInfo();
                    console.log('Inspect modal closed');
                }, function() {
                    console.log('Inspect modal dismissed');
                });
            };
        }])
        .controller('inspectSoftwareCtrl', ['$scope', 'inspectInstance', '$modalInstance', 'workzoneServices', function($scope, inspectInstance, $modalInstance, workzoneServices) {
            $scope.isInspectSoftwareLoading = true;
            workzoneServices.getInspectSoftware(inspectInstance._id).then(function(response) {
                $scope.isInspectSoftwareLoading = false;
                console.log('inspect success');
                console.log(response.data);
                var data = response.data;
                var installedSoftwareString = data.installedSoftwareString;
                var installedSoftwareArray = installedSoftwareString.split('\r\n');
                $scope.installedSoftware = installedSoftwareArray;
            }, function(response) {
                $scope.isInspectSoftwareLoading = false;
                console.log('inspect failed');
                console.log(response.data);
                if (response.data.message) {
                    $scope.error = response.data.message;
                } else {
                    $scope.error = "Something went wrong while inspecting";
                }
            });
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }]).controller('assignJobCtrl', ['$scope', 'inspectInstance', '$modalInstance', 'workzoneServices', 'chefSelectorComponent', 'responseFormatter', function($scope, inspectInstance, $modalInstance, workzoneServices, chefSelectorComponent, responseFormatter) {
            var compositeSelector;
            workzoneServices.getOrgTasks().then(function(response) {
                var data, selectorList = [],
                    optionList = [];

                if (response.data) {
                    data = response.data;
                } else {
                    data = response;
                }

                if (inspectInstance.taskIds && inspectInstance.taskIds.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        if (inspectInstance.taskIds.indexOf(data[i]._id) !== -1) {
                            selectorList.push(data[i]);
                        }
                    }
                }
                optionList = data;
                var factory = chefSelectorComponent.getComponent;
                compositeSelector = new factory({
                    scopeElement: '#assign_job_component',
                    optionList: responseFormatter.formatTaskList(optionList),
                    selectorList: responseFormatter.formatTaskList(selectorList),
                    isSortList: true,
                    isSearchBoxEnable: false,
                    isOverrideHtmlTemplate: true,
                    isPriorityEnable: false,
                    isExcludeDataFromOption: true
                });
            });
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            $scope.ok = function() {
                var selectedList = compositeSelector.getSelectorList();
                var taskJSON = {
                    taskIds: []
                };
                if (selectedList && selectedList.length) {
                    for (var i = 0; i < selectedList.length; i++) {
                        taskJSON.taskIds.push(selectedList[i].data._id);
                    }
                }

                var reqBody = taskJSON;
                workzoneServices.addInstanceTask(inspectInstance._id, reqBody).then(function() {
                    inspectInstance.taskIds = taskJSON.taskIds;
                    $modalInstance.close();
                });
            };
        }]).controller('applicationCreateCtrl', ['$scope', 'items', '$modalInstance', 'workzoneServices', function($scope, items, $modalInstance, workzoneServices) {
            $scope.ok = function() {
                var appUrls = [];
                appUrls.push({
                    name: $scope.appUrlItem.name,
                    url: $scope.appUrlItem.url
                });
                if (appUrls.length) {
                    var reqBody = {};
                    reqBody.appUrls = appUrls;
                    workzoneServices.createAppUrl(items._id, reqBody).then(function(response) {
                        $modalInstance.close(response.data[0]);
                    });
                }
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }]).controller('applicationEditCtrl', ['$scope', 'items', '$modalInstance', 'workzoneServices', function($scope, items, $modalInstance, workzoneServices) {
            $scope.appUrlItem = {
                name: items.selectedAppUrl.name,
                url: items.selectedAppUrl.url
            };
            var _instanceId = items.instance._id;
            var _appUrlId = items.selectedAppUrl._id;
            $scope.ok = function() {
                var appUrls = [];
                appUrls.push({
                    name: $scope.appUrlItem.name,
                    url: $scope.appUrlItem.url
                });
                if (appUrls.length) {
                    var reqBody = {};
                    reqBody.name = appUrls[0].name;
                    reqBody.url = appUrls[0].url;
                    workzoneServices.updateAppUrl(_instanceId, _appUrlId, reqBody).then(function() {
                        $scope.appUrlItem = reqBody;
                        $modalInstance.close($scope.appUrlItem);
                    });
                }
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ]);
})();