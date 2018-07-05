/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

(function(angular){
    "use strict";
    angular.module('workzone.blueprint')
        .controller('compositeBlueprintInfoCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) {
            var compBlueInfo={
                items:items,
                bluePrintDetails:[]
            };
            compBlueInfo.getInfo=function () {
                workzoneServices.getCompsiteBlueprintInfo(compBlueInfo.items._id || compBlueInfo.items.id).success(function(compBlue){
                    compBlueInfo.bluePrintDetails=compBlue;
                });
            };
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            compBlueInfo.getInfo();
            return compBlueInfo;
        }]);
})(angular);