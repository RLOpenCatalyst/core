/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2016
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('compositeLogsCtrl',['$scope','workzoneServices','$interval','orchestrationSetting','$timeout',function($scope, workzoneServices, $interval, orchestrationSetting, $timeout){
			$scope.isTaskListLoading = true;
			var compLogData ={
				allTaskList:[],
				selectBoxOption:[],
				taskType:'',
				selectTaskInd:0,
				taskHistoryStartPoint:0,
				assignedTaskIds:[],
				allHistoryIds:[],
				currentItemDetail:{
					taskId:'',
					taskType:'',
					historyId:''
				}
			};
			var items=$scope.parentItemDetail;
			compLogData.init=function(){
				compLogData.pullHistoryDetails();
			};
			/** Task Name
			 * call inside the task list
			 * pass params:  object of tasksId
			 */
			compLogData.pullTaskDetailsWTList = function(taskIdOBJ){
				workzoneServices.postTasksDetails(taskIdOBJ).then(function(allTaskDetails) {
					compLogData.allTaskList=angular.extend(compLogData.allTaskList,allTaskDetails.data);
					angular.forEach(allTaskDetails.data,function(value){
						compLogData.assignedTaskIds.push(value._id);
					});
					if (compLogData.allTaskHistoryIds.length  < compLogData.assignedTask.assignedTaskIds.length) {
						compLogData.taskHistoryIds();
					} else {
						angular.forEach(compLogData.allTaskHistoryIds,function(valueHis){
							compLogData.createOptions(valueHis.taskId,valueHis.historyId);
						});
					}
				});
			};
			/**init function
			 *  fetch all task id and history id .
			 *  pass params : item taskId , item historyId.
			 **/
			compLogData.pullHistoryDetails=function() {
				workzoneServices.getTaskHistoryItem(items.taskId ,items.historyId).then(function (responseHis) {
					compLogData.assignedTask=responseHis.data;
					var assTaskIdsArgument=compLogData.assignedTask.assignedTaskIds.filter(function(x) { return compLogData.assignedTaskIds.indexOf(x) < 0; });
					if(assTaskIdsArgument.length >0 ){
						compLogData.pullTaskDetailsWTList(assTaskIdsArgument);
					}
					compLogData.allTaskHistoryIds=responseHis.data.taskHistoryIds;
				});
			};
			/** create option  */
			compLogData.createOptions= function(taskId,historyId){
				angular.forEach(compLogData.allTaskList,function(value){
					if(value._id === taskId){
						value=angular.extend(value,{historyId:historyId});
						compLogData.selectBoxOption.push(value);
						$scope.isTaskListLoading = false;
					}
				});
			};
			/** Get taskHistoryIds
			 * interval */
			compLogData.taskHistoryIds=function (){
				$timeout(function(){workzoneServices.getTaskHistoryItem(items.taskId ,items.historyId).then(function (historyIds) {
					compLogData.allTaskHistoryIds=historyIds.data.taskHistoryIds;
					var taskIdsLen =compLogData.allTaskHistoryIds.length;
					// associate with name
					if(taskIdsLen > 0){
						for(var idn=compLogData.taskHistoryStartPoint; idn < taskIdsLen; idn++){
							compLogData.createOptions(compLogData.allTaskHistoryIds[idn].taskId,compLogData.allTaskHistoryIds[idn].historyId);
						}
					}
					if (historyIds.data.status !== "failed" && taskIdsLen  < compLogData.assignedTask.assignedTaskIds.length ) {
						compLogData.taskHistoryStartPoint = taskIdsLen;
						compLogData.taskHistoryIds();
					}
				});},3000);
			};
			/** after select task
			 * pass params : task object index.
			 */
			compLogData.onchangeCompTask = function(index){
					var currentInd = index || compLogData.selectTaskInd;
				if(compLogData.selectBoxOption.length >0){
					compLogData.currentItemDetail={
						taskId: compLogData.selectBoxOption[currentInd]._id,
						taskType:compLogData.selectBoxOption[currentInd].taskType,
						historyId:compLogData.selectBoxOption[currentInd].historyId
					};
					compLogData.taskType=compLogData.currentItemDetail.taskType;
					$scope.parentItemDetail=compLogData.currentItemDetail;
									$scope.$broadcast ('parentChangeCompTask',$scope.parentItemDetail);
					$scope.$broadcast ('closeWindow');
					return  $scope.close;
				} else {
					$timeout(function(){compLogData.onchangeCompTask(index);},2000);
				}
			};
			compLogData.init();
			return compLogData;
		}
	]);
})();
