/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzonePermission', []).service('instancePermission', ['uac', function(uac){
		this.checkChef = function() {
			return uac.hasPermission('instancechefclientrun','modify');
		};
		this.checkPuppet = function() {
			return uac.hasPermission('puppetserver','modify');
		};
		this.logInfo = function() {
			return uac.hasPermission('logs','read');
		};
		this.ssh = function(){
			return uac.hasPermission('instanceconnect', 'execute');
		};
		this.rdp = function(){
			return true;
			//return uac.hasPermission('instancerdp','execute');
		};
		this.instanceStart = function(){
			return uac.hasPermission('instancestart','execute');
		};
		this.instanceStop = function(){
			return uac.hasPermission('instancestop','execute');
		};
		this.launch = function(){
			return uac.hasPermission('instancelaunch','execute');
		};
	}]).service('orchestrationPermission', [function(){
		this.createTask = function() {
			return true;
			//return uac.hasPermission('instancetasks','create');
		};
		this.editTask = function() {
			return true;
			//return uac.hasPermission('instancetasks','modify');
		};
		this.deleteTask = function() {
			return true;
			//return uac.hasPermission('instancetasks','delete');
		};
	}]).service('applicationPermission', ['uac', function(uac){
		this.createApp = function() {
			return uac.hasPermission('application', 'create');
		};
		this.appDeploy = function() {
			return uac.hasPermission('application_instance','create');
		};
		this.deployHistory = function() {
			return uac.hasPermission('deploy_history','read');
		};
		this.upgradeApp = function() {
			return true;
		};
		this.promoteApp = function() {
			return true;
		};
		this.revokeApp = function() {
			return true;
		};
		this.approveApp = function() {
			return true;
		};
		this.createTask = function() {
			return true;
		};
	}]);
})(angular);