(function (angular) {
	"use strict";
	angular.module('workzone.instance')
	.controller('instanceSSHCtrl', ['$scope', '$modalInstance', 'sshInstance', function($scope, $modalInstance, sshInstance) {
		$scope.sshInstance = sshInstance;
		$scope.isSSHLoading = true;
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})(angular);