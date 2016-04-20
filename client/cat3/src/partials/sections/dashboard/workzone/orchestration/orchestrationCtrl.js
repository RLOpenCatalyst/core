/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('workzone.orchestration', ['rl.ui.component.library', 'datatables', 'filter.currentTime', 'ngAnimate', 'ui.bootstrap', 'apis.workzone', 'ModalService', 'utility.array', 'workzonePermission', 'chefDataFormatter', 'utility.pagination'])
		.controller('orchestrationCtrl', ['$scope', '$rootScope', '$modal', 'workzoneServices', 'confirmbox', 'arrayUtil', 'orchestrationPermission', 'workzoneUIUtils', 'paginationUtil', '$timeout', function($scope, $rootScope, $modal, workzoneServices, confirmbox, arrayUtil, orchestrationPerms, workzoneUIUtils, paginationUtil, $timeout) {
			var _permSet = {
				createTask: orchestrationPerms.createTask(),
				editTask: orchestrationPerms.editTask(),
				deleteTask: orchestrationPerms.deleteTask()
			};
			$scope.perms = _permSet;


			$scope.isOrchestrationPageLoading = true;
			var gridBottomSpace = 60;
			$scope.gridHeight = workzoneUIUtils.makeTabScrollable('orchestrationPage')-gridBottomSpace;
			$scope.paginationParams={
					pages:{
						page:1,
						pageSize:5
					},
					sort:{
						field:'name',
						direction:'desc'
					}
				};
				$scope.tabData = [];
			
			$scope.initGrids = function(){
				
				
				
				$scope.orcheGridOptions = {
					data : 'tabData',
					paginationPageSizes: [5,10,15],
					paginationPageSize: $scope.paginationParams.pages.pageSize,
					paginationCurrentPage:$scope.paginationParams.pages.page,
					enableColumnMenus:false,
					enableScrollbars :true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 1,
					useExternalPagination: true,
					useExternalSorting: true,
					columnDefs : [
						{ name:'Job Type',cellTemplate:'<img src="images/orchestration/jenkins.png" ng-show="row.entity.taskType==\'jenkins\'" alt="row.entity.taskType" class="jenkins-img" />'
						+'<img src="images/orchestration/chef.png" ng-show="row.entity.taskType==\'chef\'" alt="row.entity.taskType" class="jenkins-img" />'
						+'<img src="images/orchestration/composite.jpg" ng-show="row.entity.taskType==\'composite\'" alt="{{row.entity.taskType}}" class="jenkins-img" />'
						+'<img src="images/global/puppet.png" ng-show="row.entity.taskType==\'puppet\' " alt="{{row.entity.taskType}}" class="jenkins-img">',cellTooltip: true},
						{ name:'Name',field:'name',cellTooltip: true},
						{ name:'Job Description',field:'description',cellTooltip: true},
						{ name:'Job Links', cellTemplate:'<div>'
						+'<span ng-show="row.entity.taskType===\'chef\'">'
						+'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'
						+'<span title="Assign Nodes" class="fa fa-list-ul chef-assign-nodes cursor" ng-click="grid.appScope.assignedRunList(row.entity);"></span>'
						+'</span>'
						+'<span ng-show="row.entity.taskType===\'jenkins\'">'
						+'<a target="_blank" title="Jenkins" ng-href="http://{{row.entity.taskConfig.jobURL}}">'
						+'<img class="chefImage-size" src="images/orchestration/joburl.jpg" /> </a>'
						+'</span>'
						+'<span ng-show="row.entity.taskType===\'composite\'"> NA </span>'
						+'<span ng-show="row.entity.taskType==\'puppet\'">'
						+'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'
						+'</span>'
						+'</div>' ,cellTooltip: true},
						{ name:'Execute', cellTemplate:'<span title="Execute" class="fa fa-play btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.execute(row.entity)"></span>', cellTooltip: true},
						{ name:'History', cellTemplate:'<span title="History" class="fa fa-header btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.getHistory(row.entity)"></span>', cellTooltip: true},
						{ name:'Last Run', cellTemplate:'<span>{{row.entity.lastRunTimestamp  | timestampToCurrentTime}}</span>', cellTooltip: true},
						{ name:'Action', cellTemplate:'<span title="Edit" class="fa fa-pencil btn btn-info pull-left tableactionbutton btnEditTask btn-sg white" ng-click="grid.appScope.createNewTask(row.entity)"></span>'
						+'<span  title="Delete" class="fa fa-trash-o btn btn-danger pull-left btn-sg tableactionbutton btnDeleteTask white" ng-click="grid.appScope.deleteTask(row.entity)" ng-show="grid.appScope.perms.deleteTask;"></span>', cellTooltip: true}
						],
					onRegisterApi: function(gridApi) {
						$scope.gridApi = gridApi;
      					$scope.gridApi.core.on.sortChanged( $scope, function( grid, sortColumns ) {
							console.log(sortColumns[0].sort.direction);
							$scope.paginationParams.sort = {
								field: sortColumns[0].field,
								direction: sortColumns[0].sort.direction
							};
							$scope.taskListGridView();
						});

				      //Pagination for page and pageSize
					$scope.gridApi.pagination.on.paginationChanged($scope, function(newPage, pageSize) {
						$scope.paginationParams.pages = {
							page: newPage,
							pageSize: pageSize
						};
						$scope.taskListGridView();
						/*workzoneServices.gettasksList($scope.requestParams,$scope.paginationParams).then(function(result){
							$timeout(function(){
								$scope.orcheGridOptions.totalItems = result.data.metaData.totalRecords;
								$scope.tabData = result.data.tasks;
							}, 100);
						});*/
						/*workzoneServices.getAllTaskList().then(function(result){
							$scope.orcheGridOptions.data=result.data;
						});*/
					});
					}
				};
			};
			/*$scope.gridOptions = {};
			$scope.paginationParams={
				pages:{
					page:1,
					pageSize:5
				},
				sort:{
					field:'name',
					direction:'desc'
				}
			};
			$scope.gridSettings= function(requestParams){

				var gridOption={
					paginationPageSizes: [5, 10, 15, 20],
					paginationPageSize: $scope.paginationParams.pages.pageSize,
					paginationCurrentPage:$scope.paginationParams.pages.page,
					enableColumnMenus:false,
					enableScrollbars :true,
					enableHorizontalScrollbar: 0,
					enableVerticalScrollbar: 1,
					useExternalPagination: true,
					useExternalSorting: true
				};
				gridOption.data=[];
				gridOption.columnDefs = [
					{ name:'Job Type',cellTemplate:'<img src="images/orchestration/jenkins.png" ng-show="row.entity.taskType==\'jenkins\'" alt="row.entity.taskType" class="jenkins-img" />'
					+'<img src="images/orchestration/chef.png" ng-show="row.entity.taskType==\'chef\'" alt="row.entity.taskType" class="jenkins-img" />'
					+'<img src="images/orchestration/composite.jpg" ng-show="row.entity.taskType==\'composite\'" alt="{{row.entity.taskType}}" class="jenkins-img" />'
					+'<img src="images/orchestration/puppet.png" ng-show="row.entity.taskType==\'puppet\' " alt="{{row.entity.taskType}}" class="jenkins-img">',cellTooltip: true},
					{ name:'Name',field:'name',cellTooltip: true},
					{ name:'Job Description',field:'description',cellTooltip: true},
					{ name:'Job Links', cellTemplate:'<div>'
					+'<span ng-show="row.entity.taskType===\'chef\'">'
					+'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'
					+'<span title="Assign Nodes" class="fa fa-list-ul chef-assign-nodes cursor" ng-click="grid.appScope.assignedRunList(row.entity);"></span>'
					+'</span>'
					+'<span ng-show="row.entity.taskType===\'jenkins\'">'
					+'<a target="_blank" title="Jenkins" ng-href="http://{{row.entity.taskConfig.jobURL}}">'
					+'<img class="chefImage-size" src="images/orchestration/joburl.jpg" /> </a>'
					+'</span>'
					+'<span ng-show="row.entity.taskType===\'composite\'"> NA </span>'
					+'<span ng-show="row.entity.taskType==\'puppet\'">'
					+'<span title="View Nodes" class="fa fa-sitemap chef-view-nodes cursor" ng-click="grid.appScope.viewNodes(row.entity);"></span>'
					+'</span>'
					+'</div>' ,cellTooltip: true},
					{ name:'Execute', cellTemplate:'<span title="Execute" class="fa fa-play btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.execute(row.entity)"></span>', cellTooltip: true},
					{ name:'History', cellTemplate:'<span title="History" class="fa fa-header btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.getHistory(row.entity)"></span>', cellTooltip: true},
					{ name:'Last Run', cellTemplate:'<span>{{row.entity.lastRunTimestamp  | timestampToCurrentTime}}</span>', cellTooltip: true},
					{ name:'Action', cellTemplate:'<span title="Edit" class="fa fa-pencil btn btn-info pull-left tableactionbutton btnEditTask btn-sg white" ng-click="grid.appScope.createNewTask(row.entity)"></span>'
					+'<span  title="Delete" class="fa fa-trash-o btn btn-danger pull-left btn-sg tableactionbutton btnDeleteTask white" ng-click="grid.appScope.deleteTask(row.entity)"></span>', cellTooltip: true}
				];
				gridOption.onRegisterApi= function(gridApi) {

				  //Sorting for sortBy and sortOrder
			      gridApi.core.on.sortChanged($scope, function(grid, sortColumns) {
			      	$scope.paginationParams.sort={
			      		field:sortColumns[0].field,
			      		direction: sortColumns[0].sort.direction
			      	};
			      	getOrchestrationList();
			      });

			      //Pagination for page and pageSize
			      gridApi.pagination.on.paginationChanged($scope, function (newPage, pageSize) {
		      		$scope.paginationParams.pages={
			      		page:newPage,
			      		pageSize:pageSize
		      		};
		      		getOrchestrationList();
			      });
			    }
				
	      		function getOrchestrationList(){
	      			$scope.isOrchestrationTableLoading = true;
	      			workzoneServices.gettasksList(requestParams,$scope.paginationParams).then(function (response) {
						gridOption.totalItems = response.data.metaData.totalRecords;
						gridOption.data = response.data.tasks;
						
						$scope.tasks = gridOption.data;
						$scope.isOrchestrationPageLoading = false;
						$scope.isOrchestrationTableLoading = false;
						
	                    workzoneUIUtils.makeTabScrollable('orchestrationPage');
					});
	      		}
	      		getOrchestrationList();

				$scope.gridOptions= gridOption;
			};*/













			var helper = {
				orchestrationLogModal: function(id,historyId,taskType) {
					var modalInstance = $modal.open({
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
								}
							}
						}
					});
				}
			};
			
			angular.extend($scope, {
				taskListGridView :function(){
					$scope.isOrchestrationPageLoading = true;
					//$scope.tabData = [];
					// service
					workzoneServices.gettasksList($scope.requestParams,$scope.paginationParams).then(function(result){

						/*$scope.orcheGridOptions.totalItems = result.data.metaData.totalRecords;
						$scope.tabData = result.data.tasks;*/
						$timeout(function(){
							$scope.orcheGridOptions.totalItems = result.data.metaData.totalRecords;
							$scope.tabData = result.data.tasks;
						}, 100);
						// $scope.orcheGridOptions.totalItems = result.data.metaData.totalRecords;

						
						// $scope.tabData = result.data.tasks;

						$scope.isOrchestrationPageLoading = false;
						
					});
					
				},
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
							$scope.taskListGridView();
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
			$scope.setFirstPageView = function(){
				$scope.orcheGridOptions.paginationCurrentPage = $scope.paginationParams.pages.page = 1;
				//TODO: Set sortBy and sortField to controller defaults;
				//$scope.tasks = data.tasks;
			};
			$rootScope.$on('WZ_ENV_CHANGE_START', function(event, requestParams) {
				//$scope.isOrchestrationPageLoading = true;
				$scope.requestParams=requestParams;
				
				$scope.initGrids();
				$scope.setFirstPageView();
				$scope.taskListGridView();

			});
			$rootScope.$on('WZ_REFRESH_ORCHESTRATIONS', function(event) {
				$scope.setFirstPageView();
			});
			$rootScope.$on('WZ_TAB_VISIT', function(event, tabName){
				if(tabName == 'Orchestration'){
					//$scope.initGrids();
					//$scope.gridApi.core.refresh();
					//$("#orchestrationPage .scrollContent").height($("#orchestrationPage .scrollContent").height() - 1);
					//$scope.gridHeight = $scope.gridHeight - 1;
					//$scope.taskListGridView();
					//$scope.isInstancePageLoading = true;
					var tableData = $scope.tabData;
					$scope.tabData = [];
					$timeout(function(){
						$scope.tabData = tableData;
						//$scope.isInstancePageLoading = false;
					}, 500);
				}
			});
			$rootScope.$on('WZ_ENV_CHANGE_END', function(event, requestParams, data) {
				//console.log("Arab info::::",data);

				/*$scope.requestParams=requestParams;
				//$scope.tasks = data.tasks;
				$scope.initGrids();
				$scope.taskListGridView();*/
				//$scope.tasks = [];


				/*var tasks = data.tasks;
				$scope.tasks = tasks;*/
				
				// workzoneUIUtils.makeTabScrollable('orchestrationPage');
			});
			workzoneUIUtils.makeTabScrollable('orchestrationPage');
			
		}]);
})(angular);