/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('intanceInfoCtrl',['$scope','toastr', 'items','$modalInstance', function ($scope, toastr, items,$modalInstance) {
        $scope.instanceInfo = items;
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);