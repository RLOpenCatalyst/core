/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.instance', ['ui.bootstrap', 'utility.validation', 'filter.currentTime', 'apis.workzone','utility.array','workzonePermission', 'instanceServices', 'chefDataFormatter', 'utility.pagination','ngFileUpload'])
		.controller('instanceCtrl', ['chefSelectorComponent', '$scope', '$rootScope', '$modal', '$q', 'workzoneServices','arrayUtil', 'instancePermission', 
			'instanceActions', 'instanceOperations', 'workzoneEnvironment', '$timeout', 'workzoneUIUtils', 'uiGridOptionsService' ,'confirmbox' ,function(chefSelectorComponent, $scope, $rootScope, $modal, $q, workzoneServices,arrayUtil, instancePerms, instanceActions, instanceOperations,workzoneEnvironment, $timeout, workzoneUIUtils,uiGridOptionsService,confirmbox) {
			var helper = {
				attachListOfTaskWithInstance: function(completeData) {
					var instanceList = completeData.instances;
					$scope.selectedCard = instanceList.length ? instanceList[0]._id : null;
					var taskList = completeData.tasks;
					var inst;
					for (var i = 0; i < instanceList.length; i++) {
						inst = instanceList[i];
						inst.taskDetails = [];
						if (inst.taskIds && inst.taskIds.length) {
							for (var x = 0; x < inst.taskIds.length; x++) {
								for (var j = 0; j < taskList.length; j++) {
									if (inst.taskIds[x] === taskList[j]._id) {
										inst.taskDetails.push({
											name: taskList[j].name,
											id: taskList[j]._id
										});
										break;
									}
								}
							}
						}
					}
					return completeData;
				},
				setInitPaginationDefaults: function(){
					var uigridDefaults = uiGridOptionsService.options();
					/*object used for ui grid table. This contains page,pageSize,sortBy and sortDirection*/
					$scope.paginationParams = uigridDefaults.pagination;
					$scope.paginationParams.sortBy = 'instanceCreatedOn';
					$scope.paginationParams.sortOrder = 'desc';

					/*objects used for card*/
					$scope.currentCardPage = uigridDefaults.pagination.page;
					$scope.cardsPerPage = uigridDefaults.pagination.pageSize;
					$scope.numofCardPages = 0;//Have to calculate from totalItems/cardsPerPage
					$scope.totalCards = 0;
				},
				setPaginationDefaults: function(){
					$scope.paginationParams.sortBy = 'instanceCreatedOn';
					$scope.paginationParams.sortOrder = 'desc';
					if($scope.paginationParams.page !== 1){
						$scope.setFirstPageView();//if current page is not 1, then ui grid will trigger a call when set to 1.
					}else{
						$scope.instancesListCardView();	
					}
				},
				setHostToIp : function(result) {
					/*condition check for appUrl when $host has been entered by the user which 
					which should be changed to the instance IP*/
					$scope.instanceList = result;
					for(var i =0; i<$scope.instanceList.length;i++){
						var appItem = $scope.instanceList[i].appUrls;
						for(var j =0; j<appItem.length;j++){
							var url = appItem[j].url;
							if(url){
								url = url.replace('$host', $scope.instanceList[i].instanceIP);
								$scope.instanceList[i].appUrls[j].url = url;
							}
						}
					}
				}
			};
			$scope.instancePageLevelLoader = true;
			$scope.instStartStopFlag = false;
			$scope.isImportClickEnabled = true;
			$scope.openContainersTab = function() {
				$scope.$parent.$parent.activateTab('Containers');
			};
			/*User permission set example*/
			//defining an object for permission.
			var _permSet = {
				chefClientRun : instancePerms.checkChef(),
				puppet : instancePerms.checkPuppet(),
				logInfo : instancePerms.logInfo(),
				ssh : instancePerms.ssh(),
				rdp : instancePerms.rdp(),
				start : instancePerms.instanceStart(),
				stop : instancePerms.instanceStop(),
				launch : instancePerms.launch()
			};
			$scope.perms = _permSet;
			/*Setting the paginationParams*/
			$scope.isInstancePageLoading = true;
			var gridBottomSpace = 5;
			var instanceUIGridDefaults = uiGridOptionsService.options();
			$scope.paginationParams = instanceUIGridDefaults.pagination;
			$scope.currentCardPage = instanceUIGridDefaults.pagination.page;
			$scope.cardsPerPage = instanceUIGridDefaults.pagination.pageSize;
			$scope.numofCardPages = 0;//Have to calculate from totalItems/cardsPerPage
			$scope.totalCards = 0;

			$scope.tabData = [];
			/*grid method to define the columns that need to be present*/
			$scope.initGrids = function(){
				$scope.instancesGridOptions = angular.extend(instanceUIGridDefaults.gridOption,{
				data:'tabData',
					columnDefs : [
						{ name:'Logo',width: 100, enableSorting: false ,  cellTemplate:'<img class="instanceRoleLogo" ng-src="{{grid.appScope.getRoleLogo(row.entity)}}" />'+
						'<img class="instanceRoleLogoDocker" src="images/global/docker.png" ng-show="row.entity.docker && row.entity.docker.dockerEngineStatus === \'success\'" ng-click="grid.appScope.openContainersTab()">', cellTooltip: true},
						{ name:'Name', field: 'name', cellTemplate:'<span>{{row.entity.name}}</span>'+
						'<span class="marginleft5" ng-click="grid.appScope.operationSet.editInstanceName(row.entity);">'+
						'<i title="Edit Instance Name" class="pull-right fa fa-pencil edit-instance-name cursor"></i>'+
						'</span>', cellTooltip: true},
						{ name:'Ip Address', displayName:'IP Address', field:'instanceIP',cellTooltip: true},
						{ name:'App Versions',enableSorting: false , cellTemplate:'<span class="" >{{grid.appScope.operationSet.viewAppVersions(row.entity)}}</span>', cellTooltip: true},
						{ name:'App Status',enableSorting: false , cellTemplate:'<span class="" >{{grid.appScope.operationSet.viewAppStatus(row.entity)}}</span>', cellTooltip: true},
						{ name:'RunLists', enableSorting: false , cellTemplate:'<span class="blue cursor" ng-click="grid.appScope.operationSet.viewRunList(row.entity)">View All RunList</span>', cellTooltip: true},
						{ name:'Status', width: 90,enableSorting: false , cellTemplate:'<div class="status-state {{grid.appScope.getAWSStatus(row.entity.instanceState,1)}}"></div>', cellTooltip: true},
						{ name:'Log Info', width: 90,enableSorting: false , cellTemplate:'<i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.operationSet.viewLogs(row.entity)" ng-show="grid.appScope.perms.logInfo"></i>', cellTooltip: true},
						{ name:'Chef Run', width: 100,enableSorting: false ,  cellTemplate:'<div ng-show="grid.appScope.actionSet.isChefEnabled(row.entity) && grid.appScope.perms.chefClientRun" title="Chef Client Run" class="btn-icons icon-chef" ng-click="grid.appScope.operationSet.updateCookbook(row.entity);"></div>'+
						'<div ng-show="grid.appScope.actionSet.isChefDisabled(row.entity) && grid.appScope.perms.chefClientRun" class="btn-icons icon-chef-disabled"></div>'+
						'<div ng-show="grid.appScope.actionSet.isPuppetEnabled(row.entity) && grid.appScope.perms.puppet" title="Puppet Client Run" class="btn-icons icon-puppet" ng-click="grid.appScope.operationSet.puppetRunClient(row.entity);"></div>'+
						'<div ng-show="grid.appScope.actionSet.isPuppetDisabled(row.entity) && grid.appScope.perms.puppet"class="btn-icons icon-puppet-disabled">'+
						'</div>', cellTooltip: true},
						{ name:'Action',width: 140, enableSorting: false , cellTemplate:'src/partials/sections/dashboard/workzone/instance/popups/instanceActionGridTemplate.html'}
					],
				});
			};
			/*APIs registered are triggered as ui-grid is configured 
			for server side(external) pagination.*/
			$scope.instancesGridOptions = angular.extend(instanceUIGridDefaults.gridOption, {
				onRegisterApi: function(gridApi) {
					$scope.gridApi = gridApi;

					//Sorting for sortBy and sortOrder
					gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
						if (sortColumns[0] && sortColumns[0].field && sortColumns[0].sort && sortColumns[0].sort.direction) {
							$scope.paginationParams.sortBy = sortColumns[0].field;
							$scope.paginationParams.sortOrder = sortColumns[0].sort.direction;
							$scope.instancesListCardView();
						}
					});
					//Pagination for page and pageSize
					gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
						$scope.paginationParams.page = newPage;
						$scope.paginationParams.pageSize = pageSize;
						$scope.currentCardPage = newPage;
						$scope.cardsPerPage = pageSize;
						$scope.instancesListCardView();
					});
				},
			});
			$scope.cardPaginationChange = function() {
				$scope.paginationParams.page = $scope.currentCardPage;
				$scope.paginationParams.pageSize = $scope.cardsPerPage;
				$scope.instancesGridOptions.paginationCurrentPage = $scope.currentCardPage;
			};
			//variables used in rendering of the cards and table && checking ssh
			angular.extend($scope, {
				instancesListCardView: function() {
					$scope.isInstancePageLoading = true;
					$scope.instanceList = [];
					// service to get the list of instances.
					workzoneServices.getPaginatedInstances($scope.envParams, $scope.paginationParams).then(function(result) {
						$timeout(function() {
							$scope.instancesGridOptions.totalItems = $scope.totalCards = result.data.metaData.totalRecords;
							/*calling the helper method to check if $host is present 
							so that it gets replaced with instanceIP*/
							helper.setHostToIp(result.data.instances);
							$scope.tabData = $scope.instanceList;
							if($scope.totalCards > $scope.paginationParams.pageSize) {
								$scope.cardsAvailable = true;
							} else {
								$scope.cardsAvailable = false;
							}
							$scope.isInstancePageLoading = false;
							$scope.numofCardPages = Math.ceil($scope.instancesGridOptions.totalItems / $scope.paginationParams.pageSize);
						}, 100);
					}, function(error) {
						$scope.isInstancePageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
					});
				},
				/*method to get the AWS instance status(specific only to AWS currently)*/
				getAWSStatus: function(instanceStatus,type) {
					var colorSuffix = '';
					var instanceStateImagePrefix='instance-state-';
					var instanceStateTextPrefix='instance-state-text-';
					 switch(instanceStatus) {
						case 'running': 
							colorSuffix = 'running';
							break;
						case 'stopping': 
							colorSuffix = 'stopping';
							break;
						case 'terminated':
						case 'stopped': 
							colorSuffix = 'stopped';
							break;
						case 'pending': 
							colorSuffix = 'pending';
							break;
						case 'unknown': 
							colorSuffix = 'unknown';
							break;
						case 'paused': 
							colorSuffix = 'paused';
							break;
						default: 
							colorSuffix = 'unknown';
							break;
					}
					if (type === "text") {
						return instanceStateTextPrefix + colorSuffix;
					} else {
						return instanceStateImagePrefix + colorSuffix;
					}
				},
				/*method to get the instance role*/
				getRoleLogo: function(inst){
					var imagePath = '';
					var type = '';
					type = inst.blueprintData && inst.blueprintData.templateId;
					switch(type) {
						case 'chef': 
						case 'chef_import':
							imagePath = 'images/global/chef-import.png';
							break;
						case 'Apache':
						case 'apache':
							imagePath = 'images/templateicons/appFact4.png';
							break;
						case 'CustomTemplate': 
							imagePath = 'images/templateicons/custom-temp.jpg';
							break;
						case 'Tomcat': 
							imagePath = 'images/templateicons/apache-tomcat.jpeg';
							break;
						case 'CFT_newco': 
							imagePath = 'images/templateicons/cloudformation.png';
							break;
						default: 
							imagePath = 'images/templateicons/imgo.jpg';
							break;
					}
					return imagePath;
				},
				getOSLogo: function(inst){
					var imagePath = '';
					var type = '';
					type = inst.hardware && inst.hardware.platform;
					switch(type) {
						case 'unknown': 
							imagePath = 'images/osIcons/linux.png';
							break;
						case 'ubuntu':
						case 'Ubuntu':
							imagePath = 'images/osIcons/ubuntu.png';
							break;
						case 'windows':
						case 'azure': 
							imagePath = 'images/osIcons/windows.png';
							break;
						case 'centos': 
							imagePath = 'images/osIcons/centos.png';
							break;
						default: 
							imagePath = 'images/osIcons/linux.png';
							break;
					}
					return imagePath;
				},
				getPlatformId: function(providerType, platformID) {
					var providerIdPrefix;
					switch (providerType) {
						case 'aws':
							providerIdPrefix = 'AWS Id : ';
							break;
						case 'azure':
							providerIdPrefix = 'Azure Id : ';
							break;
						case 'vmware':
							providerIdPrefix = 'VMware Id : ';
							break;
						case 'openstack':
							providerIdPrefix = 'openstack Id : ';
							break;
						default:
							providerIdPrefix = 'Instance Id : ';
							platformID = 'unknown';
					}
					return providerIdPrefix + platformID;
				}, 
				actionSet: instanceActions
			});
			/*	START: Methods which make use of instanceService
				Below methods on the instance card/table make use of instanceActions service.
				Same sevice is reused in control panel actions tab but promise handlers may be different.
			*/
			$scope.operationSet = {};
			$scope.operationSet.deleteInstance = function(inst){
				var promise = instanceOperations.deleteInstance(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved deleteInstance:" + resolveMessage);
					$scope.instancesListCardView();
				}, function(rejectMessage) {
					console.log("Promise rejected deleteInstance:" + rejectMessage);
				});
			};
			$scope.operationSet.editInstanceName = function(inst){
				var promise = instanceOperations.editInstanceName(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved editInstanceName:" + resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log("Promise rejected editInstanceName:" + rejectMessage);
				});
			};
			$scope.operationSet.instanceSSH = function(inst){
				var promise = instanceOperations.instanceSSH(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved instanceSSH:" + resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log("Promise rejected instanceSSH:" + rejectMessage);
				});
			};
			$scope.operationSet.viewLogs = function(inst){
				var promise = instanceOperations.viewLogs(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved viewLogs:" + resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log("Promise rejected viewLogs:" + rejectMessage);
				});
			};
			$scope.operationSet.viewRunList = function(inst){
				angular.extend(inst,{viewType:'runList'});
				var promise = instanceOperations.viewRunList(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved viewRunList:" + resolveMessage);
				}, function(rejectMessage) {
					console.log("Promise rejected viewRunList:" + rejectMessage);
				});
			};
			$scope.operationSet.viewAppVersions = function(inst){
				/*angular.extend(inst,{viewType:'appVersion'});
				instanceOperations.viewRunList(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved viewAppVersions:" + resolveMessage);
				}, function(rejectMessage) {
					console.log("Promise rejected viewAppVersions:" + rejectMessage);
				});*/
				var appInfo =[];
				for(var i=0; i< inst.appInfo.length; i++){
					appInfo.push(inst.appInfo[i].version);
				}
				return appInfo.join(",");
			};

			$scope.operationSet.viewAppStatus = function(inst){
				var appInfo =[];
				for(var i=0; i< inst.appInfo.length; i++){
					appInfo.push(inst.appInfo[i].status);
				}
				return appInfo.join(",");
			};
			$scope.operationSet.updateCookbook = function(inst) {
				var promise = instanceOperations.updateCookbook(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved updateCookbook:" + resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log("Promise rejected updateCookbook:" + rejectMessage);
				});
			};
			$scope.operationSet.puppetRunClient = function(inst) {
				var promise = instanceOperations.puppetRunClient(inst);
				promise.then(function(resolveMessage) {
					console.log("Promise resolved puppetRunClient:" + resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log("Promise rejected puppetRunClient:" + rejectMessage);
				});
			};
			$scope.operationSet.changeInstanceStatus = function(inst) {
				$scope.instStartStopFlag = true;
				var instObj = {_inst:inst, _id:inst._id, state:inst.instanceState, instIdx:$scope.instanceList.indexOf(inst)};
				workzoneServices.getInstanceData(inst).then(
					function(response){
						if(response.data.instanceState==="running"){						
							var stopPromise = instanceOperations.stopInstanceHandler(inst, $scope.perms.stop);
							stopPromise.then(function(){
								$scope.operationSet.checkInstanceStatus(instObj, 2000);
								$scope.operationSet.viewLogs(inst);
                                $scope.instStartStopFlag = false;
							}, function(rejectMessage){
								$scope.instStartStopFlag = false;
								console.log("Promise rejected " + rejectMessage);
							});
						}else{						
							var startPromise = instanceOperations.startInstanceHandler(inst, $scope.perms.start);
							startPromise.then(function(){
								$scope.operationSet.checkInstanceStatus(instObj, 2000);
								$scope.operationSet.viewLogs(inst);
                                $scope.instStartStopFlag = false;
							}, function(rejectMessage){
								$scope.instStartStopFlag = false;
								console.log("Promise rejected " + rejectMessage);
							});
						}
					}
				);
			};
			$scope.operationSet.checkInstanceStatus = function(instObj, delay){
				var _instObj = instObj;
				$timeout(function(){
					workzoneServices.getInstanceData(instObj._inst).then(
						function(response){
							if(response){
								$scope.instanceList[_instObj.instIdx].instanceState = response.data.instanceState;
								console.log(response.data.instanceState, ' polling');

								if( response.data.instanceState === 'stopped' || response.data.instanceState === 'running' ){
									$scope.instStartStopFlag = false;
									console.log(response.data.instanceState, ' polling complete');
								}else{
									$scope.operationSet.checkInstanceStatus(_instObj, 5000);
								}
							}
						},
						function(){
						}
					);
				}, delay);
			};
			/*END: Methods which make use of instanceService*/
			/*setting the firstPageView*/
			$scope.setFirstPageView = function() {
				$scope.instancesGridOptions.paginationCurrentPage = $scope.paginationParams.page = 1;
			};
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams){
				$scope.envParams=requestParams;
				$scope.initGrids();
				helper.setPaginationDefaults();
				$scope.gridHeight = workzoneUIUtils.makeTabScrollable('instancePage')-gridBottomSpace;
				//workzoneUIUtils.makeTabScrollable('instancePage');//TODO: Ideally this should be on resize event;
			});
			//root scope method for refreshing the list view at the time of blueprint launch.
			$rootScope.$on('WZ_INSTANCES_SHOW_LATEST', function(){
				helper.setPaginationDefaults();
			});
			//root scope method for refreshing the list view at the time of docker cookbook run.
			$rootScope.$on('WZ_INSTANCES_REFRESH_CURRENT', function(){
				$scope.instancesListCardView();
			});
			$scope.instanceImportByIP = function() {
				$scope.isImportClickEnabled = false;
				var whetherConfigListAvailable = workzoneServices.getCheckIfConfigListAvailable();
				var getOSList = workzoneServices.getOSList();
				var getConfigList = workzoneServices.getConfigListForOrg(workzoneEnvironment.getEnvParams().org);
				var allPromise = $q.all([whetherConfigListAvailable, getOSList, getConfigList]);
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceImportByIp.html',
					controller: 'instanceImportByIpCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return allPromise;
						}
					}
				});
				modalInstance.result.then(function(newinstId) {
					$scope.isImportClickEnabled = true;
					$rootScope.$emit('WZ_INSTANCES_SHOW_LATEST');
					$scope.operationSet.viewLogs(newinstId);
				}, function() {
					$scope.isImportClickEnabled = true;
					console.log('Modal dismissed at: ' + new Date());
				});
			};
			$scope.rdpFileLink = function(instanceObj) {
				var fileLink = '/instances/rdp/' + instanceObj.instanceIP + '/3389';
				return fileLink;
			};
			$scope.rdpFileName = function(instanceObj) {
				var fileName = instanceObj.instanceIP +'.rdp';
				return fileName;
			};
			$scope.showAppLinksPopup = function(inst) {
				inst.showAppLinks = !inst.showAppLinks;
				console.log(inst.showAppLinks);
			};
			$scope.selectCard = function(identi) {
				$scope.selectedCard = identi;
			};
			$scope.setCardView = function() {
				$scope.isCardViewActive = true;
				$scope.instanceCardViewSelection = "instance-tab-active";
				$scope.instanceTableViewSelection = "";
			};
			$scope.instanceExecute = function(task){
				var modalOptions = {
					closeButtonText: 'Cancel',
					actionButtonText: 'Ok',
					actionButtonStyle: 'cat-btn-update',
					headerText: 'Confirmation',
					bodyText: 'Are you sure you want to execute this Job?'
				};
				confirmbox.showModal({}, modalOptions).then(function() {
				workzoneServices.runTask(task.id).then(function(response) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
						controller: 'orchestrationLogCtrl as orchLogCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									taskId:task.id,
									historyId: response.data.historyId,
									taskType: task.taskType
								};
							}
						}
					});
				});
				});
			};
			$scope.instanceTableView = function() {
				$scope.isCardViewActive = false;
				$scope.instanceTableViewSelection = "instance-tab-active";
				$scope.instanceCardViewSelection = "";
				var tableData = $scope.tabData;
				$scope.tabData = [];
				$timeout(function(){
					$scope.tabData = tableData;
				}, 500);

			};
			$scope.instanceControlPanel = function(instanceObj) {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/controlPanel.html',
					controller: 'controlPanelCtrl',
					backdrop : 'static',
					keyboard: false,
					size: 'lg',
					resolve: {
						instance: function() {
							return instanceObj;
						}
					}
				});
			};
			$scope.refreshCurrentPage = function(){
				$rootScope.$emit('WZ_INSTANCES_REFRESH_CURRENT');    
			};
			$scope.init = function(){
				helper.setInitPaginationDefaults();
				$scope.setCardView();
			};
			$scope.init();
		}
	]);
})(angular);