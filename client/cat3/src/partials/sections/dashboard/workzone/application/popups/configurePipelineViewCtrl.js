/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.application')
		.controller('configurePipelineViewCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'chefSelectorComponent', 'responseFormatter', 'items', '$q', '$timeout', 
		function($scope, $modalInstance, workzoneServices, chefSelectorComponent, responseFormatter, items, $q, $timeout) {
			var selectedElements = [];
			var newEnvList = [];
			var projectID = items;
			var list, selectedElements, factory, compositeSelector;
			var c = workzoneServices.getEnvConfig(items);
			var d = workzoneServices.getUpdatedEnvConfig(items);
			$q.all([c, d]).then(function(allPromise) {
				console.log(allPromise);
				var allEnvNames = allPromise[0].data[0].environmentname;
				var data = allEnvNames.split(',');
				var list = [];
				for(var i=0; i<data.length; i++){
					var obj = {
					    "className": "environment",
					    "value": data[i],
					    "data": {
					    	"key": data[i].environmentname,
					    	"value": data[i].environmentname
					    }
					}
					list.push(obj);
				}
				newEnvList = allPromise[1].data[0].envSequence;
				for(var i=0; i<newEnvList.length; i++) {
					var newList = {
						"className": "environment",
					    "value": newEnvList[i],
					    "data": {
					    	"key": newEnvList[i],
					    	"value": newEnvList[i]
					    }
					}
					selectedElements.push(newList);
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
					isExcludeDataFromOption: true,
				});
				console.log(list);
				console.log(selectedElements);
				registerUpdateEvent(compositeSelector);
			});
			function registerUpdateEvent(obj) {
				obj.addListUpdateListener('updateList');
				console.log(updateList);
			}
			angular.extend($scope, {
			    ok:function(){
			    	var newEnv=[];
			    	angular.forEach(compositeSelector.getSelectorList(),function(val){
				    	newEnv.push(val.value);
				    });
				    console.log(newEnv);
				    var envList = {
						"appDeployPipelineData": {
							"loggedInUser": "",
							"projectId": projectID,
							"envId": newEnv,
							"envSequence": newEnv
						}
					};
			    	workzoneServices.postEnvConfig(envList).then(function () {
						$modalInstance.close();
					}, function(error){
						if(error.responseText){
							$scope.errorMessage = error.responseText;
						}
					});
					$modalInstance.close({envList: envList.appDeployPipelineData.envSequence});
			    },
				cancel: function() {
					$modalInstance.dismiss('cancel');
				}
			});
		}
	]);
})();