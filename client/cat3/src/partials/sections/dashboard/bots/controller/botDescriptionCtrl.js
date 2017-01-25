/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botDescriptionCtrl',['$scope', 'uiGridOptionsClient', '$rootScope', '$state', 'genericServices',
    function ($scope, uiGridOptionsClient, $rootScope, $state, genSevs) {
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
                    }, 
                    settings: {
                        "title": "Settings",
                        "url": "src/partials/sections/dashboard/bots/tabs/settings.html"
                    }
                }
            };
            $scope.tab = botsTab;
    }]);
})(angular);