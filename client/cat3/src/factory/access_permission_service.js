/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

//This is a global service and will be cache 
angular.module('factory.appPermission', []).factory('uac', ['$http', '$log', '$q', 'session', function ($http, $log, $q, session) {
	'use strict';
	function getpermissionforcategory (category, permissionto, permissionset) {
		var perms = [];
		if (permissionset) {
			for (var i = 0; i < permissionset.length; i++) {
				var obj = permissionset[i].permissions;
				for (var j = 0; j < obj.length; j++) {
					if (obj[j].category === category) {
						var acc = obj[j].access.toString().split(',');
						for (var ac in acc) {
							if (perms.indexOf(acc[ac]) < 0){
								perms.push(acc[ac]);
							}
						}
					}
				}
			}
			if (perms.indexOf(permissionto) >= 0) {
				return (true);
			} else{
				return (false);
			}
		} else {
			return (false);
		}
	}
	var permissionService = {
		hasPermission: function(category, permissionto){
			var	retVal = '';
			if (!session.getUser()) {
				return false; // return permission denied
			}else {
				retVal = getpermissionforcategory(category, permissionto, session.getUser().permissionset);
				return retVal;
			}
		}
	};
	return {
		hasPermission: permissionService.hasPermission
	};
}]);