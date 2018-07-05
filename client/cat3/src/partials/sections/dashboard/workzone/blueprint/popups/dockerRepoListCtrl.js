/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(angular){
	"use strict";
	angular.module('workzone.blueprint')
		.controller('dockerRepoListCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
			console.log(items);
			$scope.dockerRepoList = items.blueprintConfig.dockerCompose;

			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})(angular);