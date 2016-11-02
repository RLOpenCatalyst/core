/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('instanceUsageCtrl', ['$scope', '$rootScope', '$modalInstance', 'items', '$state','analyticsServices', 'genericServices','$timeout', function($scope, $rootScope, $modalInstance, items, $state,analyticsServices,genSevs,$timeout) {
			console.log(items);
			$scope.instanceName = items.name;
			var resId = items.platformId;
            $scope.trendLineChart={
                data:[]
            };
            $scope.trendsChart=function(){
                $scope.trendLineChart.options = {
                    chart: {
                        type: 'lineChart',
                        height: 400,
                        margin: {
                            top: 20,
                            right: 20,
                            bottom:70,
                            left: 40
                        },
                        x: function (d) {
                            return d[0];
                        },
                        y: function (d) {
                            return d[1];
                        },
                        useVoronoi: false,
                        clipEdge: true,
                        duration: 10,
                        useInteractiveGuideline: true,
                        xAxis: {
                            axisLabel: 'Date',
                            showMaxMin: false,
                            tickFormat: function (d) {
                                return d3.time.format('%d/%m %H:%M')(new Date(d))
                            }
                        },
                        yAxis: {
                            tickFormat: function (d) {
                                return d3.format(',.2f')(d);
                            }
                        },
                        zoom: {
                            enabled: true,
                            scaleExtent: [1, 10],
                            useFixedDomain: false,
                            useNiceScale: false,
                            horizontalOff: true,
                            verticalOff: true,
                            unzoomEventType: 'dblclick.zoom'
                        }
                    }
            	};
                $scope.trendLineChart.data = [];
                $scope.legends=[];
                $scope.getData();
            };
            $scope.getData=function(){
                $scope.trendLineChart.data = [];
                var  $today = new Date();
                var $yesterday = new Date($today);
                $yesterday.setDate($today.getDate() - 1);
                var param = {
                   url: '/analytics/trend/usage?resource='+'resId'+'&fromTimeStamp='+$yesterday+'&toTimeStamp='+ $today+'&interval=3600'
                };
                genSevs.promiseGet(param).then(function (result) {
                    var result = {
    "DiskWriteBytes": {
        "unit": "Megabytes",
        "symbol": "MB",
        "dataPoints": [{
            "fromTime": "2016-10-23T11:00:00.000Z",
            "toTime": "2016-10-23T12:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T12:00:00.000Z",
            "toTime": "2016-10-23T13:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T13:00:00.000Z",
            "toTime": "2016-10-23T14:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T14:00:00.000Z",
            "toTime": "2016-10-23T15:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T15:00:00.000Z",
            "toTime": "2016-10-23T16:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T16:00:00.000Z",
            "toTime": "2016-10-23T17:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T17:00:00.000Z",
            "toTime": "2016-10-23T18:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T18:00:00.000Z",
            "toTime": "2016-10-23T19:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T19:00:00.000Z",
            "toTime": "2016-10-23T20:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T20:00:00.000Z",
            "toTime": "2016-10-23T21:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T21:00:00.000Z",
            "toTime": "2016-10-23T22:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T22:00:00.000Z",
            "toTime": "2016-10-23T23:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T23:00:00.000Z",
            "toTime": "2016-10-24T00:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T00:00:00.000Z",
            "toTime": "2016-10-24T01:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T01:00:00.000Z",
            "toTime": "2016-10-24T02:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T02:00:00.000Z",
            "toTime": "2016-10-24T03:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T03:00:00.000Z",
            "toTime": "2016-10-24T04:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T04:00:00.000Z",
            "toTime": "2016-10-24T05:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T05:00:00.000Z",
            "toTime": "2016-10-24T06:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T06:00:00.000Z",
            "toTime": "2016-10-24T07:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T07:00:00.000Z",
            "toTime": "2016-10-24T08:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T08:00:00.000Z",
            "toTime": "2016-10-24T09:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }]
    },
    "DiskReadBytes": {
        "unit": "Megabytes",
        "symbol": "MB",
        "dataPoints": [{
            "fromTime": "2016-10-23T11:00:00.000Z",
            "toTime": "2016-10-23T12:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T12:00:00.000Z",
            "toTime": "2016-10-23T13:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T13:00:00.000Z",
            "toTime": "2016-10-23T14:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T14:00:00.000Z",
            "toTime": "2016-10-23T15:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T15:00:00.000Z",
            "toTime": "2016-10-23T16:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T16:00:00.000Z",
            "toTime": "2016-10-23T17:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T17:00:00.000Z",
            "toTime": "2016-10-23T18:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T18:00:00.000Z",
            "toTime": "2016-10-23T19:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T19:00:00.000Z",
            "toTime": "2016-10-23T20:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T20:00:00.000Z",
            "toTime": "2016-10-23T21:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T21:00:00.000Z",
            "toTime": "2016-10-23T22:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T22:00:00.000Z",
            "toTime": "2016-10-23T23:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T23:00:00.000Z",
            "toTime": "2016-10-24T00:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T00:00:00.000Z",
            "toTime": "2016-10-24T01:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T01:00:00.000Z",
            "toTime": "2016-10-24T02:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T02:00:00.000Z",
            "toTime": "2016-10-24T03:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T03:00:00.000Z",
            "toTime": "2016-10-24T04:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T04:00:00.000Z",
            "toTime": "2016-10-24T05:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T05:00:00.000Z",
            "toTime": "2016-10-24T06:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T06:00:00.000Z",
            "toTime": "2016-10-24T07:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T07:00:00.000Z",
            "toTime": "2016-10-24T08:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T08:00:00.000Z",
            "toTime": "2016-10-24T09:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }]
    },
    "NetworkIn": {
        "unit": "Megabytes",
        "symbol": "MB",
        "dataPoints": [{
            "fromTime": "2016-10-23T11:00:00.000Z",
            "toTime": "2016-10-23T12:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T12:00:00.000Z",
            "toTime": "2016-10-23T13:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T13:00:00.000Z",
            "toTime": "2016-10-23T14:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T14:00:00.000Z",
            "toTime": "2016-10-23T15:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T15:00:00.000Z",
            "toTime": "2016-10-23T16:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T16:00:00.000Z",
            "toTime": "2016-10-23T17:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T17:00:00.000Z",
            "toTime": "2016-10-23T18:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T18:00:00.000Z",
            "toTime": "2016-10-23T19:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T19:00:00.000Z",
            "toTime": "2016-10-23T20:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T20:00:00.000Z",
            "toTime": "2016-10-23T21:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T21:00:00.000Z",
            "toTime": "2016-10-23T22:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T22:00:00.000Z",
            "toTime": "2016-10-23T23:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T23:00:00.000Z",
            "toTime": "2016-10-24T00:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T00:00:00.000Z",
            "toTime": "2016-10-24T01:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T01:00:00.000Z",
            "toTime": "2016-10-24T02:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T02:00:00.000Z",
            "toTime": "2016-10-24T03:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T03:00:00.000Z",
            "toTime": "2016-10-24T04:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T04:00:00.000Z",
            "toTime": "2016-10-24T05:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T05:00:00.000Z",
            "toTime": "2016-10-24T06:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T06:00:00.000Z",
            "toTime": "2016-10-24T07:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T07:00:00.000Z",
            "toTime": "2016-10-24T08:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T08:00:00.000Z",
            "toTime": "2016-10-24T09:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }]
    },
    "NetworkOut": {
        "unit": "Megabytes",
        "symbol": "MB",
        "dataPoints": [{
            "fromTime": "2016-10-23T11:00:00.000Z",
            "toTime": "2016-10-23T12:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T12:00:00.000Z",
            "toTime": "2016-10-23T13:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T13:00:00.000Z",
            "toTime": "2016-10-23T14:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T14:00:00.000Z",
            "toTime": "2016-10-23T15:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T15:00:00.000Z",
            "toTime": "2016-10-23T16:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T16:00:00.000Z",
            "toTime": "2016-10-23T17:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T17:00:00.000Z",
            "toTime": "2016-10-23T18:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T18:00:00.000Z",
            "toTime": "2016-10-23T19:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T19:00:00.000Z",
            "toTime": "2016-10-23T20:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T20:00:00.000Z",
            "toTime": "2016-10-23T21:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T21:00:00.000Z",
            "toTime": "2016-10-23T22:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T22:00:00.000Z",
            "toTime": "2016-10-23T23:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-23T23:00:00.000Z",
            "toTime": "2016-10-24T00:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T00:00:00.000Z",
            "toTime": "2016-10-24T01:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T01:00:00.000Z",
            "toTime": "2016-10-24T02:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T02:00:00.000Z",
            "toTime": "2016-10-24T03:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T03:00:00.000Z",
            "toTime": "2016-10-24T04:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T04:00:00.000Z",
            "toTime": "2016-10-24T05:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T05:00:00.000Z",
            "toTime": "2016-10-24T06:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T06:00:00.000Z",
            "toTime": "2016-10-24T07:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T07:00:00.000Z",
            "toTime": "2016-10-24T08:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }, {
            "fromTime": "2016-10-24T08:00:00.000Z",
            "toTime": "2016-10-24T09:00:00.000Z",
            "maximum": 0,
            "minimum": 0,
            "average": 0
        }]
    },
    "CPUUtilization": {
        "unit": "Percent",
        "symbol": "Percent",
        "dataPoints": [{
            "fromTime": "2016-10-23T11:00:00.000Z",
            "toTime": "2016-10-23T12:00:00.000Z",
            "maximum": 4.5,
            "minimum": 0.33,
            "average": 0.9945454545454546
        }, {
            "fromTime": "2016-10-23T12:00:00.000Z",
            "toTime": "2016-10-23T13:00:00.000Z",
            "maximum": 13,
            "minimum": 0.33,
            "average": 1.4576363636363636
        }, {
            "fromTime": "2016-10-23T13:00:00.000Z",
            "toTime": "2016-10-23T14:00:00.000Z",
            "maximum": 35.33,
            "minimum": 0.33,
            "average": 1.806
        }, {
            "fromTime": "2016-10-23T14:00:00.000Z",
            "toTime": "2016-10-23T15:00:00.000Z",
            "maximum": 17.5,
            "minimum": 0.33,
            "average": 1.2516363636363634
        }, {
            "fromTime": "2016-10-23T15:00:00.000Z",
            "toTime": "2016-10-23T16:00:00.000Z",
            "maximum": 87.21,
            "minimum": 0.33,
            "average": 5.374363636363637
        }, {
            "fromTime": "2016-10-23T16:00:00.000Z",
            "toTime": "2016-10-23T17:00:00.000Z",
            "maximum": 89.5,
            "minimum": 0.33,
            "average": 5.176181818181818
        }, {
            "fromTime": "2016-10-23T17:00:00.000Z",
            "toTime": "2016-10-23T18:00:00.000Z",
            "maximum": 11.67,
            "minimum": 0.33,
            "average": 0.9761818181818184
        }, {
            "fromTime": "2016-10-23T18:00:00.000Z",
            "toTime": "2016-10-23T19:00:00.000Z",
            "maximum": 2.67,
            "minimum": 0.33,
            "average": 0.878909090909091
        }, {
            "fromTime": "2016-10-23T19:00:00.000Z",
            "toTime": "2016-10-23T20:00:00.000Z",
            "maximum": 4.5,
            "minimum": 0.33,
            "average": 0.7487272727272727
        }, {
            "fromTime": "2016-10-23T20:00:00.000Z",
            "toTime": "2016-10-23T21:00:00.000Z",
            "maximum": 1,
            "minimum": 0.33,
            "average": 0.6034545454545457
        }, {
            "fromTime": "2016-10-23T21:00:00.000Z",
            "toTime": "2016-10-23T22:00:00.000Z",
            "maximum": 1.33,
            "minimum": 0.33,
            "average": 0.6276363636363637
        }, {
            "fromTime": "2016-10-23T22:00:00.000Z",
            "toTime": "2016-10-23T23:00:00.000Z",
            "maximum": 39,
            "minimum": 0.33,
            "average": 1.6670909090909094
        }, {
            "fromTime": "2016-10-23T23:00:00.000Z",
            "toTime": "2016-10-24T00:00:00.000Z",
            "maximum": 56.83,
            "minimum": 0.33,
            "average": 3.1819999999999995
        }, {
            "fromTime": "2016-10-24T00:00:00.000Z",
            "toTime": "2016-10-24T01:00:00.000Z",
            "maximum": 1.83,
            "minimum": 0.33,
            "average": 0.5941818181818183
        }, {
            "fromTime": "2016-10-24T01:00:00.000Z",
            "toTime": "2016-10-24T02:00:00.000Z",
            "maximum": 1.02,
            "minimum": 0.33,
            "average": 0.5365454545454547
        }, {
            "fromTime": "2016-10-24T02:00:00.000Z",
            "toTime": "2016-10-24T03:00:00.000Z",
            "maximum": 1.83,
            "minimum": 0.33,
            "average": 0.5458181818181819
        }, {
            "fromTime": "2016-10-24T03:00:00.000Z",
            "toTime": "2016-10-24T04:00:00.000Z",
            "maximum": 1,
            "minimum": 0.33,
            "average": 0.527818181818182
        }, {
            "fromTime": "2016-10-24T04:00:00.000Z",
            "toTime": "2016-10-24T05:00:00.000Z",
            "maximum": 4,
            "minimum": 0.33,
            "average": 0.8365454545454546
        }, {
            "fromTime": "2016-10-24T05:00:00.000Z",
            "toTime": "2016-10-24T06:00:00.000Z",
            "maximum": 1.33,
            "minimum": 0.33,
            "average": 0.566909090909091
        }, {
            "fromTime": "2016-10-24T06:00:00.000Z",
            "toTime": "2016-10-24T07:00:00.000Z",
            "maximum": 1.33,
            "minimum": 0.33,
            "average": 0.5516363636363637
        }, {
            "fromTime": "2016-10-24T07:00:00.000Z",
            "toTime": "2016-10-24T08:00:00.000Z",
            "maximum": 1,
            "minimum": 0.33,
            "average": 0.5367272727272728
        }, {
            "fromTime": "2016-10-24T08:00:00.000Z",
            "toTime": "2016-10-24T09:00:00.000Z",
            "maximum": 3.11,
            "minimum": 0.33,
            "average": 0.5783636363636363
        }]
    }
}
                    var va = [];
                    if(result) {
                        angular.forEach(result[$scope.splitUp].dataPoints, function (value) {
                            va.push([Date.parse(value.fromTime), value.average]);
                        });
                        $scope.trendLineChart.data.push({
                            "key":resId,
                            "values": va
                        });
                    }
                });
            };
            $scope.trendsChart($rootScope.filterNewEnt);
            $scope.splitChange=function() {
                $scope.getData($rootScope.filterNewEnt);
            };
            $scope.init =function(){
                $scope.splitUp='CPUUtilization';
            };
        	$scope.init();
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})(angular);