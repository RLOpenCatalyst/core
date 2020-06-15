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
	console.log("hit****************************************");
	$urlRouterProvider.otherwise("/signin");
	$stateProvider.state('signinDefault', {
		url: "",
		templateUrl: "src/partials/sections/login/login.html",
		controller: "loginCtrl as logD"
	}).state('signin', {
		url: "/signin",
		templateUrl: "src/partials/sections/login/login.html",
		controller: "loginCtrl as logD"
	}).state('dashboard', {
		url: "/dashboard",
		template: "<div ui-view></div>",
		controller: "dashboardCtrl",
		onEnter: function () {
		},
		onExit: function () {
		}
	}).state('dashboard.workzone', {
		url: "/workzone",
		templateUrl: "src/partials/sections/dashboard/workzone/workzone.html",
		controller: "workzoneCtrl",
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
		controller: "designCtrl as desCtrl",
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
	}).state('dashboard.analytics', {
		url: "/CM/",
		templateUrl: "src/partials/sections/dashboard/analytics/analytics.html",
		controller: "analyticsCtrl as analytic",
		//params:{filterView:{analytics:true}},
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.analyticsBool()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;

			}]
		}
	}).state('dashboard.bots', {
		url: "/bots/library",
		templateUrl: "src/partials/sections/dashboard/bots/bots.html",
		controller: "botsCtrl as bts",
        abstract: true,
		resolve: {
			auth: ["$q", function ($q) {
				var deferred = $q.defer();
				// instead, go to a different page
				if (modulePerms.serviceBool()) {
					// everything is fine, proceed
					deferred.resolve();
				} else {
					deferred.reject({redirectTo: 'dashboard'});
				}
				return deferred.promise;
			}]
		}
	}).state('dashboard.settings', {
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