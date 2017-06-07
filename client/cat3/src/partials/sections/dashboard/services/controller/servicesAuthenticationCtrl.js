/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2017
 */
(function(angular) {
        "use strict";
        angular.module('dashboard.services')
        .controller('servicesAuthenticationCtrl', ['$scope', '$rootScope', 'items', '$state', 'servicesCreateService', 'toastr', function($scope, $rootScope, items, $state, servicesCreateService, toastr) {
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
                    console.log(reqBody);
                    servicesCreateService.postAuthenticateResource(items.serviceSelected.id, items.resourceObj.id, reqBody).then(function (response) {
                        if (response) {
                            toastr.success('Authentication success');
                            $state.go('dashboard.services.servicesList');
                        }
                    });
                };
                if ($scope.passwordModel === "password") {
                    reqBody.credentials.type = 'password';
                    reqBody.credentials.password = $scope.IMGNewEnt.password;
                    $scope.postAuthenticationResource();
                } else {
                    $scope.pemFileSelection($scope.pemfile);
                }
                $scope.addPemText = function (pemfileText) {
                    reqBody.credentials.type = 'pemFile';
                    reqBody.credentials.pemFileData = pemfileText;
                    console.log(reqBody);
                    $scope.postAuthenticationResource();
                };
            };

        }]);
})(angular);