/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */


/*global angularApp: true*/
/*
 * This is the main Module and entry point for routes configuration.
 * All modules/feature will be through
 * */

var angularApp = angular.module('catapp', ['ui.router',
    'global.login',
    'global.breadcrumb',
    'authentication',
    'factory.appPermission',
    'dashboard.workzone',
    'dashboard.help',
    'dashboard.track',
    'dashboard.settings',
    'dashboard.design',
    'directive.loading',
    'ngSanitize',
    'global.cache',
    'ui.grid',
    'ui.grid.pagination',
    'ui.grid.resizeColumns',
    'global.uiGridOptions'
]);

angularApp.run(['$rootScope', 'auth', '$state', '$stateParams',
    function ($rootScope, Auth, $state, $stateParams) {
        'use strict';
        $rootScope.$on('$stateChangeStart', function (event, toState) {
            //More function params: function (event, toState, toParams, fromState, fromParams)
            if (toState.name !== 'signin' && !Auth.isLoggedIn()) {
                event.preventDefault();
                $state.go('signin');
            } else if ((toState.name === 'signin' || toState.name === 'signinDefault') && Auth.isLoggedIn()) {
                event.preventDefault();
                $state.go('dashboard');
            }
        });
        
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
    }
]);

angularApp.controller('HeadNavigatorCtrl', ['$scope', '$rootScope', '$http', '$log', '$location', '$window', 'auth', '$state', function ($scope, $rootScope, $http, $log, $location, $window, auth, $state) {
    'use strict';

    //global Scope Constant Defined;
    $rootScope.app = $rootScope.app || {};
    $rootScope.app.isDashboard = false;
    $rootScope.appDetails = $rootScope.appDetails || {};

    $rootScope.locate = function (txt) {
        /*var result = document.getElementsByClassName("headNavigItem");
        var wrappedResult = angular.element(result);
        wrappedResult.removeClass('activeSection');
        var elem;*/
        console.log(' in locate with '+txt);
        switch (txt) {
            case 'workzone':
                $window.location.href = '../../../../#ajax/Dev.html';
                break;
            case 'settings':
                //$location.path('dashboard/setting');
                break;
            case 'track':
                // $location.path('dashboard/track');
                break;
            case 'design':
                //  $location.path('dashboard/design');
                break;
            case 'help':
                //  $location.path('/dashboard/help');
        }
    };

    $scope.showLogoutConfirmationSection = false;
    $scope.logoutConfirmation = function () {
        $scope.showLogoutConfirmationSection = true;
    };

    $scope.closeLogoutPanel = function () {
        $scope.showLogoutConfirmationSection = false;
    };

    $scope.doLogout = function () {
        auth.logout().then(function () {
            $rootScope.app.isDashboard = false;
            $rootScope.$emit('HIDE_BREADCRUMB');
            $state.go('signin');
        });
        $scope.showLogoutConfirmationSection = false;
    };
    $rootScope.$on('USER_LOGOUT', function() {
        $scope.doLogout();
    });
}])
.controller('dashboardCtrl', ['$rootScope', '$scope', '$http', 'uac', '$location', '$state', function ($rootScope, $scope, $http, uac, $location, $state) {
        'use strict';
        $rootScope.isBreadCrumbAvailable = true;
        $rootScope.app.isDashboard = true;
            
        /*State will be dashboard if coming via login flow. So check permission and do default landing logic*/
        /*Otherwise dont enable default landing logic. This is so that user can land on url directly*/
        if($state.current.name === 'dashboard') {
            if($rootScope.workZoneBool){
                $state.go('dashboard.workzone');
            }else if($rootScope.bluePrintBool){
                $state.go('dashboard.design');
            }else if($rootScope.trackBool){
                $state.go('dashboard.track');
            }else if($rootScope.settingsBool){
                $state.go('dashboard.settings');
            }
        }
    }
]);
