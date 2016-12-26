(function (angular) {
	"use strict";
	angular.module('dashboard.track', [])
	.controller('trackCtrl',['$scope', function ($scope) {
		$scope.Text = 'Track page';
	}]);
})(angular);