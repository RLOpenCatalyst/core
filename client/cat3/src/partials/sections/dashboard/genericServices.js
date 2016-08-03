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
    }]);
})(angular);