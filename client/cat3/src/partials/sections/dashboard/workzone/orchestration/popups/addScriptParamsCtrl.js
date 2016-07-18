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
			$scope.params={};
			$scope.inputCounter = 0;
			$scope.inputs = [{
			  id: 'input'
			}];
			$scope.add = function() {
			  $scope.inputTemplate = {
			    id: 'input-' + $scope.inputCounter,
			    name: ''
			  };
			  $scope.inputCounter += 1;
			  $scope.inputs.push($scope.inputTemplate);
			};
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				var v=$scope.params;
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

