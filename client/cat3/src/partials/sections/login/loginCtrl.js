/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('global.login',[]).service('loginServices',['$rootScope', '$q', '$http','toastr',function($rootScope,$q,$http,toastr){
	var loginServices=this;
        loginServices.promiseGet = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.get(paramsObject.url)
                .success(function(data) {
                    if(!paramsObject.inlineLoader){$rootScope.onBodyLoading=false;}
                    deferred.resolve(data);
                })
                .error(function(data) {
                    if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=false;}
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };
	}]).controller('loginCtrl', ['$scope', '$location','auth', '$timeout','loginServices', function ($scope, $location, auth, $timeout,loginServices) {
		var logD=this;
		 loginServices.promiseGet({url:"/applications/latest/version"}).then(function(res){
		 	logD.vers=res.appVersion;
		 });
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
		
	}]);
})(angular);