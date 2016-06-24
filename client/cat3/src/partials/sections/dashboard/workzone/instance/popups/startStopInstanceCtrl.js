/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('startStopInstanceCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) {
			angular.extend($scope, {
				instance: items.inst,
				perm:items.hasPerm,
				authMsg:"",
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
				ok: function(){
					if($scope.perm){
						$scope.isStartStopInstanceLoading = true;
						$scope.startStopInstHandler();
					}else{
						$scope.authMsg = "Authentication Failed.";
					}
				},
				startStopInstHandler:function(){
					var urlParams = this.instance._id;
					var result=(this.instance.instanceState === "running") ? workzoneServices.stopInstance(urlParams) : workzoneServices.startInstance(urlParams);
					result.then(function(data) {
						if (data ) {
							$modalInstance.close(items);
							$scope.isStartStopInstanceLoading = false;
						} else {
							alert('Unexpected Behaviour');
						}
					}, function(error) {
						error = error.responseText || error;
						if (error.message) {
							alert(error.message);
						} else {
							alert(error);
						}
					});
				}
			});
		}
	]);
})(angular);