/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('instanceImportByIpCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices','genericServices','$rootScope','workzoneEnvironment','toastr', function($scope, $modalInstance, items, workzoneServices,genSevs,$rootScope,workzoneEnvironment,toastr) {
			var configAvailable = items[0].data;
			var osList = items[1].data;
			var configList = items[2].data;
			var reqBody = {};
            $scope.region='';
            $scope.providerId='';
            $scope.cloudProviders=[];
            $scope.monitorList = [];

            var cloudParam={url:'/cloudProviders'};
            genSevs.promiseGet(cloudParam).then(function (response) {
                if(response){
                    $scope.cloudProviders=response;
                    }
                });

            //$scope.tagSerSelected = 'Monitoring';
			if (!configAvailable.length) {
				$scope.cancel();
				toastr.error('Chef Or Puppet is not Available');
				return false;
			}
			$scope.taggingServerList=[];
	        workzoneServices.getTaggingServer().then(function (topSer) {
	            $scope.taggingServerList=topSer.data;
	        });
	        $scope.monitorId = 'null';
	        var p = workzoneEnvironment.getEnvParams();
	        workzoneServices.getMonitorList(p.org).then(function (response) {
	        	$scope.monitorList = response.data;
	        	for(var i=0; i<$scope.monitorList.length; i++){
		        	if($scope.monitorList[i].isDefault){
		        		$scope.monitorId = $scope.monitorList[i]._id;
		        		break;
		        	}
		        }
	        });
			$scope.tagServerChecking = function() {
				if($scope.tagServerCheck){
					$scope.tagServerStatus = true;
				}else{
					$scope.tagServerStatus = false;
				}
			};
			angular.extend($scope, {
				osList: osList,
				configList: configList,
				isPemActive: 'password',
				os: '',
				pemfile: '',
				username: '',
				passwordModel: '',
				ipAddress: '',
				appLinkSecondOption: false,
				selectedConfig: configList[0].rowid,
				importErrorMessage: '',
				pemFileSelection: function($event) {
					if (FileReader) {
						var fileContent = new FileReader();
						fileContent.onload = function(e) {
							$scope.addPemText(e.target.result);
						};
						fileContent.onerror = function(e) {
							toastr.error(e);
						};
						fileContent.readAsText($event);
					} else {
						toastr.error('HTMl5 File Reader is not Supported. Please upgrade your browser');
					}
				},
				ok: function() {
					if($scope.monitorId === 'null') {
		                $scope.monitorId = null;
		            }

					var index;
					if($scope.providerId !==  "No Provider"){
						for(var i=0;i<$scope.cloudProviders.length;i++){
							if($scope.cloudProviders[i]._id === $scope.providerId){
								index = i;
								i=$scope.cloudProviders.length;
							}
						}
					}

					console.log($scope.cloudProviders);

                    reqBody.providerType =$scope.cloudProviders[index].providerType


                    reqBody.providerid=$scope.providerId;
                    reqBody.region=$scope.region;
					reqBody.fqdn = $scope.ipAddress;
					reqBody.os = $scope.os;
					reqBody.configManagmentId = $scope.selectedConfig;
					reqBody.monitorId = $scope.monitorId;
					if($scope.tagServerCheck) {
						reqBody.tagServer = $scope.tagSerSelected;
					}
					reqBody.credentials = {
						username: $scope.username
					};
					var appUrls = [];
					$.each($scope.app, function(index, element) {
						if (element.name && element.url) {
							appUrls.push({
								name: element.name,
								url: element.url
							});
						}
					});
					if (appUrls.length) {
						reqBody.appUrls = appUrls;
					}
					$scope.isSubmitLoading = true;
					//post method for import by ip
					$scope.postMethodImportByIp = function(){
						workzoneServices.postImportByIP(workzoneEnvironment.getEnvParams(),reqBody)
						.then(function(response) {
							if(response.data){
								$modalInstance.close(response.data);
							}
						},function(response){
							$scope.isSubmitLoading = false;
                            if(response.data.message){
                                $scope.importErrorMessage = response.data.message;
                            }else{
                                $scope.importErrorMessage = response.data;
                            }
						});
					};
					if ($scope.isPemActive === "password") {
						reqBody.credentials.password = $scope.passwordModel;
						$scope.postMethodImportByIp();	
					} else {
						$scope.pemFileSelection($scope.pemfile);
					}
					$scope.addPemText = function(pemfileText){
						reqBody.credentials.pemFileData = pemfileText;
						$scope.postMethodImportByIp();
					};
				},
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
				app: [{
					name: '',
					url: ''
				}, {
					name: '',
					url: ''
				}]
			});
			//system default configuration variables
		}
	]);
})(angular);