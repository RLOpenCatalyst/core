/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.blueprint')
		.controller('blueprintLaunchParamsCtrl', ['$scope', '$modalInstance', 'toastr',  'items','workzoneServices','genericServices','workzoneEnvironment', function($scope, $modalInstance, toastr, items,workzoneServices,genericServices,workzoneEnvironment) {
			console.log(items);
			$scope.showMonitor = true;
			if(items.blueprintType === 'azure_arm' || items.blueprintType === 'azure_launch') {
				$scope.showMonitor = false;
			}
			var launchHelper = {
				launch : function(){
					$modalInstance.close({bp:items,stackName:$scope.stackName,domainName:$scope.domainName,tagServer:$scope.tagSerSelected,launchEnv:$scope.envSeleted,monitorId:$scope.monitorId});
				}
			};
			//var bPLP=this;
			$scope.taggingServerList=[];
			$scope.envOptions=[];
			$scope.monitorList = [];
			workzoneServices.getTaggingServer().then(function (topSer) {
				$scope.taggingServerList=topSer.data;
			});
			$scope.monitorId = 'null';
			$scope.getMonitorList = function(orgId) {
				workzoneServices.getMonitorList(orgId).then(function (response) {		
			        $scope.monitorList = response.data;
			        for(var i=0; i<$scope.monitorList.length; i++){
			        	if($scope.monitorList[i].isDefault){
			        		$scope.monitorId = $scope.monitorList[i]._id;
			        		break;
			        	}
			        }
				});
			};
			genericServices.getTreeNew().then(function (envData) {
				angular.forEach(envData,function(val){
					var orgID,bgID,projID;
					if(items.organizationId === undefined) {
						orgID = (items.orgId)?items.orgId:items.masterDetails.orgId;
			        	bgID = (items.bgId)?items.bgId:items.masterDetails.bgId;
			        	projID = (items.projectId)?items.projectId:items.masterDetails.projectId;
			        	$scope.getMonitorList(orgID);
					} else {
						orgID = items.organizationId;
						bgID = items.businessGroupId;
						projID = items.projectId;
						$scope.getMonitorList(orgID);
					}
					if(val.rowid === orgID){
						$scope.orgSeleted=val.name;
						angular.forEach(val.businessGroups,function(busval){
							if(busval.rowid === bgID){
								$scope.busSeleted=busval.name;
								angular.forEach(busval.projects,function(projval){
									if(projval.rowId === projID){
										$scope.projSeleted=projval.name;
										$scope.envOptions=projval.environments;
										if(workzoneEnvironment.getEnvParams() && workzoneEnvironment.getEnvParams().env){
											$scope.envSeleted=workzoneEnvironment.getEnvParams().env;
										} else {
											$scope.envSeleted=projval.environments[0].rowid;
										}
									}
								});
							}
						});
					}

				});

			});
			$scope.stackName='';
			$scope.domainName='';
			$scope.tagSerSelected = '';
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.monitorIdCheck = function() {
				if($scope.monitorId === 'null') {
	                $scope.monitorId = null;
	            }
			};
			$scope.launchBP = function() {
				$scope.monitorIdCheck();
				if(items.orgId === undefined && items.botType === undefined){
					var compBlue={
						"blueprintId": (items.id)?items.id:items._id,
						"environmentId": $scope.envSeleted
					};
					workzoneServices.launchCompsiteBlueprint(compBlue).success(function() {
                        toastr.success('Successfully launched composite blueprint');
                        $modalInstance.close(compBlue);
					}).error(function(data) {
                        toastr.error(data.message, 'Error');
					});
				} else {
					if(items.blueprintType === "aws_cf" || items.botLinkedSubCategory === "aws_cf") {
						$scope.showCFTInputs = true;
					}else if(items.blueprintType === "azure_arm" || items.botLinkedSubCategory === "azure_arm") {
						$scope.showARMInputs = true;
					}else if(items.domainNameCheck === true || items.domainNameCheck === "true") {
						$scope.showBlueprintInputs = true;
					}else {
						launchHelper.launch();
					}
				}
			};
			$scope.cftSubmitHandler = function(){
				$scope.monitorIdCheck();
				launchHelper.launch();
			};
			$scope.launchBPWithDomainName = function(){
				$scope.monitorIdCheck();
				launchHelper.launch();
			};
		}
	]);
})(angular);
