/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.services')
    .controller('servicesListCtrl',['$scope', '$rootScope', 'moment', '$state', 'genericServices','$filter', 'confirmbox', 'toastr', 'workzoneUIUtils', '$modal', 'uiGridOptionsService', '$timeout', function ($scope, $rootScope, moment, $state, genSevs, $filter, confirmbox, toastr, workzoneUIUtils, $modal, uiGridOptionsService, $timeout) {

        var treeNames = ['Services','Service List'];
        $rootScope.$emit('treeNameUpdate', treeNames);
        
    }]);
})(angular);