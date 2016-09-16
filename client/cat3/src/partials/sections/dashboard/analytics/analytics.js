(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['apis.analytics','nvd3'])
		.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.analytics.cost', {
				url: "cost/:view",
				templateUrl: "src/partials/sections/dashboard/analytics/view/cost.html",
				controller: "costCtrl as cost",
				params:{org:null,bus:null,proj:null},
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
	.controller('analyticsCtrl',['$scope', '$rootScope','$state','genericServices', function ($scope, $rootScope,$state,genericServices) {
		var analytic = this;
		$rootScope.isOpenSidebar = false;
		$rootScope.dashboardChild = 'analytics';
		$rootScope.stateParams = $state.params;
		var treeNames = ['ANALYTICS'];
		$rootScope.$emit('treeNameUpdate', treeNames);
		$rootScope.$emit('HEADER_NAV_CHANGE', 'ANALYTICS');
		// // get organigetion
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject = orgs;
		});
		$rootScope.organNewEnt=[];
		$rootScope.organNewEnt.org = '0';
		$rootScope.organNewEnt.buss='0';
		$rootScope.organNewEnt.proj='0';
		if (!$rootScope.stateParams.view) {
			$state.go('dashboard.analytics.cost', {view: 'chat'});
		}
	}]);
})(angular);
