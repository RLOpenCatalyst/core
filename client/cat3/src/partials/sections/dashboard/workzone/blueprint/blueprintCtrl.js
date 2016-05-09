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

			var envParams ;
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams, data) {
				$scope.isBlueprintPageLoading = true;
				$scope.envParams=requestParams;
				$scope.blueprintListCards();
			});

			angular.extend($scope, {
				blueprintListCards: function() {
					$scope.isBlueprintPageLoading = true;
					$scope.blueprints = [];
					// service to get the list of blueprints
					workzoneServices.getBlueprints($scope.envParams).then(function(result) {
						//var blueprint = result.data;
						var blueprint = [{
		"_id": "572c7bb83cee328b66285e74",
		"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
		"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
		"name": "Tomcat7",
		"templateId": "ubuntu-aws",
		"templateType": "ami",
		"blueprintConfig": {
			"_id": "572c7bb83cee328b66285e73",
			"infraManagerData": {
				"versionsList": [{
					"runlist": ["recipe[tomcat-all-rl]"],
					"attributes": [{
						"_id": "572c7bb83cee328b66285e72",
						"jsonObj": {
							"java": {
								"install_flavor": "oracle"
							}
						},
						"name": "Java Flavour"
					}, {
						"_id": "572c7bb83cee328b66285e71",
						"jsonObj": {
							"java": {
								"jdk_version": "7"
							}
						},
						"name": "Java JDK Version"
					}, {
						"_id": "572c7bb83cee328b66285e70",
						"jsonObj": {
							"java": {
								"oracle": {
									"accept_oracle_download_terms": "true"
								}
							}
						},
						"name": "Oracle Download Terms"
					}, {
						"_id": "572c7bb83cee328b66285e6f",
						"jsonObj": {
							"tomcat-all-rl": {
								"user": "tomcat"
							}
						},
						"name": "Tomcat User"
					}, {
						"_id": "572c7bb83cee328b66285e6e",
						"jsonObj": {
							"tomcat-all-rl": {
								"group": "tomcat"
							}
						},
						"name": "Tomcat Group"
					}, {
						"_id": "572c7bb83cee328b66285e6d",
						"jsonObj": {
							"tomcat-all-rl": {
								"version": "7.0.53"
							}
						},
						"name": "Tomcat Version"
					}, {
						"_id": "572c7bb83cee328b66285e6c",
						"jsonObj": {
							"tomcat-all-rl": {
								"tomcat_home": "/opt/tomcat7"
							}
						},
						"name": "Tomcat Home"
					}, {
						"_id": "572c7bb83cee328b66285e6b",
						"jsonObj": {
							"tomcat-all-rl": {
								"set_etc_environment": "true"
							}
						},
						"name": "Set Tomcat Environment"
					}, {
						"_id": "572c7bb83cee328b66285e6a",
						"jsonObj": {
							"tomcat-all-rl": {
								"shutdown_port": "8005"
							}
						},
						"name": "Tomcat Shutdown Port"
					}, {
						"_id": "572c7bb83cee328b66285e69",
						"jsonObj": {
							"tomcat-all-rl": {
								"port": "3001"
							}
						},
						"name": "Tomcat Running Port"
					}, {
						"_id": "572c7bb83cee328b66285e68",
						"jsonObj": {
							"tomcat-all-rl": {
								"max_threads": "100"
							}
						},
						"name": "Tomcat Max Threads"
					}, {
						"_id": "572c7bb83cee328b66285e67",
						"jsonObj": {
							"tomcat-all-rl": {
								"min_spare_threads": "10"
							}
						},
						"name": "Tomcat Min Spare Threads"
					}, {
						"_id": "572c7bb83cee328b66285e66",
						"jsonObj": {
							"tomcat-all-rl": {
								"java_opts": "-d64 -server -Djava.awt.headless=true -XX:PermSize=64m -XX:MaxPermSize=256m"
							}
						},
						"name": "Tomcat Java Opts"
					}],
					"_id": "572c7bb83cee328b66285e65",
					"ver": "0.1"
				}],
				"_id": "572c7bb83cee328b66285e64",
				"latestVersion": "0.1"
			},
			"infraManagerId": "80829b1d-3ffa-4a28-b45d-712fbe21b553",
			"infraMangerType": "chef",
			"cloudProviderData": {
				"securityGroupIds": ["sg-eeff688b"],
				"_id": "572c7bb83cee328b66285e63",
				"instanceCount": "1",
				"instanceOS": "linux",
				"imageId": "572c7a083cee328b66285e1c",
				"subnetId": "subnet-d7df258e",
				"region": "us-west-1",
				"vpcId": "vpc-bd815ad8",
				"instanceUsername": "root",
				"instanceAmiid": "ami-06116566",
				"instanceType": "t2.micro",
				"keyPairId": "572c79b13cee328b66285e1a"
			},
			"cloudProviderId": "572c79b13cee328b66285e19",
			"cloudProviderType": "aws"
		},
		"blueprintType": "instance_launch",
		"version": "1",
		"__v": 0,
		"users": [],
		"appUrls": [{
			"name": "Google",
			"url": "http://www.google.com",
			"_id": "572c7bb83cee328b66285e76"
		}, {
			"name": "Tomcat7",
			"url": "http://$host:3001",
			"_id": "572c7bb83cee328b66285e75"
		}],
		"versions": [{
			"id": "572c7f123cee328b66285f51",
			"version": "2",
			"name": "Tomcat7"
		}, {
			"id": "572c82883cee328b66285f74",
			"version": "3",
			"name": "Tomcat7-Edited"
		}, {
			"id": "572c82f13cee328b66285f8a",
			"version": "4",
			"name": "Tomcat7-Edited"
		}]
	}, {
		"_id": "572c7c043cee328b66285e7e",
		"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
		"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
		"name": "Windows2012",
		"templateId": "windows-aws",
		"templateType": "ami",
		"blueprintConfig": {
			"_id": "572c7c043cee328b66285e7d",
			"infraManagerData": {
				"versionsList": [{
					"runlist": [],
					"_id": "572c7c043cee328b66285e7c",
					"ver": "0.1"
				}],
				"_id": "572c7c043cee328b66285e7b",
				"latestVersion": "0.1"
			},
			"infraManagerId": "80829b1d-3ffa-4a28-b45d-712fbe21b553",
			"infraMangerType": "chef",
			"cloudProviderData": {
				"securityGroupIds": ["sg-eeff688b"],
				"_id": "572c7c043cee328b66285e7a",
				"instanceCount": "1",
				"instanceOS": "windows",
				"imageId": "572c7a403cee328b66285e4d",
				"subnetId": "subnet-d7df258e",
				"region": "us-west-1",
				"vpcId": "vpc-bd815ad8",
				"instanceUsername": "root",
				"instanceAmiid": "ami-a3314fc3",
				"instanceType": "t2.small",
				"keyPairId": "572c79b13cee328b66285e1a"
			},
			"cloudProviderId": "572c79b13cee328b66285e19",
			"cloudProviderType": "aws"
		},
		"blueprintType": "instance_launch",
		"version": "1",
		"__v": 0,
		"users": [],
		"appUrls": []
	}, {
		"_id": "572c81ce3cee328b66285f62",
		"orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
		"bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
		"projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
		"name": "Apache2-SS",
		"templateId": "APache2",
		"templateType": "chef",
		"blueprintConfig": {
			"_id": "572c81ce3cee328b66285f61",
			"infraManagerData": {
				"versionsList": [{
					"runlist": ["recipe[apache2]"],
					"_id": "572c81ce3cee328b66285f60",
					"ver": "0.1"
				}],
				"_id": "572c81ce3cee328b66285f5f",
				"latestVersion": "0.1"
			},
			"infraManagerId": "80829b1d-3ffa-4a28-b45d-712fbe21b553",
			"infraMangerType": "chef",
			"cloudProviderData": {
				"securityGroupIds": ["sg-eeff688b"],
				"_id": "572c81ce3cee328b66285f5e",
				"instanceCount": "1",
				"instanceOS": "linux",
				"imageId": "572c7a083cee328b66285e1c",
				"subnetId": "subnet-d7df258e",
				"region": "us-west-1",
				"vpcId": "vpc-bd815ad8",
				"instanceUsername": "root",
				"instanceAmiid": "ami-06116566",
				"instanceType": "t2.micro",
				"keyPairId": "572c79b13cee328b66285e1a"
			},
			"cloudProviderId": "572c79b13cee328b66285e19",
			"cloudProviderType": "aws"
		},
		"blueprintType": "instance_launch",
		"version": "1",
		"__v": 0,
		"users": [],
		"appUrls": []
	}];
						$scope.blueprints = formatData.getFormattedCollection(blueprint);
						$scope.isBlueprintPageLoading = false;
		                workzoneUIUtils.makeTabScrollable('blueprintPage');
					},function(error) {
						$scope.isBlueprintPageLoading = false;
						console.log(error);
						$scope.errorMessage = "No Records found";
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
				}
			});
		}
	]);
})(angular);