/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.instance')
		.controller('instanceSSHCtrl', ['$scope', '$modalInstance', 'sshInstance', function($scope, $modalInstance, sshInstance) {
			$scope.sshInstance = sshInstance;
			$scope.isSSHLoading = true;
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})(angular);