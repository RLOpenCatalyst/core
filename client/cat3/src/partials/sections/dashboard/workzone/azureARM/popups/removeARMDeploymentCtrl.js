/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.azureARM')
	.controller('removeARMDeploymentCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'items', function($scope, $modalInstance, workzoneServices, items) {
		$scope.cancel = function() {
			$modalInstance.dismiss('cancel');
		};
		$scope.ok = function() {
			workzoneServices.removeARMDeployment(items._id).then(function() {
				$modalInstance.close(items);
			});
		};
	}]);
})(angular);