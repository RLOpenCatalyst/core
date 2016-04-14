/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.container', [ 'ngAnimate', 'ui.bootstrap', 'utility.validation', 'filter.currentTime', 'apis.workzone', 'factory.appPermission', 'datatables', 'mgcrea.ngStrap', 'ngSanitize', 'utility.pagination'])
		.controller('containerCtrl', ['$scope', '$rootScope', '$modal', '$q', 'workzoneServices', 'workzoneUIUtils', 'paginationUtil', function($scope, $rootScope, $modal, $q, workzoneServices, workzoneUIUtils, paginationUtil) {
			
			var containerActCtrl={
				gridOptions:{}
			};
			$scope.gridSettings= function(requestParams){

				var gridOption={
					paginationPageSizes: [5,10, 20, 50],
					paginationPageSize: 5,
					enableColumnMenus:false,
					enableScrollbars :true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 1,
					useExternalPagination: true,
					useExternalSorting: true
				};
				gridOption.data=[];
				gridOption.columnDefs = [
					{ name:'Actions',cellTemplate:'<span class="containerIcon greenBg" ng-click="grid.appScope.containerAction(row.entity,2)" id="power-off"  ng-show="grid.appScope.checkEdited(row.entity)"><i class="{{ row.entity.isStop ? "fa fa-power-off" : "fa fa-play" }}"></i></span>'
					+'<span class="containerIcon yellowBg" ng-click="grid.appScope.containerAction(row.entity,3)" id="undo"  ng-show="grid.appScope.checkEdited(row.entity)"><i class="fa fa-undo"></i></span>'
					+'<span class="containerIcon grayBg" ng-click="grid.appScope.containerAction(row.entity,4)" id="pause" ng-show="grid.appScope.checkEdited(row.entity) && checkPausePlay(row.entity)"><i class="fa fa-pause"></i></span>'
					+'<span class="containerIcon grayBg" ng-click="grid.appScope.containerAction(row.entity,5)" id="play" ng-show="grid.appScope.checkEdited(row.entity) && !checkPausePlay(row.entity)"><i class="fa fa-eject fa fa-roate-90"></i></span>'
					+'<span class="containerIcon crimsonBg" ng-click="grid.appScope.containerAction(row.entity,6)" id="sign-out" ><i class="fa fa-sign-out"></i></span>', cellTooltip: true},
					{ name:'State',field:'Status',cellTooltip: true},
					{ name:'Created',field:'Created',cellTooltip: true},
					{ name:'Name',cellTemplate:'<span ng-bind-html="row.entity.Names"></span>',cellTooltip: true},
					{ name:'Instance Ip',field:'instanceIP',cellTooltip: true},
					{ name:'Container Id',field:'Id',cellTooltip: true},
					{ name:'Image',field:'Image',cellTooltip: true},
					{ name:'More Info',cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.dockerMoreInfo(row.entity)"></i></div>',cellTooltip: true}
				];
				gridOption.onRegisterApi= function(gridApi) {
			      gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
			       
			      });
			      gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
			      		console.log(newPage+"------"+pageSize);
			      		var paginationParams = {};
			      		paginationParams["page"] = newPage;
			      		paginationParams["pageSize"] = pageSize;
			       		workzoneServices.getDockerContainers(requestParams,paginationParams).then(function (response) {
			       			gridOption.totalItems = response.data.metaData.totalRecords;
			       			gridOption.data = response.data.containerList;
			       		});
			      });
			    }
				var paginationParams = {
                    "page":1,
                    "pageSize":5
                };
				workzoneServices.getDockerContainers(requestParams,paginationParams).then(function (response) {
					gridOption.totalItems = response.data.metaData.totalRecords;
					gridOption.data = response.data.containerList;
					for(var i in gridOption.data){     
						var statusBool = (gridOption.data[i].Status.indexOf("Up") === 0) ? true : false;                        
						gridOption.data[i].isStop=statusBool;
						gridOption.data[i].isPause=statusBool;
					}
					$scope.containerList = gridOption.data;
					$scope.isContainerPageLoading = false;
                    workzoneUIUtils.makeTabScrollable('containerPage');
				});

				$scope.gridOptions= gridOption;
			};


			$scope.truncateImageIDLimit = 12;
			
			$scope.dockerPopUpPages= {
				2:{ page:'dockerstopplay', ctrl:'dockerControllers' },
				3:{ page:'dockerreload', ctrl:'dockerControllers' },
				4:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				5:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				6:{ page:'dockerterminate', ctrl:'dockerControllers' }
			};

			
			$scope.checkEdited = function(_app){
				return (_app.Status.indexOf('Exited') >= 0 ) ? false : true;
			};
			$scope.checkcAdvisor = function(_app){
				return (_app.Image.indexOf('cadvisor') >=0 ) ? true : false;
			};

			$scope.checkPausePlay = function(_app){
				return (_app.isPause) ? true : false;
			};
			$scope.showcAdvisor = function(app){
				var cAdvisorInstance = $modal.open({
					animate:true,
					templateUrl:'src/partials/sections/dashboard/workzone/container/popups/dockercAdvisor.html',
					controller:'dockercAdvisorCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve:{
						items:function(){
							return app.instanceip;
						}
					}
				});
				cAdvisorInstance.result.then(
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}, 
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}
				);
			};
			$scope.reloadContainers = function(){
				workzoneServices.getDockerContainers()
					.then(function (response) {
						var temp=response.data;
						for(var i in temp){  
						if(temp.hasOwnProperty(i)){                      
							var statusBool = (temp[i].Status.indexOf("Up") === 0) ? true : false;                        
							temp[i].isStop=statusBool;
							temp[i].isPause=statusBool;
						}
					}
						$scope.containerList = response.data;
					});    
			};
			$scope.containerAction = function(app,action){
				var itemIdx = $scope.containerList.indexOf(app);
				var modalInstance = $modal.open({
					animate:true,
					templateUrl:'src/partials/sections/dashboard/workzone/container/popups/'+$scope.dockerPopUpPages[action].page+'.html',
					controller:'dockerControllers',
					backdrop : 'static',
					keyboard: false,
					resolve:{
						items:function(){
							return app.Id.substring(0,$scope.truncateImageIDLimit);                            
						}
					}
				});
				modalInstance.result.then(
					function(){
						workzoneServices.checkDockerActions(app,action)
							.then(
								function(response){
									if(response.data.data === "ok"){
										if(action === "2"){ //STOP AND PLAY CONTAINER
											$scope.containerList[itemIdx].isStop = !$scope.containerList[itemIdx].isStop;                                            
										}else if(action === "3"){ //RELOAD CONTAINERS
											workzoneServices.getDockerContainers()
												.then(function (response) {
													$scope.containerList[itemIdx] = response.data[itemIdx];
												});
										}else if(action === "4"){  // PAUSE CONTAINER
											$scope.containerList[itemIdx].isPause = !$scope.containerList[itemIdx].isPause;                                            
										}else if(action === "5"){  // PLAY CONTAINER
											$scope.containerList[itemIdx].isPause = !$scope.containerList[itemIdx].isPause;                                            
										}else if(action === "6"){ // DELETE CONTAINER
											$scope.containerList.splice(itemIdx,1);
										}                                        
									}
								}
							);
					},
					function(){
						$scope.containerList[itemIdx].isActive = true;
						console.log('Modal dismissed at: ' + new Date());
					}
				);                
			};
			$scope.dockerMoreInfo = function(app){
				 var modalInstance = $modal.open({
					animation:true,
					templateUrl:'src/partials/sections/dashboard/workzone/container/popups/dockermoreinfo.html',
					controller:'dockerMoreInfoCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve:{
						items:function(){
							return app;
						}
					}
				});
				modalInstance.result.then(
					function(){
						console.log('Modal closed at: ' + new Date());
					},
					function(){
						console.log('Modal dismissed at: ' + new Date());
					}
				);
			};
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				$scope.requestParams=requestParams;
				$scope.gridSettings(requestParams);
				$scope.isContainerPageLoading = false;
				$scope.containerList = [];
			});
			
		}])
		.controller('dockercAdvisorCtrl',['$scope','$modalInstance','items','workzoneServices', '$sce', function($scope, $modalInstance ,items,workzoneServices, $sce){
			$scope.items = items;            
				$scope.getcAdvisorUrl=function(dns_extract){
					return $sce.trustUrl("http://"+dns_extract+":8080/docker/");
				};
				$scope.cancel=function(){
					$modalInstance.dismiss('cancel');
				};
		}])
		.controller('dockerMoreInfoCtrl',  ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) { 
			$scope.dockerInfoResponse="";
			$scope.tabs = [
				{
					'title': 'General-Info',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerGeneralInfo.html'
				},
				{
					'title': 'State',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerState.html'
				},
				{
					'title': 'Image',
					'template': 'src/partials/sections/dashboard/workzone/container/templates/dockerImage.html'
				}
			];
			$scope.tabs.activeTab = "General-Info";
			workzoneServices.getDockerMoreInfo(items)
				.then(function(response){
					$scope.dockerInfoResponse = response.data;
				});
			angular.extend($scope,{
				cancel:function(){
					$modalInstance.dismiss('cancel');
				}
			});
		}])

		.controller('dockerControllers',  ['$scope', '$modalInstance', function ($scope, $modalInstance) {

			angular.extend($scope,{
				cancel:function(){
					$modalInstance.dismiss('cancel');
				},
				ok:function(){
					$modalInstance.close();
				}
			});
		}
	]);
})(angular);
