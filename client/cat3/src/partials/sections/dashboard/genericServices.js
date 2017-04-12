/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * June 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.genericServices',['authentication', 'utility.pagination']).service('genericServices',['$rootScope', '$q', '$http', 'workzoneServices', '$modal', 'confirmbox', 'toastr','session',function($rootScope, $q, $http, workSvs, $modal, confirmbox, toastr,Auth){
        var genericServices=this;
        genericServices.promiseGet = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.get(paramsObject.url,Auth.getHeaderObject())
                .success(function(data) {
                    if(!paramsObject.inlineLoader){$rootScope.onBodyLoading=false;}
                    deferred.resolve(data);
                })
                .error(function(data) {
                    if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=false;}
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };

        genericServices.promiseOwn = function (paramsObject) {
            return $http(paramsObject);
        };

        genericServices.promisePost = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.post(paramsObject.url,paramsObject.data,Auth.getHeaderObject())
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };
        genericServices.promisePut = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.put(paramsObject.url,paramsObject.data,Auth.getHeaderObject())
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };
        genericServices.promisePatch = function (paramsObject) {
            if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
            var deferred = $q.defer();
            $http.patch(paramsObject.url,paramsObject.data,Auth.getHeaderObject())
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message,'Error');
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
                .error(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };

        genericServices.getTreeNew = function () {
            $rootScope.onBodyLoading=true;
            var deferred = $q.defer();
            $http.get('/organizations/getTreeNew',Auth.getHeaderObject())
                .success(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.resolve(data);
                })
                .error(function(data) {
                    $rootScope.onBodyLoading=false;
                    deferred.reject();
                    toastr.error(data.message, 'Error');
                });
            return deferred.promise;
        };

        genericServices.moreInfo= function(blueprintObj,bpType){
            if(bpType === 'composite'){
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/compositeBlueprintInfo.html',
                    controller: 'compositeBlueprintInfoCtrl as compBlue',
                    backdrop : 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return blueprintObj;
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

        genericServices.removeBlueprint= function(blueprintObj, bpType) {
            var modalOptions = {
                closeButtonText: 'Cancel',
                actionButtonText: 'Delete',
                actionButtonStyle: 'cat-btn-delete',
                headerText: 'Delete  Blueprint',
                bodyText: 'Are you sure you want to delete this  blueprint?'
            };
            if(bpType === 'composite'){
                confirmbox.showModal({}, modalOptions).then(function() {
                    workSvs.deleteCompsiteBlueprint(blueprintObj._id).success(function() {
                        toastr.success('Successfully deleted');
                        $rootScope.$emit('BP_BLUEPRINTS_REFRESH_CURRENT');
                    }).error(function(data) {
                        toastr.error(data.message, 'Error');
                    });
                });
            } else {
                confirmbox.showModal({}, modalOptions).then(function() {
                    workSvs.deleteBlueprint(blueprintObj._id).success(function() {
                        angular.element('#'+blueprintObj._id).hide();
                        toastr.success('Successfully deleted');
                        $rootScope.$emit('BP_BLUEPRINTS_REFRESH_CURRENT');
                    }).error(function(data) {
                        toastr.error(data.message, 'Error');
                    });
                });
            }
        };

        /*genericServices.executeTask =function(task) {
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
            }).result.then(function(response) {
                $modal.open({
                    animate: true,
                    templateUrl: "src/partials/sections/dashboard/bots/view/botExecutionLogs.html",
                    controller: "botsExecutionLogsNewCtrl",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return {
                                logDetails : response,
                                isBotNew : task.isBotsNew
                            }
                        }
                    }
                }).result.then(function() {
                    console.log('The modal close is not getting invoked currently. Goes to cancel handler');
                }, function() {
                    console.log('Cancel Handler getting invoked');
                });
            }, function() {
            });
        };*/
        genericServices.showLogsForBots = function(response) {
            $modal.open({
                animation: true,
                templateUrl: 'src/partials/sections/dashboard/bots/view/botExecutionLogs.html',
                controller: 'botsExecutionLogsNewCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    items: function() {
                        return {
                            logDetails : response
                        };
                    }
                }
            }).result.then(function() {
            }, function() {
            }); 
        };

        genericServices.launchBlueprint=function(blueprintObj) {
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
                if (bpObj.bp.botLinkedSubCategory === "docker") {
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
                } else {
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
                    .result.then(function() {
                    
                    }, function() {

                    });
                }
            }, function() {

            });
        };
        genericServices.editRunlist = function(chefRunlist, chefAttribute) {
            $modal.open({
                templateUrl: 'src/partials/sections/dashboard/popups/view/orchestrationUpdateChefRunlist.html',
                controller: 'orchestrationUpdateChefRunlistCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve : {
                    cookbookRunlistAttr: function(){
                        return {
                            chefrunlist: chefRunlist,
                            cookbookAttributes: chefAttribute                            
                        };
                    }
                }
            }).result.then(function (selectedCookBooks) {
                $rootScope.editRunListAttributes = false;
                $rootScope.chefrunlist = selectedCookBooks.list;
                $rootScope.cookbookAttributes = selectedCookBooks.cbAttributes;
                $rootScope.$emit('WZ_ORCHESTRATION_REFRESH_CURRENT',selectedCookBooks);
            }, function () {
                console.log('Dismiss time is ' + new Date());
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
            });
        };
        genericServices.instanceStart=function () {

        };
        genericServices.instanceStop=function () {

        };
    }]);
})(angular);