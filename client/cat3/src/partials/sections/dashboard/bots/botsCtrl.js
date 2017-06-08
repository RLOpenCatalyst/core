/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.bots', ['library.bots','library.params','bots.paramService']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
		var modulePerms = modulePermissionProvider.$get();
		$stateProvider.state('dashboard.bots.library', {
			url: "/library",
			templateUrl: "src/partials/sections/dashboard/bots/view/library.html",
			controller: "libraryCtrl as libr",
			parameters:{actMenu:true,filterView:{library:true}},
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
			parameters:{actMenu:true,filterView:{audittrail:true}},
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
		}).state('dashboard.bots.botsDescription', {
			url: "/botDescription",
			templateUrl: "src/partials/sections/dashboard/bots/view/botsDescription.html",
			controller: "botDescriptionCtrl as btsDescription",
			parameters:{actMenu:true,filterView:{botsDescription:true}},
            params:{botDetail:[],listType:0},
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
		}).state('dashboard.bots.botsCreate', {
			url: "/botCreate",
			templateUrl: "src/partials/sections/dashboard/bots/view/newBotCreate.html",
			controller: "newBotCtrl as newBtsCtrl",
			parameters:{actMenu:true,filterView:{newBotCreate:true}},
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
		}).state('dashboard.bots.sync', {
			url: "/botsSync",
			templateUrl: "src/partials/sections/dashboard/bots/view/sync.html",
			controller: "syncCtrl as botsSync",
			parameters:{actMenu:true,filterView:{sync:true}},
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
	.controller('botsCtrl',['$scope', '$rootScope', '$state','genericServices', function ($scope, $rootScope, $state, genericServices) {
		//$state.go('dashboard.bots.library');
		$scope.$watch(function() {
			$rootScope.stateItems = $state.current.name;
		});
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject=orgs;
			$rootScope.organNewEnt=[];
			$rootScope.organNewEnt.org = orgs[0];
			$rootScope.organNewEnt.buss = orgs[0].businessGroups[0];
			$rootScope.organNewEnt.proj = orgs[0].businessGroups[0].projects[0];
		});
	}]);
})(angular);