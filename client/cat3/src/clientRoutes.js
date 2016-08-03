/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
function routeConfig($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
	"use strict";
	var val = window.localStorage.getItem('catAuthToken');
	var modulePerms = modulePermissionProvider.$get();
	if (val) {
		var getAuthTokenDetails = JSON.parse(val);
		if (getAuthTokenDetails && getAuthTokenDetails.token) {
			$httpProvider.defaults.headers.common[getAuthTokenDetails.tokenHeaderName] = getAuthTokenDetails.token;
		}
	}
	$urlRouterProvider.otherwise("/signin");
	$stateProvider.state('signinDefault', {
		url: "",
		templateUrl: "src/partials/sections/login/login.html",
		controller: "loginCtrl"
	}).state('signin', {
		url: "/signin",
		templateUrl: "src/partials/sections/login/login.html",
		controller: "loginCtrl",
		data:{
			menuName:''
		}
	}).state('dashboard', {
		url: "/dashboard",
		template: "<div ui-view></div>",
		controller: "dashboardCtrl",
		data:{
			menuName:'dashboard'
		},
		onEnter: function () {
		},
		onExit: function () {
		}
	}).state('dashboard.workzone', {
		url: "/workzone",
		templateUrl: "src/partials/sections/dashboard/workzone/workzone.html",
		controller: "workzoneCtrl",
		data:{
			menuName:'workzone'
		},
		onEnter: function () {
		},
		onExit: function () {
		},
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.workzoneAccess()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;
			}]
		}
	}).state('dashboard.design', {
		url: "/design",
		templateUrl: "src/partials/sections/dashboard/design/design.html",
		controller: "designCtrl",
		data:{
			menuName:'design'
		},
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.designAccess()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;
			}]
		}
	}).state('dashboard.designSubView', {
		url: "/design/:subItem/:view",
		templateUrl: "src/partials/sections/dashboard/design/design.html",
		controller:'designSubItemCtrl as desSubItm',
		params:{templateObj:null,blueId:null},
		data:{
			menuName:'design',
			subChild: function($stateParams){
				return{
					item:$stateParams.subItem,
					view:$stateParams.view
				}
			}
		},
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.designAccess()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;
			}]
		}
	}).
	state('dashboard.settings', {
		url: "/settings",
		templateUrl: "src/partials/sections/dashboard/setting/setting.html",
		controller: "settingCtrl",
		params: {
			activeSection: 'activeSection'
		},
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.settingsAccess()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;
			}]
		}
	}).state('dashboard.track', {
		url: "/track",
		templateUrl: "src/partials/sections/dashboard/track/track.html",
		controller: "trackCtrl",
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.trackAccess()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;

			}]
		}
	}).state('dashboard.settings.organization', {
		url: "/organizations",
		templateUrl: "src/partials/sections/dashboard/setting/organization/organization.html",
		controller: "organizationCtrl"
	}).state('dashboard.settings.listOrganizations', {
		url: "/organizations/list",
		templateUrl: "src/partials/sections/dashboard/setting/organization/organizationList.html",
		controller: "organizationListCtrl"
	}).state('dashboard.settings.newOrganization', {
		url: "/organizations/new",
		templateUrl: "src/partials/sections/dashboard/setting/organization/organizationNew.html",
		controller: "organizationNewCtrl"
	}).state('dashboard.settings.editOrganization', {
		url: "/organizations/edit/:id",
		templateUrl: "src/partials/sections/dashboard/setting/organization/organizationNew.html",
		controller: "organizationNewCtrl"
	}).state('reset', {
		url: "/reset",
		controller: "resetCtrl"
	});
}
angularApp.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', routeConfig]);