/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.genericServices',['authentication', 'utility.pagination']).service('genericServices',['$rootScope', '$q', '$http', 'workzoneServices', '$modal', 'confirmbox', 'toastr',function($rootScope, $q, $http, workSvs, $modal, confirmbox, toastr){
        var genericServices=this;
        genericServices.promiseGet = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.get(paramsObject.url)
                .success(function(data) {
                    if(!paramsObject.inlineLoader){$rootScope.onBodyLoading=false;}
                    deferred.resolve(data);
                })
                .error(function(data, status) {
                    if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=false;}
                    deferred.reject();
                    toastr.error(data.message, status);
                });
            return deferred.promise;
        };

        genericServices.promisePost = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.post(paramsObject.url,paramsObject.data)
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data, status) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, status);
                });
            return deferred.promise;
        };

        genericServices.promiseDelete= function (paramsObject) {
            $rootScope.onBodyLoading=true;
            var deferred = $q.defer();
            $http({
                method: 'DELETE',
                url: paramsObject.url,
                data:paramsObject.data
            }).success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data, status) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, status);
                });
            return deferred.promise;
        };

        genericServices.getTreeNew = function () {
            $rootScope.onBodyLoading=true;
            var deferred = $q.defer();
            $http.get('/organizations/getTreeNew')
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data, status) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, status);
                });
            return deferred.promise;
        };

        genericServices.moreInfo= function(blueprintObj,bpType){
            if(bpType === 'compBlueInfo'){
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/compositeBlueprintInfo.html',
                    controller: 'compositeBlueprintInfoCtrl as compBlue',
                    backdrop : 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return blueprintObj ;
                        }
                    }
                });
            } else {
               $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/blueprintInfo.html',
                    controller: 'blueprintInfoCtrl',
                    backdrop : 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return blueprintObj;
                        }
                    }
                });
            }
        };

        genericServices.log=function(id,historyId,taskType) {
            $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
                controller: 'orchestrationLogCtrl as orchLogCtrl',
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
        };

        genericServices.botHistory=function(bot) {
            $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationHistory.html',
                controller: 'orchestrationHistoryCtrl',
                backdrop: 'static',
                keyboard: false,
                size: 'lg',
                resolve: {
                    items: function() {
                        return bot;
                    }
                }
            });
        };

        genericServices.removeBlueprint= function(blueprintObj, bpType) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete  Blueprint',
                bodyText: 'Are you sure you want to delete this  blueprint?'
            };
            if(bpType === 'compositeBlueprint'){
                confirmbox.showModal({}, modalOptions).then(function() {
                    workSvs.deleteCompsiteBlueprint(blueprintObj).success(function() {
                        angular.element('#'+blueprintObj).hide();
                        toastr.success('Successfully deleted');
                    }).error(function(data) {
                        toastr.error(data.message, 'Error');
                    });
                });
            } else {
                confirmbox.showModal({}, modalOptions).then(function() {
                    workSvs.deleteBlueprint(blueprintObj._id).success(function() {
                        angular.element('#'+blueprintObj._id).hide();
                        toastr.success('Successfully deleted');
                    }).error(function(data) {
                        toastr.error(data.message, 'Error');
                    });
                });
            }
        };

        /*genericServices.executeTask =function(task) {
            if (task.taskConfig.parameterized && task.taskConfig.parameterized.length) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/runParamConfig.html',
                    controller: 'runParamConfigCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return angular.extend([], task.taskConfig.parameterized);
                        }
                    }
                }).result.then(function(selectedItems) {
                    var choiceParam = {};
                    var p = selectedItems;
                    for (var i = 0; i < p.length; i++) {
                        choiceParam[p[i].name] = p[i].defaultValue[0];
                    }
                    workSvs.runTask(task._id, {
                        "choiceParam": choiceParam
                    }).then(function(response) {
                        helper.orchestrationLogModal(task._id, response.data.historyId, task.taskType);
                        $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                    });
                }, function() {
                    console.log("Dismiss at " + new Date());
                });
            } else {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/confirmJobRun.html',
                    controller: 'confirmJobRunCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return task._id;
                        }
                    }
                }).result.then(function(response) {
                    genericServices.log(task._id,response.historyId,task.taskType);
                    if(response.blueprintMessage){
                        $rootScope.$emit('WZ_INSTANCES_SHOW_LATEST');
                    }
                    $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                }, function() {
                    $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                });
            }
        }*/

        genericServices.executeTask =function(task) {
            if ((task.taskConfig.parameterized && task.taskConfig.parameterized.length) || (task.taskConfig.attributes && task.taskConfig.attributes.length) || (task.taskConfig.scriptDetails && task.taskConfig.scriptDetails.length)) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/bots/view/editParams.html',
                    controller: 'editParamsCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return task;
                        }
                    }
                }).result.then(function(selectedItems, selectedCookBooks) {
                    var choiceParam = {};
                    var p = selectedItems;
                    for (var i = 0; i < p.length; i++) {
                        choiceParam[p[i].name] = p[i].defaultValue[0];
                    }
                    workSvs.runTask(task._id, {
                        "choiceParam": choiceParam
                    }).then(function(response) {
                        helper.orchestrationLogModal(task._id, response.data.historyId, task.taskType);
                        $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                    });
                }, function() {
                    console.log("Dismiss at " + new Date());
                });
            } else {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/confirmJobRun.html',
                    controller: 'confirmJobRunCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return task._id;
                        }
                    }
                }).result.then(function(response) {
                    genericServices.log(task._id,response.historyId,task.taskType);
                    if(response.blueprintMessage){
                        $rootScope.$emit('WZ_INSTANCES_SHOW_LATEST');
                    }
                    $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                }, function() {
                    $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT');
                });
            }
        }

        genericServices.lunchBlueprint=function(blueprintObj) {
            $modal.open({
                animate: true,
                templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunchParams.html",
                controller: "blueprintLaunchParamsCtrl as bPLP",
                backdrop : 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return blueprintObj;
                    }
                }
            }).result.then(function(bpObj) {
                if (bpObj.bp.blueprintType === "docker") {
                    $modal.open({
                        animate: true,
                        templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/dockerLaunchParams.html",
                        controller: "dockerLaunchParamsCtrl",
                        backdrop: 'static',
                        keyboard: false,
                        size: 'lg',
                        resolve: {
                            items: function() {
                                return bpObj.bp;
                            }
                        }
                    }).result.then(function() {
                        console.log('The modal close is not getting invoked currently. Goes to cancel handler');
                    }, function() {
                        console.log('Cancel Handler getting invoked');
                    });
                }else{
                    $modal.open({
                            animate: true,
                            templateUrl: "src/partials/sections/dashboard/workzone/blueprint/popups/blueprintLaunch.html",
                            controller: "blueprintLaunchCtrl",
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                bpItem: function() {
                                    return bpObj;
                                }
                            }
                        })
                        .result.then(function(selectedItem) {
                        $scope.selected = selectedItem;
                    }, function() {

                    });
                }
            }, function() {

            });
        };
        genericServices.scheduleTime=function (ids) {
            $modal.open({
                animate: true,
                templateUrl: "src/partials/sections/dashboard/popups/view/schedule.html",
                controller: "scheduleCtrl as sch",
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return ids;
                    }
                }
            })
        };
        genericServices.instanceStart=function (ids) {

        };
        genericServices.instanceStop=function () {

        };
    }]);
})(angular);