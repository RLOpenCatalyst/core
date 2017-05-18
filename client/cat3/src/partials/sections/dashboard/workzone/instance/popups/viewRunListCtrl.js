/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('viewRunListCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
			$scope.cookbookList = items.runlist;
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})(angular);