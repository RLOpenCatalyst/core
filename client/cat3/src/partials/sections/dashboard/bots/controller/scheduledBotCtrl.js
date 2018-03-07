/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jan 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
        .controller('scheduledBotCtrl',['$scope', '$rootScope', '$modal', '$timeout', 'uiGridOptionsService', 'genericServices', 'toastr',
            function($scope, $rootScope, $modal, $timeout, uiGridOptionsService, genSevs, toastr){

                var items;
                $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
                    $scope.templateSelected = reqParams;
                });

                $rootScope.$on('BOTS_DESCRIPTION_REFRESH', function(event,reqParams) {
                    $scope.templateSelected = reqParams;
                });


                if($scope.templateSelected) {
                    items = $scope.templateSelected;
                }

                $scope.scheduledBotsData = [];
                var schedulesGrid = uiGridOptionsService.options();
                $scope.paginationParams = schedulesGrid.pagination;
                $scope.paginationParams=[];
                $scope.paginationParams.page = 1;
                $scope.paginationParams.pageSize = 10;
                $scope.paginationParams.sortBy = 'startedOn';
                $scope.paginationParams.sortOrder = 'desc';

                $scope.botDetail = items;
                $scope.botId = items._id;

                $scope.refreshScheduledBots = function(){
                    var reqBody = null;
                    var param={
                        url:'/botSchedulerList?botId=' + $scope.botId
                    };
                    genSevs.promiseGet(param).then(function (response) {
                        $timeout(function() {
                            if (response) {
                                $scope.scheduledBotsData = response;
                                var columnDefs = [];
                                angular.forEach($scope.scheduledBotsData, function(val){
                                    var schedulesGrids = [
                                        { name:'Bot Name',field:'status',cellTemplate:'<div>{{row.botName}}</div>', cellTooltip: true},
                                        { name:'Execution Count',field:'user',cellTooltip: true},
                                        { name:'Scheduled Frequency',width: 70, cellTemplate:'<div class="text-center"></div>'},
                                        { name:'Start Time',field:'startedOn',cellTemplate:'<span></span>', sort:{ direction: 'desc'}, cellTooltip: true},
                                        { name:'End Time',field:'user',cellTooltip: true},
                                        { name:'Unscheduled',field:'user',cellTooltip: true},
                                    ];
                                    columnDefs = schedulesGrids;
                                });
                                $scope.scheduledBotsData.columnDefs = columnDefs;
                                angular.extend($scope.scheduledBotsData, schedulesGrid.gridOption);
                            }
                        }, 100);
                    });
                };


            }
        ]);
})(angular);