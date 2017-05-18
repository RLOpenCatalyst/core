/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function(angular) {
	"use strict";
	angular.module('workzone.instance')
		.controller('cpInfoCtrl', ['$scope', '$modal', 'workzoneServices','toastr', function($scope, $modal, workzoneServices,toastr) {
			/*Open only One Accordian-Group all a time*/
			$scope.oneAtATime = false;
			/*Opening all Accordian-group on load*/
			$scope.isFirstOpen = true;
			$scope.isSecondOpen = true;
			$scope.isThirdOpen = true;
			$scope.isFourthOpen = true;
			$scope.isFifthOpen = true;
			$scope.isSixthOpen = true;
			$scope.taskInfo = [];
			$scope.bpInfo = [];
			var cpInstance = $scope.$parent.cpInstance;  
			var hardwareInfo = {},
				softwareInfo = {},
				cmInfo = {};
				
			var helper = {
				memoryCalculation: function(data) {
					var memoryInitial = data;
					if (memoryInitial === 'unknown' || memoryInitial.indexOf('MB') !== -1) {
						return memoryInitial;
					} else {
						var memValue = memoryInitial.substring(0, memoryInitial.length - 2);
						var memValueInMB = memValue / 1000;
						var memValueRounded = Math.round(memValueInMB);
						var memDisplay = memValueRounded + ' MB';
						return memDisplay;
					}
				}
			};

			$scope.instInfo = cpInstance;
			$scope.appUrlInfo = cpInstance.appUrls;
			$scope.setTaskInfo = function() {
				if (cpInstance.taskIds && cpInstance.taskIds.length) {
					workzoneServices.postRetrieveTasksDetails(cpInstance.taskIds).then(function(response) {
						$scope.taskInfo = response.data;
					});
				}
			};
			$scope.setBlueprintInfo = function() {   
				if(cpInstance.blueprintData && cpInstance.blueprintData.blueprintId) {
					workzoneServices.blueprintInfo(cpInstance.blueprintData.blueprintId).then(function(response) {
						$scope.bpInfo = response.data;
					},
					function(error) {
						toastr.error(error.data.errMessage);
					});
				}
			};
			$scope.setTaskInfo();
			$scope.setBlueprintInfo();

			hardwareInfo.machine = cpInstance.hardware.architecture;
			hardwareInfo.memoryTotal = helper.memoryCalculation(cpInstance.hardware.memory.total);
			hardwareInfo.memoryFree = helper.memoryCalculation(cpInstance.hardware.memory.free);
			softwareInfo.os = cpInstance.hardware.platform;
			softwareInfo.version = cpInstance.hardware.platformVersion;
			cmInfo.bootstrap = cpInstance.bootStrapStatus;
			cmInfo.runlist = cpInstance.runlist.join();
			$scope.hardwareInfo = hardwareInfo;
			$scope.softwareInfo = softwareInfo;
			$scope.cmInfo = cmInfo;

			$scope.createAppUrl = function(type,appUrl) {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/applicationUrl.html',
					controller: 'appUrlCreateEditCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								type:type,
								cpInstance:cpInstance,
								selectedAppUrl:appUrl
							};
						}
					}
				}).result.then(function(createdItem) {
					if(type === 'new'){
						$scope.appUrlInfo.push(createdItem);
					}else{
						appUrl.name = createdItem.name;
						appUrl.url = createdItem.url;
					}
				}, function() {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			$scope.deleteAppUrl = function(_appUrl, index) {
				workzoneServices.deleteAppUrl(cpInstance._id, _appUrl._id).then(function() {
					var idx = index;
					$scope.appUrlInfo.splice(idx,1);
				}, function() {
					toastr.error("Unable to delete URL please try again later");
				});
			};
			$scope.inspect = function() {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/inspectSoftware.html',
					controller: 'inspectSoftwareCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						inspectInstance: function() {
							return cpInstance;
						}
					}
				}).result.then(function() {
					console.log('Inspect modal closed');
				}, function() {
					console.log('Inspect modal dismissed');
				});
			};
			$scope.assignJob = function() {
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/assignJob.html',
					controller: 'assignJobCtrl',
					size: 'lg',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						inspectInstance: function() {
							return cpInstance;
						}
					}
				}).result.then(function() {
					$scope.setTaskInfo();
					console.log('Inspect modal closed');
				}, function() {
					console.log('Inspect modal dismissed');
				});
			};
		}])
		.controller('inspectSoftwareCtrl', ['$scope', 'inspectInstance', '$modalInstance', 'workzoneServices', function($scope, inspectInstance, $modalInstance, workzoneServices) {
			$scope.isInspectSoftwareLoading = true;
			workzoneServices.getInspectSoftware(inspectInstance._id).then(function(response) {
				$scope.isInspectSoftwareLoading = false;
				console.log('inspect success');
				console.log(response.data);
				var data = response.data;
				var installedSoftwareString = data.installedSoftwareString;
				var installedSoftwareArray = installedSoftwareString.split('\r\n');
				$scope.installedSoftware = installedSoftwareArray;
			}, function(response) {
				$scope.isInspectSoftwareLoading = false;
				console.log('inspect failed');
				console.log(response.data);
				if (response.data.message) {
					$scope.error = response.data.message;
				} else {
					$scope.error = "Something went wrong while inspecting";
				}
			});
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}]).controller('assignJobCtrl', ['$scope', 'inspectInstance', '$modalInstance', 'workzoneServices', 'chefSelectorComponent', 'responseFormatter', function($scope, inspectInstance, $modalInstance, workzoneServices, chefSelectorComponent, responseFormatter) {
			var compositeSelector;
			workzoneServices.getOrgTasks().then(function(response) {
				var data, selectorList = [],
					optionList = [];

				if (response.data) {
					data = response.data;
				} else {
					data = response;
				}

				if (inspectInstance.taskIds && inspectInstance.taskIds.length > 0) {
					for (var i = 0; i < data.length; i++) {
						if (inspectInstance.taskIds.indexOf(data[i]._id) !== -1) {
							selectorList.push(data[i]);
						}
					}
				}
				optionList = data;
				var factory = chefSelectorComponent.getComponent;
				compositeSelector = new factory({
					scopeElement: '#assign_job_component',
					optionList: responseFormatter.formatTaskList(optionList),
					selectorList: responseFormatter.formatTaskList(selectorList),
					isSortList: true,
					isSearchBoxEnable: false,
					isOverrideHtmlTemplate: true,
					isPriorityEnable: false,
					isExcludeDataFromOption: true
				});
			});
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok = function() {
				var selectedList = compositeSelector.getSelectorList();
				var taskJSON = {
					taskIds: []
				};
				if (selectedList && selectedList.length) {
					for (var i = 0; i < selectedList.length; i++) {
						taskJSON.taskIds.push(selectedList[i].data._id);
					}
				}

				var reqBody = taskJSON;
				workzoneServices.addInstanceTask(inspectInstance._id, reqBody).then(function() {
					inspectInstance.taskIds = taskJSON.taskIds;
					$modalInstance.close();
				});
			};
		}]).controller('appUrlCreateEditCtrl', ['$scope', 'items', '$modalInstance', 'workzoneServices', function($scope, items, $modalInstance, workzoneServices) {
			/*on opening the popup checking whether the type is edit 
			and filling the appropriate name and url for the selected appItem*/
			if (items.type === 'edit') {
				var url = items.selectedAppUrl.url;
				if (url) {
					url = url.replace(items.cpInstance.instanceIP, '$host');
					items.selectedAppUrl.url = url;
				}
				$scope.appUrlItem = {
					name: items.selectedAppUrl.name,
					url: items.selectedAppUrl.url
				};
			}
			$scope.ok = function() {
				var appUrls = [];
				appUrls.push({
					name: $scope.appUrlItem.name,
					url: $scope.appUrlItem.url
				});
				if (appUrls.length) {
					var reqBody = {};
					/*condition check if the type is new(user is creating a new appUrl)*/
					if (items.type === 'new') {
						reqBody.appUrls = appUrls;
						workzoneServices.createAppUrl(items.cpInstance._id, reqBody).then(function(response) {
							var url = response.data[0].url;
							if (url) {
								url = url.replace('$host', items.cpInstance.instanceIP);
								response.data[0].url = url;
							}
							$scope.appUrlItem = response.data[0];
							$modalInstance.close($scope.appUrlItem);
						});
					} else {
						/*condition check if the type is editing a particular entry*/
						reqBody.name = appUrls[0].name;
						reqBody.url = appUrls[0].url;
						workzoneServices.updateAppUrl(items.cpInstance._id, items.selectedAppUrl._id, reqBody).then(function() {
							var url = reqBody.url;
							if (url) {
								url = url.replace('$host', items.cpInstance.instanceIP);
								reqBody.url = url;
							}
							$scope.appUrlItem = reqBody;
							$modalInstance.close($scope.appUrlItem);
						});
					}
				}
			};
			$scope.cancel = function() {
				// on cancel retaining the instance IP without getting it changed to $host.
				var url = items.selectedAppUrl.url;
				if (url) {
					url = url.replace('$host',items.cpInstance.instanceIP);
					items.selectedAppUrl.url = url;
				}
				$scope.appUrlItem = {
					name: items.selectedAppUrl.name,
					url: items.selectedAppUrl.url
				};
				$modalInstance.dismiss($scope.appUrlItem);
			};
		}
	]);
})(angular);