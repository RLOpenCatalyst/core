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
			var launchHelper = {
				launch : function(){
					$modalInstance.close({bp:items,stackName:$scope.stackName,domainName:$scope.domainName});
				}
			};
			$scope.stackName='';
			$scope.domainName='';
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
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
