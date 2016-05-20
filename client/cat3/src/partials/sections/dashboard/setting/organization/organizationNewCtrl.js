/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('settings.organization')
	.controller('organizationNewCtrl', ['$scope','$stateParams', function($scope, $stateParams){
		console.log('org edit controller');
		if($stateParams.id){
			$scope.Text = "Edit Page for org " + $stateParams.id;	
		}
		else{
			$scope.Text = "New Page for org";
		}
		
	}]);
})(angular);