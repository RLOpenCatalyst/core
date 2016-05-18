/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.cloudFormation')
	.controller('removeCFTCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) {
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
		$scope.removeCFT = function() {
			workzoneServices.deleteCloudFormation(items._id).then(
				function() {
					$modalInstance.close(items);
				},
				function(error) {
					error = error.responseText || error;
					if (error.message) {
						alert(error.message);
					} else {
						alert(error);
					}
				}
			);
		};
	}]);
})();