/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
	.controller('viewNodesCtrl', ['$scope', 'items', '$modalInstance', function($scope, items, $modalInstance) {
		if (items.hasOwnProperty('data')) {
			$scope.instanceList = items.data;
		} else {
			$scope.instanceList = items;
		}
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})();