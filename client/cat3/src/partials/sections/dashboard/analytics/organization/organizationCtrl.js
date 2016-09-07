/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Sep 2016
 */

(function (angular) {
    "use strict";
    angular.module('analytics.organization',[])
    .controller('organizationCtrl', ['$scope', function($scope){
        $scope.openFilters = false;
        console.log('hi');
        $scope.fnShowFilters = function () {
            $scope.openFilters = true;
        };

        $scope.fnApplyFilters = function () {
            $scope.openFilters = false;
        };
    }]);
})(angular);
