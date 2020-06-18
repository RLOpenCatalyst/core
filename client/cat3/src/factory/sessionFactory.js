/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Apr 2016
 */

(function (angular) {
	'use strict';
	angular.module('authentication')
		.factory('session', ['localStorage', '$rootScope', function (localStorage, $rootScope) {
			var _strToken = localStorage.getItem('session.accessToken');
			this._accessToken = _strToken === 'null' ? null : _strToken;
			try {
				this._user = JSON.parse(localStorage.getItem('session.user'));
			} catch (e) {
				this._user = null;
			}
			this._userFromLocalStorage = null;
			this.getUser = function () {
				return this._user;
			};
			this.setUser = function (user) {
				this._user = user;
				//console.log("setUser---------------------------------");
				localStorage.setItem('session.user', JSON.stringify(user));
				this.setHeaderNavigation(user);
				return this;
			};
			this.setUserFromLocalStorage = function () {
				//console.log("setUserFromLocalStorage---------------------------------");
				try {
					this._userFromLocalStorage = JSON.parse(localStorage.getItem('session.user'));
				} catch (e) {
					this._userFromLocalStorage = null;
				}
			};
			this.getUserFromLocalStorage = function () {
				return this._userFromLocalStorage;
			};
			this.setHeaderNavigation = function (user) {
				if (!user) {
					return; //when specific route accessed directly and user info not available
				}
				$rootScope.appDetails = user;
				$rootScope.$emit('SET_HEADER', user);
			};

			this.getToken = function () {
				return this._accessToken;
			};
			this.setToken = function (token) {
				this._accessToken = token;
				localStorage.setItem('session.accessToken', token);
				return this;
			};
			//TODO: To check if token is in sync or still valid, during a later login
			this.isTokenSyncWithServer = function () {
				return this.getToken();
			};
			this.destroy = function destroy() {
				this.setUser(null);
				this.setToken(null);
			};
			this.getHeaderObject = function getHeaderObject() {
				return this.getToken() && {'headers': {"x-catalyst-auth": this.getToken()}};
			};
			this.setHeaderNavigation(this._user);
			return this;
		}
	]);
})(angular);