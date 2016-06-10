/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	'use strict';
	angular.module('workzone.orchestration')
		.controller('newTaskCtrl', ['chefSelectorComponent', '$scope', '$modalInstance', 'items', '$modal', 'arrayUtil', 'workzoneServices', 'responseFormatter', '$rootScope', '$q', function (chefSelectorComponent, $scope, $modalInstance, items, $modal, arrayUtil, workzoneServices, responseFormatter, $rootScope, $q) {
			
            $scope.role={
             name : ''   
            };

            $scope.isNewTaskPageLoading = true;
			$scope.chefrunlist = [];
			$scope.cookbookAttributes = [];
			$scope.toggleAll = function() {
				var toggleStatus = $scope.isAllSelected;
				angular.forEach($scope.chefInstanceList, function(itm){ itm._isNodeSelected = toggleStatus; });

			};
			$scope.optionToggled = function(){
				$scope.isAllSelected = $scope.chefInstanceList.every(function(itm){ return  itm._isNodeSelected; })
			};
			//default values for new task
			angular.extend($scope, {
				taskTypes: {
					'chef':{name:'Chef'},
					'jenkins':{name:'Jenkins'},
					'puppet':{name:'Puppet'},
					'composite':{name:'Composite'},
					'script':{name:'Script'}
				},
				parentItems:items,
				updateCookbook: function () {
					if ($scope.chefInstanceList.length || $scope.chefBluePrintList.length) {
						$modal.open({
							templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationUpdateChefRunlist.html',
							controller: 'orchestrationUpdateChefRunlistCtrl',
							backdrop: 'static',
							keyboard: false,
							resolve : {
								cookbookRunlistAttr: function(){
									return {
										chefrunlist:$scope.chefrunlist,
										attributes:$scope.cookbookAttributes
									};
								}
							}
						}).result.then(function (selectedCookBooks) {
							$scope.editRunListAttributes = false;
							$scope.chefrunlist = selectedCookBooks.list;
							$scope.cookbookAttributes = selectedCookBooks.cbAttributes;
						}, function () {
							console.log('Dismiss time is ' + new Date());
						});
					}
				},
				changeJobURL: function () {
					if($scope.jenkinsServerSelect && $scope.jenkinJobSelected){
						workzoneServices.getJenkinsJobDetails($scope.jenkinsServerSelect, $scope.jenkinJobSelected).then(function (response) {
							var data;
							if (response.data) {
								data = response.data;
							} else {
								data = response;
							}
							$scope.jobUrl = data.url;
						}); 
					}
				},
				changeJobList: function () {
					if ($scope.jenkinsServerSelect) {
						workzoneServices.getJenkinsServerJobList($scope.jenkinsServerSelect).then(function (response) {
							if (response.data) {
								$scope.jenkinServerJobList = response.data;
							} else {
								$scope.jenkinServerJobList = response;
							}
						});
					}
				},
				isChefNodeAvailable: function (id) {
					if (!$scope.isEditMode) {
						return false;
					} else if ($scope.taskType === "chef") {
						return arrayUtil.isValueAvailable(items.taskConfig.nodeIds, id);
					}
				},
				isPuppetNodeAvailable: function (id) {
					if (!$scope.isEditMode) {
						return false;
					} else {
						return arrayUtil.isValueAvailable(items.taskConfig.nodeIds, id);
					}
				},
				addJenkinsParams: function () {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/addJenkinsParams.html',
						controller: 'addJenkinsParamsCtrl',
						backdrop: 'static',
						keyboard: false
					}).result.then(function (addJenkinsParams) {
						$scope.jenkinsParamsList.push(addJenkinsParams);
					}, function () {
						console.log('Dismiss time is ' + new Date());
					});
				},
				removeJenkinsParams: function (params) {
					var idx = $scope.jenkinsParamsList.indexOf(params);
					$scope.jenkinsParamsList.splice(idx,1);
				},
				removeJobLink: function (jobLink) {
					var idx = $scope.jobResultURL.indexOf(jobLink);
					$scope.jobResultURL.splice(idx,1);
				},
				openAddJobLink: function (type) {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/addJobLinks.html',
						controller: 'addJobLinksCtrl',
						backdrop: 'static',
						keyboard: false,
						width: '600px',
						resolve: {
							items: function () {
								return type;
							}
						}
					}).result.then(function (addJobLink) {
						//adding the job link in the main list.
						$scope.jobResultURL.push(addJobLink);

					}, function () {
						console.log('Dismiss time is ' + new Date());
					});
				},
				postNewTask : function(taskObj){
				//new task creation.
					var reqBody = {
						taskData: taskObj
					};
					workzoneServices.postNewTask(reqBody).then(function () {
						items = reqBody.taskData;
						$rootScope.$emit('WZ_ORCHESTRATION_SHOW_LATEST');
						$rootScope.$emit('GET_ALL_TASK');
                        $scope.taskSaving = false;
						$modalInstance.close(items);
					});
				},
				updateTask : function(taskObj){
					//update task.
					var reqBody = {
						taskData: taskObj
					};
					workzoneServices.updateTask(reqBody, $scope.id).then(function () {
						items = reqBody.taskData;
						$rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                        $scope.taskSaving = false;
						$modalInstance.close(items);
					});
				},
				setFile : function(element) {
					$scope.$apply(function($scope) {
						$scope.currentFileMetadata = element.files[0];
					});
				},
				ok: function () {
                    $scope.taskSaving = true;
					//these values are common across all task types
					var taskJSON = {
						taskType: $scope.taskType,
						name: $scope.name,
						description: $scope.description,
					};
					//checking for name of the task
					if (!taskJSON.name.trim()) {
						alert('Please enter the name of the task.');
                        $scope.taskSaving = false;
						return false;
					}
					//validating the task selections values and taking selected values from chef components
					if ($scope.taskType === "composite") {
						taskJSON.assignTasks = [];
						var selectedList = compositeSelector.getSelectorList();
						if (selectedList && selectedList.length) {
							for (var i = 0; i < selectedList.length; i++) {
								taskJSON.assignTasks.push(selectedList[i].data._id);
							}
						} else {
							alert('please select atleast one job');
                            $scope.taskSaving = false;
							return false;
						}
					}
					/*This will get the values in order to create chef type task and check for any chef node selections*/
					if ($scope.taskType === "chef") {
						taskJSON.nodeIds = [];
						taskJSON.blueprintIds = '';
                        taskJSON.role = $scope.role.name;
						for (var ci = 0; ci < $scope.chefInstanceList.length; ci++) {
							if ($scope.chefInstanceList[ci]._isNodeSelected) {
								taskJSON.nodeIds.push($scope.chefInstanceList[ci]._id);
							}
						}
						for(var bi = 0; bi < $scope.chefBluePrintList.length; bi++){
							if ($scope.chefBluePrintList[bi]._isBlueprintSelected) {
								taskJSON.blueprintIds=$scope.chefBluePrintList[bi]._id;
							}
						}

						if (!taskJSON.nodeIds.length && !taskJSON.blueprintIds && !taskJSON.role ) {
							alert('Please select a node or blueprint or role');
                            $scope.taskSaving = false;
							return false;
						}
						if (taskJSON.nodeIds.length && taskJSON.blueprintIds) {
							alert('Please choose either nodes or blueprints or role, not all');
                            $scope.taskSaving = false;
							return false;
						}

                        if (taskJSON.nodeIds.length && taskJSON.role) {
                            alert('Please choose either nodes or blueprints or role, not all');
                            $scope.taskSaving = false;
                            return false;
                        }

                        if (taskJSON.blueprintIds.length && taskJSON.role) {
                            alert('Please choose either nodes or blueprints or role, not all');
                            $scope.taskSaving = false;
                            return false;
                        }

						taskJSON.runlist = responseFormatter.formatSelectedChefRunList($scope.chefrunlist);
						taskJSON.attributes = responseFormatter.formatSelectedCookbookAttributes($scope.cookbookAttributes);
					}
					/*This will get the values in order to create puppet type task and check for any puppet node selections*/
					if ($scope.taskType === "puppet") {
						taskJSON.nodeIds = [];
						for (var pi = 0; pi < $scope.puppetInstanceList.length; pi++) {
							if ($scope.puppetInstanceList[pi]._isNodeSelected) {
								taskJSON.nodeIds.push($scope.puppetInstanceList[pi]._id);
							}
						}
						if (!taskJSON.nodeIds.length) {
							alert('Please select atleast one puppet node');
                            $scope.taskSaving = false;
							return false;
						}
					}
					if ($scope.taskType === "jenkins") {
						taskJSON.jenkinsServerId = $scope.jenkinsServerSelect;
						if (!taskJSON.jenkinsServerId.length) {
							alert('Please select the Jenkins Server');
                            $scope.taskSaving = false;
							return false;
						}
						taskJSON.autoSyncFlag = $scope.autoSync.flag;
						taskJSON.jobName = $scope.jenkinJobSelected;
						if (!taskJSON.jobName.length) {
							alert('Please select one Job');
                            $scope.taskSaving = false;
							return false;
						}
						taskJSON.jobURL = $scope.jobUrl;
						if (!taskJSON.jobURL.length) {
							alert('No Job Url');
                            $scope.taskSaving = false;
							return false;
						}
						taskJSON.isParameterized = $scope.isParameterized.flag;
						taskJSON.jobResultURL = $scope.jobResultURL;
						//first time execute will get result from jobResultURLPattern.
						taskJSON.jobResultURLPattern = taskJSON.jobResultURL;
						taskJSON.parameterized = $scope.jenkinsParamsList;
					}
					//if task type is script
					if ($scope.taskType === "script") {
						taskJSON.nodeIds = [];
						for (var si = 0; si < $scope.chefInstanceList.length; si++) {
							if ($scope.chefInstanceList[si]._isNodeSelected) {
								taskJSON.nodeIds.push($scope.chefInstanceList[si]._id);
							}
						}
						if (!taskJSON.nodeIds.length) {
							alert('Please select a node');
                            $scope.taskSaving = false;
							return false;
						}
						if($scope.scriptFile){//will be true if a file chosen by user 
							var formdata = new FormData();
							formdata.append('file',  $scope.scriptFile);
							workzoneServices.postFileUpload(formdata,{transformRequest: angular.identity,headers: {'Content-Type': undefined}}).then(function(response){
								var scriptFile = response.data;
								taskJSON.scriptFileName = scriptFile.filename;//wrong name field in api, it contains generated file id.
								if ($scope.isEditMode) {
									$scope.updateTask(taskJSON);            
								}else{
									$scope.postNewTask(taskJSON);             
								}
							});
						}
						else{
							if ($scope.isEditMode) {
								taskJSON.scriptFileName = items.taskConfig.scriptFileName;
								$scope.updateTask(taskJSON);            
							}
						}
					}
					//checking whether its a update or a new task creation
					var type = $scope.taskType;
					if(type === "chef" || type === "jenkins" || type === "puppet" || type === "composite"){
						if ($scope.isEditMode) {
							$scope.updateTask(taskJSON);
						} else {
							$scope.postNewTask(taskJSON);
						}
					}
					$rootScope.createChefJob=false;
				},
				cancel: function () {
					$rootScope.createChefJob=false;
					$modalInstance.dismiss('cancel');
				}
			});
			$scope.name = "";
			$scope.taskType = "chef";//default Task type selection;
			$scope.isEditMode = false;//default edit mode is false;
            $scope.taskSaving = false;//to disable submit button, dfault false
			$scope.autoSync = {
				flag: false
			};
			$scope.isParameterized = {
				flag: false
			};
			/*in backend at the time of edit of task the jobResultUrlPattern 
			was going as null. So there was in issue with the links disappearing.*/
			$scope.jobResultURLPattern = [];
			$scope.jobResultURL = [];
			$scope.jenkinsParamsList = [];
			$scope.jenkinsServerSelect = '';
			$scope.jenkinJobSelected = '';
			$scope.description = '';
			$scope.chefInstanceList = [];
			$scope.chefBluePrintList = [];
			$scope.puppetInstanceList = [];
			$scope.cookbookAttributes = [];
			$scope.editRunListAttributes = false;
			var compositeSelector;
			workzoneServices.getEnvironmentTaskList().then(function (response) {
				var data, selectorList = [],
						optionList = [];

				if (response.data) {
					data = response.data;
				} else {
					data = response;
				}
				if (items.taskType && items.taskType === "composite") {
					for (var j = 0; j < items.taskConfig.assignTasks.length; j++) {
						for (var i = 0; i < data.length; i++) {    
							if (items.taskConfig.assignTasks[j] === data[i]._id) {
								selectorList.push(data[i]);
							}
						}
					}
				} else {
					selectorList = [];
				}
				optionList = data;
				var factory = chefSelectorComponent.getComponent;
				compositeSelector = new factory({
					scopeElement: '#component_for_composite',
					optionList: responseFormatter.formatTaskList(optionList),
					selectorList: responseFormatter.formatTaskList(selectorList),
					isSortList: true,
					isSearchBoxEnable: false,
					isOverrideHtmlTemplate: true,
					isExcludeDataFromOption: true
				});
				$scope.isNewTaskPageLoading = false;
			});
            $scope.isTargetTypesLoading = true;
			var allInstances = workzoneServices.getCurrentEnvInstances();
			var allBlueprints = workzoneServices.getBlueprints();
            var allRunlist = workzoneServices.getCookBookListForOrg();
			$q.all([allInstances,allBlueprints,allRunlist]).then(function(promiseObjs) {
                $scope.isTargetTypesLoading = false;
				var instances = promiseObjs[0].data;
				var blueprints = promiseObjs[1].data;
                var roles = Object.keys(promiseObjs[2].data.roles);
                console.log(roles);
				/*Identifying the chef nodes and adding a flag for identifying the selection in the angular checkbox selection*/
				if ($scope.taskType === "chef") {
					if($scope.isEditMode){

                        if(items.taskConfig && items.taskConfig.role) {
                            $scope.role.name = items.taskConfig.role;
                        }



						$scope.editRunListAttributes = true;
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), items.taskConfig.nodeIds);
						$scope.isNewTaskPageLoading = false;
						$scope.chefBluePrintList = responseFormatter.identifyAvailableBlueprint(responseFormatter.getBlueprintList(blueprints), items.blueprintIds);
						$scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(items.taskConfig.runlist);
						$scope.cookbookAttributes = responseFormatter.formatSavedCookbookAttributes(items.taskConfig.attributes);
						$scope.chefrunlist = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
						
                        $scope.chefRoleList = roles;

                       
                        if (items.blueprintIds.length){
							$scope.targetType="blueprint";
						}else if(items.taskConfig && items.taskConfig.nodeIds && items.taskConfig.nodeIds.length){
							$scope.targetType="instance";
						} else {
                            $scope.targetType="role";
                        }
					}else{
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), []);
						$scope.isNewTaskPageLoading = false;
						$scope.chefBluePrintList = responseFormatter.identifyAvailableBlueprint(responseFormatter.getBlueprintList(blueprints), []);
						$scope.chefRoleList = roles;
                        $scope.targetType="instance";
					}
				}
				/*Identifying the Puppet nodes and adding a flag for identifying the selection in the angular checkbox selection*/
				if ($scope.isEditMode && $scope.taskType === "puppet") {
					if ($scope.isEditMode) {
						$scope.puppetInstanceList = responseFormatter.identifyAvailablePuppetNode(responseFormatter.getPuppetList(instances), items.taskConfig.nodeIds);
						$scope.isNewTaskPageLoading = false;
					} else {
						$scope.puppetInstanceList = responseFormatter.identifyAvailablePuppetNode(responseFormatter.getPuppetList(instances), []);
					}
				}
				/*Identifying the nodes and checking for task type to be script*/
				if ($scope.taskType === "script") {
					if($scope.isEditMode){
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), items.taskConfig.nodeIds);
						$scope.isNewTaskPageLoading = false;
						$scope.targetType="instance";
						$scope.scriptFileNameEdit = items.taskConfig.scriptFileName.split('_')[1] || 'invalid filename';
					}else{
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), []);
						$scope.isNewTaskPageLoading = false;
						$scope.targetType="instance";
					}
				}
				$scope.optionToggled();
			});
			workzoneServices.getJenkinsServerList().then(function (response) {
				var data;
				if (response.data) {
					data = response.data;
				} else {
					data = response;
				}
				$scope.jenkinsServerList = responseFormatter.formatJenkinsServerList(data);

				if ($scope.isEditMode && items.taskType === "jenkins") {
					$scope.jenkinsServerSelect = items.taskConfig.jenkinsServerId;
					$scope.isNewTaskPageLoading = false;
				}
				$scope.changeJobList();
				$scope.changeJobURL();
			});
			// if new task creation then we will give chef as default selection.
			if (!(typeof items === "string" && items === "new")) {
				/*common properties across all task*/
				$scope.isEditMode = true;
				$scope.id = items._id;
				$scope.description = items.description;
				$scope.taskType = items.taskType;
				$scope.name = items.name;
				//properties specific to jenkins
				if (items.taskType === "jenkins") {
					$scope.jobUrl = items.taskConfig.jobURL;
					$scope.autoSync.flag = items.taskConfig.autoSyncFlag === "false" ? false : true;
					$scope.isParameterized.flag = items.taskConfig.isParameterized;
					$scope.jobResultURL = items.taskConfig.jobResultURL;
					$scope.jenkinsParamsList = items.taskConfig.parameterized;
					$scope.jenkinJobSelected = items.taskConfig.jobName;
				}
			}
		}
	]);
})(angular);
