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
					url: '/botsNew?filterBy=id:' + botId,
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
					url: '/botsNew/' + botId + '/bots-History/' + botsHistoryId +'/logs?' + urlParam,
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
					url: '/botsNew',
					data: bots
				};
				return genericServices.promisePost(params);
			};

			botService.getScriptList = function (scriptType) {
				var params = {
					url: '/scripts?filterBy=scriptType:'+scriptType,
					inlineLoader: true	
				}
				return genericServices.promiseGet(params);
			};

			botService.getBlueprintList = function (orgId,templateType) {
				var params = {
					url: '/blueprints/list?filterBy=orgId:'+ orgId + ',templateType:'+templateType,
					inlineLoader: true	
				}
				return genericServices.promiseGet(params);
			};

			botService.syncIndividualBot = function(gitHubId,botId) {
				var params = {
					url: '/git-hub/' + gitHubId + '/content/' + botId,
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.getBotCategoryList = function () {
				var params = {
					url: '/config-data/category-type',
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.getBlueprintDetails = function(blueprintId) {
				var params = {
					url: '/blueprints/' + blueprintId,
					inlineLoader: true
				}
				return genericServices.promiseGet(params);
			};

			botService.botExecute = function(botId,reqBody) {
				var params = {
					url: '/botsNew/' + botId + '/execute',
					data: reqBody
				}
				return genericServices.promisePost(params);
			}
			
        }]);
})(angular);