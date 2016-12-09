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
			var launchHelper = {
				launch : function(){
					$modalInstance.close({bp:items,stackName:$scope.stackName,domainName:$scope.domainName,tagServer:$scope.tagSerSelected,launchEnv:$scope.envSeleted});
				}
			};
			//var bPLP=this;
			$scope.taggingServerList=[];
			$scope.envOptions=[];
			workzoneServices.getTaggingServer().then(function (topSer) {
				$scope.taggingServerList=topSer.data;
			});
			genericServices.getTreeNew().then(function (envData) {
				angular.forEach(envData,function(val){
					var orgID,bgID,projID;
					if(items.organizationId === undefined) {
						orgID = (items.orgId)?items.orgId:items.organization.id;
			        	bgID = (items.bgId)?items.bgId:items.businessGroup.id;
			        	projID = (items.projectId)?items.projectId:items.project.id;
					} else {
						orgID = items.organizationId;
						bgID = items.businessGroupId;
						projID = items.projectId;
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
			$scope.tagSerSelected = "";
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.launchBP = function() {
				if(items.orgId === undefined){
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
					if(items.blueprintType === "aws_cf") {
						$scope.showCFTInputs = true;
					}else if(items.blueprintType === "azure_arm") {
						$scope.showARMInputs = true;
					}else if(items.domainNameCheck === true || items.domainNameCheck === "true") {
						$scope.showBlueprintInputs = true;
					}else {
						launchHelper.launch();
					}
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
