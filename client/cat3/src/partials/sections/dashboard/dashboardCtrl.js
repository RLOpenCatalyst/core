(function (angular) {
    "use strict";
    angular.module('dashboard', [
        'dashboard.workzone',
        'dashboard.analytics',
        'workzone.application',
        'dashboard.help',
        'dashboard.track',
        'dashboard.settings',
        'dashboard.design',
        'dashboard.bots',
        'apis.workzone', 'dashboard.genericServices','dashboard.demo','dashboard.e-commerce'])
        .controller('dashboardCtrl', ['$rootScope', '$scope', '$http', 'uac', '$location', '$state', function ($rootScope, $scope, $http, uac, $location, $state) {
                $rootScope.isBreadCrumbAvailable = true;
                $rootScope.app.isDashboard = true;
                if ($state.current && $state.current.data && $state.current.data.menuName) {
                    $rootScope.dashboardChild = $state.current.data.menuName;
                } else {
                    $rootScope.dashboardChild = '';
                }
                $rootScope.showTreeMenu = true;
                /*State will be dashboard if coming via login flow. So check permission and do default landing logic*/
                /*Otherwise dont enable default landing logic. This is so that user can land on url directly*/
                if ($state.current.name === 'dashboard') {
                    if ($rootScope.serviceBool) {
                        $state.go('dashboard.bots');
                    } else if ($rootScope.workZoneBool) {
                        $state.go('dashboard.workzone');
                    } else if ($rootScope.designBool) {
                        $state.go('dashboard.design');
                    } else if ($rootScope.trackBool) {
                        $state.go('dashboard.track');
                    } else if ($rootScope.settingsBool) {
                        $state.go('dashboard.settings');
                    }
                }
            }
        ]);
})(angular);
