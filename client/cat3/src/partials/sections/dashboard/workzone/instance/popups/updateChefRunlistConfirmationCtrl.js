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
					$scope.isSubmitLoading = true;
					workzoneServices.updateChefRunlist(instance_id, reqBody).then(function () {
						$scope.isSubmitLoading = false;
						$modalInstance.close();
					}, function(error){
						$scope.isSubmitLoading = false;
						if(error.responseText){
							$scope.chefRunErrorMessage = error.responseText;
						}
					});
				},
				cancel: function() {
					$modalInstance.dismiss('cancel');
				}
			});
		}
	]);
 })(angular);