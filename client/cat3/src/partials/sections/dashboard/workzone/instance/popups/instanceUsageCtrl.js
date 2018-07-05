/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('instanceUsageCtrl', ['$scope', '$rootScope', '$modalInstance', 'items', '$state','analyticsServices', 'genericServices', function($scope, $rootScope, $modalInstance, items, $state,analyticsServices,genSevs) {
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
                                return d3.time.format('%d/%m %H:%M')(new Date(d));
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