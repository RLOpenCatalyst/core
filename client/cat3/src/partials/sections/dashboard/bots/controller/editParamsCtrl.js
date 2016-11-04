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
        $scope.taskType = items.taskType;
        $scope.taggingServerList=[];
        $scope.envOptions=[];
        workzoneServices.getTaggingServer().then(function (topSer) {
            $scope.taggingServerList=topSer.data;
        });
        $scope.isChefattributesLoading = true;
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
                                $scope.isChefattributesLoading = false;
                            } else {
                                $scope.chefattributes = data;
                                $scope.isChefattributesLoading = false;
                            }
                        });
                    });
                }
            });
        }

        $scope.jenkinsparams = items.taskConfig.parameterized;
        $scope.scriptparams = items.taskConfig.scriptDetails;
        $scope.parameters=[''];
        var taskData={};
        var choiceParam = [];
        $scope.add = function() {
            $scope.parameters.push('');
        };

        $scope.executeBot=function(){
            var taskData={};
            var taggedServer = $scope.tagSerSelected;
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
                    //$modalInstance.close($scope.parameters);
                    taskData.scriptDetails = $scope.parameters;
                    taskData.taggedServer = taggedServer;
                }
            }
            if (items.taskConfig.taskType === 'chef') {
                //taskJSON.runlist = responseFormatter.formatSelectedChefRunList($scope.chefrunlist);
                taskData.attributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                taskData.taggedServer = taggedServer;
            }
            if (items.taskConfig.taskType === 'jenkins') {
                choiceParam = $scope.jenkinsparams;
                console.log(choiceParam);
            }
            $scope.executeTask(taskData);
        };

        $scope.executeTask = function(taskData){
           if (items.taskConfig.taskType === 'jenkins') {
                var reqBody = {
                    choiceParam
                };
            } else {
                var reqBody = {
                    taskData
                };
            }
            workzoneServices.runTask(items._id, reqBody).then(
                function (response) {
                    $modalInstance.close(response.data);
                    helper.orchestrationLogModal(task._id, response.data.historyId, task.taskType);
                    $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                },
                function (error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                }
            );
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