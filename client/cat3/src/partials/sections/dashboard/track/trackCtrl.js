(function (angular) {
	"use strict";
	angular.module('dashboard.track', []).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
        var modulePerms = modulePermissionProvider.$get();
    }]).controller('trackCtrl',['$scope','$rootScope','genericServices', function ($scope,$rootScope,genericServices) {
        // create left tree

	}]);
})(angular);