/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('orchestrationHistoryCtrl',["items", '$scope', '$modalInstance', '$modal', '$timeout', 'uiGridOptionsClient', 'uiGridConstants', 'workzoneServices',
			function(items, $scope, $modalInstance, $modal, $timeout, uiGridOptionsClient, uiGridConstants, workzoneServices){

				//UI Grid for chef Task starts
				$scope.taskHistoryChefData = [];
				var gridOptions = uiGridOptionsClient.options().gridOption;
				$scope.taskHistoryChefGridOptions = gridOptions;
				$scope.ischefTaskHistoryPageLoading = true;

				$scope.initChefGrids = function(){
					$scope.taskHistoryChefGridOptions.data='taskHistoryChefData';
					$scope.taskHistoryChefGridOptions.columnDefs = [
					{ name:'Start Time',cellTemplate:'<span title="{{row.entity.timestampStarted  | timestampToLocaleTime}}">{{row.entity.timestampStarted  | timestampToLocaleTime}}</span>',cellTooltip: true, sort: { direction: 'uiGridConstants.ASC' }},
					{ name:'End Time',cellTemplate:'<span title="{{row.entity.timestampEnded  | timestampToLocaleTime}}">{{row.entity.timestampEnded  | timestampToLocaleTime}}</span>',cellTooltip: true},
					// { name:'Status',field:'status',cellClass:'success'},
					{ name:'Status',field:'status',cellTemplate:'<div class="{{row.entity.status}}">{{row.entity.status}}</div>',sort: { direction: 'uiGridConstants.ASC' }},
					{ name:'Message', field: 'message', 
					  cellTemplate:'<span title="{{row.entity.message}}">{{row.entity.message}}</span>'},
					{ name:'User',field:'user',cellTooltip: true},
					{ name:'Logs',
					  cellTemplate:'<div class="text-center"><i class="fa fa-info-circle cursor" title="More Info" ng-click="grid.appScope.historyLogs(row.entity)"></i></div>'}
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
						}, function(error){
							$scope.errorMessage = "No Chef History Records found";
						});
					},
				});
				$scope.initchef = function(){
					$scope.initChefGrids();
					$scope.taskHistoryChefListView();
				};
				$scope.initchef();
				//UI Grid for chef Task ends






				$scope.task=items;
				workzoneServices.getHistory(items._id).then(function(response) {
					var data;
					if(response.data){
						data=response.data;
					}else if(response){
						data=response;
					}
					$scope.history=data;
				});

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
		]
	);
})();
