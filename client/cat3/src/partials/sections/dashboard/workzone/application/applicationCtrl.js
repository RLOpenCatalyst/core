/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.application', ['ui.bootstrap', 'apis.workzone', 'workzonePermission', 'filter.currentTime'])
	.service('appDeployResponseFormatter', [function(){}])
		.controller('applicationCtrl', ['$scope', '$rootScope', 'workzoneServices', 'applicationPermission', '$modal', 'workzoneUIUtils', 'uiGridOptionsService', function ($scope, $rootScope, workzoneServices, applicationPerms, $modal, workzoneUIUtils, uiGridOptiSer) {
			var gridOpt=uiGridOptiSer.options();
			$rootScope.selectedCardClass='';
			var gridBottomSpace = 5;
			var gridBottomSpaceSummary = 5;
			angular.extend($scope, {
				cardGridData:[],
				selectedGridRow:[],
				pipelineConfig:'',
				pipeLineActBarShow:false,
				isApplicationPageLoading :true,
				isAppallCardTab : {icon:true,template:false},
				isHistoryTab:{icon:true,template:false},
				isAppActiveCardTab:{icon:false,template:true},
				requestParams:{},
				currentTargetId:'',
				pagiOptionsHistory :gridOpt.pagination,
				pagiOptionsCard : gridOpt.pagination,
				pagiOptionsSummary : gridOpt.pagination,
				applicationPipelineTab : function(param) {
					switch (param){
						case 'allCards' :
							$scope.isAppallCardTab = {icon:false,template:true};
							$scope.isAppActiveCardTab = {icon:true,template:false};
							$scope.isHistoryTab = {icon:true,template:false};
							removeSelect();
						break;
						case 'activeCards' :
							$scope.isAppallCardTab = {icon:true,template:false};
							$scope.isAppActiveCardTab =  {icon:false,template:true};
							$scope.isHistoryTab = {icon:true,template:false};
							removeSelect();
						break;
						case 'history' :
							$scope.isAppallCardTab = {icon:true,template:false};
							$scope.isAppActiveCardTab = {icon:true,template:false};
							$scope.isHistoryTab = {icon:false,template:true};
							removeSelect();
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
								items: $scope.requestParams
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
						$scope.pipeGridOptions.columnDefs=createColUIGrid(newEnvList,'pipeline');
						$scope.summaryGridOptions.columnDefs=createColUIGrid(newEnvList,'summary');
						if($scope.pipeLineActBarShow){
							$scope.isLastEnv=($scope.pipelineConfig.envId.length-1 === $scope.pipelineConfig.envId.indexOf($scope.pipeLineActBarData.envName)) ? true :false;
						}
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
					result.then(function(selectedItem) {
						$scope.pipeGridOptions.data[$scope.rowIndex][selectedItem.envName]=selectedItem;
					}, function() {

					});
				},
				promoteApp: function(cardDetails) {
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
				},
				appCardRefresh :function () {
					getApplicationCardService($scope.requestParams.params,$scope.pagiOptionsCard);
				},
				appSummaryRefresh :function () {
					getSummaryCardService($scope.requestParams.params);
				},
				appHistoryRefresh :function () {
					$rootScope.$emit('REFRESH-HISTORY');
				}
			});
			var count = 0;
			/*User permission set example*/
			//defining an object for permission.
			var _permSet = {
				createApp : applicationPerms.createApp()
			};
			$scope.perms = _permSet;
			function createColUIGrid(envList,cardType){
				$scope.pipelineConfig=envList;
				var pipecolumnDefs=[];
					pipecolumnDefs = [{
						name: 'appName',
						displayName: 'App Name',
						cellTemplate: '<div pipeline-card card-type="'+cardType+'" card-details="row.entity.appName"></div>',
						cellTooltip: true,
						width:180
					}];
					if(envList) {
						angular.forEach(envList.envSequence, function (val) {
							if (envList.envId.indexOf(val) !== -1) {
								var optionObject = {
									name: val,
									field: val,
									displayName: val,
									cellTooltip: true,
									cellTemplate: '<div pipeline-card card-type="'+cardType+'" env-name="' + val + '" app-name="row.entity.appName" card-details="row.entity[col.field]"></div>'
								};
								pipecolumnDefs.push(optionObject);
							}
						});
					}
				return pipecolumnDefs;
			}
			function getApplicationPipeLineData(envParams) {
				workzoneServices.getPipelineConfig(envParams).then(function(configResult){
					//Api response is in array but it is only one object.
					$scope.pipelineConfig = configResult.data[0];
					$scope.pipeGridOptions = angular.extend(gridOpt.gridOption, {enableSorting: false}, {
						onRegisterApi: function (gridApi) {
							$scope.gridApi=gridApi;
							gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
								$scope.pagiOptionsCard.page = newPage;
								$scope.pagiOptionsCard.pageSize = pageSize;
								getApplicationCardService(envParams, $scope.pagiOptionsCard);
							});
						}
					});
					$scope.pipeGridOptions.rowTemplate = "<div ng-click=\"grid.appScope.selectRow(row,1)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>";
					//Api response is in array but it is only one object.
					$scope.pipeGridOptions.columnDefs=createColUIGrid(configResult.data[0],'pipeline');
					$scope.pagiOptionsCard.page=1;
					getApplicationCardService(envParams, $scope.pagiOptionsCard);
					getApplicationSummary(envParams,configResult.data[0]);
				});
			}
			function getApplicationCardService(envParams,pagiOptionsCard){
				workzoneServices.getPipelineView(envParams,pagiOptionsCard).then(function(cardResult){
					$scope.pipeGridOptions.data= cardResult.data.appDeploy;
					if(pagiOptionsCard.page === 1){
						$scope.pipeGridOptions.paginationCurrentPage = 1;
					}
					$scope.isApplicationPageLoading=false;
					removeSelect();
					$scope.pipeGridOptions.totalItems = cardResult.data.metaData.totalRecords;

				});
			}
			function getApplicationSummary(envParams,config){
				//workzoneServices.getPipelineConfig(envParams).then(function(configResult){
					$scope.summaryGridOptions = angular.extend({enableColumnMenus: false}, {enableSorting: false},
					//Api response is in array but it is only one object.
						{columnDefs:createColUIGrid(config,'summary')});
					$scope.summaryGridOptions.rowTemplate = "<div ng-click=\"grid.appScope.selectRow(row,2)\" ng-repeat=\"(colRenderIndex, col) in colContainer.renderedColumns track by col.colDef.name\" class=\"ui-grid-cell\" ng-class=\"{ 'ui-grid-row-header-cell': col.isRowHeader }\" ui-grid-cell dbl-click-row></div>";
				//});
				getSummaryCardService(envParams, $scope.pagiOptionsSummary);
			}
			function getSummaryCardService(envParams){
				workzoneServices.getSummaryCard(envParams).then(function(cardResult){
					$scope.summaryGridOptions.data= cardResult.data.pipeLineView;
					removeSelect();
					$scope.summaryGridOptions.totalItems = cardResult.data.metaData.totalRecords;
				});
			}
			$scope.selectRow = function (row,flg) {
				$scope.selectedGridRow=[];
				$scope.selectedGridRow=row;
				$scope.rowIndex = -1;
				var hash = row.entity.$$hashKey;
				var data =(flg===1)?$scope.pipeGridOptions.data:$scope.summaryGridOptions.data;     // original rows of data
				for (var ndx = 0; ndx < data.length; ndx++) {
					if (data[ndx].$$hashKey === hash) {
						$scope.rowIndex = ndx;
						break;
					}
				}
			};
			$scope.$on('SELECTED-CARD' ,function ($event,cardDetails,appName,envName){
				$scope.pipeLineActBarData ='';
				if(!cardDetails || !cardDetails.applicationInstanceName){
					$scope.pipeLineActBarShow =false;
					$rootScope.selectedCardClass='';
					$scope.currentTargetId='';
					angular.element('.card').removeClass('selected-card');
					return true;
				}
				$scope.pipeLineActBarData = angular.extend(cardDetails,{appName:appName},{envName:envName},$scope.requestParams);
				$scope.isLastEnv=($scope.pipelineConfig.envId.length-1 === $scope.pipelineConfig.envId.indexOf(envName)) ? true :false;
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
			function removeSelect(){
				$scope.pipeLineActBarShow =false;
				$rootScope.selectedCardClass='';
				$scope.currentTargetId='';
				angular.element('.card').removeClass('selected-card');
			}
			$rootScope.$on('VIEW-APP-LOGS',function($event,los){
				$scope.appInfo(los);
				$event.stopPropagation();
			});
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams, requestParamNames) {
				$scope.isApplicationPageLoading = true; //Application data fetch from 2 apis is about to start
				count = 0;
				getApplicationPipeLineData(requestParams);
				$scope.requestParams={params:requestParams,paramNames:requestParamNames};
				$scope.envDetails = requestParams;
				$scope.orgName = requestParamNames.org;
				$scope.selectedEnv = requestParamNames.env;
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('applicationPage')-gridBottomSpace;
				$scope.gridHeightSummary = workzoneUIUtils.makeTabScrollable('applicationPage')-gridBottomSpaceSummary;
				workzoneUIUtils.makeTabScrollable('applicationPage');
			});
		}]).controller('PipeLineViewCtrl', ['$scope', '$rootScope', 'applicationPermission',  function ($scope, $rootScope) {
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
					case 'Failure':
						colorSuffix = 'failure';
						break;
					default:
						colorSuffix = 'unknown';
						break;
				}
				return type==="image" ? appCardStateImagePrefix + colorSuffix : instanceStateTextPrefix + colorSuffix;
			};
			pipeLineData.selectedCard = function(cardDetails,appName,envName,id,cardType){
				$scope.$emit('SELECTED-CARD',cardDetails,appName,envName);
				angular.element('.card').removeClass('selected-card');
				if($rootScope.selectedCardClass){
					angular.element('#'+id+cardType).addClass('selected-card');
				}
			};
			return pipeLineData;
		}
	]);
})(angular);
