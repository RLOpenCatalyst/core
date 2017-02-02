/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('apis.workzone',['authentication', 'utility.pagination'])
		.service('workzoneEnvironment', [function () {
			var requestParams;
			var env = {
				setParams: function (params) {
					requestParams = params;
				},
				getParams: function () {
					return requestParams;
				}
			};
			return {
				setEnvParams: env.setParams,
				getEnvParams: env.getParams
			};
		}])
		.service('workzoneServices', ['$http', 'session', 'workzoneEnvironment', 'paginationUtil', function ($http, Auth, workzoneEnvironment, paginationUtil) {
			var baseAPIUrl = uiConfigs.serverUrl;
			function fullUrl(relUrl){
				return baseAPIUrl + relUrl;
			}
			var serviceInterface = {
				getTree: function () {
					var url = '/organizations/getTreeForbtv';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*applicationsCtrl*/
				getAppPipeLineForProj: function () {
					var url = '/cat3/data/app_deploy_env_application.json';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				postPipeLineConfiguration: function () {
					var url = '/app-deploy-pipeline/save/appConfigPipeLineData';
					return $http.post(fullUrl(url), Auth.getHeaderObject());
				},
				getAppCardLogs: function(instanceNodeIp, projId) {
					var url = '/instances/' + instanceNodeIp + '/project/' + projId + '/logs';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getApplicationHistoryForEnv: function (envName, projId,pagiOpti) {
					var pageiReq=paginationUtil.pageObjectToString(pagiOpti);
					var url = '/app-deploy/project/' + projId + '/env/'+ envName +'/appDeployHistoryList'+pageiReq;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getApplicationHistoryLogs: function(appId) {
					var url = '/app-deploy/' + appId + '/logs';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getEnvConfig: function(projId) {
					var url = '/d4dMasters' + '/project/' + projId;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				postEnvConfig: function(reqBody) {
					var url = '/app-deploy-pipeline/save/appConfigPipeLineData';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				getUpdatedEnvConfig: function(projId) {
					var url = '/app-deploy-pipeline' + '/project/' + projId;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*azureArmCtrl*/
				getPaginatedARM: function(envParams,paginationParams) {
					var pageStr = paginationUtil.pageObjectToString(paginationParams);
					var url = '/organizations/' + envParams.org + '/businessgroups/' + envParams.bg + 
					'/projects/' + envParams.proj + '/environments/' + envParams.env + '/azureArmList'+pageStr;                    
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				removeARMDeployment: function (armId) {
					var url = '/azure-arm/' + armId;
					return $http.delete(fullUrl(url), Auth.getHeaderObject());
				},
				/*blueprintCtrl*/
				getCurrentEnvInstances: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +
					'/projects/' + p.proj + '/environments/' + p.env + '/instances';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getBlueprints: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/blueprints/organization/' + p.org + '/businessgroup/' + p.bg + 
					'/project/' + p.proj;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				blueprintInfo: function (blueprintID) {
					var url = '/blueprints/' + blueprintID + '/blueprintInfo';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				deleteBlueprint: function (blueprintID) {
					var url = '/blueprints/' + blueprintID;
					return $http.delete(fullUrl(url), Auth.getHeaderObject());
				},
				launchBlueprint: function (blueprintID, version, envId, stackName,domainName, tagServer, monitorId, tagSetStr) {
					var url = '/blueprints/' + blueprintID + '/launch?version=' + version +
							'&envId=' + envId + '&stackName=' + stackName + '&domainName=' + domainName + '&tagServer=' + tagServer + '&monitorId=' + monitorId + '&tagSetStr='+tagSetStr;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getBlueprintById: function(blueprintId) {
					var url = '/blueprints/' + blueprintId;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*containerCtrl*/
				getDockerContainers: function (envParams,paginationParams) {
					var pageStr = paginationUtil.pageObjectToString(paginationParams);
					var url = '/organizations/' + envParams.org + '/businessgroups/' + envParams.bg + 
					'/projects/' + envParams.proj + '/environments/' + envParams.env + '/containerList'+pageStr;                    
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getDockerMoreInfo: function (instanceId,containerId) {
					var url = '/instances/dockercontainerdetails/' + instanceId + '/' + containerId;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				checkDockerActions: function (instanceId, containerId, action) { //serviceInterface.checkDockerActions = function (obj, action) {
					var url = '/instances/dockercontainerdetails/' + instanceId + '/' + containerId + '/' + action;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*instanceCtrl*/
				getPaginatedInstances: function(envParams,paginationParams,filterBy) {
					var pageStr = paginationUtil.pageObjectToString(paginationParams);
					var url = '/organizations/' + envParams.org + '/businessgroups/' + envParams.bg + 
					'/projects/' + envParams.proj + '/environments/' + envParams.env + '/instanceList'+pageStr;                    
                    if(filterBy){
                       url += '&filterBy=' + filterBy;
                    }
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getCheckIfConfigListAvailable: function () {
					var url = '/d4dMasters/readmasterjsonnew/10';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getOSList: function () {
					var url = '/vmimages/os/type/all/list';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getConfigListForOrg: function (orgId) {
					var url = '/d4dMasters/organization/' + orgId +
							'/configmanagement/list';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				postInstanceNameUpdate: function (instanceId, instanceName) {
					var url = '/instances/' + instanceId + '/updateName';
					return $http.post(fullUrl(url), instanceName, Auth.getHeaderObject());
				},
				postImportByIP: function (urlParams, reqBody) {
					var url = '/organizations/' + urlParams.org + '/businessgroups/' +
							urlParams.bg + '/projects/' + urlParams.proj + '/environments/' +
							urlParams.env + '/addInstance';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				postLaunchDockerBlueprint : function(instid,repopath,reqBody){
					var url = '/instances/dockercompositeimagepull/' + instid + '/' + repopath;
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				getInstanceLogs: function (instanceId, timestamp) {
					var urlParam = '';
					if (timestamp) {
						urlParam = timestamp;
					}
					var url = '/instances/' + instanceId + '/logs' + urlParam;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*controlPanelCtrl*/
				getChefServerDetails: function (chefServerId) {
					var url = '/d4dMasters/19/chefserverid/' + chefServerId;
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				getInstanceActionLogs: function (instanceId) {
					var url = '/instances/' + instanceId + '/actionLogs';
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				getActionHistoryLogs: function (instanceId, actionId) {
					var url = "/instances/" + instanceId + '/actionLogs/' + actionId + '/logs';
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				getInstanceDetails: function (instanceId) {
					var url = '/instances/' + instanceId;
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				convertToWorkstation: function (instanceId) {
					var url = '/instances/' + instanceId + '/setAsWorkStation';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getServiceCommand: function () {
					var url = '/d4dMasters/19/commandtype/Service%20Command';
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				getImageDetails: function (imageId) {
					var url = '/vmimages/' + imageId;
					return $http.get(fullUrl(url), Auth.getHeaderObject);
				},
				postRetrieveTasksDetails: function (_taskIds) {
					var reqBody = {
						taskIds: _taskIds
					};
					var url = '/tasks/';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				createAppUrl: function (instanceId, reqBody) {
					var url = '/instances/' + instanceId + '/appUrl';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				updateAppUrl: function (instanceId, appUrlId, reqBody) {
					var url = '/instances/' + instanceId + '/appUrl/' + appUrlId + '/update';
					return $http.post(fullUrl(url), reqBody, appUrlId, Auth.getHeaderObject());
				},
				deleteAppUrl: function (instanceId, appUrlId) {
					var url = '/instances/' + instanceId + '/appUrl/' + appUrlId;
					return $http.delete(fullUrl(url), Auth.getHeaderObject());
				},
				postRetrieveServiceDetails: function (_serviceIds) {
					var reqBody = {
						serviceids: _serviceIds
					};
					var url = '/d4dMasters/getrows/19';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				getDoServiceActionOnInstance: function (instanceId, serviceRowId, actionType) {
					var url = '/instances/' + instanceId + '/services/' + serviceRowId + '/' + actionType;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				deleteServiceOnInstance: function (instanceId, serviceRowId) {
					var url = '/instances/' + instanceId + '/services/' + serviceRowId;
					return $http.delete(fullUrl(url), Auth.getHeaderObject());
				},
				getInspectSoftware: function (instanceId) {
					var url = '/instances/' + instanceId + '/inspect';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				/*orchestrationCtrl*/
				getPaginatedTasks: function(envParams,paginationParams) {
					var pageStr = paginationUtil.pageObjectToString(paginationParams);
					var url = '/organizations/' + envParams.org + '/businessgroups/' + envParams.bg + 
					'/projects/' + envParams.proj + '/environments/' + envParams.env + '/taskList'+pageStr;                    
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				postRetrieveDetailsForInstanceNames: function (nodeIds) {
					return $http.post('/instances/', nodeIds, Auth.getHeaderObject());
				},
				getHistory: function (taskid) {
					var url = '/tasks/' + taskid + '/history';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getJenkinsLogs: function (taskId, jobname, buildId) {
					var url = '/jenkins/' + taskId + '/jobs/' + jobname + '/builds/' +
							buildId + '/output';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getChefJobLogs: function (instanceId, actionId, timestamp, timestampEnded) {
					var urlParams = '';
					if (timestamp) {
						urlParams = 'timestamp=' + timestamp;
					}
					if(timestamp && timestampEnded) {
						urlParams = 'timestamp=' + timestamp  + '&timestampEnded=' + timestampEnded;
					}
					var url = "/instances/" + instanceId + '/actionLogs/' + actionId +
							'/logs?' + urlParams;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getTaskHistoryItem : function(taskId, historyId){
					var url = '/tasks/' + taskId + '/history/' + historyId;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getJenkinsServerList: function () {
					var url = '/jenkins/';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getJenkinsServerJobList: function (jenkinsServerId) {
					var url = '/jenkins/' + jenkinsServerId + '/jobs';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getJenkinsJobDetails: function (jenkinsServerId, jobname) {
					var url = '/jenkins/' + jenkinsServerId + '/jobs/' + jobname;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				runTask: function (taskId, reqBody) {
					var url = '/tasks/' + taskId + '/run';
					return $http.post(fullUrl(url), reqBody, Auth.getHeaderObject());
				},
				deleteTask: function (taskId) {
					return $http({
						method: "delete",
						url: fullUrl('/tasks/' + taskId),
						async: false
					});
				},
				getEnvironmentTaskList: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +
							'/projects/' + p.proj + '/environments/' + p.env + '/tasks';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				postNewTask: function (data) {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +
							'/projects/' + p.proj + '/environments/' + p.env + '/tasks';
					return $http.post(fullUrl(url), data, Auth.getHeaderObject());
				},
				getScriptList: function (scriptType) {
					var url = '/scripts?filterBy=scriptType:'+scriptType;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				updateTask: function (data, id) {
					var url = '/tasks/' + id + '/update';
					return $http.post(fullUrl(url), data, Auth.getHeaderObject());
				},
				deleteInstance: function (instanceID) {
                    var url = '/instances/' + instanceID;
                    return $http.delete(fullUrl(url), Auth.getHeaderObject());
                },
				startInstance: function (instanceID) {
					var url = '/instances/' + instanceID + '/startInstance';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				stopInstance: function (instanceID) {
					var url = '/instances/' + instanceID + '/stopInstance';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getPaginatedCFT: function(envParams,paginationParams) {
					var pageStr = paginationUtil.pageObjectToString(paginationParams);
					var url = '/organizations/' + envParams.org + '/businessgroups/' + envParams.bg + 
					'/projects/' + envParams.proj + '/environments/' + envParams.env + '/cftList'+pageStr;                    
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				deleteCloudFormation: function (cftIT) {
					var url = '/cloudformation/' + cftIT;
					return $http.delete(fullUrl(url), Auth.getHeaderObject());
				},
				getCftEventsInfo: function (stackid) {
					var url = '/cloudformation/' + stackid + '/events';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getInstanceData: function (inst) {
					console.log(inst._id);
					var url = "/instances/" + inst._id;
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getCookBookListForOrg: function (orgId) {
					if(!orgId){
						var p = workzoneEnvironment.getEnvParams();
						orgId = p.org;
					}
					var url='/organizations/'+orgId+'/chefRunlist';
					return $http.get(url,Auth.getHeaderObject());
				},
				getSoftwareTemplatesForOrg: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/d4dMasters/org/' + p.org + '/templateType/SoftwareStack/templates';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getcookBookAttributes: function (data, chefServerId) {
					//TODO. Request body to be expanded for roles also
					var reqBody = {
						cookbooks: data
					};
					var url = '/chef/servers/' + chefServerId + '/attributes';
					return $.post(fullUrl(url), reqBody);
				},
				getOrgTasks: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +
							'/projects/' + p.proj + '/environments/' + p.env + '/tasks';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				addInstanceTask: function (instanceID, data) {
					var url = "/instances/" + instanceID + "/addTask";
					return $http.post(fullUrl(url), data, Auth.getHeaderObject());
				},
				addInstanceService: function (instanceID, data) {
					var url = "/instances/" + instanceID + "/services/add";
					return $.post(fullUrl(url), data);
				},
				updateChefRunlist: function (instanceId, data) {
					var url = "/instances/" + instanceId + "/updateRunlist";
					return $.post(fullUrl(url), data);
				},
				confirmUpdateRunlists: function (instanceId) {
					return instanceId;
				},
				updatePuppetRunlist: function (instanceId) {
					var url = "/instances/" + instanceId + "/updateRunlist";
					return $.post(fullUrl(url));
				},
				postTasksDetails :function(tasksIds){
					var URL='/tasks';
					return $http.post(fullUrl(URL),{taskIds:tasksIds});
				},
				repositoryServerList:function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/d4dMasters/organization/' + p.org + '/repositoryServer/list';
					return $http.get(fullUrl(url));
				},
				getJobTask: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +
						'/projects/' + p.proj + '/environments/' + p.env + '/tasks';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getChefJob: function () {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +'/projects/' + p.proj + '/environments/' + p.env + '/chefTasks';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				 getChefJobEnv: function (env) {
					var p = workzoneEnvironment.getEnvParams();
					var url = '/organizations/' + p.org + '/businessgroups/' + p.bg +'/projects/' + p.proj + '/environments/' +env + '/chefTasks';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getNexusRepository:function(nexusId){
					var p = workzoneEnvironment.getEnvParams(),
						url = '/app-deploy/nexus/'+nexusId+'/project/' + p.proj + '/nexusRepositoryList';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getDockerRepository :function(){
					var p = workzoneEnvironment.getEnvParams(),
					url = '/d4dMasters/project/'+p.proj;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getNexusArtifacts:function(requestData){
					   var url = '/nexus/'+requestData.nexus+'/repositories/'+requestData.repositories+'/group/'+requestData.group+'/artifact';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getNexusVersions:function(requestData){
					var url = '/app-deploy/nexus/'+requestData.nexus+'/repositories/'+requestData.repositories+'/group/'+requestData.group+'/artifact/'+requestData.artifactId+'/versionList';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getPipelineConfig:function(requestEnv){
				   var url = '/app-deploy-pipeline/project/'+requestEnv.proj;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getPipelineView :function(requestEnv,pgOptions){
					var pageiReq=paginationUtil.pageObjectToString(pgOptions);
					var url = '/app-deploy/project/'+requestEnv.proj+'/appDeployList'+pageiReq;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getSummaryCard:function(requestEnv){
					var url = '/app-deploy/project/'+requestEnv.proj+'/pipeLineViewList';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getCardHistoryList :function(envDetails,version){
					var url= '/app-deploy/project/' + envDetails.params.proj + '/env/' + envDetails.envName + '/appDeployInstanceList?appName='+envDetails.appName.name+'&version='+version;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				postAppDeploy:function(RequestObject){
					var url='/app-deploy/new';
					return $http.post(fullUrl(url),RequestObject,Auth.getHeaderObject());
				},
				putAppDeploy:function(RequestObject){
					var url='/app-deploy/upgrade';
					return $http.put(fullUrl(url),RequestObject,Auth.getHeaderObject());
				},
				getDockerImageTags :function(requestObject) {
					var url='/d4dMasters/docker/'+requestObject.dockerId+'/repository/'+requestObject.repository+'/image/'+requestObject.image+'/tags';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				putAppPromote:function(RequestObject){
					var url='/app-deploy/promote';
					return $http.put(fullUrl(url),RequestObject,Auth.getHeaderObject());
				},
				getAppUpgrade:function(requestOject,version){
					var url ='/app-data/project/' + requestOject.params.proj + '/env/' + requestOject.envName + '?application='+requestOject.appName.name+'&version='+version;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				postAppApprove :function(RequestObject){
					var url='/deploy-permission/save/permissionData';
					return $http.post(fullUrl(url),RequestObject,Auth.getHeaderObject());
				},
				getAllEnv:function() {
					var url='/d4dMasters/readmasterjsonnew/4';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getApprove:function(argument,version){
					var url ='/deploy-permission/project/'+argument.params.proj+'/env/'+argument.envName+'/permissionList?appName='+argument.appName.name+'&version='+version;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				deleteCompsiteBlueprint:function (compositeBlueprintId) {
					var url ='/composite-blueprints/'+compositeBlueprintId;
					return $http.delete(fullUrl(url),Auth.getHeaderObject());
				},
				launchCompsiteBlueprint:function (compositeBlueprint) {
					var url ='/blueprint-frames/';
					return $http.post(fullUrl(url),compositeBlueprint,Auth.getHeaderObject());
				},
				getAllCompsiteBlueprint:function () {
					var p = workzoneEnvironment.getEnvParams();
					var url ='/composite-blueprints?filterBy=organizationId:'+p.org+'+businessGroupId:'+p.bg+'+projectId:'+p.proj;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getCompsiteBlueprintInfo:function (compositeBlueprintId) {
					var url ='/composite-blueprints/'+compositeBlueprintId;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
                getAllRegionsList: function () {
					var url = '/vmimages/regions/list';
					return $http.get(fullUrl(url), Auth.getHeaderObject());
				},
				getProviders:function () {
					var url ='/aws/providers';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
                getProviderRegions:function (providerId) {
					var url ='/aws/providers/'+providerId;
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
                getProviderVPCs:function (providerId, region) {
                    var reqBody = {
						providerId: providerId,
                        region: region
					};
                    var url ='/aws/providers/describe/vpcs';
					return $http.post(fullUrl(url),reqBody, Auth.getHeaderObject());
				},
				getManagedInstances:function (providerId) {
					var url ='/providers/'+providerId+'/managedInstances';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getAssignedInstances:function (providerId) {
					var url ='/providers/'+providerId+'/unmanagedInstances';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getUnassignedInstances:function (providerId) {
					var url ='/providers/'+providerId+'/unassigned-instances';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getBotTypeList:function () {
					var url ='/config-data/bots-type';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getTaggingServer:function () {
					var url ='/config-data/tagging-server';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getBotCategoryList:function () {
					var url ='/config-data/category-type';
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				},
				getMonitorList:function (orgId) {
					var url = '/monitors';
					if(orgId){
						url += '?filterBy=orgId:' + orgId;
					}
					return $http.get(fullUrl(url),Auth.getHeaderObject());
				}
			};
			return serviceInterface;
		}
	]);
})(angular);