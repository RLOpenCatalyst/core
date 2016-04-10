(function (angular) {
	"use strict";
	angular.module('dashboard.settings', ['settings.organization'])
	.controller('settingCtrl',['$scope', '$rootScope', function ($scope, $rootScope) {
		/*Note state params value is passed from routes, while state is already added in rootscope*/
		$scope.Text = "State Params Example : " + $rootScope.$stateParams.activeSection;
	}]);
})(angular);
