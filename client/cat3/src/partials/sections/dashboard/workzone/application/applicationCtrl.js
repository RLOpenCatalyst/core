/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.application', ['datatables', 'ngAnimate', 'ui.bootstrap', 'apis.workzone', 'workzonePermission', 'filter.currentTime'])
		.service('appDeployResponseFormatter', [function(){
			var pipeLineConfig = {
			};
		}])
		.controller('applicationCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal', 'appDeployResponseFormatter','uiGridOptionsServices', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, appDeployResponseFormatter,uiGridOptiSer) {
			var gridOpt=uiGridOptiSer.options();
			$rootScope.selectedCardClass='';
			angular.extend($scope, {
				pipelineConfig:'',
				pipeLineActBarShow:false,
				isApplicationPageLoading :true,
				isAppallCardTab : {icon:false,template:true},
				isHistoryTab:{icon:true,template:false},
				isAppActiveCardTab:{icon:true,template:false},
				requestParams:{},
				currentTargetId:'',
				pagiOptionsHistory :gridOpt.pagination,
				pagiOptionsCard : gridOpt.pagination,
				applicationPipelineTab : function(param) {
					switch (param){
						case 'allCards' :
							getApplicationPipeLineData($scope.requestParams.params);
							$scope.isAppallCardTab = {icon:false,template:true};
							$scope.isAppActiveCardTab = {icon:true,template:false};
							$scope.isHistoryTab = {icon:true,template:false};
						break;
						case 'activeCards' :
							$scope.isAppallCardTab = {icon:true,template:false};
							$scope.isAppActiveCardTab =  {icon:false,template:true};
							$scope.isHistoryTab = {icon:true,template:false};
						break;
						case 'history' :
							$scope.isAppallCardTab = {icon:true,template:false};
							$scope.isAppActiveCardTab = {icon:true,template:false};
							$scope.isHistoryTab = {icon:false,template:true};
						break;
					}
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
						controller: "configurePipelineViewCtrl as envConfig",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return $scope.envDetails.proj;
							}
						}
					}).
					result.then(function(newEnvList) {
                        $scope.updatedEnvList = newEnvList.envList;
                        console.log($scope.updatedEnvList);
					}, function() {

					});
				},
				upgradeApp: function(cardDetails) {
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/upgradeApp.html",
						controller: "upgradeAppCtrl as upGrdApp",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return cardDetails;
							}
						}
					}).
					result.then(function() {

					}, function() {

					});
				},
				appApprove: function(cardDetails) {
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationApprove.html",
						controller: "applicationApproveCtrl as approveApp",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return cardDetails;
							}
						}
					}).
					result.then(function() {

					}, function() {

					});
				},
				PromoteApp: function(cardDetails) {
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/application/popups/applicationPromote.html",
						controller: "applicationPromoteCtrl as promApp",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return angular.extend(cardDetails,{config:$scope.pipelineConfig});
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
					$scope.pipelineConfig=configResult.data[0];
					$scope.pipeGridOptions=angular.extend(gridOpt.gridOption,{enableSorting: false},{
						onRegisterApi: function(gridApi) {
							gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
								$scope.pagiOptionsCard.page=newPage;
								$scope.pagiOptionsCard.pageSize=pageSize;
								getApplicationCardService(envParams,$scope.pagiOptionsCard);
							});
						}
					});
					$scope.pipeGridOptions.columnDefs=[{ name:'appName',field:'appName',displayName:'App Name',cellTemplate:'<div pipeline-card card-details="row.entity.appName"></div>',cellTooltip: true}];
					angular.forEach(configResult.data[0].envSequence,function(val){
						if(configResult.data[0].envId.indexOf(val) !== -1) {
							var optionObject = {
								name: val,
								field: val,
								displayName: val,
								cellTooltip: true,
								cellTemplate: '<div pipeline-card env-name="'+val+'" app-name="row.entity.appName" card-details="row.entity[col.field]"></div>'
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
					$scope.isApplicationPageLoading=false;
					$scope.pipeLineActBarShow=false;
					$rootScope.selectedCardClass='';
					angular.element('#pipelineView .card').removeClass('selected-card');
					$scope.pipeGridOptions.totalItems = cardResult.data.metaData.totalRecords;
				});
			}

			$scope.$on('SELECTED-CARD' ,function ($event,cardDetails,appName,envName){
				$scope.pipeLineActBarData ='';
				if(!cardDetails || !cardDetails.applicationInstanceName){
					$scope.pipeLineActBarShow =false;
					$rootScope.selectedCardClass='';
					$scope.currentTargetId='';
					angular.element('#pipelineView .card').removeClass('selected-card');
					return true;
				}
				$scope.pipeLineActBarData = angular.extend(cardDetails,{appName:appName},{envName:envName},$scope.requestParams);
				$scope.isLastEnv=($scope.pipelineConfig.envId.length-1 === $scope.pipelineConfig.envId.indexOf(envName)) ? true :false;
				// call service for manage button
				workzoneServices.getCardPermission($scope.pipeLineActBarData).then(function (PermissionResult) {
					$scope.cardPermission = PermissionResult.data;
				});
				if(!$scope.currentTargetId) {
					$scope.pipeLineActBarShow =true;
					$rootScope.selectedCardClass='selected-card';
					$scope.currentTargetId = cardDetails.applicationLastDeploy;
				} else if($scope.currentTargetId && cardDetails.applicationLastDeploy !== $scope.currentTargetId){
					$scope.pipeLineActBarShow =true;
					$rootScope.selectedCardClass='selected-card';
					$scope.currentTargetId = cardDetails.applicationLastDeploy;
				} else {
					$scope.pipeLineActBarShow =false;
					$rootScope.selectedCardClass='';
					$scope.currentTargetId='';
				}
			});
			$rootScope.$on('VIEW-APP-LOGS',function($event,los){
				$scope.appInfo(los);
			});
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams, requestParamNames) {
				$scope.isApplicationPageLoading = true; //Application data fetch from 2 apis is about to start
				count = 0;
				getApplicationPipeLineData(requestParams);
				$scope.requestParams={params:requestParams,paramNames:requestParamNames};
				$scope.envDetails = requestParams;
				$scope.orgName = requestParamNames.org;
				$scope.selectedEnv = requestParamNames.env;
			}
		);
	}]).controller('PipeLineViewCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal','$attrs', 'appDeployResponseFormatter', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, $attrs,appDeployResponseFormatter) {
		var pipeLineData={
			selectedCardClass:''
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
		pipeLineData.selectedCard = function(cardDetails,appName,envName){
			$scope.$emit('SELECTED-CARD',cardDetails,appName,envName);
			angular.element('#pipelineView .card').removeClass('selected-card');
			pipeLineData.selectedCardClass =$rootScope.selectedCardClass;

		};

		return pipeLineData;
	}]);
})(angular);