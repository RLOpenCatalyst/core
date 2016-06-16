(function (angular) {
	"use strict";
	angular.module('workzone.application').directive("pipelineCard",[function () {
		return {
			restrict: 'A',
			templateUrl: 'src/partials/sections/dashboard/workzone/application/pipelineCard.html',
			scope: {
				cardDetails:'=',
				appName :'=',
				envName:'@',
				cardType:'@'
			},
			controller: 'PipeLineViewCtrl as pipeCtrl',
			link: function (scope) {
				scope.cardDetails = scope.cardDetails;
				scope.appName = scope.appName;
				scope.envName = scope.envName;
				scope.cardType = scope.cardType;
			}
		};
	}]);
})(angular);