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

        $scope.totalCount = 0;
        $scope.countInit = function() {
           return $scope.totalCount++;
        }

        if (items.botLinkedSubCategory === 'chef') {
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
                            $scope.cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
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
        $scope.cookbookAttributes = [];
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

        $scope.executeBot=function(){
            if (items.botConfig && items.botConfig.taskType === 'script') {
                /*for(var i = 0; i < $scope.scriptparams.length; i++){
                    var scriptObj = {};
                    var scriptParamList = [];
                    if($scope.scriptparams[i].scriptParameters.length > 0){
                        for(var j = 0; j<$scope.scriptparams[i].scriptParameters.length;j++){
                            scriptParamList.push($scope.scriptparams[i].scriptParameters[j].paramVal);
                        }
                        if($scope.scriptparams[i].scriptParameters.length === scriptParamList.length){
                            scriptObj[$scope.scriptparams[i].scriptId] = scriptParamList;
                            scriptParams.push(scriptObj);
                        }
                    }else{
                        scriptObj[$scope.scriptparams[i].scriptId] = [];
                        scriptParams.push(scriptObj);
                    }
                }*/

                scriptParams = $scope.scriptparams;
            }
            if (items.botConfig && items.botConfig.taskType === 'chef') {
                cookbookAttributes = responseFormatter.formatSelectedCookbookAttributes($scope.chefattributes);
                
            }
            if (items.botConfig && items.botConfig.taskType === 'jenkins') {
                choiceParam = $scope.jenparams;
            }
            $scope.executeTask();
        };

        $scope.executeTask = function(){
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
                $modalInstance.close(response.data);
                $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                helper.botLogModal(items.botId, response.historyId, response.taskType);
            },
            function (error) {
                if(error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                }
            });
        };

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);