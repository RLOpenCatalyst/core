/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */

(function(angular) {
	"use strict";
	angular.module('workzone.blueprint')
		.controller('dockerLaunchParamsCtrl', ['$scope', '$modal', '$modalInstance', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'workzoneServices', '$q', 'items', function($scope, $modal, $modalInstance, $timeout, uiGridOptionsClient, uiGridConstants, workzoneServices, $q, items) {
			angular.extend($scope, {
				cancel: function() {
					$modalInstance.dismiss('cancel');
				}
			});
			//wizard data setting for step 1 and step 2.
			var stepIndex = 0, // points to the current step in the steps array
			steps = $scope.steps = [{
				'isDisplayed': true,
				'name': 'dockerimages',
				'title': 'Docker Images'
			}, {
				'isDisplayed': false,
				'name': 'instances',
				'title': 'Select Instance'
			}];
			$scope.nextEnabled = false;
			$scope.previousEnabled = false;
			$scope.submitEnabled = false;
			$scope.repaintStep = steps[stepIndex].name;
			$scope.next = function() {
				if (steps.length === 0) {
					console.debug('No steps provided.');
					return;
				}
				// If we're at the last step, then stay there.
				if (stepIndex === steps.length - 1) {
					return;
				}

				steps[stepIndex++].isDisplayed = false;
				steps[stepIndex].isDisplayed = true;
				$scope.repaintStep = steps[stepIndex].name;
				$scope.setButtons();
			};
			/* Moves to the previous step*/
			$scope.previous = function() {
				if (steps.length === 0) {
					console.debug('No steps provided.');
					return;
				}
				if (stepIndex === 0) {
					console.debug('At first step');
					return;
				}
				steps[stepIndex--].isDisplayed = false;
				steps[stepIndex].isDisplayed = true;
				$scope.repaintStep = steps[stepIndex].name;
				$scope.setButtons();
			}; // $scope.previous

			/* Sets the correct buttons to be enabled or disabled.*/
			$scope.setButtons = function() {
				if (stepIndex === steps.length - 1) {
					$scope.nextEnabled = false;
					$scope.previousEnabled = true;
					$scope.submitEnabled = true;
				} else if (stepIndex === 0) {
					$scope.previousEnabled = false;
					$scope.nextEnabled = true;
					$scope.submitEnabled = false;
				} else {
					$scope.nextEnabled = true;
					$scope.previousEnabled = true;
					$scope.submitEnabled = false;
				}
			};
			/*method added for allowing the user to move the 
			table row up  in dockerLaunchParams section*/
			$scope.moveUpChoice = function(arr, index) {
				var currItem = index;
				if (currItem > 0) {
					arr.splice(currItem - 1, 0, arr.splice(currItem, 1)[0]);
				}
			};
			/*method added for allowing the user to move the
			 table row down in dockerLaunchParams section*/
			$scope.moveDownChoice = function(arr, index) {
				var currItem = index;
				var newPosition = index + 1;
				if (currItem < arr.length) {
					arr.splice(newPosition, 0, arr.splice(currItem, 1)[0]);
				}
			};
			
			/*Step 1 - Docker Images*/
			//items gives the details of the selected blueprint.
			var dockerParams = {};
			var dockerImagesOptions = uiGridOptionsClient.options().gridOption;
			$scope.dockerImagesGridOptions = dockerImagesOptions;
			$scope.dockerDetails = [];

			$scope.initDockerImagesGrids = function(){
				$scope.dockerImagesGridOptions.data='dockerDetails';
				$scope.dockerImagesGridOptions.columnDefs = [
				{name:"Name",cellTemplate:'<div title="{{row.entity.dockercontainerpathstitle}}">{{row.entity.dockercontainerpathstitle}}</div>',cellTooltip: true},
				{name:"Image Path", cellTemplate:'<div title="{{row.entity.dockercontainerpaths}}">{{row.entity.dockercontainerpaths}}</div>',cellTooltip: true},
				{name:"Tag", cellTemplate:'<div>{{row.entity.dockerrepotags}}</div>',cellTooltip: true},
				{name:"Launch Params", width:300, cellTemplate:'<input type="text" class="widthInputClass" ng-model="row.entity.dockerlaunchparameters"><i class="btn icon-append fa fa-list-alt fa-lg" title="Launch Parameters" ng-click="grid.appScope.launchParam(row.entity, rowRenderIndex)"></i>',cellTooltip: true},
				{name:"Re-Order", width:100, cellTemplate:'<i class="fa fa-chevron-circle-up fa-lg" ng-click="grid.appScope.moveUpChoice(grid.appScope.dockerDetails, this.rowRenderIndex)"></i><i class="fa fa-chevron-circle-down fa-lg marginleft5" ng-click="grid.appScope.moveDownChoice(grid.appScope.dockerDetails, this.rowRenderIndex)"></i>',cellTooltip: true}
				];
			};
			angular.extend($scope, {
				dockerImagesListView: function() {
					var _dockerImages = [];
					//gives the dockerParams details to show up the image in the first step of wizard.
					dockerParams.forEach(function(k, v) {
						_dockerImages.push(dockerParams[v]);
					});
					$scope.dockerDetails = _dockerImages; 
				},
				rePaintDockerImagesListView: function() {
					if($scope.dockerDetails.length ===0){
						return false;
					}
					$scope.isdockerImagesPageLoading = true;
					var tableData = $scope.dockerDetails;
					$scope.dockerDetails = [];
					$timeout(function() {
						$scope.isdockerImagesPageLoading = false;
						$scope.dockerDetails = tableData;
					},100);   
				},
			});
			$scope.initdockerimages = function(){
				$scope.isdockerImagesPageLoading = true;
				workzoneServices.getBlueprintById(items.selectedVersionBpId).then(function(response){
					var bluePrintOfSelectedVersion = response.data;
					dockerParams = bluePrintOfSelectedVersion.blueprintConfig.dockerCompose;
					$scope.initDockerImagesGrids();
					$scope.dockerImagesListView();
					$scope.isdockerImagesPageLoading = false;
					helper.initializeStepChangeListener();
					$scope.nextEnabled = true;
				}, function(error){
					console.log(error);
					$scope.isdockerImagesPageLoading = false;
				});
			};
			$scope.initdockerimages();
			/*Step 1 - Docker Images Ends*/

			/*Step 2 - Instances to run Docker images starts*/
			var helper = {
				filterRunningInstances: function (totalInstances) {
					var runningInstances = [];
					for(var i=0; i<totalInstances.length; i++){
						if(totalInstances[i].instanceState ==='running'){
							runningInstances.push(totalInstances[i]);
						}
					}
					return runningInstances;
				},
				//Repainting the UI Grid for Docker Images.
				initializeStepChangeListener: function (){
					$scope.$watch('repaintStep', function () {
						switch($scope.repaintStep){
							case 'dockerimages' :
								$scope.rePaintDockerImagesListView();
							break;
							case 'instances' :
							   $scope.rePaintDockerinstancesListView();
							break;
						}
					});
				}
			};
			
			var dockerInstancesGridOptions = uiGridOptionsClient.options().gridOption;
			$scope.dockerinstancesGridOptions = dockerInstancesGridOptions;
			$scope.dockerinstancesData = [];

			$scope.initdockerinstancesGrids = function(){
				$scope.dockerinstancesGridOptions.data='dockerinstancesData';
				$scope.dockerinstancesGridOptions.columnDefs = [
					{ name:'Select Instance', cellTemplate:'<input type="checkbox" ng-model="row.entity.checked" ng-click="grid.appScope.selectValue(row.entity)"  value="{{row.entity._id}}"  ng-disabled="grid.appScope.checked==grid.appScope.limit && !row.entity.checked"/>',cellTooltip: true},
					{ name: 'Instance Name', field:'name', cellTooltip: true},
					{ name: 'IP Address', cellTemplate:'<div>{{row.entity.instanceIP}}</div>', cellTooltip: true},
					{ name: 'Log', cellTemplate:'<i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.viewLogs(row.entity)"></i>', cellTooltip: true}
				];
			};
			angular.extend($scope, {
				dockerinstancesListView: function() {
					$scope.isDockerInstancesLoading = true;
					$scope.dockerinstancesData = [];
					//call made to get the instance details.(instance name,instanceIP)
					workzoneServices.getCurrentEnvInstances().then(function(response) {
						$scope.isDockerInstancesLoading = false;
						$scope.dockerinstancesData = helper.filterRunningInstances(response.data);
					}, function(){
						$scope.errorMessage = "No Docker Instances Records found";
					});
				},
				rePaintDockerinstancesListView: function() {
					if($scope.dockerinstancesData.length === 0){
						return false;
					}
					$scope.isDockerInstancesLoading = true;
					var tableData = $scope.dockerinstancesData;
					$scope.dockerinstancesData = [];
					$timeout(function() {
						$scope.isDockerInstancesLoading = false;
						$scope.dockerinstancesData = tableData;
					},100);
				}
			});
			$scope.initdockerinstances = function(){
				$scope.initdockerinstancesGrids();
				$scope.dockerinstancesListView();
			};
			$scope.initdockerinstances();
			/*Step 2 - Instances to run Docker images ends*/

			//modal to show the Docker Parameters Popup
			$scope.launchParam = function(launchObj, idx) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/dockerParams.html',
					controller: 'dockerParamsCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return launchObj.dockerlaunchparameters;
						}
					}
				});
				modalInstance.result.then(function(paramStr) {
					$scope.dockerDetails[idx].dockerlaunchparameters = paramStr;
					//updating the dockerLaunchParameters for the particular index.
				}, function() {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			//view the instance logs on click of more info and on start button click.
			$scope.viewLogs = function(instanceObj) {
				var _viewLogs = function(resolve, reject) {
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instanceLogs.html',
						controller: 'dockerInstanceLogsCtrl',
						backdrop: 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return instanceObj;
							}
						}
					});
					modalInstance.result.then(function(modalClose) {
						resolve(modalClose);
					}, function(modalCancel) {
						reject(modalCancel);
					});
				};
				return $q(_viewLogs);
			};

			/*user sets the value(instanceId and instance) on the checkbox 
			the user has selected to show the logs once the user clicks on submit
			and restricts the selection to 1*/
			$scope.checkBoxSelectLength = [];
			$scope.limit = 1; /*limiting the checkbox selection to 1*/
			$scope.checked = 0; /*checking the number of checkbox selection.Initially 0*/
			$scope.selectValue = function(instance) {
				$scope.checkBoxSelectLength = $scope.checkBoxSelectLength || [];
				if (instance.checked) {
					$scope.instanceSelected = instance;
					$scope.checkBoxSelectLength.push(instance);
					$scope.checked++;
					$scope.checkBoxSelectLength = _.uniq($scope.checkBoxSelectLength);
				} else {
					$scope.checkBoxSelectLength = _.without($scope.checkBoxSelectLength, instance);
					$scope.checked--;
					$scope.showNoDockerAvailable = false;
					/*Setting to scope to false whenever the user unchecks the checkbox*/
				}
			};

			$scope.submit = function() {
				$scope.isLogsLoading = true;
				var dockerImageParams = JSON.stringify($scope.dockerDetails);
				var repopath = "null"; //by default set to null.(taken from 2.0);
				var reqBody = {
					compositedockerimage: encodeURIComponent(dockerImageParams)
				};
				workzoneServices.postLaunchDockerBlueprint($scope.instanceSelected._id, repopath, reqBody).then(function(response) {
					var data = response.data;
					$scope.isLogsLoading = false;
					/*If Response is ok the logs are shown and docker image is pulled*/
					if (data === "OK") {
						$scope.viewLogs($scope.instanceSelected);
					} else {
						if (data.indexOf('No Docker Found') >= 0) {
							$scope.showNoDockerAvailable = true;
							/*Setting the scope to true to show a row beneath which tells that 
							docker is not installed on the particular node*/
						}
					}
				});
			};
		}
	]);
})(angular);