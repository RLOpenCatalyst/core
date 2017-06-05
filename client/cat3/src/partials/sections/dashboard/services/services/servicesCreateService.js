(function (angular) {
    "use strict";
    angular.module('services.paramsServices',[])
        .service('servicesCreateService',['$rootScope','$http','$q','toastr', 'genericServices', function ($rootScope,$http,$q,toastr,genericServices) {
        	var serviceCreate = this;
			serviceCreate.postCreateService = function (services) {
				var params = {
					url: '/services',
					data: services
				};
				return genericServices.promisePost(params);
			};

			serviceCreate.getMonitorList = function (orgId) {
				var url = '/monitors';
				if(orgId){
					url += '?filterBy=orgId:' + orgId;
				}
				var params = {
					url: url,
					inlineLoader: true	
				};
				return genericServices.promiseGet(params); 
			};

			serviceCreate.getConfigManagementList = function(orgId) {
				var params = {
					url: '/d4dMasters/organization/' + orgId + '/configmanagement/list',
					inlineLoader: true
				}
				return genericServices.promiseGet(params); 
			};

        }]);
})(angular);