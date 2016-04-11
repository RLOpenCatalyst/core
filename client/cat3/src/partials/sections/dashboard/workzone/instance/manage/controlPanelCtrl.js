/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
    "use strict";
    angular.module('workzone.instance')
            .controller('controlPanelCtrl', ['$scope', 'instance', 'workzoneServices', 'workzoneEnvironment', '$modalInstance', 'instanceLogs', function ($scope, instance, workzoneServices, workzoneEnvironment, $modalInstance, instanceLogs) {
                    $scope.cancel = function () {
                        instanceLogs.stopLogsPolling();
                        $modalInstance.dismiss('cancel');
                    };
                    
                    //To activate the tab
                    $scope.activateTab = function (tabName) {
                        $scope.tabs.activeTab = tabName;
                    };

                    $scope.tabs = [
                        {
                            "title": "Action History",
                            "template": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActionHistory.html"
                        }, {
                            "title": "Information",
                            "template": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpInfo.html"
                        }, {
                            "title": "Services",
                            "template": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpServices.html"
                        }, {
                            "title": "Logs",
                            "template": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpLogs.html"
                        }, {
                            "title": "Instance Actions",
                            "template": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActions.html"
                        }];
                    //make 'Action History' tab active by default
                    $scope.activateTab('Action History');
                    //The cpInstance from this scope is used in the controllers of child tabs.
                    $scope.cpInstance = instance;
                    $scope.instInfo = $scope.cpInstance;
                    $scope.$watch('tabs.activeTab', function () {
                        //$rootScope.$emit('rightPanelNavigation', $scope.tabs.activeTab, 0);
                    });
                }
            ]);
})(angular);