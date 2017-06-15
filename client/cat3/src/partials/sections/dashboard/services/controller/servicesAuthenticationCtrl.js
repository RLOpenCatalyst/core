/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */
(function(angular) {
        "use strict";
        angular.module('dashboard.services')
        .controller('servicesAuthenticationCtrl', ['$scope', '$rootScope', 'items', '$state', 'servicesCreateService','$modalInstance', 'toastr', function($scope, $rootScope, items, $state, servicesCreateService, $modalInstance, toastr) {
            $scope.getItems = items;
            $scope.IMGNewEnt={
	            passType:'password'
	        };
            var reqBody = {};
            $scope.pemFileSelection = function($event) {
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
	        };

            $scope.ok = function() {
                reqBody.credentials = {};
                $scope.postAuthenticationResource = function () {
                    reqBody.credentials.username = $scope.IMGNewEnt.userName;
                    servicesCreateService.postAuthenticateResource(items.serviceSelected.id, items.resourceObj.id, reqBody).then(function (response) {
                        if (response) {
                            $modalInstance.close(response);
                            toastr.success(response.message);
                        }
                    });
                };
                if ($scope.IMGNewEnt.passType === "password") {
                    reqBody.credentials.type = 'password';
                    reqBody.credentials.password = $scope.IMGNewEnt.password;
                    $scope.postAuthenticationResource();
                } else {
                    $scope.pemFileSelection($scope.pemfile);
                }
                $scope.addPemText = function (pemfileText) {
                    reqBody.credentials.type = 'pemFile';
                    reqBody.credentials.pemFileData = pemfileText;
                    $scope.postAuthenticationResource();
                };
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            }

        }]);
})(angular);