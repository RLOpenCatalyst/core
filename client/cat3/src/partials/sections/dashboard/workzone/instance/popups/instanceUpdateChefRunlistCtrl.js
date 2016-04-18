/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.instance').
	controller('instanceUpdateChefRunlistCtrl', ['$scope', 'items', 'instanceId', '$modalInstance',
	'responseFormatter', 'chefSelectorComponent', '$timeout', '$http', 'workzoneServices', '$modal',
	function($scope, items, instanceId, $modalInstance, responseFormatter, chefSelectorComponent, $timeout, $http, workzoneServices, $modal) {
		/*Open only One Accordian-Group at a time*/
		$scope.oneAtATime = true;
		/*Initialising First Accordian-group open on load*/
		$scope.isFirstOpen = true;
		var chefServerID = items[0].data.serverId;
		$scope.chefServerID = chefServerID;
		var list = responseFormatter.formatDataForChefClientRun(items[0].data);
		var template = responseFormatter.formatTemplateDataForChefClient(items[1].data);
		var totalElements = responseFormatter.merge(list, template);
		var selectedElements = responseFormatter.findDataForEditValue(items[2]);
		var factory = chefSelectorComponent.getComponent;
		var compositeSelector;
		$scope.allCBAttributes = [];
		function registerUpdateEvent(obj) {
			obj.addListUpdateListener('updateList', $scope.updateAttributeList);
		}

		$scope.confirmUpdateRunlist = function() {
			var taskJSON = {};
			var selectedCookBooks = compositeSelector.getSelectorList();
			taskJSON.runlist = responseFormatter.formatSelectedChefRunList(selectedCookBooks);
			taskJSON.jsonAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.allCBAttributes);
			var modalInstance = $modal.open({
				animation: true,
				templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/updateChefRunlistConfirmation.html',
				controller: 'updateChefRunlistConfirmationCtrl',
				backdrop: 'static',
				keyboard: false,
				resolve: {
					items: function() {
						return {
							instanceId : instanceId,
							taskJSON : taskJSON
						};
					}
				}

			});
			modalInstance.result.then(function() {
				$modalInstance.close();
				//TODO show instance logs
			});
		};

		$timeout(function() {
			//DOM has finished rendering after that initializing the component
			compositeSelector = new factory({
				scopeElement: '#chefClientForOrchestration',
				optionList: totalElements,
				selectorList: selectedElements,
				isSortList: true,
				isSearchBoxEnable: true,
				isPriorityEnable: true,
				isExcludeDataFromOption: true,
				isOverrideHtmlTemplate: false,
				idList: {
					selectorList: '#selector',
					optionSelector: '#option',
					upBtn: '#btnRunlistItemUp',
					downBtn: '#btnRunlistItemDown',
					addToSelector: '#btnaddToRunlist',
					removeFromSelector: '#btnremoveFromRunlist',
					searchBox: '#searchBox'
				}
			});
			registerUpdateEvent(compositeSelector);
		}, 10);

		angular.extend($scope, {
			HelpScreen: function() {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceCookBookHelp.html',
					controller: 'cookbookHelpCtrl',
					backdrop: 'static',
					keyboard: false,
				});
			},
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			changeSelection: function(className) {
				//compositeSelector.
				if (className === "all") {
					compositeSelector.resetFilters();
				} else {
					compositeSelector.applyFilterThroughClass(className);
				}
			},
			updateAttributeList: function() {
				//var value=arguments[0];
				var updatedList = arguments[1];
				//var operationType=arguments[2];
				if (updatedList.length > 0) {
					workzoneServices.getcookBookAttributes(updatedList, chefServerID).then(function(response) {
						var data;
						if (response.data) {
							data = response.data;
						} else {
							data = response;
						}
						/*Scope apply done to force refresh screen after receiving the AJAX response*/
						$scope.$apply(function() {
							$scope.allCBAttributes = data;
						});
					});
				} else {
					$scope.$apply(function() {
						$scope.allCBAttributes = [];
					});
				}
			},
		});
	}]);
})(angular);