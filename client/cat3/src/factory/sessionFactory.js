/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Apr 2016
 */

(function () {
	'use strict';
	angular.module('authentication')
		.factory('session', ['localStorage', '$rootScope', function (localStorage, $rootScope) {
			var _strToken = localStorage.getItem('session.accessToken');

			this._accessToken = _strToken ==='null' ? null : _strToken; 
			this._user = JSON.parse(localStorage.getItem('session.user'));

			this.getUser = function(){
				return this._user;
			};

			this.setUser = function(user){
				this._user = user;
				localStorage.setItem('session.user', JSON.stringify(user));
				this.setHeaderNavigation(user);
				return this;
			};

			this.setHeaderNavigation = function(d){
				if(!d){
					return; //when specific route accessed directly and user info not available
				}
		
				$rootScope.appDetails = d;

				var headNavigArr = $rootScope.appDetails.authorizedfiles.split(',');

				$rootScope.workZoneBool = (headNavigArr.indexOf('Workspace') !== -1) ? true : false;
				$rootScope.bluePrintBool = (headNavigArr.indexOf('blueprints') !== -1) ? true : false;
				$rootScope.trackBool = (headNavigArr.indexOf('Track') !== -1) ? true : false;
				$rootScope.settingsBool = (headNavigArr.indexOf('Settings') !== -1) ? true : false;
			};

			this.getToken = function(){
				return this._accessToken;
			};

			this.setToken = function(token){
				this._accessToken = token;
				localStorage.setItem('session.accessToken', token);
				return this;
			};

			//TODO: To check if token is in sync or still valid, during a later login
			this.isTokenSyncWithServer = function (){
				return this.getToken();
			};

			this.destroy = function destroy(){
				this.setUser(null);
				this.setToken(null);
			};

			this.getHeaderObject = function getHeaderObject(){
				return this.getToken() && {'headers': {"x-catalyst-auth": this.getToken()}};
			};
			
			this.setHeaderNavigation(this._user);
			return this;
		}

	]);
})();