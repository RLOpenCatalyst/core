/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
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
		}
	]);
 })(angular);