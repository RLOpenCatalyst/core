/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Apr 2016
 */

(function () {
	'use strict';
	angular.module('authentication', ['apis.authentication'])
		.factory('auth', ['$http', '$q', '$rootScope', 'authenticationAPI', 'session', function ($http, $q, $rootScope, authenticationAPI, session) {
			
			this.login = function(params){
				var deferred = $q.defer();
				authenticationAPI.postAuth(params).then(function(response){
					var data = response.data;
					if(!data.token){
						deferred.reject({'error': {'type': 'login', 'message': 'Wrong credentials. Server trying to redirect'}});
						return;
					}
					session.setToken(data.token);
					authenticationAPI.getUserPermissions().then(function (response) {
						session.setUser(response.data);
						deferred.resolve();	
					}, function(error) {
						session.setUser(null);
						deferred.reject({'error': {'type': 'permission', 'message': error.data.message || error.data}});
					});
				}, 
				function(error){
					session.setToken(null);
					deferred.reject({'error': {'type': 'login', 'message': error.data.message}});
				});
				return deferred.promise;
			};	
			
			this.isLoggedIn = function isLoggedIn() {
				return session.getUser() !== null;
			};
			
			this.logout = function(){
				return authenticationAPI.logout().then(function(){
					session.destroy();      
				});
			};
	
			return this;
		}
	]);
})();