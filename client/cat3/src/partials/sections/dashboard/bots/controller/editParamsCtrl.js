/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
        .controller('editParamsCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', 'responseFormatter', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, responseFormatter) {
            console.log(items.taskConfig.parameterized);
            console.log(items.taskConfig.attributes);
            console.log(items.taskConfig.scriptDetails);
            $scope.taskType = items.taskType;
            if (items.taskType === 'chef') {
                $scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(items.taskConfig.runlist);
                var nodesList = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
                $scope.chefattributes = [];
                $scope.chefattributes = responseFormatter.formatSavedCookbookAttributes(items.taskConfig.attributes);
                workzoneServices.getCookBookListForOrg(items.orgId).then(function(data){
                    var runlist = [];
                    for (var i = 0; i < nodesList.length; i++) {
                        if (nodesList[i].className === "cookbook" || nodesList[i].className === "deploy") {
                            runlist.push(nodesList[i].value);
                        }
                    }
                    if (runlist.length > 0) {
                        workzoneServices.getcookBookAttributes(runlist, data.data.serverId).then(function (response) {
                            var data;
                            if (response.data) {
                                data = response.data;
                            } else {
                                data = response;
                            }
                            /*Scope apply done to force refresh screen after receiving the AJAX response*/
                            $scope.$apply(function () {
                                if ($scope.chefattributes.length > 0) {
                                    $scope.chefattributes = angular.copy($scope.chefattributes, data);
                                    console.log($scope.chefattributes);
                                } else {
                                    $scope.chefattributes = data;
                                    console.log($scope.chefattributes);
                                }
                            });
                        });
                    }
                });
            }

            $scope.jenkinsparams = items.taskConfig.parameterized;
            $scope.scriptparams = items.taskConfig.scriptDetails;
            $scope.parameters=[''];
            $scope.add = function() {
                $scope.parameters.push('');
            };

            $scope.executeBot=function(){
                var taskJSON={}
                if (items.taskConfig.taskType === 'script') {
                    var checkParam = false;
                    for(var i =0; i<$scope.parameters.length; i++){
                        if($scope.parameters[i] === '' || $scope.parameters[i] === null){
                            checkParam = false;
                            toastr.error('Please enter parameters');
                            return false;
                        } else {
                            checkParam = true;
                        }
                    }
                    if(checkParam){
                        $modalInstance.close($scope.parameters);   
                    }
                }
                if (items.taskConfig.taskType === 'chef') {
                    //taskJSON.runlist = responseFormatter.formatSelectedChefRunList($scope.chefrunlist);
                    taskJSON.attributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                    console.log(taskJSON.attributes);
                }
                if (items.taskConfig.taskType === 'jenkins') {
                    taskJSON.parameterized = $scope.jenkinsparams;
                }
            };

            $scope.deleteBot = function(botObj) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    actionButtonStyle: 'cat-btn-delete',
                    headerText: 'Delete Bot',
                    bodyText: 'Are you sure you want to delete this Bot?'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    workzoneServices.deleteBot(botObj._id).then(function(response) {
                        if (response.data.deleteCount.ok) {
                            toastr.success('Successfully deleted');
                            //helper.removeTask();
                        }
                    }, function(data) {
                        toastr.error('error:: ' + data.toString());
                    });
                });
            }

            $scope.cancel= function() {
                $modalInstance.dismiss('cancel');
            };
        }]);
})(angular);