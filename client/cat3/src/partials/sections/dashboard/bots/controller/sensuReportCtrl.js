/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
        .controller('sensuReportCtrl', ['$scope', '$rootScope', 'genericServices', '$timeout', 'analyticsServices', '$location', '$anchorScroll', function ($scope, $rootScope, genSevs, $timeout, analyticsServices, $location, $anchorScroll) {

            var treeNames = ['BOTs', 'ServiceNowReport'];
            $rootScope.$emit('treeNameUpdate', treeNames);

            $scope.childData = false;
            $scope.barChart = {
                option: {},
                data: []
            };
            $scope.insidebarChart = {
                option: {},
                data: []
            };
            var months=['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

           

            $scope.filterNewEnt = {
                period: 'month',
                endDate: {
                    year: '2018',
                    month:months[new Date().getMonth()],
                    day:moment(new Date()).format('MM-DD-YYYY')
                }
            };


           // $scope.filterNewEnt.date = moment($scope.filterNewEnt.endDate.month + ' 01 ' + $scope.filterNewEnt.endDate.year).format('MM-DD-YYYY');
            $scope.showPick = false;
            $scope.tabShowChat = true;
            $scope.tabShowReport = false;
            $scope.tabShow = function (chat, report) {
                $scope.tabShowChat = chat;
                $scope.tabShowReport = report;
            };

            $scope.ids = '';


            $scope.barChart = {
                data: [],
                options: {
                    chart: {
                        type: 'multiBarChart',
                        height: 350,
                        margin: {
                            top: 40,
                            right: 20,
                            bottom: 45,
                            left: 45
                        },
                        clipEdge: true,
                        duration: 500,
                        stacked: true,
                        groupSpacing: 0.3,
                        xAxis: {
                            axisLabel: 'Name',
                            showMaxMin: false,
                            staggerLabels: false,
                            tickFormat: function (d) {
                                return d;
                            }
                        },
                        yAxis: {
                            axisLabel: 'Total Tasks',
                            axisLabelDistance: -20,
                            tickFormat: function (d) {
                                return d3.format(',.1f')(d);
                            }
                        },
                        multibar: {
                            dispatch: {
                                //chartClick: function(e) {console.log("! chart Click !")},
                                elementClick: function (e) {
                                    $scope.$apply(function () {
                                        $scope.childData = true;
                                        $scope.ids = new Date().getTime();
                                        $location.hash($scope.ids);
                                        // call $anchorScroll()
                                        $anchorScroll();
                                    });
                                }
                            }
                        },
                        callback: function (e) {

                        }

                    }
                }
            };
            $scope.applyFilter = function (filterApp, period) {


                var todays_date = new Date();

                $scope.filterNewEnt.date = moment($scope.filterNewEnt.endDate.month + ' 01 ' + $scope.filterNewEnt.endDate.year).format('MM-DD-YYYY');

                if (period) {
                    if (period === 'daily') {
                        console.log($scope.filterNewEnt.endDate.day);
                        $scope.filterNewEnt.date = $scope.filterNewEnt.endDate.day;
                        $scope.barChart.data = [];

                        var date1 = new Date($scope.filterNewEnt.date);
                        console.log($scope.filterNewEnt.date);

                        var starttimeDiff = Math.abs(date1.getTime() - todays_date.getTime());

                        var startdiffdays = Math.ceil(starttimeDiff / (1000 * 3600 * 24));
                        var enddiffdays = startdiffdays - 1;
                        console.log(startdiffdays);
                        if (startdiffdays && enddiffdays) {

                            generateData(period, startdiffdays, enddiffdays);
                        }
                    } else {
                        console.log($scope.filterNewEnt.endDate.month);
                        $scope.filterNewEnt.date = moment($scope.filterNewEnt.endDate.month + ' 01 ' + $scope.filterNewEnt.endDate.year).format('MM-DD-YYYY');

                        console.log($scope.filterNewEnt.date);
                        $scope.barChart.data = [];
                        var date1 = new Date($scope.filterNewEnt.date);
                        console.log($scope.filterNewEnt.date);

                        var starttimeDiff = Math.abs(date1.getTime() - todays_date.getTime());

                        var startdiffdays = Math.ceil(starttimeDiff / (1000 * 3600 * 24));
                        var enddiffdays = startdiffdays - 30;
                        if (enddiffdays < 0) {
                            enddiffdays = 0;
                        }
                        console.log(startdiffdays);

                        if (startdiffdays) {
                            generateData(period, startdiffdays, enddiffdays);
                        }

                    }
                    $scope.filterNewEnt.period = period;
                    
                }

            };



            $scope.showScheduledTasks = function () {

                console.log($scope.ticketsResolveStartsOn);
                console.log($scope.ticketsResolveEndsOn);

                var date1 = new Date($scope.ticketsResolveStartsOn);
                var date2 = new Date($scope.ticketsResolveEndsOn);
                var todaysdate = new Date();

                var starttimeDiff = Math.abs(date1.getTime() - todaysdate.getTime());
                var endtimeDiff = Math.abs(date2.getTime() - todaysdate.getTime());
                var startdiffdays = Math.ceil(starttimeDiff / (1000 * 3600 * 24));
                var enddiffdays = Math.ceil(endtimeDiff / (1000 * 3600 * 24));
                $scope.barChart.data = [];

                generateData('custom', startdiffdays, enddiffdays);

            }

            var date = new Date();
            var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            var starttimeDiff = Math.abs(firstDay.getTime() - date.getTime());
            var startdiffdays = Math.ceil(starttimeDiff / (1000 * 3600 * 24));
            console.log(firstDay);
            console.log(startdiffdays);

            // Getting data dynamically
            generateData('monthly', startdiffdays, 0);


            function generateData(period, startdiff, enddiff) {

                var param = {
                    url: '/snowtask?period=' + period + '&startdiff=' + startdiff + '&enddiff=' + enddiff
                }
                genSevs.promiseGet(param).then(function (response) {
                    angular.forEach(response, function (val, key) {
                        $scope.barChart.data.push({
                            key: key,
                            values: val
                        });

                    });
                })
                //console.log(response);
            }



            // $scope.barChart.data = [{
            //     key: 'open',
            //     values: [{ x: 'TdmsBot', y: 2, key: "open" }, { x: 'Gopi', y: 5, key: "open" }, { x: 'Satish', y: 9, key: "open" }, { x: 'Sandeep', y: 10, key: "open" }, { x: 'Jim', y: 16, key: "open" }],
            //     color: "#f39c12"

            // }, {
            //     key: 'Closed',
            //     values: [{ x: 'TdmsBot', y: 3, key: "closed" }, { x: 'Gopi', y: 7, key: "closed" }, { x: 'Satish', y: 11, key: "closed" }, { x: 'Sandeep', y: 13, key: "closed" }, { x: 'Jim', y: 17, key: "closed" }],
            //     color: "#00875a"

            // }, {
            //     key: 'InProgress',
            //     values: [{ x: 'TdmsBot', y: 7, key: "Inprogress" }, { x: 'Gopi', y: 13, key: "Inprogress" }, { x: 'Satish', y: 22, key: "Inprogress" }, { x: 'Sandeep', y: 27, key: "Inprogress" }, { x: 'Jim', y: 29, key: "Inprogress" }],
            //     color: "#0052cc"

            // }]

            /* Random Data Generator (took from nvd3.org) */
            $scope.insidebarChart = {
                options: {
                    chart: {
                        type: 'multiBarChart',
                        height: 350,

                        margin: {
                            top: 40,
                            right: 20,
                            bottom: 45,
                            left: 45
                        },
                        clipEdge: true,
                        duration: 500,
                        stacked: true,
                        groupSpacing: 0.3,
                        xAxis: {
                            axisLabel: 'Category',
                            showMaxMin: false,
                            staggerLabels: false,
                            tickFormat: function (d) {
                                return d;
                            }
                        },
                        yAxis: {
                            axisLabel: 'Total Tickets',
                            axisLabelDistance: -20,
                            tickFormat: function (d) {
                                return d3.format(',.1f')(d);
                            }
                        },
                        multibar: {
                            dispatch: {
                                //chartClick: function(e) {console.log("! chart Click !")},
                                elementClick: function (e) {
                                    $scope.$apply(function () {
                                        $scope.childData = true;
                                    });
                                }
                            }
                        },
                        callback: function (e) {

                        }

                    }
                }
            };
            $scope.insidebarChart.data = [{
                key: 'open',
                values: [{ x: 'AccountCreation', y: 9, key: "open" }, { x: 'GsuiteAccess', y: 13, key: "open" }, { x: 'JiraAccess', y: 16, key: "open" }, { x: 'AS400', y: 20, key: "open" }, { x: 'Salesforce', y: 22, key: "open" }],


            }, {
                key: 'Closed',
                values: [{ x: 'AccountCreation', y: 11, key: "closed" }, { x: 'GsuiteAccess', y: 6, key: "closed" }, { x: 'JiraAccess', y: 8, key: "closed" }, { x: 'AS400', y: 23, key: "closed" }, { x: 'Salesforce', y: 27, key: "closed" }],


            }, {
                key: 'InProgress',
                values: [{ x: 'AccountCreation', y: 7, key: "Inprogress" }, { x: 'GsuiteAccess', y: 13, key: "Inprogress" }, { x: 'JiraAccess', y: 22, key: "Inprogress" }, { x: 'AS400', y: 27, key: "Inprogress" }, { x: 'Salesforce', y: 29, key: "Inprogress" }],


            }]

        }]);
})(angular);