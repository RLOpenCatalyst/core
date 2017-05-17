(function (angular) {
	"use strict";
	angular.module('dashboard.track', []).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
         modulePermissionProvider.$get();
    }]).controller('trackCtrl',[ function () {
        // create left tree

	}]);
})(angular);