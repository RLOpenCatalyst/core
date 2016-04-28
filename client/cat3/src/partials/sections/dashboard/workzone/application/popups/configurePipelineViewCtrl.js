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
			var compositeSelector;
			$scope.chefServerID = '';
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
				selectedElements = [];
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
					/*idList: {
						selectorList: '#selector',
						optionSelector: '#option',
						upBtn: '#btnRunlistItemUp',
						downBtn: '#btnRunlistItemDown',
						addToSelector: '#btnaddToRunlist',
						removeFromSelector: '#btnremoveFromRunlist',
						searchBox: '#searchBox'
					}*/
				});
				console.log(list);
				console.log(selectorList);
				registerUpdateEvent(compositeSelector);
			});
			function registerUpdateEvent(obj) {
				obj.addListUpdateListener('updateList');
				console.log(updateList);
			}
			angular.extend($scope, {
				ok: function() {
					var envList = {};
					/*var selectedCookBooks = compositeSelector.getSelectorList();
					envList = selectedCookBooks;
					console.log(envList);*/
					envList = {
						"appDeployPipelineData": {
							"loggedInUser": "",
							"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
							//"envId": 
							"envId": ["QA", "Dev", "Prod", "Stage"],
							"envSequence": ["QA", "Dev", "Prod", "Stage"]
						}
					};
					workzoneServices.postEnvConfig(envList).then(function () {
						$modalInstance.close();
					}, function(error){
						if(error.responseText){
							$scope.errorMessage = error.responseText;
						}
					});
				},
				cancel: function() {
					$modalInstance.dismiss('cancel');
				}
			});
		}
	]);
})();