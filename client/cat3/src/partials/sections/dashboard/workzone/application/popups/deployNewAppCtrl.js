/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */
(function(angular){
	"use strict";
	angular.module('workzone.application')
		.controller('deployNewAppCtrl', ['items','$scope','$rootScope','$modal', '$modalInstance','workzoneServices','workzoneEnvironment','$timeout', function(items,$scope,$rootScope,$modal,$modalInstance,workSvs,workEnvt,$timeout) {
			angular.extend($scope, {
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
				versionsOptions:[],
				tagOptions:[],
				deployResult:[],
				artifactsVersion:[],
				errorMsg:{}
			};
			depNewApp.init =function(){
				$scope.isLoadingServer=true;
				$scope.isLoadingJob=true;
				workSvs.repositoryServerList().then(function (serverResult) {
					$scope.isLoadingServer=false;
					depNewApp.serverOptions = serverResult.data.server;
					if(serverResult.data.server.length === 0){
						depNewApp.errorMsg= {
							text:"Server is not defined",
							type: "warning",
							server:true,
							role:"tooltip",
							positions:"bottom"
						};
					}
				});
				depNewApp.getAllChefJobs();
			};
			depNewApp.getAllChefJobs =function () {
				// call job API
				workSvs.getChefJob().then(function (jobResult) {
					$scope.isLoadingJob=false;
					depNewApp.jobOptions = jobResult.data;
				});
			};
			depNewApp.getRepository= function(){
				depNewApp.groupOptions=[];
				if (depNewApp.newEnt.serverTypeInd){
					depNewApp.newEnt.serverType = depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].configType;
				} else {
					depNewApp.newEnt.serverType = '';
				}
				$scope.isLoadingNexus = true;
				if(depNewApp.newEnt.serverType === 'nexus'){
					// create group select box options
					depNewApp.groupOptions = depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].groupid;
					workSvs.getNexusRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
						depNewApp.repositoryOptions = repositoryResult.data;
						$scope.isLoadingNexus = false;
					});
				} else if(depNewApp.newEnt.serverType === 'docker'){
					workSvs.getDockerRepository(depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid).then(function (repositoryResult) {
						$scope.isLoadingNexus = false;
						depNewApp.repositoryOptions = repositoryResult.data[0].repositories.docker;
						if(depNewApp.repositoryOptions.length === 0){
							depNewApp.errorMsg= {
								text: "Repository is not defined",
								type: "warning",
								repository:true,
								role:"tooltip",
								positions:"bottom"
							};
						}
					});
				}
				depNewApp.clearChildField('serverType');
			};
			depNewApp.changeRepository = function(){
				if(depNewApp.newEnt.serverType === 'docker') {
					var repository=depNewApp.newEnt.repositoryIMG.split('/');
					depNewApp.newEnt.repository=depNewApp.newEnt.repositoryIMG;
					var tagRep='';
					if(depNewApp.newEnt.repositoryIMG && depNewApp.newEnt.repositoryIMG.indexOf('/') === -1){
						tagRep='library';
						depNewApp.newEnt.image=depNewApp.newEnt.repository;
					} else {
						tagRep=repository[0];
						depNewApp.newEnt.image=repository[1];
					}
					$scope.isLoadingDocTag=true;
					var requestObject={
						dockerId:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
						repository:tagRep,
						image:depNewApp.newEnt.image
					};
					workSvs.getDockerImageTags(requestObject).then(function(tagResult){
						depNewApp.tagOptions = tagResult.data;
						$scope.isLoadingDocTag=false;
					});
				} else {
					depNewApp.newEnt.repository = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].id;
					depNewApp.newEnt.repositoryURL = depNewApp.repositoryOptions[depNewApp.newEnt.repositoryInd].resourceURI;
				}
				depNewApp.clearChildField('repository');
			};
			depNewApp.getArtifacts= function(){
				$scope.isLoadingArtifacts = true;
				depNewApp.requestData={
					nexus:depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid,
					repositories:depNewApp.newEnt.repository,
					group:depNewApp.newEnt.groupId
				};
				workSvs.getNexusArtifacts(depNewApp.requestData).then(function (artifactsResult) {
					var artVerObj=[];
					angular.forEach(artifactsResult.data,function(val){
						artVerObj[val.version]=val;
						depNewApp.artifactsVersion[val.artifactId]=artVerObj;
						if (depNewApp.artifactsOptions.indexOf(val.artifactId) === -1) {
							depNewApp.artifactsOptions.push(val.artifactId);
						}
					});
					$scope.isLoadingArtifacts = false;
				});
				depNewApp.clearChildField('groupId');
			};
			depNewApp.getVersions= function(){
				$scope.isLoadingNexusVersion = true;
				depNewApp.requestData.artifactId = depNewApp.newEnt.artifact;
					workSvs.getNexusVersions(depNewApp.requestData).then(function (versionsResult) {
					depNewApp.versionsOptions = versionsResult.data;
					$scope.isLoadingNexusVersion = false;
				});
				depNewApp.clearChildField('artifact');
			};
			depNewApp.createNewJob = function (){
				$rootScope.$emit("CREATE_NEW_JOB");
				$rootScope.createChefJob=true;
			};
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
						depNewApp.tagOptions=[];
						depNewApp.newEnt.ContNameId='';
						depNewApp.newEnt.contPort='';
						depNewApp.newEnt.tag='';
						depNewApp.newEnt.repositoryIMG='';
						break;
					case 'repository' :
						depNewApp.newEnt.groupId='';
						depNewApp.newEnt.artifact= '';
						depNewApp.newEnt.version ='';
						depNewApp.artifactsOptions=[];
						depNewApp.versionsOptions=[];
						depNewApp.tagOptions=[];
						depNewApp.newEnt.tag='';
						break;
					case 'groupId' :
						depNewApp.newEnt.artifact = '';
						depNewApp.newEnt.version ='';
						depNewApp.versionsOptions=[];
						break;
					case 'artifact' :
						depNewApp.newEnt.version ='';
						break;
				}
			};
			depNewApp.submitAppDeploy = function (){
				depNewApp.deploymentData ={
					"sourceData": {
					},
					"appData": {
						"projectId":workEnvt.getEnvParams().proj,
						"envName": items.paramNames.env,
						"appName":depNewApp.newEnt.repository,
						"version":(depNewApp.newEnt.serverType === 'nexus')?depNewApp.newEnt.version :depNewApp.newEnt.tag
					},
					"task": {
						"taskId": depNewApp.jobOptions[depNewApp.newEnt.jobInd]._id,
						"nodeIds": depNewApp.jobOptions[depNewApp.newEnt.jobInd].taskConfig.nodeIds
					}
				};
				if(depNewApp.newEnt.serverType === 'nexus'){
					depNewApp.deploymentData.appData.appName=depNewApp.newEnt.artifact;
					depNewApp.deploymentData.sourceData.nexus={
						"repoURL":depNewApp.artifactsVersion[depNewApp.newEnt.artifact][depNewApp.newEnt.version].resourceURI,
						"version": depNewApp.newEnt.version,
						"artifactId":depNewApp.newEnt.artifact,
						"groupId": depNewApp.newEnt.groupId,
						"repository":depNewApp.newEnt.repository,
						"rowId":depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid
					};
				}else{
					depNewApp.deploymentData.sourceData.docker={
						"image": depNewApp.newEnt.repositoryIMG,
						"containerName": depNewApp.newEnt.ContNameId,
						"containerPort": depNewApp.newEnt.contPort,
						"hostPort": depNewApp.newEnt.hostPort,
						"imageTag": depNewApp.newEnt.tag,
						"rowId":depNewApp.serverOptions[depNewApp.newEnt.serverTypeInd].rowid
					};
				}
				$scope.isLoadingNewApp=true;
				workSvs.postAppDeploy(depNewApp.deploymentData).then(function(deployResult){
					$scope.isLoadingNewApp=false;
					depNewApp.deployResult=deployResult.data;
					depNewApp.taskLog();
					$timeout(function () {$modalInstance.close();},400);
				});
			};
			depNewApp.taskLog=function(){
				$modal.open({
					animation: true,
					templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
					controller: 'orchestrationLogCtrl as orchLogCtrl',
					backdrop: 'static',
					keyboard: false,
					resolve: {
						items: function() {
							return {
								taskId: depNewApp.deployResult.taskId,
								historyId: depNewApp.deployResult.historyId,
								taskType: depNewApp.deployResult.taskType
							};
						}
					}
				});
			};
			// call job api after creating new job .
			$rootScope.$on("GET_ALL_TASK", function(){
				depNewApp.getAllChefJobs();
				$rootScope.createChefJob = false;
			});
			depNewApp.init();
			return depNewApp;
		}
	]);
})(angular);
