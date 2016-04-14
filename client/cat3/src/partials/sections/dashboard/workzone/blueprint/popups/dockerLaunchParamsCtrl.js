/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */


//dockerModuleCtrl.$inject = ['$scope','workzoneServices','items'];

(function(angular) {
    "use strict";
    angular.module('workzone.blueprint')
    .controller('dockerLaunchParamsCtrl', ['$scope', '$modal' , 'workzoneServices','$q' , 'items', function($scope, $modal , workzoneServices, $q , items) {
        $scope.dockerDetails = [];
        var dockerParams = items.blueprintConfig.dockerCompose;
        dockerParams.forEach(function(k, v) {
            /*var uniqueid = (Math.floor(Math.random() * 9000) + 1000) + '-' + (Math.floor(Math.random() * 9000) + 1000); //$.now();
            $scope.uniqueid = uniqueid;*/
            $scope.dockerDetails.push(dockerParams[v]);
        });
        //call made to get the instance details.
        workzoneServices.getCurrentSelectedEnvInstanceList().then(function(response) {
            var data;
            data = response.data.instances;
            $scope.instanceData = data;
        });

        $scope.launchParam = function(launchObj) {
            var modalInstance = $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/dockerParams.html',
                controller: 'dockerParamsCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return launchObj;
                    }
                }
            });
            modalInstance.result.then(function(selectedItem) {
                $scope.selected = selectedItem;
            }, function() {
                console.log('Modal Dismissed at ' + new Date());
            });
        };
        
        $scope.viewLogs = function(instanceObj) {
            var _viewLogs = function(resolve, reject) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/instance/popups/instancelog.html',
                    controller: 'dockerInstanceLogsCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return instanceObj;
                        }
                    }
                });
                modalInstance.result.then(function(modalClose) {
                    resolve(modalClose);
                }, function(modalCancel) {
                    reject(modalCancel);
                });
            };
            return $q(_viewLogs);
        };

        var  index = 0, // points to the current step in the steps array
             steps = $scope.steps = [{
                'isDisplayed':true,
                'name':'dockerimages',
                'title':'Docker Images'
             },
             {
                'isDisplayed':false,
                'name':'instances',
                'title':'Instances'
             }];
        
        $scope.nextEnabled = true;
        $scope.previousEnabled = false;
        $scope.submitEnabled = false;
       
        $scope.next = function() {
            if (steps.length === 0) {
                console.debug('No steps provided.');
                return;
            }
            // If we're at the last step, then stay there.
            if (index == steps.length - 1) {
                return;
            }

            steps[index++].isDisplayed = false;
            steps[index].isDisplayed = true;
            $scope.setButtons();
        }; // $scope.next

        /*
         * Moves to the previous step
         */
        $scope.previous = function() {
            if (steps.length === 0) {
                console.debug('No steps provided.');
                return;
            }

            if (index === 0) {
                console.debug('At first step');
                return;
            }
            steps[index--].isDisplayed = false;
            steps[index].isDisplayed = true;
            $scope.setButtons();
        }; // $scope.previous

        $scope.submit = function() {
            $scope.submitAction();
        };

        /*
         * Adds a step to the end of the step list and
         * sets the index to 0 if it's the first step added.
         */
        

        /*
         * Sets the correct buttons to be enabled or disabled.
         */
        $scope.setButtons = function() {
            if (index == steps.length - 1) {
                $scope.nextEnabled = false;
                $scope.previousEnabled = true;
                $scope.submitEnabled = true;
            } else if (index === 0) {
                $scope.previousEnabled = false;
                $scope.nextEnabled = true;
                $scope.submitEnabled = false;
            } else {
                $scope.nextEnabled = true;
                $scope.previousEnabled = true;
                $scope.submitEnabled = false;
            }
        };
    }])
})(angular);

