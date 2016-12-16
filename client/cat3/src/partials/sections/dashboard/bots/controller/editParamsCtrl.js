/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
    .controller('editParamsCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', 'responseFormatter', '$modal', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, responseFormatter, $modal) {
        console.log(items);
        $scope.botName = items.botName;
        $scope.taskType = items.botLinkedSubCategory;
        $scope.taggingServerList=[];
        $scope.envOptions=[];
        workzoneServices.getTaggingServer().then(function (topSer) {
            $scope.taggingServerList=topSer.data;
        });
        $scope.chefAttributesFlag = false;
        $scope.scriptParamsFlag = false;
        if(items.botConfig && items.botConfig.runlist && items.botConfig.runlist.length) {
            $scope.chefAttributesFlag = true;
        }
        if(items.botLinkedSubCategory === 'script' && items.botConfig) {
            for (var i=0; i<items.botConfig.scriptDetails.length; i++) {
                if(items.botConfig.scriptDetails[i].scriptParameters.length > 0) {
                    $scope.scriptParamsFlag = true;
                }
            }
        }
        $scope.isChefattributesLoading = true;
        if (items.botLinkedSubCategory === 'chef' && items.botConfig) {
            $scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(items.botConfig.runlist);
            var nodesList = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
            $scope.chefattributes = [];
            $scope.chefattributes = responseFormatter.formatSavedCookbookAttributes(items.botConfig.attributes);
            workzoneServices.getCookBookListForOrg(items.masterDetails.orgId).then(function(data){
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
                            if ($scope.chefattributes) {
                                for (var j = 0; j < data.length; j++) {
                                    for (var attrItem in data[j].attributes) {
                                        if ($scope.chefattributes[attrItem]) {
                                            data[j].attributes[attrItem].default = $scope.chefattributes[attrItem];
                                        }
                                    }
                                }
                            }
                            $scope.chefattributes = data;
                            $scope.isChefattributesLoading = false;
                        });
                    });
                }
            });
        }
        if (items.botConfig) {
            $scope.jenkinsparams = items.botConfig.parameterized;
            $scope.scriptparams = items.botConfig.scriptDetails;
        }
        $scope.parameters=[''];
        var cookbookAttributes = [];
        var scriptParams = [];
        var choiceParam = {};
        $scope.jenparams = {};

        var helper = {
            botLogModal: function(id,historyId,taskType) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/bots/view/botExecutionLogs.html',
                    controller: 'botExecutionLogsCtrl as botExecLogCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return {
                                taskId: id,
                                historyId: historyId,
                                taskType: taskType
                            };
                        }
                    }
                });
            }
        };

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
        };

        $scope.executeBot=function(){
            if (items.botConfig && items.botConfig.taskType === 'script') {
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
            if (items.botConfig && items.botConfig.taskType === 'chef') {
                cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
            }
            if (items.botConfig && items.botConfig.taskType === 'jenkins') {
                choiceParam = $scope.jenparams;
            }
            $scope.executeBot();
        };

        $scope.executeBot = function(){
            var reqBody = {};
            if (items.botConfig && items.botConfig.taskType === 'jenkins') {
                reqBody.choiceParam = choiceParam;
            } else if (items.botConfig && items.botConfig.taskType === 'chef'){
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.chefAttributesFlag) {
                    reqBody.cookbookAttributes = cookbookAttributes;
                }
            } else  if (items.botConfig && items.botConfig.taskType === 'script') {
                reqBody.tagServer = $scope.tagSerSelected;
                if ($scope.scriptParamsFlag) {
                    reqBody.scriptParams = scriptParams;
                }
            }
            var param={
                url:'/bots/' + items.botId + '/execute',
                data: reqBody
            };
            genSevs.promisePost(param).then(function (response) {
                console.log(response);
                $modalInstance.close(response.data);
                $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                helper.botLogModal(items.botId, response.historyId, response.taskType);
            },
            function (error) {
                error = error.responseText || error;
                if (error.message) {
                    toastr.error(error.message);
                } else {
                    toastr.error(error);
                }
            });
        };

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);