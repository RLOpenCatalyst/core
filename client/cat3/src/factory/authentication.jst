/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function () {
	'use strict';
	angular.module('authenticationModel', [])
		.factory('Auth', [function () {
			var localStorageKeyName = 'catAuthToken';

			return {
				getToken: function () {
					var val = window.localStorage.getItem(localStorageKeyName);
					var getAuthTokenDetails;
					if (val) {
						getAuthTokenDetails = JSON.parse(val);
					}
					return (getAuthTokenDetails && getAuthTokenDetails.token);
				},
				setToken: function (token) {
					window.localStorage.setItem(localStorageKeyName, JSON.stringify({
						'token': token,
						'tokenHeaderName': 'x-catalyst-auth'
					}));
				},
				removeToken: function () {
					window.localStorage.removeItem(localStorageKeyName);
				},
				isLoggedIn: function () {
					return !!this.getToken();
				},
				isToeknSyncWithServer: function () {
					return this.getToken();
				},
				getHeaderObject: function () {
					var val = window.localStorage.getItem(localStorageKeyName);
					var getAuthTokenDetails;
					if (val) {
						getAuthTokenDetails = JSON.parse(val);
					}
					return getAuthTokenDetails && {'headers': {"x-catalyst-auth": getAuthTokenDetails.token}};
				}
			};
		}
	]);
})();