(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('costCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices', function ($scope,$rootScope,$state,analyticsServices,genSevs){
        $rootScope.stateItems = $state.params;
        // var treeNames = ['Analytics','Cost'];
        // $rootScope.$emit('treeNameUpdate', treeNames);
            var costObj =this;
            costObj.chartData=[];
            costObj.pieChat={
                option:{},
                totalCoust:'',
                data: []
            };
            costObj.barChat={
                option:{},
                data: []
            };
            costObj.costGridOptions={
                columnDefs:[],
                data:[]
            };
          costObj.createChart = function() {
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
                    enableGridMenu: true,
                    enableSelectAll: true,
                    exporterMenuPdf: false,
                    exporterCsvFilename: 'costFile.csv',
                    exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
                    onRegisterApi: function (gridApi) {
                        $scope.gridApi = gridApi;
                    }
                };

           };
            costObj.getCostData=function(fltObj){
                var param = {
                    // url: 'src/partials/sections/dashboard/analytics/data/cost.json?org'
                    url:''
                };
                if(fltObj && fltObj.org){
                    var entityId=null;
                    if(fltObj.provider){
                        entityId=fltObj.provider.id;
                    } else {
                        entityId=fltObj.org.id;
                    }
                    param.url='/analytics/cost/aggregate?parentEntityId='+fltObj.org.id+'&entityId='+entityId+'&toTimeStamp='+new Date()+'&period=month';
                }

                genSevs.promiseGet(param).then(function (result) {
                    costObj.chartData=result;
                    $rootScope.splitUpCosts=[];
                    console.log('aaa',result.splitUpCosts);
                    if(result.splitUpCosts) {
                        angular.forEach(result.splitUpCosts, function (val, key) {
                            $rootScope.splitUpCosts.push(key);
                        });
                        $scope.$emit('CHANGE_splitUp', $rootScope.splitUpCosts[0]);
                        costObj.createLable(result, $rootScope.splitUpCosts[0]);
                    } else {
                        costObj.createLable(result,'provider');
                    }
                });
            };
            costObj.createLable= function(result,viewType){
                if(result && result.cost) {
                    costObj.costGridOptions.data = [];
                    costObj.costGridOptions.columnDefs = [
                        {name: 'name', field: 'name'},
                        {name: 'totalCost', field: 'cost.totalCost'}
                    ];
                    costObj.pieChat.totalCoust = result.cost.totalCost;
                    costObj.serviceCosts = result.cost.AWS.serviceCosts;
                    costObj.pieChat.data = [];
                    costObj.barChat.data = [];
                    // create bar
                    //if(viewType === 'ProviderView'){
                    costObj.costGridOptions.data = result.splitUpCosts[viewType];
                    angular.forEach(result.splitUpCosts[viewType], function (value) {
                        costObj.pieChat.data.push({
                            key: value.name,
                            value: value.cost.totalCost
                        });
                    });

                    angular.forEach(result.cost.AWS.serviceCosts, function (valueChild, keyChild) {
                        var va = [];
                        costObj.costGridOptions.columnDefs.push({
                            name: keyChild,
                            field: 'cost.AWS.serviceCosts.' + keyChild
                        })
                        angular.forEach(result.splitUpCosts[viewType], function (valBar) {
                            va.push(
                                {
                                    "label": valBar.name,
                                    "value": valBar.cost.AWS.serviceCosts[keyChild]
                                }
                            );
                        });
                        costObj.barChat.data.push({
                            "key": keyChild,
                            "values": va
                        });
                    });
                    // } else {
                    //     costObj.costGridOptions.data = result.splitUpCosts.businessUnits;
                    //     angular.forEach(result.splitUpCosts.businessUnits, function (value) {
                    //         costObj.pieChat.data.push({
                    //             key: value.name,
                    //             value: value.cost.totalCost
                    //         });
                    //     });
                    //     angular.forEach(result.cost.AWS.serviceCosts,function(valueChild,keyChild){
                    //         var va=[];
                    //         costObj.costGridOptions.columnDefs.push({name: keyChild, field: 'cost.AWS.serviceCosts.'+keyChild})
                    //         angular.forEach(result.splitUpCosts.businessUnits, function (valBar) {
                    //             va.push(
                    //                 { "label": valBar.name,
                    //                     "value": valBar.cost.AWS.serviceCosts[keyChild]
                    //                 }
                    //             );
                    //         });
                    //         costObj.barChat.data.push({
                    //             "key": keyChild,
                    //             "values": va
                    //         });
                    //     });
                    // }
                }
            };
            costObj.trendsChart=function(fltObj){
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
                    url: ''
                };

                if(fltObj && fltObj.org){
                    var entityId=null;
                    if(fltObj.provider){
                        entityId=fltObj.provider.id;
                    } else {
                        entityId=fltObj.org.id;
                    }
                    param.url='http://192.168.152.139:3001/analytics/cost/trend?parentEntityId='+fltObj.org.id+'&entityId='+fltObj.org.id+'&toTimeStamp='+new Date()+'&period=month&interval=86400'
                }

                genSevs.promiseGet(param).then(function (result) {
                    if(result.costTrends && result.costTrends.length) {
                        costObj.trendLineChart.totalCost = result.cost.totalCost;
                        costObj.trendLineChart.data = [];
                        angular.forEach(result.cost.AWS.serviceCosts, function (valueChild, keyChild) {
                            var va = [];
                            angular.forEach(result.costTrends, function (value) {
                                va.push([value.fromTime,value.cost.AWS.serviceCosts[keyChild]]);
                            });
                            costObj.trendLineChart.data.push({
                                "key": keyChild,
                                "values": va
                            });
                        });
                    }
                });
            };
            costObj.createChart();
            $scope.$on('CHANGE_VIEW', function (event, data) {
                costObj.createLable(costObj.chartData,data);
            });
            $rootScope.$watch('filterApply', function () {
                costObj.getCostData( $rootScope.filterNewEnt);
                costObj.trendsChart($rootScope.filterNewEnt);
            });

    }]);
})(angular);
