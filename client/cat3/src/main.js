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

var angularApp = angular.module('catapp', ['ui.router','ngTouch','toastr','angularMoment',
	'global.login',
	'global.breadcrumb',
	'authentication',
	'factory.appPermission',
	'appPermission',
	'dashboard',
	'directive.loading',
	'ngSanitize',
	'global.cache',
	'ui.grid',
	'ui.grid.pagination',
	'ui.grid.autoResize','ui.grid.exporter',
	'ui.grid.resizeColumns',
	'global.uiGridOptions',
	'global.messages',
	'ui.grid.selection','ui.grid.cellNav'
]);

angularApp.run(['$rootScope', 'auth', '$state', '$stateParams','$http','$window',
	function ($rootScope, Auth, $state, $stateParams,$http) {
		'use strict';
		$rootScope.$on('$stateChangeStart', function (event, toState) {
			//More function params: function (event, toState, toParams, fromState, fromParams)
			function checkAuthentication() {
				if (toState.name !== 'signin' && !Auth.isLoggedIn()) {
					event.preventDefault();
					$state.go('signin');
				} else if ((toState.name === 'signin' || toState.name === 'signinDefault') && Auth.isLoggedIn()) {
					event.preventDefault();
					$state.go('dashboard');
				}
			}
			if (Auth.getToken() && !Auth.isLoggedInFirst()) {
				Auth.isTokenValid().then(function (token) {
					if (!token) {
						Auth.destroyUser();
						event.preventDefault();
						$state.go('signin');
					} else {
						Auth.setUserFromLocalStorage();
						checkAuthentication();
					}
				});
			} else {
				checkAuthentication();
			}
		});
		$rootScope.$on('$stateChangeError', function (evt, to, toParams, from, fromParams, error) {
			if (error.redirectTo) {
				$state.go(error.redirectTo);
			} else {
				$state.go('error', {status: error.status});
			}
		});
		$rootScope.state = $state;
		$rootScope.stateParams = $stateParams;
	}
]);

angularApp.controller('HeadNavigatorCtrl', ['$scope', '$rootScope', 'moment', 'authenticationAPI', '$http', '$log', '$location', '$window', 'auth', '$state', 'modulePermission', function ($scope, $rootScope, moment, authenticationAPI,$http, $log, $location, $window, auth, $state, modulePerms) {
	'use strict';
	//global Scope Constant Defined;
	$rootScope.app = $rootScope.app || {};
	$rootScope.app.isDashboard = false;
	$rootScope.appDetails = $rootScope.appDetails || {};
	$rootScope.$on('SET_HEADER', function () {
		//permission set is included to show/hide modules.
		var _permSet = {
			workzone: modulePerms.workzoneAccess(),
			design: modulePerms.designAccess(),
			settings: modulePerms.settingsAccess(),
			track: modulePerms.trackAccess(),
			analyticsBool: modulePerms.analyticsBool(),
			serviceBool: modulePerms.serviceBool()
		};
		$rootScope.workZoneBool = _permSet.workzone;
		$rootScope.designBool = _permSet.design;
		$rootScope.settingsBool = _permSet.settings;
		$rootScope.trackBool = _permSet.track;
		$rootScope.analyticsBool = _permSet.analyticsBool;
		$rootScope.serviceBool = _permSet.serviceBool;
	});
	$scope.$watch(function() {
		$rootScope.moduleSelection = $state.params;
	});
	$rootScope.$emit('SET_HEADER', $rootScope.appDetails);
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
	$rootScope.$on('USER_LOGOUT', function () {
		$scope.doLogout();
	});

	$scope.checkForNotification = function() {
		var socketClient = io('/notify')
        socketClient.on('connect',function(){
        	authenticationAPI.getUserPermissions().then(function(response){
				$scope.userName = response.data.cn;
				socketClient.emit('join','client-'+$scope.userName);
				socketClient.emit('onLoad',$scope.userName);
			});
        });
        
        $scope.notificationList = [];
        $scope.checkTimeForNotification = [];
        socketClient.on('noticelist',function(data){
        	$scope.notificationCount = data.count;
            $scope.notificationList = data.data;
        });

        socketClient.on('notice',function(data){
        	$scope.notificationList.unshift(data);
    		$scope.$apply(function () {
	            $scope.notificationCount = $scope.notificationCount + 1;
	        });
        });

        socketClient.on('update',function(data){
       
        });

        $scope.userClick = function() {
        	socketClient.emit('noticeack',$scope.userName);
        };

        socketClient.on('disconnect',function(){
            socketClient.emit('leave','client-'+$scope.userName);
        });
	};

	$scope.notificationCheck = function() {
		$scope.userClick();
	};

	$scope.checkForNotification();
}]);
