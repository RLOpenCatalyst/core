/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.instance', ['ngAnimate', 'ui.bootstrap', 'utility.validation', 'filter.currentTime', 'apis.workzone','utility.array','workzonePermission', 'instanceServices', 'chefDataFormatter'])
	.controller('instanceCtrl', ['chefSelectorComponent', '$scope', '$rootScope', '$modal', '$q', 'workzoneServices','arrayUtil', 'instancePermission', 
		'instanceActions', 'instanceOperations', 'workzoneEnvironment', '$timeout', 'workzoneUIUtils', function(chefSelectorComponent, $scope, $rootScope, $modal, $q, workzoneServices,arrayUtil, instancePerms, instanceActions, instanceOperations,workzoneEnvironment, $timeout, workzoneUIUtils) {
			console.log('instanceCtrl');
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
			}
		};
		var completeData;
		$scope.instancePageLevelLoader = true;
		$scope.instStartStopFlag = false;

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

		//variables used in rendering of the cards and table && checking ssh
		angular.extend($scope, {
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
				return type==="image" ? instanceStateImagePrefix + colorSuffix : instanceStateTextPrefix + colorSuffix;
			}, 
			actionSet: instanceActions
		});

		/*	START: Methods which make use of instanceService
			Below methods on the instance card/table make use of instanceActions service.
			Same sevice is reused in control panel actions tab but promise handlers may be different.
		*/
		$scope.operationSet = {};
		$scope.operationSet.deleteInstance = function(inst,index){
			var promise = instanceOperations.deleteInstance(inst);
			promise.then(function(resolveMessage) {
				console.log("Promise resolved deleteInstance:" + resolveMessage);
				$scope.instanceList.splice(index, 1);
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
			var promise = instanceOperations.viewRunList(inst);
			promise.then(function(resolveMessage) {
				console.log("Promise resolved viewRunList:" + resolveMessage);
			}, function(rejectMessage) {
				console.log("Promise rejected viewRunList:" + rejectMessage);
			});
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
						}, function(rejectMessage){
							$scope.instStartStopFlag = false;
							console.log("Promise rejected " + rejectMessage);
						});
					}else{						
						var startPromise = instanceOperations.startInstanceHandler(inst, $scope.perms.start);
						startPromise.then(function(){
							$scope.operationSet.checkInstanceStatus(instObj, 2000);
							$scope.operationSet.viewLogs(inst);
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

								/*if (data.appUrls && data.appUrls.length) {
									for (var k = 0; k < data.appUrls.length; k++) {
										var url = data.appUrls[k].url;
										url = url.replace('$host', data.instanceIP);
										$('.app-url[data-appUrlId="' + data.appUrls[k]._id + '"]').attr('href', url);
									}
								}*/

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

		/*angular.extend($scope, {
			getbootStrapStatus: function(status) {
				var applyClass = '';
				var classPrefixConstant1='card_btns_chef';
				var classPrefixConstant2='card_btns_puppet';
				var classPrefixConstant3='card_btns_ssh';
				var classPrefixConstant4='card_btns_rdp';
				if (status === 'success') {
					applyClass = '1';
				} else if (status === 'pending' || status === 'stopping') {
					applyClass = '1_disabled';
				}
				return classPrefixConstant1 + applyClass;
				return classPrefixConstant2 + applyClass;
				return classPrefixConstant3 + applyClass;
				return classPrefixConstant4 + applyClass;
			}
		});*/
		$rootScope.$on('WZ_ENV_CHANGE_START', function(){
			$scope.isInstancePageLoading = true;
			$scope.instanceList = [];
		});
		$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
			$scope.isInstancePageLoading = false;
			completeData = helper.attachListOfTaskWithInstance(data);
			$scope.instanceList = completeData.instances;
			workzoneUIUtils.makeTabScrollable('instancePage');
		});

		$scope.instanceImportByIP = function() {
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
				$scope.operationSet.viewLogs(newinstId);
			}, function() {
				console.log('Modal dismissed at: ' + new Date());
			});
		};

		$scope.showAppLinksPopup = function(inst) {
			inst.showAppLinks = !inst.showAppLinks;
		};

		$scope.selectCard = function(identi) {
			$scope.selectedCard = identi;
		};

		$scope.instanceCardView = function() {
			$scope.isCardViewActive = true;
			$scope.instanceCardViewSelection = "selectedView";
			$scope.instanceTableViewSelection = "";
		};

		$scope.instanceTableView = function() {
			$scope.isCardViewActive = false;
			$scope.instanceTableViewSelection = "selectedView";
			$scope.instanceCardViewSelection = "";
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
		$scope.init = function(){
			$scope.instanceCardView();
			//workzoneUIUtils.attachResizeTabEvent('instancePage');
		};
		
		$scope.init();
	}]);
})(angular);