/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.instance')
	.controller('updateChefRunlistConfirmationCtrl', ['$scope', '$modalInstance', 'workzoneServices', '$rootScope', 'items', function($scope, $modalInstance, workzoneServices, $rootScope, items) {
		var instance_id = items.instanceId;
		angular.extend($scope,{
			ok: function () {
				var reqBody = items.taskJSON;
				workzoneServices.updateChefRunlist(instance_id, reqBody).then(function () {
					$modalInstance.close();
				}, function(error){
					if(error.responseText){
						//asking the user the atleast select one cookbook.
						alert('Please select atleast one cookbook');
						$modalInstance.dismiss('cancel');
						//$scope.errorMessage = error.responseText;
					}
				});
			},
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
	}]);
 })(angular);