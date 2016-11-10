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
        $scope.chefAttributesFlag = false;
        $scope.scriptParamsFlag = false;
        if(items.taskConfig.attributes && items.taskConfig.attributes.length) {
            $scope.chefAttributesFlag = true;
        }
        if(items.taskType === 'script') {
            for (var i=0; i<items.taskConfig.scriptDetails.length; i++) {
                if(items.taskConfig.scriptDetails[i].scriptParameters.length > 0) {
                    $scope.scriptParamsFlag = true;
                }
            }
        }
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
        var cookbookAttributes = [];
        var scriptParams = [];
        var choiceParam = {}, key;
        var tagServer = "";
        $scope.jenparams = {};
        $scope.tagSerSelected;
        $scope.add = function() {
            $scope.parameters.push('');
        };

        $scope.removeScriptInputParams = function(paramInput) {
            if($scope.parameters.length > 1){
                var idx = $scope.parameters.indexOf(paramInput);
                $scope.parameters.splice(idx,1);
            }else{
                toastr.error('Cannot delete the row');
            }
        }

        $scope.executeBot=function(){
            if (items.taskConfig.taskType === 'script') {
                var checkParam = false;
                if ($scope.scriptParamsFlag) {
                    for(var i =0; i<$scope.parameters.length; i++){
                        if($scope.parameters[i] === '' || $scope.parameters[i] === null){
                            checkParam = false;
                            toastr.error('Please enter parameters');
                            return false;
                        } else {
                            checkParam = true;
                        }
                    }
                }
                if(checkParam){
                    scriptParams = $scope.parameters;
                } 
            }
            if (items.taskConfig.taskType === 'chef') {
                cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                
            }
            if (items.taskConfig.taskType === 'jenkins') {
                choiceParam = $scope.jenparams;
            }
            $scope.executeTask(taskData);
        };

        $scope.executeTask = function(taskData){
            var reqBody = {};
            if (items.taskConfig.taskType === 'jenkins') {
                reqBody.choiceParams = choiceParam;
            } else if (items.taskConfig.taskType === 'chef'){
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.chefAttributesFlag) {
                    reqBody.cookbookAttributes = cookbookAttributes;
                }
            } else  if (items.taskConfig.taskType === 'script') {
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.scriptParamsFlag) {
                    reqBody.scriptParams = scriptParams;
                }
            }
            workzoneServices.runTask(items._id, reqBody).then(
                function (response) {
                    $modalInstance.close(response.data);
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
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

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);