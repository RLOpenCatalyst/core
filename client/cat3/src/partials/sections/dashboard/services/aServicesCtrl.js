/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.services',['services.paramsServices']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
		var modulePerms = modulePermissionProvider.$get();
		$stateProvider.state('dashboard.services.servicesList', {
			url: "/servicesList",
			templateUrl: "src/partials/sections/dashboard/services/view/servicesList.html",
			controller: "servicesListCtrl",
			parameters:{actServiceMenu:true,filterView:{services:true}},
			resolve: {
				auth: ["$q", function ($q) {
					var deferred = $q.defer();
					// instead, go to a different page
					if (modulePerms.servicesBool()) {
						// everything is fine, proceed
						deferred.resolve();
					} else {
						deferred.reject({redirectTo: 'dashboard'});
					}
					return deferred.promise;
				}]
			}
		}).state('dashboard.services.servicesCreate', {
            url: "/servicesCreate",
            templateUrl: "src/partials/sections/dashboard/services/view/servicesCreate.html",
            controller: "servicesCreateCtrl",
            parameters:{actServiceMenu:true,filterView:{servicesCreate:true}},
            resolve: {
                auth: ["$q", function ($q) {
                    var deferred = $q.defer();
                    // instead, go to a different page
                    if (modulePerms.servicesBool()) {
                        // everything is fine, proceed
                        deferred.resolve();
                    } else {
                        deferred.reject({redirectTo: 'dashboard'});
                    }
                    return deferred.promise;
                }]
            }
        }).state('dashboard.services.servicesDescription', {
            url: "/serviceDescription",
            templateUrl: "src/partials/sections/dashboard/services/view/servicesDescription.html",
            controller: "servicesDescriptionCtrl",
            parameters:{actServiceMenu:true,filterView:{serviceDescription:true}},
            params:{serviceDetail:[],listType:0},
            resolve: {
                auth: ["$q", function ($q) {
                    var deferred = $q.defer();
                    // instead, go to a different page
                    if (modulePerms.servicesBool()) {
                        // everything is fine, proceed
                        deferred.resolve();
                    } else {
                        deferred.reject({redirectTo: 'dashboard'});
                    }
                    return deferred.promise;
                }]
            }
        })
	}]).controller('servicesCtrl',['$scope', '$rootScope', '$state','genericServices', function ($scope, $rootScope, $state, genericServices) {
		$state.go('dashboard.services.servicesList');
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