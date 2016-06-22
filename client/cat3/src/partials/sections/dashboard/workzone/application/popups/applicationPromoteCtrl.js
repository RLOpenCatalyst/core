/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(angular){
	"use strict";
	angular.module('workzone.application').controller('applicationPromoteCtrl', ['items','$scope','$rootScope','$modal', '$modalInstance','workzoneServices','workzoneEnvironment', function(items,$scope,$rootScope,$modal, $modalInstance,workSvs,workEnvt) {
		angular.extend($scope,{currentCardDetails:items}, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
		var promApp={
            errorMsg: false,
			newEnt:[],
			envOptions:[],
			jobOptions:[]
		};
		promApp.init =function(){
			promApp.newEnt.currentEnv=$scope.currentCardDetails.envName;
			var config=$scope.currentCardDetails.config;
			var currentEncInd=config.envSequence.indexOf($scope.currentCardDetails.envName);
		   angular.forEach(config.envSequence,function (val) {
			   if(config.envId.indexOf(val) !== -1 && config.envSequence.indexOf(val) > currentEncInd) {
				   promApp.envOptions.push(val);
			   }
		   });
			//promApp.getAllChefJobs();
		};
		promApp.getAllChefJobs =function () {
			workSvs.getAllEnv().then(function (EnvResult) {
				var envIdNames = EnvResult.data;
				if(envIdNames && envIdNames[0].environmentname){
					var envName=envIdNames[0].environmentname.split(',');
					var envId=envIdNames[0].environmentname_rowid.split(',');
					var indexEnvName=envName.indexOf(promApp.newEnt.targetEnv);
					workSvs.getChefJobEnv(envId[indexEnvName]).then(function (jobResult) {
						promApp.jobOptions = jobResult.data;
					});
				}
			});
		};
		promApp.createNewJob = function (){
			$rootScope.$emit("CREATE_NEW_JOB");
			$rootScope.createChefJob=true;
		};
		promApp.submitAppPromote = function(){
			$scope.isLoadingPromApp=true;
			promApp.submitData= {
				"appData": {
					"version": ($scope.currentCardDetails.appName.version)?($scope.currentCardDetails.appName.version):$scope.currentCardDetails.version,
					"sourceEnv": promApp.newEnt.currentEnv,
					"targetEnv":promApp.newEnt.targetEnv,
					"appName":$scope.currentCardDetails.appName.name, // for nexus(nexus.artifactId) and for docker(docker.image)
					"projectId":workEnvt.getEnvParams().proj,
				},
				"task": {
					"taskId": promApp.jobOptions[promApp.newEnt.jobInd]._id,
					"nodeIds": promApp.jobOptions[promApp.newEnt.jobInd].taskConfig.nodeIds
				}
			};
			workSvs.putAppPromote(promApp.submitData).success(function(promAppResult){
				promApp.taskLog(promAppResult.data);
				$modalInstance.close(angular.extend(promApp.newEnt, $scope.currentCardDetails));
				$scope.isLoadingPromApp=false;
			}).error(function(data) {
                $scope.isLoadingPromApp=false;
                promApp.msgText=data.message;
                promApp.errorMsg=true;
            });
		};
		promApp.taskLog=function(promAppResult){
			$modal.open({
				animation: true,
				templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
				controller: 'orchestrationLogCtrl as orchLogCtrl',
				backdrop: 'static',
				keyboard: false,
				resolve: {
					items: function() {
						return {
							taskId:promAppResult.taskId,
							historyId: promAppResult.historyId,
							taskType: promAppResult.taskType
						};
					}
				}
			});
		};
		// call job api after creating new job .
		$rootScope.$on("GET_ALL_TASK", function(){
			promApp.getAllChefJobs();
			$rootScope.createChefJob=false;
		});
		promApp.init();
		return promApp;
	}]);
})(angular);