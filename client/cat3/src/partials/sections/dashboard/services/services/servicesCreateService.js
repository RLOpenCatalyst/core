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

			serviceCreate.postAuthenticateResource = function (resourceId,services) {
				var params = {
					url: '/resources/' + resourceId + '/authentication',
					data: services
				};
				return genericServices.promisePost(params);
			};

            serviceCreate.postBootStrapResource = function (resourceId,services) {
                var params = {
                    url: '/resources/' + resourceId + '/bootStrap',
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

			serviceCreate.getServices = function(page, pageSize, sortBy, sortOrder) {
				var params = {
					url: '/services?version=latest&page=' + page +'&pageSize=' + pageSize +'&sortBy=' + sortBy +'&sortOrder=' + sortOrder,
					inlineLoader: true
				}
				return genericServices.promiseGet(params); 	
			};

			serviceCreate.getResources = function(serviceName) {
				var params = {
					url: '/services/' + serviceName + '/resources?version=latest',
					inlineLoader: true
				}
				return genericServices.promiseGet(params); 	
			};

			serviceCreate.deleteService = function(serviceId) {
				var params = {
					url: '/services/' + serviceId,
					inlineLoader: true
				}
				return genericServices.promiseDelete(params); 	
			};

			serviceCreate.getTemplates = function() {
				var params = {
					url: 'src/partials/sections/dashboard/services/template.json',
					inlineLoader: true
				}
				return genericServices.promiseGet(params); 	
			};

        }]);
})(angular);