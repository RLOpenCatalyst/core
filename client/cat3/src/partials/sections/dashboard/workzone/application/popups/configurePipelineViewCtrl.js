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
			workzoneServices.getUpdatedEnvConfig(items).then(function (response){
				newEnvList = response.data[0].envSequence;
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
			});
			var list, selectedElements, factory, compositeSelector;
			var c = workzoneServices.getEnvConfig(items);
			c.then(function(allPromise) {
				var allEnvNames = allPromise.data[0].environmentname;
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
						"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
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
					$modalInstance.close('cancel');
				}
			});
		}
	]);
})();