/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addJenkinsParamsCtrl',['$scope', '$modalInstance','toastr',function($scope, $modalInstance,toastr){
			//default selection type
			$scope.params={
				defaultValue:"",
				name:"",
				description:""
			};
		   $scope.selectionType='';
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				var v=$scope.params;
				if($scope.selectionType && v.defaultValue && v.name && v.description){
					$scope.params.parameterName=$scope.selectionType;
					if($scope.params.parameterName === "Choice"){
						$scope.params.defaultValue = $scope.params.defaultValue.split(',');	
					}else{
						$scope.params.defaultValue=$scope.params.defaultValue;	
					}
					$modalInstance.close($scope.params);
				}
				else{
					toastr.error('Please fill appropriate values.');
				}
			};
		}
	]);
})(angular);

