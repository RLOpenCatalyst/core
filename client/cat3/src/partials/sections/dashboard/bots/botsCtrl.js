(function (angular) {
	"use strict";
	angular.module('dashboard.bots', ['library.bots']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.bots.library', {
				url: "/library",
				templateUrl: "src/partials/sections/dashboard/bots/view/library.html",
				controller: "libraryCtrl as libr",
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
			})
		}])
	.controller('botsCtrl',['$scope', '$rootScope','$state', function ($scope, $rootScope,$state) {
		var treeNames = ['Bots'];
		$rootScope.$emit('treeNameUpdate', treeNames);
		$state.go('dashboard.bots.library');
	}]);
})(angular);