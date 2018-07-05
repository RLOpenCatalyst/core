/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('appPermission', []).service('modulePermission', ['uac', function(uac){
		this.workzoneAccess = function() {
			return uac.hasPermission('workzone','read','module');
		};
		this.designAccess = function() {
			return uac.hasPermission('design','read','module');
		};
		this.settingsAccess = function(){
			return uac.hasPermission('settings', 'read','module');
		};
		this.trackAccess = function() {
			//permission response not available in the api response.
			//return uac.hasPermission('track','read','module');
			return true;
		};
		this.analyticsBool = function() {
			//permission response not available in the api response.
			//return uac.hasPermission('track','read','module');
			return true;
		};
		this.serviceBool = function() {
			//permission response not available in the api response.
			//return uac.hasPermission('track','read','module');
			return true;
		};
	}]);
})(angular);