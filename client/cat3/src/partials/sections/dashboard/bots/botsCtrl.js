/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.bots', ['library.bots','library.params']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
		var modulePerms = modulePermissionProvider.$get();
		$stateProvider.state('dashboard.bots.library', {
			url: "/library",
			templateUrl: "src/partials/sections/dashboard/bots/view/library.html",
			controller: "libraryCtrl as libr",
			params:{filterView:{library:true}},
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
		}).state('dashboard.bots.audittrail', {
			url: "/audittrail",
			templateUrl: "src/partials/sections/dashboard/bots/view/audittrail.html",
			controller: "audittrailCtrl as audit",
			params:{filterView:{audittrail:true}},
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
		});
	}])
	.controller('botsCtrl',['$scope', '$rootScope', '$state', function ($scope, $rootScope, $state) {
		$state.go('dashboard.bots.library');
		$rootScope.stateItems = $state.params;
	}]);
})(angular);