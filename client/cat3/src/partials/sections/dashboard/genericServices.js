/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.genericServices',['authentication', 'utility.pagination']).service('genericServices',['$rootScope', '$q','$http', 'workzoneServices', '$modal','confirmbox','toastr',function($rootScope,$q,$http,workSvs,$modal,confirmbox,toastr){
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
        $rootScope.showTreeMenu = true;
        genericServices.hideTreeOverlay = function () {
            $rootScope.showTreeMenu = false;
            $(".panelRight").css("width", "calc(100% - 39px)");
            $("#navigPage").addClass("tree-close");
            $(".minifyme").css("left", "0px");
            $(".minifyme").css("border-radius", "0px");
            $(".minifyme").css("width", "35px");
        };
        genericServices.showTreeOverlay = function () {
            $rootScope.showTreeMenu = true;
            $(".panelRight").css("width", "calc(100% - 258px)");
            $("#navigPage").removeClass("tree-close");
            $(".minifyme").css("left", "216px");
            $(".minifyme").css("width", "38px");
            $(".minifyme").css("border-radius", "5px 0 0 5px");
        };
        /*genericServices.editRunlist = function(chefRunlist, chefAttribute) {
            $modal.open({
                templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationUpdateChefRunlist.html',
                controller: 'orchestrationUpdateChefRunlistCtrl',
                backdrop: 'static',
                keyboard: false,
                resolve : {
                    cookbookRunlistAttr: function(){
                        return {
                            chefrunlist: chefRunlist,
                            attributes: chefAttribute
                        };
                    }
                }
            }).result.then(function (selectedCookBooks) {
                //$rootScope.editRunListAttributes = false;
               // $rootScope.chefrunlist = selectedCookBooks.list;
               // $rootScope.cookbookAttributes = selectedCookBooks.cbAttributes;
            }, function () {
                console.log('Dismiss time is ' + new Date());
            });
        };*/
    }]);
})(angular);