(function(){
	"use strict";
	angular.module('workzone.instance')
	.controller('instanceRunPuppetClientCtrl', ['$scope', '$modalInstance', 'workzoneServices','instanceId', function($scope, $modalInstance, workzoneServices, instanceId) {
		var instance_id = instanceId;
		angular.extend($scope,{
			ok: function () {
				workzoneServices.updatePuppetRunlist(instance_id).then(function () {
					
				});
			},
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
	}]);
 })();