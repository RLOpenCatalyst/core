/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('upgradeAppCtrl', ['items','$scope', '$modalInstance','workzoneServices', function(items,$scope, $modalInstance,wzService) {

		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			init :function(){
				wzService.getAppUpgrade(items).then(function (FrzData){

				});
			}
		});
		$scope.init();
	}]);
})();