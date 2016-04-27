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
			};
		}])
		.controller('applicationCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal', 'appDeployResponseFormatter','uiGridOptionsServices', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, appDeployResponseFormatter,uiGridOptiSer) {
			var appData=uiGridOptiSer.options();
			angular.extend($scope, {
				pipeLineActBarShow:false,
				isApplicationPageLoading :true,
				isPipelineViewActive : true,
				requestParams:{},
				currentTargetId:'',
				pagiOptionsHistory :appData.pagination,
				pagiOptionsCard : appData.pagination,
				applicationPipelineView : function() {
					getApplicationPipeLineData($scope.requestParams.params);
					$scope.isPipelineViewActive = true;
				},
				applicationTableView :function() {
					$scope.isPipelineViewActive = false;
					getHistoryData($scope.requestParams.params, $scope.requestParams.paramNames);
				},
				appCardDetail :function(items) {
					$modal.open({
							animate: true,
							templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationCardDetails.html",
							controller: "applicationCardDetailsCtrl as cardDetails",
							backdrop : 'static',
							keyboard: false,
							resolve: {
								items: function() {
									return angular.extend(items,$scope.requestParams);
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
			var count = 0;
			/*User permission set example*/
			//defining an object for permission.
			var _permSet = {
				createApp : applicationPerms.createApp()
			};
			$scope.perms = _permSet;

			function getApplicationPipeLineData(envParams) {
				workzoneServices.getPipelineConfig(envParams).then(function(configResult){
					$scope.pipeGridOptions=angular.extend(appData.gridOption,{enableSorting: false},{
						onRegisterApi: function(gridApi) {
							gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
								$scope.pagiOptionsCard.page=newPage;
								$scope.pagiOptionsCard.pageSize=pageSize;
								getApplicationCardService(envParams,$scope.pagiOptionsCard);
								$scope.pipeLineActBarShow=false;
								//angular.element('#pipelineView .card').removeClass('selected-card');
							});
						}
					});
					$scope.pipeGridOptions.columnDefs=[{ name:'appName',field:'appName',displayName:'App Name',cellTemplate:'<div pipeline-card card-details="row.entity.appName"></div>',cellTooltip: true}];
					angular.forEach(configResult.data[0].envSequence,function(val,key){
						if(configResult.data[0].envId.indexOf(val) != -1) {
							var optionObject = {
								name: val,
								field: val,
								displayName: val,
								cellTooltip: true,
								cellTemplate: '<div pipeline-card env-name="'+val+'" card-details="row.entity[col.field]"></div>'
							};
							$scope.pipeGridOptions.columnDefs.push(optionObject);
						}
					});
					getApplicationCardService(envParams,$scope.pagiOptionsCard);
				});
			}
			function getApplicationCardService(envParams,pagiOptionsCard){
				workzoneServices.getPipelineView(envParams,pagiOptionsCard).then(function(cardResult){
					$scope.pipeGridOptions.data= cardResult.data.appDeploy;
					$scope.pipeGridOptions.totalItems = cardResult.data.metaData.totalRecords;
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

			$scope.$on('SELECTED-CARD' ,function (event,cardDetails,envName){
				$scope.pipeLineActBarData ='';
				if(!cardDetails){
					return ;
				}
				$scope.pipeLineActBarData = angular.extend(cardDetails,{env:envName});
				if(!$scope.currentTargetId) {
					$scope.pipeLineActBarShow =true;
					$scope.currentTargetId = cardDetails.applicationLastDeploy;
				} else if($scope.currentTargetId && cardDetails.applicationLastDeploy != $scope.currentTargetId){
					$scope.pipeLineActBarShow =true;
					$scope.currentTargetId = cardDetails.applicationLastDeploy;
				} else {
					$scope.pipeLineActBarShow =false;
					$scope.currentTargetId='';
				}
				//angular.element('.card').removeClass('selected-card');
				//$rootScope.selectedCardClass=($scope.pipeLineActBarShow == true )? 'selected-card':'';
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
	}]).controller('PipeLineViewCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal','$attrs', 'appDeployResponseFormatter', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, $attrs,appDeployResponseFormatter) {
		var pipeLineData={};
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
		pipeLineData.selectedCard = function($event,cardDetails,envName){
			$scope.$emit('SELECTED-CARD',cardDetails,envName);
		};

		return pipeLineData;
	}]);
})(angular);