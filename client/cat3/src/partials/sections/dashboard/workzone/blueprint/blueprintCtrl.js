/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.blueprint', ['ui.bootstrap', 'apis.workzone', 'ngMessages'])
		.factory('formatData', [function() {
			return {
				getFormattedCollection: function(obj) {
					var list = {
						"software_stack": [],
						"docker": [],
						"os_image": [],
						"cloudFormation": [],
						"azureARM": [],
						"compositeBlueprint":[]
					},
					temp;
					for (var i = 0; i < obj.length; i++) {
						temp = obj[i];
						temp.iconpath = this.getIconPath(temp);
						temp.cardVersions = this.getVersionList(temp);
						temp.selectedVersionBpId = temp.cardVersions[0].id;
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
				},
				getVersionList : function(bpItem) {
					var allVersionsList = [];
					var currentVersion = {
						id : bpItem._id,
						name : bpItem.name,
						version : 1
					};
					allVersionsList[0] = currentVersion;
					var olderVersions = [];
					if(bpItem.versions && bpItem.versions.length) {
						olderVersions = bpItem.versions;
						allVersionsList = allVersionsList.concat(olderVersions);
					}
					return allVersionsList.reverse();					
				},
				getIconPath : function(bpItem) {
					return bpItem.iconpath || "images/templateicons/imgo.jpg";
				}
			};
		}])
		.controller('blueprintCtrl', ['$scope', '$modal', 'formatData', 'workzoneServices', '$rootScope', 'workzoneUIUtils','confirmbox','toastr', function($scope, $modal, formatData, workzoneServices, $rootScope, workzoneUIUtils,confirmbox,toastr) {
			/*Open only One Accordian-Group at a time*/
			$scope.oneAtATime = true;
			/*Initialising First Accordian-group open on load*/
			$scope.isFirstOpen = true;

			
			angular.extend($scope, {
				blueprintListCards: function() {
					$scope.isBlueprintPageLoading = true;
					$scope.blueprints = [];
					// service to get the list of blueprints
					workzoneServices.getBlueprints().then(function(result) {
						var blueprint = result.data;
						$scope.blueprints = formatData.getFormattedCollection(blueprint);
						$scope.isBlueprintPageLoading = false;
						workzoneUIUtils.makeTabScrollable('blueprintPage');
					},function(error) {
						$scope.isBlueprintPageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
					});
				},
				//method used to change the bp Name when the version is changed.
				changeCardVersion: function(blueprintObj,bpType){	
					var idx = $scope.blueprints[bpType].indexOf(blueprintObj);
					var cardVersions = $scope.blueprints[bpType][idx].cardVersions;
					angular.forEach(cardVersions,function(val){
						if(val.id === $scope.blueprints[bpType][idx].selectedVersionBpId){
							if(bpType === 'software_stack'){
								cardVersions.name = val.name;
							}
							if(bpType === 'os_image'){
								cardVersions.name = val.name;
							}
							if(bpType === 'docker'){
								cardVersions.name = val.name;
							}
							if(bpType === 'azureARM'){
								cardVersions.name = val.name;	
							}
							if(bpType === 'cloudFormation'){
								cardVersions.name = val.name;
							}
						}
					});
				},
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
								size: 'lg',
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
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/blueprintInfo.html',
						controller: 'blueprintInfoCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return blueprintObj;
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						
					});
				},
				compBlueInfo:function (blueprintObj) {
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/compositeBlueprintInfo.html',
						controller: 'compositeBlueprintInfoCtrl as compBlue',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return blueprintObj ;
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						
					});
				},
				showDockerRepoList: function(blueprintObj) {
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/dockerRepoList.html',
						controller: 'dockerRepoListCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return blueprintObj;
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						
					});
				},
				removeBlueprint: function(blueprintObj, bpType) { 
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
				},
				getAllCompsiteBlueprint:function(){
					workzoneServices.getAllCompsiteBlueprint().success(function(compBlue){
						$scope.compositeBlueprints=compBlue.blueprints;
					});
				},
				deleteCompositeBlueprint:function(compositeBlueprintId){
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Delete',
						actionButtonStyle: 'cat-btn-delete',
						headerText: 'Delete Composite Blueprint',
						bodyText: 'Are you sure you want to delete this composite blueprint?'
					};
					confirmbox.showModal({}, modalOptions).then(function() {
						workzoneServices.deleteCompsiteBlueprint(compositeBlueprintId).success(function() {
							$scope.getAllCompsiteBlueprint();
							toastr.success('Successfully deleted');
						}).error(function(data) {
							toastr.error(data.message, 'Error');
						});
					});
				},

				launchInstanceCompoBlueprint:function(compositeBlueprintId){
					var modalOptions = {
						closeButtonText: ' Cancel ',
						actionButtonText: ' Ok ',
						actionButtonStyle: 'cat-btn-update',
						headerText: 'Confirmation',
						bodyText: 'Are you sure you want to launch the Blueprint? Press Ok To continue'
					};
					var compBlue={
						"blueprintId": compositeBlueprintId,
						"environmentId": $scope.requestParams.env
					};
					confirmbox.showModal({}, modalOptions).then(function() {
						workzoneServices.launchCompsiteBlueprint(compBlue).success(function() {
                            toastr.success('Successfully launched composite blueprint');
						}).error(function(data) {
                            toastr.error(data.message, 'Error');
						});
					});
				}

			});

			$scope.init = function () {
				$scope.requestParams = $rootScope.requestParams;
				$scope.isBlueprintPageLoading = true;
				$scope.blueprintListCards();
				$scope.getAllCompsiteBlueprint();
			}
			$scope.init();

		}
	]);
})(angular);