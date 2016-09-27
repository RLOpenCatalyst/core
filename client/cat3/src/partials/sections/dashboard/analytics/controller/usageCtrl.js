(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('usageCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices', function ($scope,$rootScope,$state,analyticsServices,genSevs){
        $rootScope.stateItems = $state.params;
            console.log($state.params);
            var usage =this;
            usage.trendsChart=function(fltObj){
                usage.trendLineChart={};
                usage.trendLineChart.options = {
                    chart: {
                        //type: 'stackedAreaChart',
                        type: 'lineChart',
                        height: 350,
                        margin: {
                            top: 20,
                            right: 20,
                            bottom: 30,
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
                            showMaxMin: false,
                            tickFormat: function (d) {
                                return d3.time.format('%x')(new Date(d))
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
                usage.trendLineChart.data = [];
                usage.costGridOptions = {
                    columnDefs: [
                    ],
                    enableGridMenu: true,
                    enableSelectAll: true,
                    exporterMenuPdf: false,
                    exporterCsvFilename: 'costFile.csv',
                    exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
                    onRegisterApi: function (gridApi) {
                        $scope.gridApi = gridApi;
                    }
                };

                var param = {
                    url: 'src/partials/sections/dashboard/analytics/data/usage.json'
                };
                genSevs.promiseGet(param).then(function (result) {
                    usage.trendLineChart.data = [];
                    usage.costGridOptions.columnDefs=[];
                   angular.forEach(result,function (valu,keyChild) {
                       var va = [];
                       angular.forEach(valu.dataPoints, function (value) {
                           va.push([value.fromTime,value.average]);
                       });
                       usage.trendLineChart.data.push({
                           "key": keyChild,
                           "values": va
                       });
                   });
                });
            };
            $rootScope.$watch('filterApply', function () {
                if($state.current.name === "dashboard.analytics.usage") {
                    usage.trendsChart($rootScope.filterNewEnt);
                }
            });
    }]);
})(angular);
