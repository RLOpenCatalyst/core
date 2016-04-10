/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.container', [ 'ngAnimate', 'ui.bootstrap', 'utility.validation', 'filter.currentTime', 'apis.workzone', 'factory.appPermission', 'datatables', 'mgcrea.ngStrap', 'ngSanitize' ])
		.controller('containerCtrl', ['$scope', '$rootScope', '$modal', '$q', 'workzoneServices', 'workzoneUIUtils', function($scope, $rootScope, $modal, $q, workzoneServices, workzoneUIUtils) {
			$rootScope.$on('WZ_ENV_CHANGE_START', function(){
				$scope.isContainerPageLoading = false;
				$scope.containerList = [];
			});

			$scope.truncateImageIDLimit = 12;
			
			$scope.dockerPopUpPages= {
				2:{ page:'dockerstopplay', ctrl:'dockerControllers' },
				3:{ page:'dockerreload', ctrl:'dockerControllers' },
				4:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				5:{ page:'dockerplaypause', ctrl:'dockerControllers' },
				6:{ page:'dockerterminate', ctrl:'dockerControllers' }
			};

			workzoneServices.getDockerContainers().then(function (response) {
					var temp=response.data;
					/*jslint forin: true */
					for(var i in temp){     
						var statusBool = (temp[i].Status.indexOf("Up") === 0) ? true : false;                        
						temp[i].isStop=statusBool;
						temp[i].isPause=statusBool;
					}
					$scope.containerList = response.data;
					$scope.isContainerPageLoading = false;
                    workzoneUIUtils.makeTabScrollable('containerPage');
				});
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
