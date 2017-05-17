/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Apr 2016
 */

(function (angular) {
	'use strict';
	angular.module('authentication')
		.factory('localStorage', ['$window', function ($window) {
			if($window.localStorage){
				return $window.localStorage;
			}
			throw new Error('Browser does not support HTML5 local storage');
		}
	]);
})(angular);