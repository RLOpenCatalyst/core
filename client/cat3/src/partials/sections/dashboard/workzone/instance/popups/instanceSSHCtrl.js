(function (angular) {
	"use strict";
	angular.module('workzone.instance')
	.controller('instanceSSHCtrl', ['$scope', '$modalInstance', 'sshInstance', function($scope, $modalInstance, sshInstance) {
		$scope.sshInstance = sshInstance;
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})(angular);