/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addScriptParamsCtrl',['$scope', '$modalInstance',function($scope, $modalInstance){
			//default selection type
			$scope.params=[''];
			$scope.add = function() {
			  $scope.params.push('');
			};
			$scope.removeScriptInputParams = function(paramInput) {
				var idx = $scope.params.indexOf(paramInput);
				$scope.params.splice(idx,1);
			}
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				if($scope.params){
					$modalInstance.close($scope.params);
				}
				else{
					alert('Please fill appropriate values.');
				}
			};
		}
	]);
})(angular);

