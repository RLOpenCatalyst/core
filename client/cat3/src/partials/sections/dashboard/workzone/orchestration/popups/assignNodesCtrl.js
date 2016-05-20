/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
	.controller('assignNodesCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {

		$scope.runlistCollection = items.taskConfig.runlist || [];

		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
	}]);
})();