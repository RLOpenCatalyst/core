/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('deployNewAppCtrl', ['$scope', '$rootScope', '$modal', '$modalInstance', function($scope, $rootScope, $modal, $modalInstance) {
		/*$scope.isSelectedEnable = true;
		$scope.serverType='';
		console.log($scope.serverType);
		if($scope.serverType==='nexusServer' || $scope.serverType==='rldocker') {
			$scope.isSelectedEnable = false;
		}*/
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			createNewJob: function(type) {
			   $modal.open({
					animate: true,
					templateUrl: "src/partials/sections/dashboard/workzone/orchestration/popup/newTask.html",
					controller: "newTaskCtrl",
					backdrop : 'static',
					size: 'lg',
					keyboard: false,
					resolve: {
						items: function() {
							return type;
						}
					}
				})
				.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
				}, function() {
					
				}); 
			}
		});
	}]);
})();