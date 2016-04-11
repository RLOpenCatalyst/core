/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('upgradeAppCtrl', ['$scope', '$modalInstance', function($scope, $modalInstance) {
		

		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
	}]);
})();