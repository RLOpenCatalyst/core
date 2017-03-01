(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('costCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
        $rootScope.stateItems = $state.params;
            //analyticsServices.initFilter();
            var costObj =this;
            costObj.chartData=[];
            costObj.splitUp=null;
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
                            showLabels: false,
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
                                left: 60
                            },
                            duration:1000,
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
                                axisLabel: 'Aggregate',
                                showMaxMin: false,
                                staggerLabels:false
                            },
                            yAxis: {
                                axisLabel: 'Cost in $',
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
                costObj.pieChat.data = [];
                costObj.barChat.data = [];
                costObj.costGridOptions.data = [];
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

                 // param.url='src/partials/sections/dashboard/analytics/data/cost.json';
                    console.log(fltObj.date);
                   param.url='/analytics/cost/aggregate?parentEntityId='+fltObj.org.id+'&entityId='+entityId+'&toTimeStamp='+new Date(fltObj.date)+'&period='+fltObj.period;
                }

                genSevs.promiseGet(param).then(function (result) {
                    costObj.chartData=result;
                    $rootScope.splitUpCosts=[];
                    if(result.splitUpCosts && Object.keys(result.splitUpCosts).length >0 ) {
                        angular.forEach(result.splitUpCosts, function (val, key) {
                            var a=key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                                return str.toUpperCase();
                            });
                            $rootScope.splitUpCosts.push({id:key,val:a});
                        });
                        if( $rootScope.splitUpCosts && $rootScope.splitUpCosts.length >0) {
                            if(!costObj.splitUp){
                                costObj.splitUp=$rootScope.splitUpCosts[0].id;
                            }
                            costObj.createLable(result,costObj.splitUp);

                        }
                    } else {
                        costObj.createLable(result,'provider');
                    }
                });
            };
            costObj.spliteChange= function() {
                costObj.createLable( costObj.chartData, costObj.splitUp);
            };
            costObj.createLable= function(result,viewType){
                console.log(1);
                costObj.createChart();
                costObj.pieChat.data = [];
                costObj.barChat.data = [];
                if(result && result.cost) {
                    costObj.costGridOptions.data = [];
                    costObj.costGridOptions.columnDefs = [
                        {name: 'name', field: 'name'},
                        {name: 'totalCost', field: 'cost.totalCost'}
                    ];
                    costObj.pieChat.totalCoust = result.cost.totalCost;
                    // create bar
                    //if(viewType === 'ProviderView'){

                    if(result.splitUpCosts && Object.keys(result.splitUpCosts).length >0 ) {
                        costObj.costGridOptions.data = result.splitUpCosts[viewType];
                        angular.forEach(result.splitUpCosts[viewType], function (value) {
                            costObj.pieChat.data.push({
                                key: value.name,
                                value: value.cost.totalCost
                            });
                        });
                    } else {
                        costObj.costGridOptions.data = result;
                        costObj.pieChat.data.push({
                            key: result.entity.name,
                            value: result.cost.totalCost
                        });
                    }
                    if(result.cost && result.cost.AWS && result.cost.AWS.serviceCosts) {
                        costObj.serviceCosts = result.cost.AWS.serviceCosts;
                        angular.forEach(result.cost.AWS.serviceCosts, function (valueChild, keyChild) {
                            var va = [];
                            costObj.costGridOptions.columnDefs.push({
                                name: keyChild,
                                displayName:keyChild,
                                field: 'cost.AWS.serviceCosts.' + keyChild
                            });
                            if(result.splitUpCosts && Object.keys(result.splitUpCosts).length >0 ) {
                                angular.forEach(result.splitUpCosts[viewType], function (valBar) {
                                    var chVal = '';
                                    if (valBar.cost.AWS.serviceCosts[keyChild]) {
                                        chVal = valBar.cost.AWS.serviceCosts[keyChild];
                                    } else {
                                        chVal = 0;
                                    }
                                    va.push(
                                        {
                                            "label": valBar.name,
                                            "value": chVal
                                        }
                                    );
                                });
                            } else {

                                    var chVal = '';
                                    if (result.cost.AWS.serviceCosts[keyChild]) {
                                        chVal =result.cost.AWS.serviceCosts[keyChild];
                                    } else {
                                        chVal = 0;
                                    }
                                    va.push(
                                        {
                                            "label": result.entity.name,
                                            "value": chVal
                                        }
                                    );

                            }
                            costObj.barChat.data.push({
                                "key": keyChild,
                                "values": va
                            });
                        });
                    }
                }
            };
            costObj.trendsChart=function(fltObj){
                costObj.trendLineChart={};
                costObj.trendLineChart.options = {
                    chart: {
                        //type: 'stackedAreaChart',
                        type: 'lineChart',
                        height: 350,
                        margin: {
                            top: 20,
                            right: 20,
                            bottom: 40,
                            left: 60
                        },
                        x: function (d) {
                            return d[0];
                        },
                        y: function (d) {
                            return d[1];
                        },
                        useVoronoi: false,
                        clipEdge: true,
                        duration: 1000,
                        useInteractiveGuideline: true,
                        xAxis: {
                            showMaxMin: false,
                            axisLabel: 'Date',
                            tickFormat: function (d) {
                                return d3.time.format('%x')(new Date(d));
                            }
                        },
                        yAxis: {
                            axisLabel: 'Cost in $',
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
                    //http://192.168.152.139:3001
                   param.url='/analytics/cost/trend?parentEntityId='+fltObj.org.id+'&entityId='+fltObj.org.id+'&toTimeStamp='+new Date()+'&period='+fltObj.period+'&interval=86400';
                }

                genSevs.promiseGet(param).then(function (result) {
                    if(result.costTrends && result.costTrends.length) {
                        costObj.trendLineChart.totalCost = result.cost.totalCost;
                        costObj.trendLineChart.data = [];
                        angular.forEach(result.cost.AWS.serviceCosts, function (valueChild, keyChild) {
                            var va = [];
                            angular.forEach(result.costTrends, function (value) {
                                var chVal='';
                                if(value.cost.AWS.serviceCosts[keyChild]){
                                    chVal=value.cost.AWS.serviceCosts[keyChild];
                                } else {
                                    chVal=0;
                                }
                                va.push([value.fromTime,chVal]);
                            });
                            costObj.trendLineChart.data.push({
                                "key": keyChild,
                                "values": va
                            });
                        });
                        costObj.trendLineChart.data[0].values.push([]);
                    }
                });
            };
            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(filterApp,period);
                if($state.current.name === "dashboard.analytics.cost") {
                    costObj.getCostData($rootScope.filterNewEnt);
                }
            };
            costObj.init =function(){
                analyticsServices.initFilter();
                costObj.createChart();
                $timeout(function () {
                    $rootScope.applyFilter(true,'month');
                    costObj.trendsChart($rootScope.filterNewEnt);
                    var treeNames = ['Cloud Management','Analytics','Cost'];
                    $rootScope.$emit('treeNameUpdate', treeNames);
                },500);
            };
            costObj.init();

        }]);
})(angular);
