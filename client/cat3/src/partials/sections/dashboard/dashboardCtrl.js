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
        'apis.workzone','dashboard.genericServices'])
        .controller('dashboardCtrl', ['$rootScope', '$scope', '$http', 'uac', '$location', '$state', function ($rootScope, $scope, $http, uac, $location, $state) {
    $rootScope.isBreadCrumbAvailable = true;
    $rootScope.app.isDashboard = true;
    if($state.current && $state.current.data && $state.current.data.menuName){
        $rootScope.dashboardChild = $state.current.data.menuName;
    } else {
        $rootScope.dashboardChild ='';
    }
            $rootScope.showTreeMenu = true;
    /*State will be dashboard if coming via login flow. So check permission and do default landing logic*/
    /*Otherwise dont enable default landing logic. This is so that user can land on url directly*/
    if ($state.current.name === 'dashboard') {
        if ($rootScope.workZoneBool) {
            $state.go('dashboard.workzone');
        } else if ($rootScope.designBool) {
            $state.go('dashboard.design');
        } else if ($rootScope.trackBool) {
            $state.go('dashboard.track');
        } else if ($rootScope.settingsBool) {
            $state.go('dashboard.settings');
        }
    }
            $rootScope.hideTreeOverlay = function () {
                $rootScope.showTreeMenu = false;
                $(".panelRight").css("width", "calc(100% - 39px)");
                $("#navigPage").addClass("tree-close");
                $(".minifyme").css("left", "0px");
                $(".minifyme").css("border-radius", "0px");
                $(".minifyme").css("width", "35px");
        };
            $rootScope.showTreeOverlay = function () {
                $rootScope.showTreeMenu = true;
                $(".panelRight").css("width", "calc(100% - 258px)");
                $("#navigPage").removeClass("tree-close");
                $(".minifyme").css("left", "216px");
                $(".minifyme").css("width", "38px");
                $(".minifyme").css("border-radius", "5px 0 0 5px");
        };
}]);
})(angular);