(function (angular) {
    "use strict";
    angular.module('bots.paramService',[])
        .service('botsCreateService',['$rootScope','$http','$q','toastr', 'genericServices', function ($rootScope,$http,$q,toastr,genericServices) {
        	var botService = this;
        	//for getting the list of templates.
        	botService.getCurrentOrgInstances = function (orgId) {
				var params = {
					url: '/instances?filterBy=orgId:' + orgId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			botService.getBOTDetails = function(botId) {
				var params = {
					url: '/bot?filterBy=id:' + botId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			botService.getInstanceDetails = function (instanceId) {
				var params = {
					url: '/instances/' + instanceId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			botService.getBotLogs = function (botId, botsHistoryId, timestamp) {
				var urlParam = '';
				if (timestamp) {
					urlParam = 'timestamp=' + timestamp;
				}
				var params = {
					url: '/bot/' + botId + '/bot-History/' + botsHistoryId +'/logs?' + urlParam,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			botService.fileUpload = function (data,postFormat) {
				var params = {
					url: '/fileUpload?fileId=',
					data: data,
					postFormat: postFormat
				};
				return genericServices.promisePost(params);
			};

			botService.postCreateBots = function (bots) {
				var params = {
					url: '/bot',
					data: bots
				};
				return genericServices.promisePost(params);
			};

			botService.getScriptList = function (scriptType) {
				var params = {
					url: '/scripts?filterBy=type:'+scriptType,
					inlineLoader: true	
				};
				return genericServices.promiseGet(params);
			};

			botService.getBlueprintList = function (orgId,templateType,bpName) {
				var url = '/blueprints/list?filterBy=';
				if(orgId !== null) {
					url += 'orgId:' + orgId
				}
				if(templateType !== null) {
					url += ',templateType:' + templateType;	
				}
				if(bpName !== null) {
					url += ',name:' + bpName;	
				}
				var params = {
					url: url,
					inlineLoader: true	
				};
				return genericServices.promiseGet(params);
			};

			botService.syncIndividualBot = function(gitHubId,botId) {
				var params = {
					url: '/git-hub/' + gitHubId + '/content/' + botId,
					inlineLoader: true
				};
				return genericServices.promiseGet(params);
			};

			botService.getBotCategoryList = function () {
				var params = {
					url: '/config-data/category-type',
					inlineLoader: true
				};
				return genericServices.promiseGet(params);
			};

			botService.getBlueprintDetails = function(blueprintId) {
				var params = {
					url: '/blueprints/' + blueprintId,
					inlineLoader: true
				};
				return genericServices.promiseGet(params);
			};

			botService.botExecute = function(botId,reqBody) {
				var params = {
					url: '/bot/' + botId + '/execute',
					data: reqBody
				};
				return genericServices.promisePost(params);
			};

			botService.getJenkinsServerDetails = function() {
				var params = {
					url: '/jenkins',
					inlineLoader: true
				};
				return genericServices.promiseGet(params);
			};

			botService.getJenkinsLogs = function(taskId, jobname, buildNumber) {
				var params = {
					url: '/jenkins/' + taskId + '/jobs/' + jobname + '/builds/' +
						buildNumber + '/output',
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.getJenkinsServerJobList =  function (jenkinsServerId) {
				var params = {
					url : '/jenkins/' + jenkinsServerId + '/jobs',
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.getJenkinsJobDetails = function (jenkinsServerId, jobname) {
				var params ={
					url : '/jenkins/' + jenkinsServerId + '/jobs/' + jobname,
					inlineLoader: true	
				} 
				return genericServices.promiseGet(params);
			};

			botService.getGitHubDetails = function () {
				var params = {
					url: '/git-hub',
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.getGitHubSyncDetails = function (actionStatus, gitHubId, pageNumber, pageSize, sortBy, sortOrder) {
				var params ={
					url : '/git-hub/' + gitHubId + '/sync?action=' + actionStatus + '&page=' + pageNumber +'&pageSize=' + pageSize +'&sortBy=' + sortBy +'&sortOrder=' + sortOrder,
					inlineLoader: true	
				} 
				return genericServices.promiseGet(params);
			};

			botService.postBotSync = function(gitHubId,reqBody) {
				var params = {
					url: '/git-hub/' + gitHubId + '/copy',
					data: reqBody
				};
				return genericServices.promisePost(params);
			};

        }]);
})(angular);