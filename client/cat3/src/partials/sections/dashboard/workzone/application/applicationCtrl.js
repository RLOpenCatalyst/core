/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.application', ['datatables', 'ngAnimate', 'ui.bootstrap', 'apis.workzone', 'workzonePermission', 'filter.currentTime', 'workzone.orchestration'])
		.service('appDeployResponseFormatter', [function(){
			var pipeLineConfig = {
				activeEnvs : ["Dev", "Prod"] //TODO: To get from configuration service and set
			};
			/*return {
				setPipeLineConfiguration : function(activeEnvs){
					pipeLineConfig.activeEnvs = activeEnvs;
				},
				getPipeLineConfiguration : function(){
					return pipeLineConfig;
				},
				formatPipelineDataArrayToObjList: function (apiPipelineData) {
					var formattedPipeLineData= [];
					for(var i=0; i < apiPipelineData.length; i++){
						var appArrayItem = apiPipelineData[i], newApp = {};
						newApp.applicationName = appArrayItem.applicationName;
						newApp.applicationVersion = appArrayItem.applicationVersion;
						newApp.environments = {};
						for(var envIndex=0; envIndex< appArrayItem.envId.length; envIndex++){
							var envId = appArrayItem.envId[envIndex]; //string
							var appDetailsInEnv = {};
							appDetailsInEnv.applicationInstanceName = appArrayItem.applicationInstanceName[envIndex];
							appDetailsInEnv.applicationNodeIP = appArrayItem.applicationNodeIP[envIndex];
							appDetailsInEnv.applicationLastDeploy = appArrayItem.applicationLastDeploy[envIndex];
							appDetailsInEnv.applicationStatus = appArrayItem.applicationStatus[envIndex];
							appDetailsInEnv.containerId = appArrayItem.containerId[envIndex];
							appDetailsInEnv.hostName = appArrayItem.hostName[envIndex];
							appDetailsInEnv.appLogs = appArrayItem.appLogs[envIndex];
							newApp.environments[envId] = appDetailsInEnv;
						}
						formattedPipeLineData.push(newApp);
					 }
					return formattedPipeLineData;
				}
			};*/
		}])
		.controller('applicationCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal', 'appDeployResponseFormatter', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, appDeployResponseFormatter) {
			$scope.activeEnvs = ["Dev","Prod"]; //TODO: To get from configuration service and set
			$scope.isApplicationPageLoading = true;
			$scope.isPipelineViewActive = true;
			$scope.applicationPipelineView = function() {
				$scope.isPipelineViewActive = true;
			};

			$scope.applicationTableView = function() {
				$scope.isPipelineViewActive = false;
			};

			$scope.getAppCardStatus = function(appCardStatus,type) {
				var colorSuffix = '';
				var appCardStateImagePrefix='instance-state-';
				var instanceStateTextPrefix='instance-state-text-';
				 switch(appCardStatus) {
					case 'SUCCESSFUL':
					case 'SUCCESSFULL': 
					case 'SUCCESS':
					case 'Successful':
						colorSuffix = 'running';
						break;
					case 'stopped': 
						colorSuffix = 'stopped';
						break;
					default: 
						colorSuffix = 'unknown';
						break;
				}
				return type==="image" ? appCardStateImagePrefix + colorSuffix : instanceStateTextPrefix + colorSuffix;
			};

			var count = 0;
			/*User permission set example*/
			//defining an object for permission.
			var _permSet = {
				createApp : applicationPerms.createApp()
			};
			$scope.perms = _permSet;

			function getApplicationPipeLineData(envParams) {
				workzoneServices.getAppPipeLineForProj(envParams.proj).then(function (response) {
					//$scope.applications = appDeployResponseFormatter.formatPipelineDataArrayToObjList(response.data);
					$scope.applications = response.data;
					count++;
					if (count === 2) {
						$scope.isApplicationPageLoading = false;
					}
				}, function(){
					$scope.applications = [];
					count++;
					if (count === 2) {
						$scope.isApplicationPageLoading = false;
					}
				});
			}

			function getHistoryData(envParams, envNames) {
				workzoneServices.getApplicationHistoryForEnv(envNames.env, envParams.proj).then(function (response) {
					$scope.appicationHistoryList = response.data;
					count++;
					if (count === 2) {
						$scope.isApplicationPageLoading = false;
					}
				}, function(){
					$scope.appicationHistoryList = [];
					count++;
					if (count === 2) {
						$scope.isApplicationPageLoading = false;
					}
				});
			}

			angular.extend($scope, {
				appCardDetails: function(items) {
				   $modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationCardDetails.html",
						controller: "applicationCardDetailsCtrl",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return items;
							}
						}
					})
					.result.then(function() {
						
					}, function() {
						
					}); 
				},
				deployNewApp: function() {
				   $modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/deployNewApp.html",
						controller: "deployNewAppCtrl",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								
							}
						}
					})
					.result.then(function() {
						
					}, function() {
						
					}); 
				},
				appInfo: function(app) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/application/popups/applicationHistoryLogs.html',
						controller: 'applicationHistoryLogsCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return app;
							}
						}
					}).
					result.then(function() {
						
					}, function() {
						
					});
				},
				configureAppPipelineView: function() { 
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/configurePipelineView.html",
						controller: "configurePipelineViewCtrl",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return $scope.envDetails.proj;
							}
						}
					}).
					result.then(function() { 
						
					}, function() {
						
					});
				},
				upgradeApp: function() { 
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/upgradeApp.html",
						controller: "upgradeAppCtrl",
						backdrop : 'static',
						keyboard: false
					}).
					result.then(function() { 
						
					}, function() {
						
					});
				}
			});
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams, requestParamNames) {
				$scope.isApplicationPageLoading = true; //Application data fetch from 2 apis is about to start
				count = 0;
				getApplicationPipeLineData(requestParams);
				getHistoryData(requestParams, requestParamNames);
				$scope.envDetails = requestParams;
				$scope.orgName = requestParamNames.org;
				$scope.selectedEnv = requestParamNames.env;
			}
		);
	}]);
})(angular);