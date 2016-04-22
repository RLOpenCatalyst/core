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
			/*END: Methods which make use of instanceService*/

			angular.extend($scope, {
				actionSet : instanceActions
			});
		}
	]);
})();