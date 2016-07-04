/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.application')
		.controller('configurePipelineViewCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'chefSelectorComponent', 'responseFormatter', 'items', '$q',
			function($scope, $modalInstance, workzoneServices, chefSelectorComponent, responseFormatter, items, $q) {
				$scope.isConfigurePipelineLoading = true;
				var helper = {
					getLeftRightEnvs: function(response){
						var envIds = response.envId;
						var envSequence = response.envSequence;
						var leftEnvList = [];
						var rightEnvList = [];
						for(var i=0;i<envIds.length;i++) {
							if(envSequence.indexOf(envIds[i])!==-1) {
								rightEnvList.push(envIds[i]);
							} else {
								leftEnvList.push(envIds[i]);
							}
						}
						return {
							left: leftEnvList,
							right: rightEnvList
						};
					}
				};
				var projectID = items;
				var compositeSelector;
				var d = workzoneServices.getUpdatedEnvConfig(items);
				$q.all([d]).then(function(allPromise) {
					$scope.isConfigurePipelineLoading = false;
					var allEnvListLeftRight = [], allEnvListLeft = [], activeEnvList = [], list = [], selectedElements = [];
					allEnvListLeftRight = helper.getLeftRightEnvs(allPromise[0].data[0]);
					allEnvListLeft = allEnvListLeftRight.left;
					for(var i=0; i<allEnvListLeft.length; i++) {
						var item = {
							"className": "environment",
							"value": allEnvListLeft[i],
							"data": {
								"key": allEnvListLeft[i],
								"value": allEnvListLeft[i]
							}
						};
						list.push(item);
					}
					activeEnvList = allEnvListLeftRight.right;
					for(var j=0; j<activeEnvList.length; j++) {
						var items = {
							"className": "environment",
							"value": activeEnvList[j],
							"data": {
								"key": activeEnvList[j],
								"value": activeEnvList[j]
							}
						};
						selectedElements.push(items);
					}
					var factory = chefSelectorComponent.getComponent;
					compositeSelector = new factory({
						scopeElement: '#configure_environments',
						optionList: list,
						selectorList: selectedElements,
						isSortList: true,
						isSearchBoxEnable: false,
						isOverrideHtmlTemplate: true,
						isPriorityEnable: true,
						isExcludeDataFromOption: false,
					});
				});
				angular.extend($scope, {
					ok:function(){
						var newEnv=[];
						var envListLeft=[];
						var envSequence=[];
						//To get the right side list
						angular.forEach(compositeSelector.getSelectorList(),function(val){
							newEnv.push(val.value);
						});
						//To get the left side list
						angular.forEach(compositeSelector.getOptionList(),function(val){
							envListLeft.push(val.value);
						});
						envSequence = envListLeft.concat(newEnv);
						var envList = {
							"projectId": projectID,
							"envId": envSequence,
							"envSequence": newEnv
						};

						workzoneServices.postEnvConfig(envList).then(function (envListResult) {
							$modalInstance.close(envListResult.data[0]);
						},function(error){
							console.log(error);
						});
					},
					cancel: function() {
						$modalInstance.dismiss('cancel');
					}
				});
			}
		]);
})(angular);