/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addJobLinksCtrl',['$scope', '$modalInstance',function($scope, $modalInstance){
			function evaluator(){
				return true;
			}
			$scope.jobLink='';
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				if(evaluator($scope.jobLink) && $scope.jobLink){
					$modalInstance.close($scope.jobLink);
				}else{
					alert('Please check the url.');
				}
			};
		}
	]);
})(angular);

