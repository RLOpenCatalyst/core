/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.design').
    controller('servicesCreateCtrl',['$scope', '$rootScope', '$state', '$http', 'genericServices','toastr', 'servicesCreateService', function ($scope, $rootScope, $state, $http, genericServices, toastr, servicesCreateService) {
    	$scope.isNewServicePageLoading = true;
        var treeNames = ['Design','Services','Service Create'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        $rootScope.filterhide= $state.params.filterhide;
        $rootScope.showForDesign= $state.params.showForDesign;
        var reqBody = {};
        $scope.showTemplate = false;
        $scope.templateSelection = false;
        var index = 0, // points to the current step in the steps array
        steps = $scope.steps = [{
            'isDisplayed': true,
            'name': 'service details'
        }, {
            'isDisplayed': false,
            'name': 'yaml details'
        },{
            'isDisplayed': false,
            'name': 'preview'
        }];
        $scope.nextEnabled = false;
        $scope.previousEnabled = true;
        $scope.isNextVisible = true;
        $scope.isSubmitVisible = false;
        $scope.step1Active = true;
        $scope.step2Active = false;
        $scope.step3Active = false;

        $scope.getTemplates = function() {
            $scope.getYamlDetails = {};
            $scope.getTemplatesName = [];
            servicesCreateService.getTemplates().then(function(response){
                if(response) {
                    $scope.getTemplateDetails = response;
                    $scope.templateSelection = true;
                    $scope.showYaml(response[0]);
                }
            });
        };

        $scope.showYaml = function(templateObject) {
            $scope.errorDisplay = false;
            $scope.templateSelected = templateObject;
            var params = {
                url:templateObject.yamlPath
            };
            genericServices.promiseGet(params).then(function(result){
                $scope.getYamlDetails = $scope.yamlResult = result;
                try {
                   $scope.yamlErrorDetails = jsyaml.load($scope.getYamlDetails);
                } 
                catch(error) {
                   $scope.errorDisplay = true;
                   $scope.yamlErrorDetails =  error.message;  
                }
            });  
        };

        $scope.$watch('yamlResult', function(){
            $scope.errorDisplay = false;
            try {
                $scope.yamlErrorDetails = jsyaml.load($scope.yamlResult);
            }
            catch(error) {
                $scope.errorDisplay = true;
                $scope.yamlErrorDetails =  error.message;
            }
        });

        $scope.configSelect = function() {
            if($scope.yamlSelection === 'chooseTemplate') {
                $scope.getTemplates();
                $scope.nextEnabled = true;
            } else {
                $scope.yamlResult = null;
                $scope.nextEnabled = false;
            }
        };

        $scope.setFile = function(element) {
        $scope.$apply(function($scope) {
                $scope.theFile = element.files[0];
            });
        };

        $scope.clearFile = function() {
            angular.element("input[type='file']").val(null);
            $scope.theFile = {};
            $scope.nextEnabled = false;
        };
    
        angular.extend($scope, {
            /* Moves to the next step*/
            next : function () {
                if (steps.length === 0) {
                    return;
                }
                // If we're at the last step, then stay there.
                if (index === steps.length - 1) {
                    return;
                }
                steps[index++].isDisplayed = false;
                steps[index].isDisplayed = true;
                $scope.setButtons();
            },
            /* Moves to the previous step*/
            previous : function () {
                if (steps.length === 0) {
                    return;
                }
                if (index === 0) {
                    $state.go('dashboard.design.servicesList');
                    return;
                }
                steps[index--].isDisplayed = false;
                steps[index].isDisplayed = true;
                $scope.setButtons();
            },
            /* Sets the correct buttons to be enabled or disabled.*/
            setButtons : function() {
                if (index === steps.length - 1) {
                    $scope.step2Active = true;
                    $scope.step1Active = false;
                    $scope.step3Active = true;
                    $scope.isNextVisible = false;
                    $scope.isSubmitVisible = true;
                    $scope.saveEnabled = true;
                    $scope.previousEnabled = true;
                } else if(index === 1) {
                    $scope.isNextVisible = false;
                    $scope.step2Active = true;
                    $scope.step1Active = false;
                    $scope.step3Active = false;
                    $scope.previousEnabled = true;
                    if($scope.yamlSelection !== undefined) {
                        $scope.nextEnabled = true;    
                    } else {
                        $scope.nextEnabled = false;
                    }
                    $scope.isNextVisible = true;
                    $scope.isSubmitVisible = false;
                } else if (index === 0) {
                    $scope.isNextVisible = true;
                    $scope.isSubmitVisible = false;
                    $scope.step2Active = false;
                    $scope.step1Active = true;
                    $scope.step3Active = false;
                    //disabling the card selected state.
                    $scope.previousEnabled = true;
                    if($scope.serviceName) {
                        $scope.nextEnabled = true;
                    } else {
                        $scope.nextEnabled = false;
                    }
                } else {
                    $scope.nextEnabled = true;
                    $scope.previousEnabled = true;
                }
            }
        });  

        $scope.$watch('serviceName', function() {
            if($scope.serviceName){
                $scope.nextEnabled = true;
            } else {
                $scope.nextEnabled = false;
            }
        });

        $scope.$watch('yamlfile', function() {
            if($scope.yamlfile){
                $scope.nextEnabled = true;
            } else {
                $scope.nextEnabled = false;
            }
        });  

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
        };

        $scope.postServices = function() {
        	reqBody = {
        		name:$scope.serviceName,
        		desc:$scope.serviceDescription,
        		masterDetails:{
        			orgId:$scope.IMGNewEnt.org.orgid,
        		    bgId:$scope.IMGNewEnt.buss.rowid,
        		    projectId:$scope.IMGNewEnt.proj.rowId,
        		    envId:$scope.IMGNewEnt.env.rowid,
        		    configId:$scope.IMGNewEnt.serverTypeInd
        		},
        		monitorId:$scope.monitorId,
        		type:'Service'
        	}
        	if($scope.yamlfile){//will be true if a file chosen by user 
                var formData = new FormData();
                formData.append('file',  $scope.yamlfile);
                $http.post('/fileUpload', formData, { transformRequest: angular.identity,headers: {'Content-Type': undefined}}).then(function (response) {
                    if(response) {
                        var yamlfileId = response.data.fileId;
                        reqBody.fileId = yamlfileId;
                        reqBody.source = 'file';
                        servicesCreateService.postCreateService(reqBody).then(function(response){
                            toastr.success('Service created successfully');
                            $state.go('dashboard.design.servicesList');
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