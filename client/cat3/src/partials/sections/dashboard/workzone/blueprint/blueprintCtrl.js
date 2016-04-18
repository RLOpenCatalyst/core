/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.blueprint', ['ngAnimate', 'ui.bootstrap', 'apis.workzone', 'ngMessages'])
		.factory('formatData', [function() {
			return {
				getFormattedCollection: function(obj) {
					var list = {
						"software_stack": [],
						"docker": [],
						"os_image": [],
						"cloudFormation": [],
						"azureARM": []
					},
					temp;
					for (var i = 0; i < obj.length; i++) {
						temp = obj[i];
						switch (temp.templateType) {
							case "chef":
								list.software_stack.push(temp);
								break;
							case "ami":
								list.os_image.push(temp);
								break;
							case "cft":
								list.cloudFormation.push(temp);
								break;
							case "docker":
								list.docker.push(temp);
								break;
							case "arm":
								list.azureARM.push(temp);
								break;
						}
					}
					return list;
				}
			};
		}])
		.controller('blueprintCtrl', ['$scope', '$modal', 'formatData', 'workzoneServices', '$rootScope', 'workzoneUIUtils', function($scope, $modal, formatData, workzoneServices, $rootScope, workzoneUIUtils) {
			/*Open only One Accordian-Group at a time*/
			$scope.oneAtATime = true;
			/*Initialising First Accordian-group open on load*/
			$scope.isFirstOpen = true;

			$rootScope.$on('WZ_ENV_CHANGE_START', function(){
				$scope.isBluePrintPageLoading = true;
				$scope.blueprints = [];
			});

			var envParams ;
			$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				envParams=requestParams;
				var blueprint = data.blueprints;
				$scope.blueprints = formatData.getFormattedCollection(blueprint);
				$scope.isBluePrintPageLoading = false;
                workzoneUIUtils.makeTabScrollable('bluePrintPage');
			});

			angular.extend($scope, {
				launchInstance: function(blueprintObj) {
				   $modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunchParams.html",
						controller: "blueprintLaunchParamsCtrl",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return blueprintObj;
							}
						}
					})
					.result.then(function(bpObj) {
						if (bpObj.bp.blueprintType === "docker") {
							$modal.open({
								animate: true,
								templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/dockerLaunchParams.html",
								controller: "dockerLaunchParamsCtrl",
								backdrop: 'static',
								keyboard: false,
								resolve: {
									items: function() {
										return bpObj.bp;
									}
								}
							}).result.then(function() {
								console.log('The modal close is not getting invoked currently. Goes to cancel handler');
							}, function() {
								console.log('Cancel Handler getting invoked');
							});
						}else{
						$modal.open({
								animate: true,
								templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunch.html",
								controller: "blueprintLaunchCtrl",
								backdrop: 'static',
								keyboard: false,
								resolve: {
									bpItem: function() {
										return bpObj;
									}
								}
							})
							.result.then(function(selectedItem) {
								$scope.selected = selectedItem;
							}, function() {

							});
						}
					}, function() {
						
					}); 
				},
				moreInfo: function(blueprintObj) {
					var moreInfoXHR = $.get('data/new_blueprintMoreInfo.json?' + blueprintObj._id);
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/blueprintMoreInfo.html',
						controller: 'blueprintMoreInfoCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return moreInfoXHR;
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						
					});
				},
				removeBluePrint: function(blueprintObj, bpType) { 
					$modal.open({
						animate: true,
						templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/removeBlueprint.html",
						controller: "removeBlueprintCtrl",
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return blueprintObj;
							}
						}
					}).
					result.then(function() { 
						var idx = $scope.blueprints[bpType].indexOf(blueprintObj);
						$scope.blueprints[bpType].splice(idx, 1);
					}, function() {
						
					});
				}
			});
		}
	]);
})(angular);