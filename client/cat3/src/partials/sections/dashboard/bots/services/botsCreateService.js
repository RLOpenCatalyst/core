(function (angular) {
    "use strict";
    angular.module('bots.paramService',[])
        .service('botsCreateService',['$rootScope','$http','$q','toastr', 'genericServices', function ($rootScope,$http,$q,toastr,genericServices) {
        	var botService = this;
        	//for getting the list of templates.
        	botService.getCurrentEnvInstances = function (orgId,bgId,projId,envId) {
				var params = {
					url: '/organizations/' + orgId + '/businessgroups/' + bgId +
					'/projects/' + projId + '/environments/' + envId + '/instances',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			botService.getBOTDetails = function(botId) {
				var params = {
					url: '/botsNew?filterBy=_id:' + botId,
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
			
        }]);
})(angular);