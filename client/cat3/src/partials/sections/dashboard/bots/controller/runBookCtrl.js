/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2018
 */

(function (angular) {
        "use strict";
        angular.module('dashboard.bots')
                .controller('runBookCtrl', ['$scope', '$rootScope', '$timeout', '$filter', 'botsCreateService',
                        function ($scope, $rootScope, $timeout, $filter, botsCreateService) {
                                var treeNames = ['Runbook', 'library'];
                                $rootScope.$emit('treeNameUpdate', treeNames);
                                $scope.isRunbookDetailsLoading = true;
                                $scope.isRunbookPageLoading = true;
                                $scope.isCardViewActive = true;
                                $scope.botsCardViewSelection = "bots-tab-active";
                                $scope.getRunbooks = function () {
                                        botsCreateService.getRunBooks().then(function (runbooks) {
                                                $scope.runBooks = runbooks;
                                                $scope.isRunbookDetailsLoading = false;
                                                $scope.isRunbookPageLoading = false;
                                                $scope.showRecords = true;
                                                $scope.statusBar = "Showing " + ($scope.runBooks.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.runBooks.length) + " of " + $filter('number')($scope.runBooks.length) + " entries";
                                        })
                                }
                                $scope.refreshRunbooks = function () {
                                         $scope.isRunbookDetailsLoading = true;
                                         $scope.isRunbookPageLoading = true;
                                        $scope.getRunbooks();
                                }
                                $scope.getRunbooks();
                               
                        }
                ]);

})(angular);