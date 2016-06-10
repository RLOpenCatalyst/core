/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Apr 2016
 */

(function(angular){
	"use strict";
	angular.module('apis.authentication', []).service('authenticationAPI', ['$http','session', function($http,session) {
		var baseAPIUrl = uiConfigs.serverUrl;
		function fullUrl(relUrl){
			return baseAPIUrl + relUrl;
		}
		var serviceInterface={};
		serviceInterface.postAuth=function(params){
			var url = '/auth/signin';
			return $http.post(fullUrl(url),params);
		};
		serviceInterface.isTokenValid=function(token){
			var url = '/auth/istokenvalid/'+token;
			return $http.get(fullUrl(url));
		};
		serviceInterface.logout=function(){
			var url = '/auth/signout';
			return $http.get(fullUrl(url),session.getHeaderObject());
		};
		serviceInterface.getUserPermissions=function(){
			var url = '/auth/getpermissionset';
			return $http.get(fullUrl(url),session.getHeaderObject());
		};
		return serviceInterface;
	}]);
})(angular);
