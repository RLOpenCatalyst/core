/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
   "use strict";
	angular.module('workzone.application')
		.controller('configurePipelineViewCtrl', ['$scope', '$modalInstance', 'workzoneServices', 'chefSelectorComponent', 'responseFormatter', 'items', function($scope, $modalInstance, workzoneServices, chefSelectorComponent, responseFormatter, items) {
			var compositeSelector;
			workzoneServices.getEnvConfig(items).then(function(response) {
				var data, selectorList = [],
					optionList = [];

				if (response.data) {
					data = response.data;
				} else {
					data = response;
					console.log(data);
				}
				optionList = data;
				for(var i=0;i<data.length;i++) {
					var envIds = data[i].envId;
					console.log(envIds);
				}
				console.log(optionList);
				var factory = chefSelectorComponent.getComponent;
				compositeSelector = new factory({
					scopeElement: '#configure_environments',
					optionList: responseFormatter.formatTaskList(optionList),
					selectorList: responseFormatter.formatTaskList(selectorList),
					isSortList: true,
					isSearchBoxEnable: false,
					isOverrideHtmlTemplate: true,
					isPriorityEnable: true,
					isExcludeDataFromOption: true
				});
				console.log(optionList);
			});
			angular.extend($scope, {
				cancel: function() {
					$modalInstance.dismiss('cancel');
				}
			});
		}
	]);
})();