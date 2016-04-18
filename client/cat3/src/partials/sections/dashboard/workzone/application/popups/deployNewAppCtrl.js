/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
"use strict";
angular.module('workzone.application').controller('deployNewAppCtrl', ['items','$scope','$rootScope','$modal', '$modalInstance','workzoneServices','workzoneEnvironment', function(items,$scope,$rootScope,$modal, $modalInstance,workSvs,workEnvt) {
		/*$scope.isSelectedEnable = true;
		$scope.serverType='';
		console.log($scope.serverType);
		if($scope.serverType==='nexusServer' || $scope.serverType==='rldocker') {
			$scope.isSelectedEnable = false;
		}*/
		angular.extend($scope,{appDepOrUpgrade:items.appDepOrUpgrade}, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
		var depNewApp={
			newEnt:[],
			serverOptions:[],
			groupOptions:[],
			jobOptions:[],
			repositoryOptions:[],
			artifactsOptions:[],
			versionsOptions:[]
			
		};
		depNewApp.init =function(){
			$scope.isLoadingServer=true;
			$scope.isLoadingJob=true;
			workSvs.repositoryServerList().then(function (serverResult) {
				$scope.isLoadingServer=false;
				depNewApp.serverOptions = serverResult.data.server;
			});
			depNewApp.getAllJobs();
		};
		depNewApp.getAllJobs =function () {
			// call job API
			workSvs.getJobTask().then(function (jobResult) {
				$scope.isLoadingJob=false;
				depNewApp.jobOptions = jobResult.data;
			});
		}
		depNewApp.getRepository= function(){
			if (depNewApp.newEnt.serverTypeInd){
				depNewApp.newEnt.serverType = depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].configType;
				// create group select box options
				angular.forEach(depNewApp.serverOptions,function(val,key){
					if(val.configType === depNewApp.newEnt.serverType){
						depNewApp.groupOptions = depNewApp.groupOptions.concat(val.groupid);
					}
				});
			} else {
				depNewApp.newEnt.serverType = '';
			}
			$scope.isLoadingNexus = true;
			workSvs.getNexusRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
				depNewApp.repositoryOptions = repositoryResult.data;
				$scope.isLoadingNexus = false;
			});
			depNewApp.clearChildField('serverType');
		}
		depNewApp.changeRepository = function(){
			depNewApp.newEnt.repository = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].id;
			depNewApp.newEnt.repositoryURL = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].resourceURI;
			depNewApp.clearChildField('repository');
		}
		depNewApp.getArtifacts= function(){
			$scope.isLoadingArtifacts = true;
			depNewApp.requestData={
					nexus:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
					repositories:depNewApp.newEnt.repository,
					group:depNewApp.newEnt.groupId
				}
			workSvs.getNexusArtifacts(depNewApp.requestData).then(function (artifactsResult) {
				depNewApp.artifactsOptions = artifactsResult.data;
				$scope.isLoadingArtifacts = false;
			});
			depNewApp.clearChildField('groupId');
		}
		depNewApp.getVersions= function(){
			$scope.isLoadingNexusVersion = true;
			depNewApp.newEnt.artifact = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			depNewApp.requestData.artifactId = depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].artifactId;
			workSvs.getNexusVersions(depNewApp.requestData).then(function (versionsResult) {
				depNewApp.versionsOptions = versionsResult.data;
				$scope.isLoadingNexusVersion = false;
			});
			depNewApp.clearChildField('artifact');
		}
		depNewApp.createNewJob = function (){
			$rootScope.$emit("createNewTask");
		}
		depNewApp.clearChildField = function (field) {
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
		depNewApp.submitDemoDeploy = function (){
			depNewApp.deploymentData = {
				appData :{
					projectId:workEnvt.getEnvParams().proj,
					envId:workEnvt.getEnvParams().env,
					nexus: {
						taskId:depNewApp.newEnt.job,
						appName:depNewApp.newEnt.repository,
						version:depNewApp.newEnt.version,
						repoURL:depNewApp.artifactsOptions[depNewApp.newEnt.artifactInd].resourceURI,
						}
				}
			}
			console.log(depNewApp.deploymentData);
		}
		// call job api after creating new job .
		$rootScope.$on("getAllJobs", function(){
			depNewApp.getAllJobs();
		});
		depNewApp.init();
		return depNewApp;
	}]);
})();