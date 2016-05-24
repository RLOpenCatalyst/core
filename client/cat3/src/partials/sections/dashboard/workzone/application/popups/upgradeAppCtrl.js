/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('upgradeAppCtrl', ['items','$scope','$rootScope', '$modalInstance','workzoneServices','$modal',function(items,$scope,$rootScope, $modalInstance,wzService,$modal) {
		var upgrdApp={
			newEnt:[],
			requestData:[],
			artifactsVersion:[],
			jobOptions:[]
		}
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			init :function(){
				wzService.getAppUpgrade(items).then(function (FrzData){
					var FrzData=FrzData.data;
					if(FrzData && FrzData.nexus && FrzData.nexus.serverRowId){
						upgrdApp.newEnt.serverType='nexus';
						upgrdApp.newEnt.artifact =FrzData.nexus.artifactId;
						upgrdApp.newEnt.groupId=FrzData.nexus.groupId;
						upgrdApp.rowid=FrzData.nexus.serverRowId;
						upgrdApp.newEnt.taskId=FrzData.nexus.taskId;
					} else if(FrzData && FrzData.docker && FrzData.docker.imageTag) {
						upgrdApp.newEnt.serverType='docker';
						upgrdApp.newEnt.ContNameId=FrzData.docker.containerName;
						upgrdApp.newEnt.contPort= FrzData.docker.containerPort;
						upgrdApp.newEnt.hostPort = FrzData.docker.hostPort;
						upgrdApp.newEnt.tag=FrzData.docker.imageTag;
						upgrdApp.newEnt.taskId=FrzData.docker.taskId;
						upgrdApp.rowid=FrzData.docker.serverRowId;
						upgrdApp.newEnt.repositoryIMG=FrzData.docker.image;
					}
					upgrdApp.projectId=FrzData.projectId;
					upgrdApp.envName=FrzData.envName;
					upgrdApp.newEnt.repository =FrzData.nexus.repository;
					upgrdApp.newEnt.version =(upgrdApp.newEnt.serverType === 'nexus')?FrzData.version :upgrdApp.newEnt.tag;
					upgrdApp.getServer();
					upgrdApp.getAllChefJobs();
				});
			}

		});
		upgrdApp.getServer=function () {
			wzService.repositoryServerList().then(function (serverResult) {
				angular.forEach(serverResult.data.server,function(val){
					if(val.rowid===upgrdApp.rowid){
						upgrdApp.newEnt.serverName=(val.nexusservername)?val.nexusservername:val.dockerreponame;
					}
				});
				upgrdApp.getArtifacts();
			});
		};
		upgrdApp.getArtifacts= function(){
			upgrdApp.requestData={
				nexus:upgrdApp.rowid,
				repositories:upgrdApp.newEnt.repository,
				group:upgrdApp.newEnt.groupId
			};
			wzService.getNexusArtifacts(upgrdApp.requestData).then(function (artifactsResult) {
				var artVerObj=[];
				angular.forEach(artifactsResult.data,function(val){
					artVerObj[val.version]=val;
					upgrdApp.artifactsVersion[val.artifactId]=artVerObj;
				});
				upgrdApp.getVersions();
			});
		};
		upgrdApp.getAllChefJobs =function () {
			// call job API
			wzService.getChefJob().then(function (jobResult) {
				$scope.isLoadingJob=false;
				upgrdApp.jobOptions = jobResult.data;
			});
		};
		upgrdApp.getVersions= function(){
			$scope.isLoadingNexusVersion = true;
			upgrdApp.requestData.artifactId = upgrdApp.newEnt.artifact;
			wzService.getNexusVersions(upgrdApp.requestData).then(function (versionsResult) {
				upgrdApp.versionsOptions = versionsResult.data;
				$scope.isLoadingNexusVersion = false;
			});
			angular.forEach(upgrdApp.jobOptions,function(val,key){
				if(val._id === upgrdApp.newEnt.taskId){
					upgrdApp.newEnt.jobInd=key;
				}
			});
		};
		upgrdApp.getTagDetails = function () {
			var repository=upgrdApp.newEnt.repositoryIMG.split('/');
			upgrdApp.newEnt.repository=repository[0];
			upgrdApp.newEnt.image=repository[1];
			$scope.isLoadingDocTag=true;
			var requestObject={
				dockerId:upgrdApp.rowid,
				repository:upgrdApp.newEnt.repository,
				image:upgrdApp.newEnt.image
			};
			wzService.getDockerImageTags(requestObject).then(function(tagResult){
				upgrdApp.tagOptions = tagResult.data;
				$scope.isLoadingDocTag=false;
			});
		}
		upgrdApp.createNewJob = function (){
			$rootScope.$emit("CREATE_NEW_JOB");
			$rootScope.createChefJob=true;
		};
		upgrdApp.submitAppUpgrade = function (DeploymentForm){
			if(upgrdApp.newEnt.serverType === 'nexus'){
				var nexus={
					"repoURL":upgrdApp.artifactsVersion[upgrdApp.newEnt.artifact][upgrdApp.newEnt.version].resourceURI,
					"version": upgrdApp.newEnt.version,
					"artifactId":upgrdApp.newEnt.artifact,
					"groupId": upgrdApp.newEnt.groupId,
					"repository":upgrdApp.newEnt.repository,
					"serverRowId":upgrdApp.rowid
				};
			} else{
				var docker={
					"image": upgrdApp.newEnt.repositoryIMG,
					"containerName": upgrdApp.newEnt.ContNameId,
					"containerPort": upgrdApp.newEnt.contPort,
					"hostPort": upgrdApp.newEnt.hostPort,
					"imageTag": upgrdApp.newEnt.tag,
					"serverRowId":upgrdApp.rowid
				};
			}
			upgrdApp.deploymentData ={
				"sourceData": {
				},
				"appData": {
					"projectId":upgrdApp.projectId,
					"envName":upgrdApp.envName,
					"appName": upgrdApp.newEnt.repository,
					"version":(upgrdApp.newEnt.serverType === 'nexus')?upgrdApp.newEnt.version :upgrdApp.newEnt.tag
				},
				"task": {
					"taskId": upgrdApp.jobOptions[upgrdApp.newEnt.jobInd]._id,
					"nodeIds": upgrdApp.jobOptions[upgrdApp.newEnt.jobInd].taskConfig.nodeIds
				}

			};
			if(upgrdApp.newEnt.serverType === 'nexus'){
				upgrdApp.deploymentData.sourceData.nexus=nexus;
			}else{
				upgrdApp.deploymentData.sourceData.docker=docker;
			}
			$scope.isLoadingNewApp=true;
			wzService.putAppDeploy(upgrdApp.deploymentData).then(function(deployResult){
				$scope.isLoadingNewApp=false;
				upgrdApp.deployResult=deployResult.data;
				upgrdApp.taskLog();
				$timeout(function () {$modalInstance.close();},400);
			});
		};
		upgrdApp.taskLog=function(){
			$modal.open({
				animation: true,
				templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
				controller: 'orchestrationLogCtrl as orchLogCtrl',
				backdrop: 'static',
				keyboard: false,
				resolve: {
					items: function() {
						return {
							taskId: upgrdApp.deployResult.taskId,
							historyId: upgrdApp.deployResult.historyId,
							taskType: upgrdApp.deployResult.taskType
						};
					}
				}
			});
		};
		// call job api after creating new job .
		$rootScope.$on("GET_ALL_TASK", function(){
			upgrdApp.getAllChefJobs();
			$rootScope.createChefJob = false;
		});
		$scope.init();
		return upgrdApp;

	}]);
})();