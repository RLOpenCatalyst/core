/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.services')
    .controller('servicesCreateCtrl',['$scope', '$rootScope', '$state', '$http', 'genericServices','toastr', 'servicesCreateService', function ($scope, $rootScope, $state, $http, genericServices, toastr, servicesCreateService) {
    	$scope.isNewServicePageLoading = true;
        var treeNames = ['Services','Service Create'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        var reqBody = {};
        $scope.getConfigList = function(orgId) {
        	$scope.isConfigMonitorLoading = true;
        	$scope.configList = [];
        	servicesCreateService.getConfigManagementList(orgId).then(function(response){
        		$scope.configList = response;
        		if($scope.configList && $scope.configList.length >0) {
        			$scope.IMGNewEnt.serverTypeInd = $scope.configList[0].rowid;
        		} else {
        			$scope.IMGNewEnt.serverTypeInd = '';
        		}
        		$scope.isConfigMonitorLoading = false;
        	})
        }

        //for getting the org id and name
        if($rootScope.organObject && $rootScope.organObject.length > 0) {
            $scope.IMGNewEnt = {
                org:$rootScope.organObject[0],
                buss:$rootScope.organObject[0].businessGroups[0],
                proj:$rootScope.organObject[0].businessGroups[0].projects[0],
                env:$rootScope.organObject[0].businessGroups[0].projects[0].environments[0]
            };
        }

        $scope.getMonitorConfig = function(orgDetails) {
        	$scope.getMonitorList(orgDetails.orgid);
        	$scope.getConfigList(orgDetails.orgid);
        }

        $scope.monitorId = 'null';
        $scope.getMonitorList = function(orgId) {
        	$scope.isConfigMonitorLoading = true;
        	$scope.monitorList = [];
        	servicesCreateService.getMonitorList(orgId).then(function(response){
        		$scope.monitorList = response;
        		if($scope.monitorList && $scope.monitorList.length >0) {
        			for(var i=0; i<$scope.monitorList.length; i++){
			        	if($scope.monitorList[i].isDefault){
			        		$scope.monitorId = $scope.monitorList[i]._id;
			        		break;
			        	} 
			        }
        		} else {
	        		$scope.monitorId = 'null';
	        	}
	        	$scope.isConfigMonitorLoading = false;
        	});
        }

        $scope.postServices = function() {
        	reqBody = {
        		name:$scope.serviceName,
        		description:$scope.serviceDescription,
        		orgId:$scope.orgNewEnt.org.orgid,
        		bgId:$scope.orgNewEnt.buss.rowid,
        		projectId:$scope.IMGNewEnt.proj.rowId,
        		envId:$scope.IMGNewEnt.env.rowid,
        		monitorId:$scope.monitorId,
        		configId:$scope.IMGNewEnt.serverTypeInd
        	}
        	if($scope.yamlfile){//will be true if a file chosen by user 
                var formData = new FormData();
                formData.append('file',  $scope.yamlfile);
                $http.post('/fileUpload', formData, { transformRequest: angular.identity,headers: {'Content-Type': undefined}}).then(function (response) {
                    if(response) {
                        var yamlfileId = response.data.fileId;
                        reqBody.fileId = yamlfileId;
                        serviceCreateService.postCreateService(reqBody).then(function(response){
                            toastr.success('Service created successfully');
                            $state.go('dashboard.services.servicesList');
                        });
                    }
                });
            }
        }

        $scope.init = function() {
        	if($rootScope.organObject && $rootScope.organObject.length > 0) {
	        	$scope.getMonitorConfig($scope.IMGNewEnt.org);
	        }
	        $scope.isNewServicePageLoading = false;
        }
        $scope.init();
        
    }]);
})(angular);