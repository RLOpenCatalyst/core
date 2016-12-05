/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addScriptParamsCtrl',['$scope', '$modalInstance','items', 'toastr',function($scope, $modalInstance,$items, toastr){
			//default selection type
			$scope.params=[];
			for(var i =0; i < $items.noOfParams; i++){
				$scope.params.push({});
			}
			$scope.add = function() {
			  $scope.params.push({});
			};
			$scope.removeScriptInputParams = function(paramInput) {
				if($scope.params.length > 1){
					var idx = $scope.params.indexOf(paramInput);
					$scope.params.splice(idx,1);
				}else{
					toastr.error('Cannot delete the row');
				}
			};
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				var checkParam = false;
				for(var i =0; i<$scope.params.length; i++){
					if(Object.keys($scope.params[i]).length === 0){
						checkParam = false;
						toastr.error('Please enter parameters');
						return false;
					}else{
						checkParam = true;
					}
				}
				if(checkParam){
					$modalInstance.close($scope.params);	
				}
				
			};
		}
	]);
})(angular);

