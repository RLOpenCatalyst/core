(function(){
	"use strict";
	angular.module('workzone.blueprint')
	.controller('dockerRepoListCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
		console.log(items);
		$scope.dockerRepoList = items.blueprintConfig.dockerCompose;

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})();