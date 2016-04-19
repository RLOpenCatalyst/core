/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.orchestration', ['rl.ui.component.library', 'datatables', 'filter.currentTime', 'ngAnimate', 'ui.bootstrap', 'apis.workzone', 'ModalService', 'utility.array', 'workzonePermission', 'chefDataFormatter'])
		.controller('orchestrationCtrl', ['$scope', '$rootScope', '$modal', 'workzoneServices', 'confirmbox', 'arrayUtil', 'orchestrationPermission', 'workzoneUIUtils', function($scope, $rootScope, $modal, workzoneServices, confirmbox, arrayUtil, orchestrationPerms, workzoneUIUtils) {
			var _permSet = {
				createTask: orchestrationPerms.createTask(),
				editTask: orchestrationPerms.editTask(),
				deleteTask: orchestrationPerms.deleteTask()
			};
			$scope.perms = _permSet;
			var helper = {
				orchestrationLogModal: function(id,historyId,taskType) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
						controller: 'orchestrationLogCtrl as orchLogCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									taskId: id,
									historyId: historyId,
									taskType: taskType
								};
							}
						}
					});
				}
			};
			angular.extend($scope, {
				execute: function(task) {
						if (task.taskConfig.parameterized && task.taskConfig.parameterized.length) {
							$modal.open({
								animation: true,
								templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/runParamConfig.html',
								controller: 'runParamConfigCtrl',
								backdrop: 'static',
								keyboard: false,
								resolve: {
									items: function() {
										return angular.extend([], task.taskConfig.parameterized);
									}
								}
							}).result.then(function(selectedItems) {
								var choiceParam = {};
								var p = selectedItems;
								for (var i = 0; i < p.length; i++) {
									choiceParam[p[i].name] = p[i].defaultValue[0];
								}
								workzoneServices.runTask(task._id, {
									"choiceParam": choiceParam
								}).then(function(response) {
									helper.orchestrationLogModal(task._id,response.data.historyId,task.taskType);
									$rootScope.$emit('WZ_REFRESH_ENV');
								});
							}, function() {
								console.log("Dismiss at " + new Date());
							});
						} else {
							//This includes chef,composite and puppet
							var modalOptions = {
								closeButtonText: 'Cancel',
								actionButtonText: 'Ok',
								actionButtonStyle: 'cat-btn-update',
								headerText: 'Confirmation',
								bodyText: 'Are you sure you want to execute this Job?'
							};

							confirmbox.showModal({}, modalOptions).then(function() {
								workzoneServices.runTask(task._id).then(function(response) {
									helper.orchestrationLogModal(task._id,response.data.historyId,task.taskType);
								});
								$rootScope.$emit('WZ_REFRESH_ENV');
							}, function(response) {
								alert('error:: ' + response.toString());
							});
						}
					},
				getHistory: function(task) {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationHistory.html',
						controller: 'orchestrationHistoryCtrl',
						backdrop: 'static',
						keyboard: false,
						size: 'lg',
						resolve: {
							items: function() {
								return task;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				deleteTask: function(orchestrationObj) {
					var modalOptions = {
						closeButtonText: 'Cancel',
						actionButtonText: 'Delete',
						actionButtonStyle: 'cat-btn-delete',
						headerText: 'Delete Task',
						bodyText: 'Are you sure you want to delete this task?'
					};
					confirmbox.showModal({}, modalOptions).then(function() {
						workzoneServices.deleteTask(orchestrationObj._id).then(function(response) {
							if (response.data.deleteCount.ok) {
								// $scope.tasks = arrayUtil.deleteObjectById($scope.tasks, orchestrationObj._id);
								$rootScope.$emit('WZ_REFRESH_ENV');
							}
						}, function(data) {
							alert('error:: ' + data.toString());
						});
					});
				},
				viewNodes: function(orchestrationObj) {
					var getInstance = workzoneServices.postRetrieveDetailsForInstanceNames(orchestrationObj.taskConfig.nodeIds);
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/viewNodes.html',
						controller: 'viewNodesCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return getInstance;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				assignedRunList: function(orchestrationObj) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/assignNodes.html',
						controller: 'assignNodesCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return orchestrationObj;
							}
						}
					}).result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {

					});
				},
				createNewTask: function(type) {
					$modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/newTask.html',
						controller: 'newTaskCtrl',
						backdrop: 'static',
						keyboard: false,
						size: 'lg',
						resolve: {
							items: function() {
								return type;
							}
						}
					}).result.then(function(taskName) {
						if (type === 'new') {
							$rootScope.globalSuccessMessage = 'New Job ' + taskName + ' created successfully';
						} else {
							$rootScope.globalSuccessMessage = taskName + ' has been updated successfully';
						}
						$('#globalSuccessMessage').animate({
							top: '0'
						}, 1000);
						setTimeout(function() {
							$('#globalSuccessMessage').animate({
								top: '-70px'
							}, 500);
						}, 5000);
					}, function() {
					});
				}
			});

			$rootScope.$on('WZ_ENV_CHANGE_START', function() {
				$scope.isOrchestrationPageLoading = true;
				$scope.tasks = [];
			});
			$rootScope.$on("CREATE_NEW_JOB", function(){
				$scope.createNewTask('new');
			});
			$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				var tasks = data.tasks;
				$scope.tasks = tasks;
				$scope.isOrchestrationPageLoading = false;
				workzoneUIUtils.makeTabScrollable('orchestrationPage');
			});
		}]);
})(angular);