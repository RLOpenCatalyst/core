/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.blueprint')
		.controller('blueprintLaunchParamsCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
			console.log(items);
			var launchHelper = {
				launch : function(){
					$modalInstance.close({bp:items,stackName:$scope.stackName,domainName:$scope.domainName,tagServer:$scope.tagServer});
				}
			};
			$scope.stackName='';
			$scope.domainName='';
			$scope.tagServer = "Monitoring";
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.tagServerChecking = function() {
				if($scope.tagServerCheck){
					$scope.tagServerStatus = true;
				}else{
					$scope.tagServerStatus = false;
					$scope.tagServer = '';
				}
			};
			$scope.launchBP = function() {
				if(items.blueprintType === "aws_cf") {
					$scope.showCFTInputs = true;
				}else if(items.blueprintType === "azure_arm") {
					$scope.showARMInputs = true;
				}else if(items.domainNameCheck === true || items.domainNameCheck === "true") {
					$scope.showBlueprintInputs = true;
				}else {
					launchHelper.launch();
				}
			};
			$scope.cftSubmitHandler = function(){
				launchHelper.launch();
			};
			$scope.launchBPWithDomainName = function(){
				launchHelper.launch();
			};
		}
	]);
})(angular);
