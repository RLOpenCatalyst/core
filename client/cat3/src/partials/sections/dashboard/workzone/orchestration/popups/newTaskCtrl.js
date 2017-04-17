/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	'use strict';
	angular.module('workzone.orchestration')
		.controller('newTaskCtrl', ['chefSelectorComponent', '$scope', '$modalInstance', 'items', '$modal', 'arrayUtil', 'workzoneServices', 'responseFormatter', '$rootScope', '$q', 'genericServices', function (chefSelectorComponent, $scope, $modalInstance, items, $modal, arrayUtil, workzoneServices, responseFormatter, $rootScope, $q, genericServices) {

			$scope.role={
				name : ''
			};
			$scope.isNewTaskPageLoading = true;
			$scope.isScriptInstanceLoading = true;
			$scope.chefrunlist = [];
			$scope.cookbookAttributes = [];
			$scope.scriptParamShow = false;
			$scope.scriptSelectAll = false;
			$scope.scriptParamsObj = {};
			$scope.chefJenkScriptTaskObj = {};
			$scope.cronDetails = {};
			$scope.type = 'new';
			$scope.showAddTask = false;
			$scope.isSudo = false;
			$scope.botCategoryList = [];
			workzoneServices.getBotCategoryList().then(function (catList) {
	            $scope.botCategoryList=catList.data;
	        });
			$scope.toggleAll = function() {
				var toggleStatus = $scope.isAllSelected;
				angular.forEach($scope.chefInstanceList, function(itm){ itm._isNodeSelected = toggleStatus;});
			};
			$scope.botStatus = function() {
				if($scope.checkBotType){
					$scope.checkBotStatus = true;
				}else{
					$scope.checkBotStatus = false;
				}
			};
			$scope.optionToggled = function(){
				$scope.isAllSelected = $scope.chefInstanceList.every(function(itm){ return  itm._isNodeSelected; });
			};
			$scope.toggleAllScriptInstance = function() {
				var toggleStatusInstance = $scope.isAllInstanceScriptSelected;
				angular.forEach($scope.chefInstanceList, function(itm){ itm._isNodeSelected = toggleStatusInstance; });
			};
			$scope.optionInstanceToggled = function(){
				$scope.isAllInstanceScriptSelected = $scope.chefInstanceList.every(function(itm){ return  itm._isNodeSelected; });
			};
			$scope.toggleAllScripts = function() {
				var toggleStatusScript = $scope.isAllScriptSelected;
				angular.forEach($scope.scriptTaskList, function(itm){ itm._isScriptSelected = toggleStatusScript;});
			};
			$scope.optionScriptToggled = function() {
				$scope.isAllScriptSelected = $scope.scriptTaskList.every(function(itm){ return  itm._isScriptSelected; });
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
						genericServices.editRunlist($scope.chefrunlist,$scope.cookbookAttributes);
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
				changeNodeScriptList: function() {
					if($scope.scriptTypeSelelct !==""){
						workzoneServices.getScriptList($scope.scriptTypeSelelct).then(function (response) {
							var data;
							if (response.data) {
								data = response.data;
							} else {
								data = response;
							}
							$scope.scriptSelectAll = true;
							if ($scope.isEditMode && items.taskType === "script") {
								var isScriptChecked = [];
								for(var i =0;i<items.taskConfig.scriptDetails.length;i++){
									isScriptChecked.push(items.taskConfig.scriptDetails[i].scriptId);
									$scope.scriptTaskList = responseFormatter.identifyAvailableScript(data, isScriptChecked);
									$scope.scriptParamsObj[items.taskConfig.scriptDetails[i].scriptId] = items.taskConfig.scriptDetails[i].scriptParameters;
									$scope.isNewTaskPageLoading = false;
								}
							} else{
								$scope.scriptTaskList = responseFormatter.identifyAvailableScript(data,[]);
								$scope.isScriptInstanceLoading = false;
							}
						});
					}
				},
				addScriptParams: function (scriptObject) {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/addScriptParams.html',
						controller: 'addScriptParamsCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function () {
								return scriptObject;
							}
						}
					}).result.then(function (addScriptParams) {
						$scope.scriptParamsObj[scriptObject._id] = $scope.scriptParamsObj[scriptObject._id].concat(addScriptParams);
					}, function () {
						console.log('Dismiss time is ' + new Date());
					});
				},
				removeJenkinsParams: function (params) {
					var idx = $scope.jenkinsParamsList.indexOf(params);
					$scope.jenkinsParamsList.splice(idx,1);
				},
                botTypeList : function() {
                    workzoneServices.getBotTypeList().then(function (response) {
                        $scope.botTypeList = response;
                    });
                },
				removeScriptParams: function (scriptObject,params) {
					var idx = $scope.scriptParamsObj[scriptObject].indexOf(params);
					$scope.scriptParamsObj[scriptObject].splice(idx,1);
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
				showScriptParams : function(scriptObj){
					$scope.scriptParamShow = true;
					$scope.selectedScript = scriptObj;
					if(!$scope.scriptParamsObj[scriptObj._id]){
						$scope.scriptParamsObj[scriptObj._id] = [];
					}
				},
				addRemoveScriptTable : function(scriptObj){
					$scope.scriptParamShow = false;
					$scope.checkedScript = scriptObj;
					if(!$scope.checkedScript._isScriptSelected){
						$scope.scriptParamsObj[scriptObj._id] = [];
					}
				},
				selectTaskCheckbox: function(){
					if($scope._isEventSelected.flag) {
						$scope.showAddTask = true;
					} else {
						$scope.showAddTask = false;
					}
				},
				addTaskEvent : function() {
					$modal.open({
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/addChefJobEvent.html',
						controller: 'addChefJobEventCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function () {
								return {
									chefJenkScriptTaskObj:$scope.chefJenkScriptTaskObj,
									type:$scope.type
								};
							}
						}
					}).result.then(function (chefEventDetails) {
						$scope.chefJenkScriptTaskObj = chefEventDetails;
						var startTimeMinute,startTimeHour,dayOfWeek,selectedDayOfTheMonth,selectedMonth;
						startTimeMinute = $scope.chefJenkScriptTaskObj.startTimeMinute;
						startTimeHour = $scope.chefJenkScriptTaskObj.startTime;
						dayOfWeek = $scope.chefJenkScriptTaskObj.dayOfWeek;
						selectedDayOfTheMonth = $scope.chefJenkScriptTaskObj.selectedDayOfTheMonth;
						selectedMonth = $scope.chefJenkScriptTaskObj.monthOfYear;
						$scope.type = 'edit';
						
						$scope.repeatPattern = 'Repeat Every -' +  $scope.chefJenkScriptTaskObj.repeats;   
						$scope.cronDetails = {
							cronStartOn : $scope.chefJenkScriptTaskObj.cronStart,
							cronEndOn : $scope.chefJenkScriptTaskObj.cronEnd,
							cronRepeatEvery : $scope.chefJenkScriptTaskObj.repeatBy,
							cronFrequency: $scope.chefJenkScriptTaskObj.repeats,
							cronMinute:startTimeMinute,
							cronHour: startTimeHour,
							cronWeekDay:dayOfWeek,
							cronDate: selectedDayOfTheMonth,
							cronMonth: selectedMonth,
							cronYear: $scope.chefJenkScriptTaskObj.monthOfYear
						};
					}, function () {
						console.log('Dismiss time is ' + new Date());
					});
				},
				clearRoleSelection : function(){
					$scope.role.name = '';
				},
				clearBluePrintSelection : function(){
					for(var bi = 0; bi < $scope.chefBluePrintList.length; bi++){
						$scope.chefBluePrintList[bi]._isBlueprintSelected = false;
					}
				},
				ok: function () {
					//these values are common across all task types
					var taskJSON={};
					if($scope.checkBotType){
						taskJSON = {
							taskType: $scope.taskType,
							name: $scope.name,
							description: $scope.description,
							botType:$scope.botType,
							botCategory: $scope.botCategory,
						    shortDesc:$scope.shortDesc,
						    manualExecutionTime:$scope.manualExecutionTime,
							serviceDeliveryCheck:$scope.checkBotType
						};
						$scope.taskSaving = true;
					}else{
						taskJSON = {
							taskType: $scope.taskType,
							name: $scope.name,
							description: $scope.description
						};
						$scope.taskSaving = true;
					}
					//checking for name of the task
					if (!taskJSON.name.trim()) {
						$scope.inputValidationMsg='Please enter the name of the task.';
						$scope.taskSaving = false;
						return false;
					}
					//validating the task selections values and taking selected values from chef components
                    var selectedList ='';
					if ($scope.taskType === "composite") {
						taskJSON.assignTasks = [];
						selectedList = compositeSelector.getSelectorList();
						if (selectedList && selectedList.length) {
							for (var i = 0; i < selectedList.length; i++) {
								taskJSON.assignTasks.push(selectedList[i].data._id);
							}
						} else {
							$scope.inputValidationMsg='please select atleast one job';
							$scope.taskSaving = false;
							return false;
						}
					}
					if($scope.taskType === "chef" || $scope.taskType === "script") {
						taskJSON.nodeIds = [];
						taskJSON.executionOrder = $scope.isExecution.flag;
						taskJSON.isTaskScheduled = $scope._isEventSelected.flag;
						taskJSON.taskScheduler = $scope.cronDetails;
						selectedList = instanceSelector.getSelectorList();
						if (selectedList && selectedList.length) {
							for (var ii = 0; ii < selectedList.length; ii++) {
								taskJSON.nodeIds.push(selectedList[ii].data);
							}
						}
					}
					/*This will get the values in order to create chef type task and check for any chef node selections*/
					if ($scope.taskType === "chef") {
						
						taskJSON.blueprintIds = [];
						taskJSON.role = $scope.role.name;
						for(var bi = 0; bi < $scope.chefBluePrintList.length; bi++){
							if ($scope.chefBluePrintList[bi]._isBlueprintSelected) {
								taskJSON.blueprintIds.push($scope.chefBluePrintList[bi]._id);
							}
						}
						if (!taskJSON.nodeIds.length && !taskJSON.blueprintIds.length && !taskJSON.role ) {
							$scope.inputValidationMsg='Please select a node or blueprint or role';
							$scope.taskSaving = false;
							return false;
						}
						if (taskJSON.nodeIds.length && taskJSON.blueprintIds.length) {
							$scope.inputValidationMsg='Please choose either nodes or blueprints or role, not all';
							$scope.taskSaving = false;
							return false;
						}

						if (taskJSON.nodeIds.length && taskJSON.role) {
							$scope.inputValidationMsg='Please choose either nodes or blueprints or role, not all';
							$scope.taskSaving = false;
							return false;
						}

						if (taskJSON.blueprintIds.length && taskJSON.role) {
							$scope.inputValidationMsg='Please choose either nodes or blueprints or role, not all';
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
							$scope.inputValidationMsg='Please select atleast one puppet node';
							$scope.taskSaving = false;
							return false;
						}
					}
					if ($scope.taskType === "jenkins") {
						taskJSON.jenkinsServerId = $scope.jenkinsServerSelect;
						if (!taskJSON.jenkinsServerId.length) {
							$scope.inputValidationMsg='Please select the Jenkins Server';
							$scope.taskSaving = false;
							return false;
						}
						taskJSON.autoSyncFlag = $scope.autoSync.flag;
						taskJSON.jobName = $scope.jenkinJobSelected;
						if (!taskJSON.jobName.length) {
							$scope.inputValidationMsg='Please select one Job';
							$scope.taskSaving = false;
							return false;
						}
						taskJSON.jobURL = $scope.jobUrl;
						if (!taskJSON.jobURL.length) {
							$scope.inputValidationMsg='No Job Url';
							$scope.taskSaving = false;
							return false;
						}
						taskJSON.isParameterized = $scope.isParameterized.flag;
						taskJSON.jobResultURL = $scope.jobResultURL;
						//first time execute will get result from jobResultURLPattern.
						taskJSON.jobResultURLPattern = taskJSON.jobResultURL;
						taskJSON.parameterized = $scope.jenkinsParamsList;
						taskJSON.isTaskScheduled = $scope._isEventSelected.flag;
						taskJSON.taskScheduler = $scope.cronDetails;
					}
					//if task type is script
					if ($scope.taskType === "script") {
						taskJSON.scriptDetails = [];
						taskJSON.isSudo = $scope.isSudo;
						taskJSON.scriptTypeName = $scope.scriptTypeSelelct;
						if (!taskJSON.scriptTypeName.length) {
							$scope.inputValidationMsg='Please select one Script Type';
							$scope.taskSaving = false;
							return false;
						}
						
						for (var k = 0; k < $scope.scriptTaskList.length; k++) {
							if ($scope.scriptTaskList[k]._isScriptSelected) {
								var scriptId = $scope.scriptTaskList[k]._id;
								var obj = {
									scriptId: scriptId,
									scriptParameters:[]
								};
								if($scope.scriptParamsObj[scriptId]){
									obj.scriptParameters = $scope.scriptParamsObj[scriptId];
								}
								taskJSON.scriptDetails.push(obj);
							}
						}
						if (!taskJSON.scriptDetails.length) {
							$scope.inputValidationMsg = 'Please select a script';
							$scope.taskSaving = false;
							return false;
						}
					}
					
					//checking whether its a update or a new task creation
					if ($scope.isEditMode) {
						$scope.updateTask(taskJSON);
					} else {
						$scope.postNewTask(taskJSON);
					}
					$rootScope.createChefJob=false;
				},
				cancel: function () {
					$rootScope.createChefJob=false;
					$modalInstance.dismiss('cancel');
				}
			});
			$scope.name = "";
			$scope.shortDesc = "";
			$scope.manualExecutionTime = "";
			$scope.taskType = "chef";//default Task type selection;
			$scope.botType = "Task";//default Bot type selection;
			$scope.botCategory = 'Active Directory';
			$scope.isEditMode = false;//default edit mode is false;
			$scope.taskSaving = false;//to disable submit button, dfault false
			$scope.autoSync = {
				flag: false
			};
			$scope.isParameterized = {
				flag: false
			};
			$scope.isExecution = {
				flag: 'PARALLEL'
			};
			$scope._isEventSelected = {
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
			$scope.scriptTaskList = [];
			$scope.scriptTypeSelelct = '';
			$scope.chefBluePrintList = [];
			$scope.puppetInstanceList = [];
			$scope.editRunListAttributes = false;

			$rootScope.$on('WZ_ORCHESTRATION_REFRESH_CURRENT', function(event,reqParams) {
				if(reqParams) {
					$scope.chefrunlist = reqParams.list;
					$scope.cookbookAttributes = reqParams.cbAttributes;
				}
            });
			var compositeSelector,instanceSelector;
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
			$scope.isScriptNodesLoading = true;
			var allInstances = workzoneServices.getCurrentEnvInstances();
			$scope.allInstances=function(){
				allInstances.then(function (response) {
					var data, selectorList = [],
						optionList = [];
					if (response.data) {
						data = response.data;
					} else {
						data = response;
					}

					if (items.taskType && items.taskType === "chef" || items.taskType && items.taskType === "script") {
						for (var j = 0; j < items.taskConfig.nodeIds.length; j++) {
							for (var i = 0; i < data.length; i++) {
								if (items.taskConfig.nodeIds[j] === data[i]._id) {
									selectorList.push(data[i]);
								}
							}
						}
					} else {
						selectorList = [];
					}
					optionList = data;
					var factory = chefSelectorComponent.getComponent;
					instanceSelector = new factory({
						scopeElement: '.component_for_instances',
						optionList: responseFormatter.formatInstanceList(optionList),
						selectorList: responseFormatter.formatInstanceList(selectorList),
						isSortList: true,
						isSearchBoxEnable: false,
						isOverrideHtmlTemplate: true,
						isExcludeDataFromOption: true
					});
					$scope.isNewTaskPageLoading = false;
				});
			};
			 $scope.$watch('taskType', function() {
        		if($scope.taskType === 'chef' || $scope.taskType === 'script'){
					$scope.allInstances();
        		}
    		});

			var allBlueprints = workzoneServices.getBlueprints();
			var allRunlist = workzoneServices.getCookBookListForOrg();
			$q.all([allInstances,allBlueprints,allRunlist]).then(function(promiseObjs) {
				$scope.isTargetTypesLoading = false;
				$scope.isScriptNodesLoading = false;
				var instances = promiseObjs[0].data;
				var blueprints = promiseObjs[1].data;
				var roles = Object.keys(promiseObjs[2].data.roles);
				/*Identifying the chef nodes and adding a flag for identifying the selection in the angular checkbox selection*/
				if ($scope.taskType === "chef") {
					if($scope.isEditMode){
						if(items.taskConfig && items.taskConfig.role) {
							$scope.role.name = items.taskConfig.role;
						}
						$scope.editRunListAttributes = true;
						$scope.isScriptInstanceLoading = false;
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList	(instances), items.taskConfig.nodeIds);
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
				/*Identifying the nodes and script list and checking for task type to be script*/
				if ($scope.taskType === "script") {
					if($scope.isEditMode){
						$scope.isSudo=items.taskConfig.isSudo;
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), items.taskConfig.nodeIds);
						$scope.isScriptInstanceLoading = false;
						$scope.isNewTaskPageLoading = false;
						$scope.targetType="instance";
					}else{
						$scope.isSudo = false;
						$scope.chefInstanceList = responseFormatter.identifyAvailableChefNode(responseFormatter.getChefList(instances), []);
						$scope.isScriptInstanceLoading = false;
						$scope.isNewTaskPageLoading = false;
						$scope.targetType="instance";
					}
				}
				$scope.optionToggled();
				$scope.optionInstanceToggled();
				$scope.optionScriptToggled();
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
				if(items.serviceDeliveryCheck &&  items.serviceDeliveryCheck === true){
					$scope.checkBotStatus = true;
					$scope.checkBotType = true;
                    $scope.botType = items.botType;
                    $scope.botCategory = items.botCategory;
                    $scope.shortDesc = items.shortDesc;
                    $scope.manualExecutionTime = items.manualExecutionTime;
				}
				//properties specific to jenkins
				if (items.taskType === "jenkins") {
					$scope.jobUrl = items.taskConfig.jobURL;
					$scope.autoSync.flag = items.taskConfig.autoSyncFlag === "false" ? false : true;
					$scope.isParameterized.flag = items.taskConfig.isParameterized;
					$scope.jobResultURL = items.taskConfig.jobResultURL;
					$scope.jenkinsParamsList = items.taskConfig.parameterized;
					$scope.jenkinJobSelected = items.taskConfig.jobName;
				}
				if(items.taskType === "script") {
					$scope.scriptTypeSelelct = items.taskConfig.scriptTypeName;
					$scope.isNewTaskPageLoading = false;
					$scope.changeNodeScriptList();
				}
				if(items.taskType === "chef" || items.taskType === "script") {
					$scope.isExecution.flag = items.executionOrder;
				}
				if(items.taskType === "chef" || items.taskType === "jenkins" || items.taskType === "script") {
					$scope._isEventSelected.flag = items.isTaskScheduled;
					if(items.isTaskScheduled === true) {
						$scope.showAddTask = true;
					}
					$scope.chefJenkScriptTaskObj = items.taskScheduler;
					$scope.type = 'edit';
				}
			}
		}
		]);
})(angular);
