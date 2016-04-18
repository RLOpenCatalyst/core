(function (angular) {
	"use strict";
	angular.module('workzone.instance')
	.controller('cookbookHelpCtrl', ['$scope', '$modalInstance', function($scope, $modalInstance) {
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})(angular);