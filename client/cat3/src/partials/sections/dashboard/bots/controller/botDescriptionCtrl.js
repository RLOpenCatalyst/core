/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botDescriptionCtrl',['$scope', 'uiGridOptionsClient', 'moment','botsCreateService', '$rootScope', '$location', 'toastr', 'confirmbox', '$state', 'genericServices',
    function ($scope, uiGridOptionsClient, moment,botsCreateService, $rootScope, $location, toastr,confirmbox, $state, genSevs) {
            var treeNames = ['BOTs','BOTs Description'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            $scope.templateSelected=$state.params.botDetail;
            $rootScope.$on('BOTS_DESCRIPTION_REFRESH', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });
            //refresh of bots History for current implementation.

            if($scope.templateSelected){
                if($scope.templateSelected.category === 'Active Directory' || $scope.templateSelected.category === 'Database Management') {
                    $scope.botIcon = 'images/bots/activeDirectory.png';
                } else if($scope.templateSelected.category === 'User Management') {
                    $scope.botIcon = 'images/bots/userManagement.png';
                } else if($scope.templateSelected.category === 'Service Management') {
                    $scope.botIcon = 'images/bots/serviceManagement.png';
                } else if($scope.templateSelected.category === 'Upgrade') {
                    $scope.botIcon = 'images/bots/upgrade.png';
                } else if($scope.templateSelected.category === 'Monitoring') {
                    $scope.botIcon = 'images/bots/monitoring.png';
                } else if($scope.templateSelected.category === 'Installation') {
                    $scope.botIcon = 'images/bots/installation.png';
                } else if($scope.templateSelected.category === 'OpenDJ LDAP') {
                    $scope.botIcon = 'images/bots/openDJ.png';
                } else if($scope.templateSelected.category === 'Application Deployment' || $scope.templateSelected.category === 'Application Management') {
                    $scope.botIcon = 'images/bots/applicationDeployment.png';
                }
            }

            $scope.launchInstance = function(launch){
                genSevs.executeTask(launch);
            };
            $scope.deleteBot = function(bot) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    actionButtonStyle: 'cat-btn-delete',
                    headerText: 'Delete Bot',
                    bodyText: 'Are you sure you want to delete this BOT?'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    var url;
                    url = '/botsNew/' + bot._id;  
                    var param = {
                        inlineLoader:true,
                        url:url
                    };
                    genSevs.promiseDelete(param).then(function (response) {
                        if (response) {
                            toastr.success('Successfully deleted.');
                            $location.path('/dashboard/bots/library');
                        }
                    }, function(data) {
                        toastr.error('error:: ' + data.toString());
                    });
                });
            };
            $scope.botInfo = $scope.templateSelected;

            $scope.botSync = function(botsDetails) {
                $scope.activeClass = botsDetails;
                botsCreateService.syncIndividualBot(botsDetails.gitHubId,botsDetails.id).then(function(response){
                    $scope.activeClass = {};
                });
            };
         
            var botsTab = {
                tab : "Execute",
                setTab : function (tabId) {
                    botsTab.tab = tabId;   
                },
                isSet : function (tabId) {
                    return botsTab.tab === tabId;
                },
                templates:   {
                    readme: {
                        "title": "ReadMe",
                        "url": "src/partials/sections/dashboard/bots/tabs/readme.html"
                    }, 
                    param: {
                        "title": "Param",
                        "url": "src/partials/sections/dashboard/bots/tabs/param.html"
                    },
                    execute: {
                        "title": "Execute",
                        "url": "src/partials/sections/dashboard/bots/tabs/editParams.html"
                    }, 
                    report: {
                        "title": "Report",
                        "url": "src/partials/sections/dashboard/bots/tabs/report.html"
                    },
                    schedule: {
                        "title": "Schedule",
                        "url": "src/partials/sections/dashboard/bots/tabs/schedule.html"
                    }, 
                    settings: {
                        "title": "Settings",
                        "url": "src/partials/sections/dashboard/bots/tabs/settings.html"
                    },
                    help: {
                        "title": "Help",
                        "url": "src/partials/sections/dashboard/bots/tabs/help.html"
                    }
                }
            };
            $scope.tab = botsTab;
    }]);
})(angular);