/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
"use strict";
angular.module('workzone.application').controller('deployNewAppCtrl', ['items','$scope', '$rootScope', '$modal', '$modalInstance','workzoneServices','workzoneEnvironment', function(items,$scope, $rootScope, $modal, $modalInstance,workSvs,workEnvt) {
		/*$scope.isSelectedEnable = true;
		$scope.serverType='';
		console.log($scope.serverType);
		if($scope.serverType==='nexusServer' || $scope.serverType==='rldocker') {
			$scope.isSelectedEnable = false;
		}*/
		angular.extend($scope,{appDepOrUpadate:items.appDepOrUpadate}, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			createNewJob: function(type) {
			   $modal.open({
					animate: true,
					templateUrl: "src/partials/sections/dashboard/workzone/orchestration/popup/newTask.html",
					controller: "newTaskCtrl",
					backdrop : 'static',
					size: 'lg',
					keyboard: false,
					resolve: {
						items: function() {
							return type;
						}
					}
				})
				.result.then(function(selectedItem) {
					$scope.selected = selectedItem;
				}, function() {
					
				}); 
			}
		});
		var depNewApp={
			newEnt:[],
			serverOptions:[],
			groupId:[],
			jobOptions:[],
			repositoryList:[],
			artifactsOptions:[],
			versionsOptions:[]
			
		};
		depNewApp.init =function(){
			workSvs.getServerList().then(function (serverResult) {
				depNewApp.serverOptions = serverResult.data.server;
			});
			depNewApp.jobList();
		};
		depNewApp.jobList =function(){
			workSvs.getJobTask().then(function (jobResult) {
				depNewApp.jobOptions = jobResult.data;
			});
		}
		depNewApp.getRepository= function(){
			if (depNewApp.newEnt.serverTypeInd){
				depNewApp.newEnt.serverType = depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].configType;
			} else {
				depNewApp.newEnt.serverType = '';
			}
			$scope.isLoadingNexus = true;
			// create group id
			angular.forEach(depNewApp.serverOptions,function(val,key){
				if(val.configType === depNewApp.newEnt.serverType){
					depNewApp.groupId = val.groupid;
				}
			});
			workSvs.getRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
				depNewApp.repositoryList = repositoryResult.data;
				$scope.isLoadingNexus = false;
			});
			depNewApp.onchangeFiled('serverType');
		}
		depNewApp.changeRepository = function(){
			depNewApp.newEnt.repository = depNewApp.repositoryList[depNewApp.newEnt.repositoryInd].id;
			depNewApp.newEnt.repositoryURL = depNewApp.repositoryList[depNewApp.newEnt.repositoryInd].resourceURI;
			depNewApp.onchangeFiled('repository');
		}
		depNewApp.getArtifacts= function(){
			$scope.isLoadingArtifacts = true;
			depNewApp.requestData={
					nexus:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
					repositories:depNewApp.newEnt.repository,
					group:depNewApp.newEnt.groupId
				}
			workSvs.getArtifacts(depNewApp.requestData).then(function (artifactsResult) {
				depNewApp.artifactsOptions = artifactsResult.data;
				$scope.isLoadingArtifacts = false;
			});
			depNewApp.onchangeFiled('groupId');
		}
		depNewApp.getVersions= function(){
			$scope.isLoadingVersion = true;
			depNewApp.newEnt.artifact = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			depNewApp.requestData.artifactId = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			workSvs.getVersions(depNewApp.requestData).then(function (versionsResult) {
				depNewApp.versionsOptions = versionsResult.data;
				$scope.isLoadingVersion = false;
			});
			depNewApp.onchangeFiled('artifact');
		}

		depNewApp.onchangeFiled = function (field) {
			switch (field){
				case 'serverType' :
					depNewApp.newEnt.repository ='';
					depNewApp.newEnt.repositoryInd ='';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.groupId='';
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.version ='';
					depNewApp.artifactsOptions=[];
					depNewApp.versionsOptions=[];
					break;
				case 'repository' :
					depNewApp.newEnt.groupId='';
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.version ='';
					depNewApp.artifactsOptions=[];
					depNewApp.versionsOptions=[];
					break;
				case 'groupId' :
					depNewApp.newEnt.artifactInd = '';
					depNewApp.newEnt.artifact ='';
					depNewApp.newEnt.version ='';
					depNewApp.versionsOptions=[];
					break;
				case 'artifact' :
					depNewApp.newEnt.version ='';
					break;
			}
		}
		depNewApp.changeDemo = function (){
			depNewApp.deploymentData = {
				appData :{
					projectId:workEnvt.getEnvParams().proj,
					envId:workEnvt.getEnvParams().env,
					appName:depNewApp.newEnt.repository,
					version:depNewApp.newEnt.version,
					nexus: {
						repoURL:depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].resourceURI,
						nodeIps: ["54.153.57.31"]
						}
				}
			}
			console.log(depNewApp.deploymentData);
		}

		depNewApp.init();
		return depNewApp;
	}]);
})();