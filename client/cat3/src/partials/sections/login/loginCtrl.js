/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	function loginFunct($rootScope,$scope, $location, auth, $timeout) {
		$rootScope.dashboardChild='';
		function changeAddress(){
			$location.path('/dashboard');
		}
		$scope.inCorrectLoginMessage = "";
		$scope.login = function (){
			$scope.inCorrectLoginMessage = "";
			var promise = auth.login({
				"username": $scope.username,
				"pass": $scope.password,
				"authType": "token"//this is how backend is identifying the difference between the normal login and token based login
			});
			promise.then(function(){
				$scope.inCorrectLoginMessage = "";
				$timeout(changeAddress,0);
			},function(reject){
				console.log(reject.error.message);
				$scope.inCorrectLoginMessage = reject.error.message;
			});
		};
	}
	angular.module('global.login', [])
		.controller('loginCtrl', ['$rootScope','$scope', '$location','auth', '$timeout', loginFunct]);
})(angular);