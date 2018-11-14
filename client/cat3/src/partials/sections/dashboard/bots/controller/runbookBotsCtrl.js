/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2018
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
        .controller('runBookBotsCtrl', ['$scope', '$rootScope', '$timeout', '$filter', '$state', 'botsCreateService', '$stateParams',
            function ($scope, $rootScope, $timeout, $filter, $state, botsCreateService,$stateParams) {
                $scope.runbookName = $stateParams.runbook;
                $scope.runbookId = $stateParams.id;
                var treeNames = ['Runbook', $scope.runbookName, 'Bots'];
                $rootScope.$emit('treeNameUpdate', treeNames);                
                $scope.isRunbookBotsDetailsLoading = true;
                $scope.isRunbookBotPageLoading = true;
                $scope.botsCardViewSelection = "bots-tab-active";

                $scope.getRunbookBots=function(runbookid) {
                    botsCreateService.getRunBookDetailById(runbookid).then(function (bots) {
                                $scope.runBookBots = bots;
                                $scope.isRunbookBotsDetailsLoading = false;
                                $scope.isRunbookBotPageLoading = false;
                                $scope.showRecords = true;
                    $scope.statusBar = "Showing " + ($scope.runBookBots.length === 0 ? "0" : "1") + " to " + $filter('number')($scope.runBookBots.length) + " of " + $filter('number')($scope.runBookBots.length) + " entries";
                    })
                }

                $scope.refreshRunbookBots = function () {
                    $scope.isRunbookBotsDetailsLoading = true;
                    $scope.isRunbookBotPageLoading = true;
                    $scope.getRunbookBots($scope.runbookId);
                 }
                $scope.getRunbookBots($scope.runbookId);    
                
                 $scope.imageForCard = function (category) {
                     var imagePath;
                     if (category === 'Active Directory' || category === 'Database Management') {
                         imagePath = 'images/bots/activeDirectory.png';
                     } else if (category === 'User Management') {
                         imagePath = 'images/bots/userManagement.png';
                     } else if (category === 'Service Management') {
                         imagePath = 'images/bots/serviceManagement.png';
                     } else if (category === 'Upgrade') {
                         imagePath = 'images/bots/upgrade.png';
                     } else if (category === 'Monitoring') {
                         imagePath = 'images/bots/monitoring.png';
                     } else if (category === 'Installation') {
                         imagePath = 'images/bots/installation.png';
                     } else if (category === 'OpenDJ LDAP') {
                         imagePath = 'images/bots/openDJ.png';
                     } else {
                         imagePath = 'images/bots/applicationDeployment.png';
                     }
                     return imagePath;
                     
                 };

          
            }
        ]);

})(angular);