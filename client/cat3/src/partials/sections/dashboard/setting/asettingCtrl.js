(function (angular) {
	"use strict";
	angular.module('dashboard.settings', ['settings.organization']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
        var modulePerms = modulePermissionProvider.$get();
        $stateProvider.state('dashboard.settings.cicdDashboard', {
            url: "/cicdDashboard/",
            templateUrl: "src/partials/sections/dashboard/setting/view/createDashboard.html",
            controller: "createDashboardCtrl as createDash",
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
        }).state('dashboard.settings.dashboardList', {
            url: "/dashboardList/",
            templateUrl: "src/partials/sections/dashboard/setting/view/dashboardList.html",
            controller: "dashboardListCtrl as createDashList",
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
        });
    }])
	.controller('settingCtrl',['$scope', '$rootScope','$state','genericServices', function ($scope, $rootScope,$state,genericServices) {
		/*Note state params value is passed from routes, while state is already added in rootscope*/
        $rootScope.treeResult=[];
        $scope.isTreeOpen = false;
	// create left tree
        genericServices.promiseGet({url:"src/partials/sections/dashboard/setting/data/treeMenu.JSON"}).then(function (treeResult) {
            $rootScope.treeResult=treeResult;
        });
        $state.go('dashboard.settings.dashboardList');
	}]);
})(angular);
