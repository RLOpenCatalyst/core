/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */
(function(angular) {
    "use strict";
    angular.module('workzone.blueprint')
        .controller('dockerLaunchParamsCtrl', ['$scope', '$modal', '$modalInstance', 'workzoneServices', '$q', 'items', 'confirmbox', function($scope, $modal, $modalInstance, workzoneServices, $q, items, confirmbox) {
            angular.extend($scope, {
                cancel: function() {
                    $modalInstance.dismiss('cancel');
                },
            });
            //wizard data setting for step 1 and step 2.
            var index = 0, // points to the current step in the steps array
                steps = $scope.steps = [{
                    'isDisplayed': true,
                    'name': 'dockerimages',
                    'title': 'Docker Images'
                }, {
                    'isDisplayed': false,
                    'name': 'instances',
                    'title': 'Select Instance'
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
                if (index === steps.length - 1) {
                    return;
                }

                steps[index++].isDisplayed = false;
                steps[index].isDisplayed = true;
                $scope.setButtons();
            };

            /* Moves to the previous step*/
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


            /* Sets the correct buttons to be enabled or disabled.*/
            $scope.setButtons = function() {
                if (index === steps.length - 1) {
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
            /*method added for allowing the user to move the 
            table row up  in dockerLaunchParams section*/
            $scope.moveUpChoice = function(arr, index) {
                var currItem = index;
                if (currItem > 0) {
                    arr.splice(currItem - 1, 0, arr.splice(currItem, 1)[0]);
                }
            };
            /*method added for allowing the user to move the
             table row down in dockerLaunchParams section*/
            $scope.moveDownChoice = function(arr, index) {
                var currItem = index;
                var newPosition = index + 1;
                if (currItem < arr.length) {
                    arr.splice(newPosition, 0, arr.splice(currItem, 1)[0]);
                }
            };
            $scope.dockerDetails = [];
            //items gives the details of the selected blueprint.
            var dockerParams = items.blueprintConfig.dockerCompose;

            //gives the dockerParams details to show up the image in the first step of wizard.
            dockerParams.forEach(function(k, v) {
                $scope.dockerDetails.push(dockerParams[v]);
            });

            //call made to get the instance details.(instance name,instanceIP)
            workzoneServices.getCurrentSelectedEnvInstanceList().then(function(response) {
                $scope.instanceData = response.data.instances;
            });

            //modal to show the Docker Parameters Popup
            $scope.launchParam = function(launchObj, idx) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/dockerParams.html',
                    controller: 'dockerParamsCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return launchObj.dockerlaunchparameters;
                        }
                    }
                });
                modalInstance.result.then(function(paramStr) {
                    $scope.dockerDetails[idx].dockerlaunchparameters = paramStr;
                    //updating the dockerLaunchParameters for the particular index.
                }, function() {
                    console.log('Modal Dismissed at ' + new Date());
                });
            };
            //view the instance logs on click of more info and on start button click.
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

            /*user sets the value(instanceId and instance) on the checkbox 
            the user has selected to show the logs once the user clicks on submit
            and restricts the selection to 1*/
            $scope.checkBoxSelectLength = [];
            $scope.limit = 1; /*limiting the checkbox selection to 1*/
            $scope.checked = 0; /*checking the number of checkbox selection.Initially 0*/
            $scope.selectValue = function(instance) {
                $scope.checkBoxSelectLength = $scope.checkBoxSelectLength || [];
                if (instance.checked) {
                    $scope.instanceSelected = instance;
                    $scope.checkBoxSelectLength.push(instance);
                    $scope.checked++;
                    $scope.checkBoxSelectLength = _.uniq($scope.checkBoxSelectLength);
                } else {
                    $scope.checkBoxSelectLength = _.without($scope.checkBoxSelectLength, instance);
                    $scope.checked--;
                    $scope.showNoDockerAvailable = false;
                    /*Setting to scope to false whenever the user unchecks the checkbox*/
                }
            };

            $scope.submit = function() {
                $scope.isLogsLoading = true;
                var dockerImageParams = JSON.stringify($scope.dockerDetails);
                var repopath = "null"; //by default set to null.(taken from 2.0);
                var reqBody = {
                    compositedockerimage: encodeURIComponent(dockerImageParams)
                };
                workzoneServices.postLaunchDockerBlueprint($scope.instanceSelected._id, repopath, reqBody).then(function(response) {
                    var data = response.data;
                    $scope.isLogsLoading = false;
                    /*If Response is ok the logs are shown and docker image is pulled*/
                    if (data === "OK") {
                        $scope.viewLogs($scope.instanceSelected);
                    } else {
                        if (data.indexOf('No Docker Found') >= 0) {
                            $scope.showNoDockerAvailable = true;
                            /*Setting the scope to true to show a row beneath which tells that 
                            docker is not installed on the particular node*/
                        }
                    }
                });
            };
        }]);
})(angular);