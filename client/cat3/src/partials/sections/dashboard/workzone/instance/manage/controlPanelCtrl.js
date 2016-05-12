/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
    "use strict";
    angular.module('workzone.instance')
        .controller('controlPanelCtrl', ['$scope', '$rootScope', 'instance', 'workzoneServices', 'workzoneEnvironment', '$modalInstance', 'instanceLogs', function ($scope, $rootScope, instance, workzoneServices, workzoneEnvironment, $modalInstance, instanceLogs) {
            $scope.cancel = function () {
                instanceLogs.stopLogsPolling();
                $modalInstance.dismiss('cancel');
            };

            var _tab = {
            //To activate the tab
            tab : "Actionhistory",
            setTab : function (tabId) {
                _tab.tab = tabId;     
            },
            isSet : function (tabId) {
                return _tab.tab === tabId;
            },
            templates:   {
                actionhistory: {
                    "url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActionHistory.html"
                }, 
                information: {
                    "url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpInfo.html"
                }, 
                services: {
                    "url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpServices.html"
                },
                logs: {
                    "url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpLogs.html"
                }, 
                instanceactions: {
                    "url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActions.html"
                }
            }
        };
        $scope.tab = _tab;

        if (instance.puppet) {
            //Dont show Services tab for puppet instance
            $scope.showServicesTab = false;
        } else {
            $scope.showServicesTab = true;
        }
        //The cpInstance from this scope is used in the controllers of child tabs.
        $scope.cpInstance = instance;
        $scope.instInfo = $scope.cpInstance;
        }
    ]);
})(angular);