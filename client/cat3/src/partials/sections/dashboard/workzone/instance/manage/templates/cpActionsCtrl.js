/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function(){
   "use strict";
	angular.module('workzone.instance')
		.controller('cpActionsCtrl', ['$scope', 'workzoneServices', 'workzoneEnvironment', 'arrayUtil', 'instancePermission', 'instanceActions', 'instanceOperations', function($scope, workzoneServices, workzoneEnvironment, arrayUtil, instancePerms, instanceActions, instanceOperations) {
			var cpInstance = $scope.$parent.cpInstance;
			$scope.inst = cpInstance;
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
			//$scope.instStartStopFlag = true;
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

			angular.extend($scope, {
				actionSet : instanceActions
			});
		}
	]);
})();