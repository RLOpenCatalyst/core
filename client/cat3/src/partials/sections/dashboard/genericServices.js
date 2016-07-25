/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.genericServices',['authentication', 'utility.pagination']).service('genericServices',['$rootScope',  'workzoneServices', '$modal','confirmbox','toastr',function($rootScope,workSvs,$modal,confirmbox,toastr){
        var genericServices=this;
        genericServices.moreInfo= function(blueprintObj,bpType){
            if(bpType === 'compBlueInfo'){
                var modalInstance = $modal.open({
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
                var modalInstance = $modal.open({
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
                modalInstance.result.then(function(selectedItem) {
                    // $scope.selected = selectedItem;
                }, function() {

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
                    workSvs.deleteCompsiteBlueprint(blueprintObj).success(function(response) {
                        angular.element('#'+blueprintObj).hide();
                        toastr.success('Successfully deleted');
                    }).error(function(data) {
                        toastr.error(data.message, 'Error');
                    });
                });
            } else {
                confirmbox.showModal({}, modalOptions).then(function() {
                    workSvs.deleteBlueprint(blueprintObj._id).success(function(response) {
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