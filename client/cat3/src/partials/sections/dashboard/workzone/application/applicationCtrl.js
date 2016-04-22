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
			$rootScope.pipeLineActBarShow=false;
			$scope.requestParams={};
			var appData={
				pagination:{
					pageSize: 10,
					page: 1,
					sortBy: "",
					sortOrder: ""
				},
				gridOption:{
					paginationPageSizes: [10,20, 50, 75],
					paginationPageSize: 10,
					enableColumnMenus:false,
					enableScrollbars :true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 0,
					useExternalPagination: true,
					useExternalSorting: true
				}
			}
			$scope.pagiOptionsHistory = appData.pagination;
			$scope.pagiOptionsCard = appData.pagination;

			$scope.applicationPipelineView = function() {
				getApplicationPipeLineData($scope.requestParams.params);
				$scope.isPipelineViewActive = true;
			};

			$scope.applicationTableView = function() {
				$scope.isPipelineViewActive = false;
				getHistoryData($scope.requestParams.params, $scope.requestParams.paramNames);
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

				workzoneServices.getPipelineConfig(envParams).then(function(configResult){
					$scope.PipeGridOptions=angular.extend(appData.gridOption,{enableSorting: false},{
						onRegisterApi: function(gridApi) {
							gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
								if( sortColumns[0] &&  sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction){
									$scope.pagiOptionsCard.sortBy = sortColumns[0].field;
									$scope.pagiOptionsCard.sortOrder = sortColumns[0].sort.direction;
									getApplicationCardService(envParams,$scope.pagiOptionsCard);
								}

							});
							gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
								$scope.pagiOptionsCard.page=newPage;
								$scope.pagiOptionsCard.pageSize=pageSize;
								getApplicationCardService(envParams,$scope.pagiOptionsCard);

							});
						}
					});
					$scope.PipeGridOptions.columnDefs=[{ name:'appName',field:'appName',displayName:'App Name',cellTemplate:'<div pipeline-card card-details="row.entity.appName"></div>',cellTooltip: true}];
					angular.forEach(configResult.data[0].envSequence,function(val,key){
						if(configResult.data[0].envId.indexOf(val) != -1) {
							var optionObject = {
								name: val,
								field: val,
								displayName: val,
								cellTooltip: true,
								cellTemplate: '<div pipeline-card card-details="row.entity[col.field]"></div>'
							};
							$scope.PipeGridOptions.columnDefs.push(optionObject);
						}
					});
					getApplicationCardService(envParams,$scope.pagiOptionsCard);
				});
			}
			function getApplicationCardService(envParams,pagiOptionsCard){
				workzoneServices.getPipelineView(envParams,pagiOptionsCard).then(function(cardResult){
					$scope.PipeGridOptions.data= cardResult.data.appDeploy;
					$scope.PipeGridOptions.totalItems = cardResult.data.metaData.totalRecords;
					$scope.isApplicationPageLoading=false;
				});
			}

			function getHistoryData(envParams, envNames) {
				$scope.isBusyShow=true;
				$scope.historyGridOptions=angular.extend(appData.gridOption,{
					columnDefs:[
						{ name:'appName',field:'applicationName',displayName:'App Name'},
						{ name:'App-Instance',field:'applicationInstanceName',displayName:'App-Instance'},
						{ name:'Version',field:'applicationVersion',displayName:'Version'},
						{ name:'Host-Name',field:'hostName',displayName:'Host Name'},
						{ name:'applicationNodeIP',field:'applicationNodeIP',displayName:'Node IP'},
						{ name:'Last Deploy',displayName:'Last Deploy',cellTemplate:'<span ng-bind-html="row.entity.applicationLastDeploy | timestampToLocaleTime | timeStampTo2lines"></span>'},
						{ name:'Container Name',displayName:'Container Name',cellTemplate:'<span>{{row.entity.containerId || "NA"}}</span>'},
						{ name:'applicationType',field:'applicationType',displayName:'App Type'},
						{ name:'Action',width:70,enableSorting: false,displayName:'Logs',cellTemplate:'<i class="fa fa-info-circle cursor" title="More Info" ng-click="appInfo(app)"></i>'},
					],
					onRegisterApi: function(gridApi) {
						gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
							if( sortColumns[0] &&  sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction){
								$scope.pagiOptionsHistory.sortBy = sortColumns[0].field;
								$scope.pagiOptionsHistory.sortOrder = sortColumns[0].sort.direction;
								getApplicationHistoryService(envParams, envNames ,$scope.pagiOptionsHistory);
							}

						});
						gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
							$scope.pagiOptionsHistory.page=newPage;
							$scope.pagiOptionsHistory.pageSize=pageSize;
							getApplicationHistoryService(envParams, envNames,$scope.pagiOptionsHistory);

						});
					}
				});
				getApplicationHistoryService(envParams, envNames,$scope.pagiOptionsHistory);
			}
			function getApplicationHistoryService(envParams, envNames,pagiOptionsHistory){
				workzoneServices.getApplicationHistoryForEnv(envNames.env, envParams.proj,pagiOptionsHistory).then(function (response) {
					$scope.historyGridOptions.data= response.data.appDeploy;
					$scope.historyGridOptions.totalItems = response.data.metaData.totalRecords;
				});
			}

			angular.extend($scope, {
				appCardDetail :function(items) {
				if(items){
					$modal.open({
							animate: true,
							templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationCardDetails.html",
							controller: "applicationCardDetailsCtrl as cardDetails",
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
				}

			},
				deployNewApp: function() {
				   $modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/deployNewApp.html",
						controller: "deployNewAppCtrl as depNewApp",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									appDepOrUpgrade:1
								};
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
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/deployNewApp.html",
						controller: "deployNewAppCtrl as depNewApp",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									appDepOrUpgrade:2
								};
							}
						}
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
				$scope.requestParams={params:requestParams,event:event,paramNames:requestParamNames};
				$scope.envDetails = requestParams;
				$scope.orgName = requestParamNames.org;
				$scope.selectedEnv = requestParamNames.env;
			}
		);
		$scope.$on('appCardDetails',function(rowData){
			$scope.appCardDetails(rowData);
		});
	}]).controller('PipeLineViewCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal','$attrs', 'appDeployResponseFormatter', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, $attrs,appDeployResponseFormatter) {
		var pipeLineData={
			currentTargetId:''
		};
		pipeLineData.appCardDetail =function(items) {
			if(items){
				$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationCardDetails.html",
						controller: "applicationCardDetailsCtrl as cardDetails",
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
			}

		};
		pipeLineData.getAppCardStatus = function(appCardStatus,type) {
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
		pipeLineData.menuController = function (rowData,$event){
			$rootScope.pipeLineActBarData = '';
			$scope.pipeLineActBarData = rowData;
			if(!rowData){
			 	return ;
			}
			if(!pipeLineData.currentTargetId){
				$rootScope.pipeLineActBarShow =true;
				pipeLineData.currentTargetId = $event.currentTarget.getAttribute('data-id');
			} else if(pipeLineData.currentTargetId && $event.currentTarget.getAttribute('data-id') == pipeLineData.currentTargetId){
				$rootScope.pipeLineActBarShow = !$rootScope.pipeLineActBarShow;
				pipeLineData.currentTargetId='';
			}
			angular.element('.card').removeClass('selected-card');
			pipeLineData.selectCardClass=($rootScope.pipeLineActBarShow == true )? 'selected-card':'';


		};
		return pipeLineData;
	}]);
})(angular);