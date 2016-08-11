/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
   "use strict";
	angular.module('workzone.blueprint')
		.controller('removeBlueprintCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices','toastr', function($scope, $modalInstance, items, workzoneServices,toastr) {
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.removeBP = function() {
				workzoneServices.deleteBlueprint(items._id).then(
					function() {
						toastr.success('Successfully deleted');
						$modalInstance.close(items);
					},
					function(error) {
						error = error.responseText || error;

						if (error.message) {
							toastr.error(error.message);
						} else {
							toastr.error(error);
						}
					}
				);
			};
		}
	]);
})(angular);
