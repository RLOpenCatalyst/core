/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
 
(function(){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpActionsCtrl', ['$scope', 'workzoneServices', 'workzoneEnvironment', 'arrayUtil', 'instancePermission', 'instanceActions', 'instanceOperations', '$timeout', function($scope, workzoneServices, workzoneEnvironment, arrayUtil, instancePerms, instanceActions, instanceOperations, $timeout) {
			var cpInstance = $scope.$parent.cpInstance;
			$scope.inst = cpInstance;
			$scope.isStartStopClickEnabled = true;
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

			$scope.rdpFileLink = function(instanceObj) {
				var fileLink = '/instances/rdp/' + instanceObj.instanceIP + '/3389';
				return fileLink;
			};
			$scope.rdpFileName = function(instanceObj) {
				var fileName = instanceObj.instanceIP +'.rdp';
				return fileName;
			};

			/*	START: Methods which make use of instanceService
				Below methods on the instance card/table make use of instanceAction service.
				same sevice is reused in control panel actions tab but promise handlers can be different.
			*/
			$scope.operationSet = {};
			$scope.operationSet.editInstanceName = function(inst){
				var promise = instanceOperations.editInstanceName(inst);
				promise.then(function(resolveMessage) {
					console.log(resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log(rejectMessage);
				});
			};
			$scope.operationSet.instanceSSH = function(inst){
				var promise = instanceOperations.instanceSSH(inst);
				promise.then(function(resolveMessage) {
					console.log(resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log(rejectMessage);
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
					console.log(resolveMessage);
				}, function(rejectMessage) {
					console.log(rejectMessage);
				});
			};
			$scope.operationSet.updateCookbook = function(inst){
				var promise = instanceOperations.updateCookbook(inst);
				promise.then(function(resolveMessage) {
					console.log(resolveMessage);
					$scope.selected = inst;
				}, function(rejectMessage) {
					console.log(rejectMessage);
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
			$scope.isStartStopClickEnabled = false;
			var instObj = {_inst:inst, _id:inst._id, state:inst.instanceState, instIdx:$scope.inst._id};
			workzoneServices.getInstanceData(inst).then(
				function(response) {
					if(response.data.instanceState==="running"){						
						var stopPromise = instanceOperations.stopInstanceHandler(inst, $scope.perms.stop);
						stopPromise.then(function(){
							$scope.operationSet.checkInstanceStatus(instObj, 2000);
							$scope.operationSet.viewLogs(inst);
							$scope.isStartStopClickEnabled = true;
						}, function(rejectMessage){
							$scope.instStartStopFlag = false;
							$scope.isStartStopClickEnabled = true;
							console.log("Promise rejected " + rejectMessage);
						});
					} else {						
						var startPromise = instanceOperations.startInstanceHandler(inst, $scope.perms.start);
						startPromise.then(function(){
							$scope.operationSet.checkInstanceStatus(instObj, 2000);
							$scope.operationSet.viewLogs(inst);
							$scope.isStartStopClickEnabled = true;
						}, function(rejectMessage){
							$scope.instStartStopFlag = false;
							$scope.isStartStopClickEnabled = true;
							console.log("Promise rejected " + rejectMessage);
						});
					}
				});
			};
			$scope.operationSet.checkInstanceStatus = function(instObj, delay) {
				var _instObj = instObj;
				$timeout(function(){
					workzoneServices.getInstanceData(instObj._inst).then(
						function(response){
							if(response){
								$scope.inst[_instObj.instIdx].instanceState = response.data.instanceState;
								console.log(response.data.instanceState, ' polling');

								if (response.data.instanceState === 'stopped' || response.data.instanceState === 'running' ){
									$scope.instStartStopFlag = false;
									console.log(response.data.instanceState, ' polling complete');
								} else{
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
			angular.extend($scope, {
				actionSet : instanceActions
			});
		}
	]);
})();