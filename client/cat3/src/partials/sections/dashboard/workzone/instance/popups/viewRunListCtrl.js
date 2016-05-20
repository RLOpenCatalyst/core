(function(){
	"use strict";
	angular.module('workzone.instance')
	.controller('viewRunListCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
		$scope.cookbookList = items.runlist;

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})();