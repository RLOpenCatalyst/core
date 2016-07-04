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
                bluePrints:[{"id": "5756881cee06745903a776cc",
                    "name": "test-sdfgthint",
                    "templateId": "test-template",
                    "templateType": "chef"},
                    {"id": "5756881cee06745903a776cc",
                        "name": "test-blueprint",
                        "templateId": "test-template",
                        "templateType": "chef"},
                    {"id": "5756881cee06745903a776cc",
                        "name": "test-blueprint",
                        "templateId": "test-template",
                        "templateType": "chef"},
                    {"id": "5756881cee06745903a776cc",
                        "name": "test-blueprint",
                        "templateId": "test-template",
                        "templateType": "chef"}]
            };
            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            return compBlueInfo;
        }]);
})(angular);