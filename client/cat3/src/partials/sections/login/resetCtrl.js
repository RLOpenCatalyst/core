/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
	"use strict";
	function resetApplication($rootScope, $location, session, $timeout) {
		function changeAddress(){
			$location.path('/signin');
		}
		function resetRootScope(){
			for (var prop in $rootScope) {
				if (prop.substring(0,1) !== '$') {
					delete $rootScope[prop];
				}
			}
		}
		$rootScope.app.isDashboard = false;
  		$rootScope.$emit('HIDE_BREADCRUMB');
		session.destroy();
		$timeout(changeAddress,0);
	}
	
	angular.module('global.login')
		.controller('resetCtrl', ['$rootScope', '$location','session', '$timeout', resetApplication]);
})();