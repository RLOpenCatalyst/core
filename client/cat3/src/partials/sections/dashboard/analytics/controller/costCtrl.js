(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('costCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices', function ($scope,$rootScope,$state,analyticsServices,genSevs){
        $rootScope.stateItems = $state.params;
        // var treeNames = ['Analytics','Cost'];
        // $rootScope.$emit('treeNameUpdate', treeNames);
            var costObj =this;
          costObj.createChart = function(fltObj) {
                costObj.pieChat = {
                    option: {
                        chart: {
                            type: 'pieChart',
                            margin: {
                                top: 20,
                                right: 0,
                                bottom: 60,
                                left: 0
                            },
                            height: 300,
                            x: function (d) {
                                return d.key;
                            },
                            y: function (d) {
                                return d.value;
                            },
                            showLabels: true,
                            labelType: "value",
                            labelThreshold: 0.01,
                            labelSunbeamLayout: true,
                            legend: {}
                        }
                    },
                    totalCoust: '',
                    data: []
                };

                costObj.barChat = {
                    option: {
                        chart: {
                            type: 'multiBarChart',
                            height: 300,
                            margin: {
                                top: 20,
                                right: 20,
                                bottom: 60,
                                left: 40
                            },
                            duration: 50,
                            stacked: true,
                            x: function (d) {
                                return d.label;
                            },
                            y: function (d) {
                                return d.value;
                            },
                            showControls: true,
                            showValues: true,
                            xAxis: {
                                axisLabel: 'label',
                                showMaxMin: false
                            },
                            yAxis: {
                                tickFormat: function (d) {
                                    return d3.format(',.2f')(d);
                                }
                            }
                        }
                    },
                    data: []

                };

                costObj.costGridOptions = {
                    columnDefs: [
                        {name: 'name', field: 'name'},
                        {name: 'totalCost', field: 'cost.totalCost'}
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
                       // url: 'src/partials/sections/dashboard/analytics/data/cost.json?org'
                        url:'/analytics/cost/aggregate?parentEntityId='+fltObj.org.id+'&entityId='+fltObj.org.id+'&toTimeStamp='+new Date()+'&period=month'
                    };
                    genSevs.promiseGet(param).then(function (result) {
                        costObj.costGridOptions.data = result.splitUpCosts.businessUnits;
                        costObj.pieChat.totalCoust = result.cost.totalCost;
                        costObj.serviceCosts = result.cost.AWS.serviceCosts;
                        costObj.pieChat.data=[];
                        // create bar
                        if(fltObj.provider){
                            angular.forEach(result.splitUpCosts.provider, function (value) {
                                costObj.pieChat.data.push({
                                    key: value.name,
                                    value: value.cost.totalCost
                                });
                            });

                            angular.forEach(result.cost.AWS.serviceCosts,function(valueChild,keyChild){
                                var va=[];
                                costObj.costGridOptions.columnDefs.push({name: keyChild, field: 'cost.AWS.serviceCosts.'+keyChild})
                                angular.forEach(result.splitUpCosts.provider, function (valBar) {
                                    va.push(
                                        { "label": valBar.name,
                                            "value": valBar.cost.AWS.serviceCosts[keyChild]
                                        }
                                    );
                                });
                                costObj.barChat.data.push({
                                    "key": keyChild,
                                    "values": va
                                });
                            });
                        } else {
                            angular.forEach(result.splitUpCosts.businessUnits, function (value) {
                                costObj.pieChat.data.push({
                                    key: value.name,
                                    value: value.cost.totalCost
                                });
                            });
                            angular.forEach(result.cost.AWS.serviceCosts,function(valueChild,keyChild){
                                var va=[];
                                costObj.costGridOptions.columnDefs.push({name: keyChild, field: 'cost.AWS.serviceCosts.'+keyChild})
                                angular.forEach(result.splitUpCosts.businessUnits, function (valBar) {
                                    va.push(
                                        { "label": valBar.name,
                                        "value": valBar.cost.AWS.serviceCosts[keyChild]
                                        }
                                    );
                                });
                                costObj.barChat.data.push({
                                    "key": keyChild,
                                    "values": va
                                });
                            });
                        }
                    });
           };
            costObj.trendsChart=function(){
                costObj.trendLineChart={};
                costObj.trendLineChart.options = {
                    chart: {
                        //type: 'stackedAreaChart',
                        type: 'lineChart',
                        height: 250,
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
                costObj.trendLineChart.data = [];
                var param = {
                    url: 'src/partials/sections/dashboard/analytics/data/costTrend.json'
                };
                genSevs.promiseGet(param).then(function (result) {
                    costObj.trendLineChart.totalCost=result.cost.totalCost;
                    costObj.trendLineChart.data=[];
                    angular.forEach(result.cost.AWS.serviceCosts,function(valueChild,keyChild){
                        var va=[];
                        angular.forEach(result.costTrends,function(value){
                            va.push([value.fromTime,result.cost.AWS.serviceCosts[keyChild]]);
                        });
                        costObj.trendLineChart.data.push({
                            "key": keyChild,
                            "values": va
                        });
                    });
                });
            };
            costObj.trendsChart();
            $rootScope.$watch('filterApply', function () {
                costObj.createChart( $rootScope.filterNewEnt);
            });

    }]);
})(angular);
