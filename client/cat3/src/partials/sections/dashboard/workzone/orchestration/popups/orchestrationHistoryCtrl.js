/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('orchestrationHistoryCtrl',["items", '$scope', '$modalInstance', '$modal', '$timeout', 'uiGridOptionsClient', 'workzoneServices',
		function(items, $scope, $modalInstance, $modal, $timeout, uiGridOptionsClient, workzoneServices){
			//UI Grid for chef Task starts
			console.log(items);
			$scope.taskHistoryChefData = [];
			var gridOptionsChef = uiGridOptionsClient.options().gridOption;
			$scope.taskHistoryChefGridOptions = gridOptionsChef;

			$scope.initChefGrids = function(){
				$scope.taskHistoryChefGridOptions.data='taskHistoryChefData';
				$scope.taskHistoryChefGridOptions.columnDefs = [
				{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
				{ name:'Message', field: 'message', 
				  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
				{ name:'User',field:'user',cellTooltip: true},
				{ name:'Logs',width: 70,
				  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},{ name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
				{ name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true}
				];
			};
			angular.extend($scope, {
				taskHistoryChefListView: function() {
					$scope.taskHistoryChefData = [];
					workzoneServices.getHistory(items._id).then(function(response) {
						$timeout(function() {
							if(response.data){
								$scope.taskHistoryChefData = response.data;
								$scope.ischefTaskHistoryPageLoading = false;
							}else if(response){
								$scope.taskHistoryChefData = response;
								$scope.ischefTaskHistoryPageLoading = false;
							}
						},100);
					}, function(){
						$scope.errorMessage = "No Chef History Records found";
						$scope.ischefTaskHistoryPageLoading = false;
					});
				}
			});
			$scope.initchef = function(){
				$scope.initChefGrids();
				$scope.taskHistoryChefListView();
			};
			//UI Grid for chef Task ends

			//UI Grid for jenkins Task starts
			$scope.taskHistoryJenkinsData = [];
			var gridOptionsJenkins = uiGridOptionsClient.options().gridOption;
			$scope.taskHistoryJenkinsGridOptions = gridOptionsJenkins;

			$scope.initJenkinsGrids = function(){
				$scope.taskHistoryJenkinsGridOptions.data='taskHistoryJenkinsData';
				$scope.taskHistoryJenkinsGridOptions.columnDefs = [
				{ name:'Job Number',field:'buildNumber',cellTemplate:'<a target="_blank" title="Jenkins" ng-href="{{grid.appScope.task.taskConfig.jobURL}}/{{row.entity.buildNumber}}">{{row.entity.buildNumber}}</a>', sort:{ direction: 'desc'}, cellTooltip: true},
				{ name:'Job Output',cellTemplate:'<span><a target="_blank" title="{{jobResultUrlName}}" class="fa fa-file-text bigger-120 btn cat-btn-update btn-sg tableactionbutton marginbottomright3" ng-repeat="jobResultUrlName in row.entity.jobResultURL" ng-href="{{jobResultUrlName}}"></a></span>',cellTooltip: true},
				{ name:'Log Info',width: 90,cellTemplate:'<span title="Jenkins Log" class="fa fa-list bigger-120 btn cat-btn-update btn-sg tableactionbutton" ng-click="grid.appScope.historyLogs(row.entity);"></span>',cellTooltip: true},
				{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status.toUpperCase()}}">{{row.entity.status.toUpperCase()}}</div>'},
				{ name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>',cellTooltip: true},
				{ name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>',cellTooltip: true}
				];
			};
			angular.extend($scope, {
				taskHistoryJenkinsListView: function() {
					$scope.taskHistoryJenkinsData = [];
					workzoneServices.getHistory(items._id).then(function(response) {
						$timeout(function() {
							if(response.data){
								$scope.taskHistoryJenkinsData = response.data;
								$scope.isjenkinsTaskHistoryPageLoading = false;
							}else if(response){
								$scope.taskHistoryJenkinsData = response;
								$scope.isjenkinsTaskHistoryPageLoading = false;
							}
						},100);
					}, function(){
						$scope.errorMessage = "No Jenkins History Records found";
						$scope.isjenkinsTaskHistoryPageLoading = false;
					});
				},
			});
			$scope.initjenkins = function(){
				$scope.initJenkinsGrids();
				$scope.taskHistoryJenkinsListView();
			};
			//UI Grid for jenkins Task ends

			//UI Grid for composite Task starts
			$scope.taskHistoryCompositeData = [];
			var gridOptionsComposite = uiGridOptionsClient.options().gridOption;
			$scope.taskHistoryCompositeGridOptions = gridOptionsComposite;

			$scope.initCompositeGrids = function(){
				$scope.taskHistoryCompositeGridOptions.data='taskHistoryCompositeData';
				$scope.taskHistoryCompositeGridOptions.columnDefs = [
				{ name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
				{ name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>',cellTooltip: true},
				{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
				{ name:'Message', field: 'message', 
				  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
				{ name:'User',field:'user',cellTooltip: true},
				{ name:'Logs',width: 70,
				  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'}
				];
			};
			angular.extend($scope, {
				taskHistoryCompositeListView: function() {
					$scope.taskHistoryCompositeData = [];
					workzoneServices.getHistory(items._id).then(function(response) {
						$timeout(function() {
							if(response.data){
								$scope.taskHistoryCompositeData = response.data;
								$scope.iscompositeTaskHistoryPageLoading = false;
							}else if(response){
								$scope.taskHistoryCompositeData = response;
								$scope.iscompositeTaskHistoryPageLoading = false;
							}
						},100);
					}, function(){
						$scope.errorMessage = "No Composite History Records found";
						$scope.iscompositeTaskHistoryPageLoading = false;
					});
				},
			});
			$scope.initcomposite = function(){
				$scope.initCompositeGrids();
				$scope.taskHistoryCompositeListView();
			};
			//UI Grid for composite Task ends

			//UI Grid for puppet Task starts
			$scope.taskHistoryPuppetData = [];
			var gridOptionsPuppet = uiGridOptionsClient.options().gridOption;
			$scope.taskHistoryPuppetGridOptions = gridOptionsPuppet;

			$scope.initPuppetGrids = function(){
				$scope.taskHistoryPuppetGridOptions.data='taskHistoryPuppetData';
				$scope.taskHistoryPuppetGridOptions.columnDefs = [
					{ name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
					{ name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true},
					{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
					{ name:'Message', field: 'message', cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
					{ name:'User',field:'user',cellTooltip: true},
					{ name:'Logs',width: 70, cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'}
				];
			};
			angular.extend($scope, {
				taskHistoryPuppetListView: function() {
					$scope.taskHistoryPuppetData = [];
					workzoneServices.getHistory(items._id).then(function(response) {
						$timeout(function() {
							if(response.data){
								$scope.taskHistoryPuppetData = response.data;
								$scope.ispuppetTaskHistoryPageLoading = false;
							}else if(response){
								$scope.taskHistoryPuppetData = response;
								$scope.ispuppetTaskHistoryPageLoading = false;
							}
						},100);
					}, function(){
						$scope.errorMessage = "No Puppet History Records found";
						$scope.ispuppetTaskHistoryPageLoading = false;
					});
				},
			});
			$scope.initpuppet = function(){
				$scope.initPuppetGrids();
				$scope.taskHistoryPuppetListView();
			};
			//UI Grid for puppet Task ends

			//UI Grid for script Task starts
			$scope.taskHistoryScriptData = [];
			var gridOptionsScript = uiGridOptionsClient.options().gridOption;
			$scope.taskHistoryScriptGridOptions = gridOptionsScript;

			$scope.initScriptGrids = function(){
				$scope.taskHistoryScriptGridOptions.data='taskHistoryScriptData';
				$scope.taskHistoryScriptGridOptions.columnDefs = [
				{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>', cellTooltip: true},
				{ name:'Message', field: 'message', 
				  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
				{ name:'User',field:'user',cellTooltip: true},
				{ name:'Logs',width: 70,
				  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'},
				  { name:'Start Time',field:'timestampStarted',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>', sort:{ direction: 'desc'}, cellTooltip: true},
				{ name:'End Time',field:'timestampEnded',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>', cellTooltip: true}
				
				];
			};
			angular.extend($scope, {
				taskHistoryScriptListView: function() {
					$scope.taskHistoryScriptData = [];
					workzoneServices.getHistory(items._id).then(function(response) {
						$timeout(function() {
							if(response.data){
								$scope.taskHistoryScriptData = response.data;
								$scope.isscriptTaskHistoryPageLoading = false;
							}else if(response){
								$scope.taskHistoryScriptData = response;
								$scope.isscriptTaskHistoryPageLoading = false;
							}
						},100);
					}, function(){
						$scope.errorMessage = "No Script History Records found";
						$scope.isscriptTaskHistoryPageLoading = false;
					});
				},
			});
			$scope.initscript = function(){
				$scope.initScriptGrids();
				$scope.taskHistoryScriptListView();
			};
			//UI Grid for script Task ends

			$scope.task=items;
			switch ($scope.task.taskType){
				case 'chef' :
					$scope.ischefTaskHistoryPageLoading = true;
					$scope.isjenkinsTaskHistoryPageLoading = false;
					$scope.iscompositeTaskHistoryPageLoading = false;
					$scope.ispuppetTaskHistoryPageLoading = false;
					$scope.isscriptTaskHistoryPageLoading = false;
					$scope.initchef();
					break;
				case 'jenkins' :
					$scope.ischefTaskHistoryPageLoading = false;
					$scope.isjenkinsTaskHistoryPageLoading = true;
					$scope.iscompositeTaskHistoryPageLoading = false;
					$scope.ispuppetTaskHistoryPageLoading = false;
					$scope.isscriptTaskHistoryPageLoading = false;
					$scope.initjenkins();
					break;
				case 'composite' :
					$scope.ischefTaskHistoryPageLoading = false;
					$scope.isjenkinsTaskHistoryPageLoading = false;
					$scope.iscompositeTaskHistoryPageLoading = true;
					$scope.ispuppetTaskHistoryPageLoading = false;
					$scope.isscriptTaskHistoryPageLoading = false;
					$scope.initcomposite();
					break;
				case 'puppet':
					$scope.ischefTaskHistoryPageLoading = false;
					$scope.isjenkinsTaskHistoryPageLoading = false;
					$scope.iscompositeTaskHistoryPageLoading = false;
					$scope.ispuppetTaskHistoryPageLoading = true;
					$scope.isscriptTaskHistoryPageLoading = false;
					$scope.initpuppet();
					break;
				case 'script':
					$scope.isscriptTaskHistoryPageLoading = true;
					$scope.ischefTaskHistoryPageLoading = false;
					$scope.isjenkinsTaskHistoryPageLoading = false;
					$scope.iscompositeTaskHistoryPageLoading = false;
					$scope.ispuppetTaskHistoryPageLoading = false;
					$scope.initscript();
					break;
			}

			$scope.historyLogs=function(hist) {
				var modalInstance = $modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
					controller: 'orchestrationLogCtrl as orchLogCtrl',
					backdrop : 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								taskId : hist.taskId,
								historyId : hist._id,
								taskType:hist.taskType
							};
						}
					}
				});
				modalInstance.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
				}, function() {
					console.log('Modal Dismissed at ' + new Date());
				});
			};
			$scope.cancel= function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})(angular);
