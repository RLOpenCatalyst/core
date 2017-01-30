/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botDescriptionCtrl',['$scope', 'uiGridOptionsClient', '$rootScope', 'confirmbox', '$state', 'genericServices',
    function ($scope, uiGridOptionsClient, $rootScope, confirmbox, $state, genSevs) {
            var treeNames = ['BOTs','Bots Description'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                $scope.templateSelected = reqParams;
            });

            $scope.launchInstance = function(launch){
                if(launch.botLinkedCategory === 'Task'){
                    genSevs.executeTask(launch);
                } else if(launch.botLinkedCategory === 'Blueprint') {
                    genSevs.launchBlueprint(launch);
                }
            };
            $scope.deleteBot = function(bot) {
                console.log(bot.gitHubId);
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    actionButtonStyle: 'cat-btn-delete',
                    headerText: 'Delete Bot',
                    bodyText: 'Are you sure you want to delete this BOT?'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    var param={
                        url:'/botsNew/' + bot.gitHubId
                    };
                    genSevs.promiseDelete(param).then(function (response) {
                        if (response) {
                            toastr.success('Successfully deleted.');
                           // lib.summary();
                            if($scope.totalBotsSelected) {
                                $scope.botLibraryGridView();
                            } else if($scope.runningBotsselected) {
                                $scope.showBotsRunning();
                            } else if($scope.scheduledBotsSelected) {
                                $scope.showScheduledBots();
                            } else if($scope.failedBotsselected) {
                                $scope.showFailedBots();
                            } else {
                                $scope.botLibraryGridView();
                            }
                        }
                    }, function(data) {
                        toastr.error('error:: ' + data.toString());
                    });
                });
            };
            $scope.botInfo = $scope.templateSelected;
         
            var botsTab = {
                tab : "ReadMe",
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
                    report: {
                        "title": "Report",
                        "url": "src/partials/sections/dashboard/bots/tabs/report.html"
                    },
                    schedule: {
                        "title": "Schedule",
                        "url": "src/partials/sections/dashboard/bots/tabs/schedule.html"
                    }/*, 
                    settings: {
                        "title": "Settings",
                        "url": "src/partials/sections/dashboard/bots/tabs/settings.html"
                    }*/
                }
            };
            $scope.tab = botsTab;
    }]);
})(angular);