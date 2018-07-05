(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('capacityCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
            $rootScope.stateItems = $state.params;
            //analyticsServices.initFilter();
            var capaCtr =this;
            capaCtr.chartData=[];
            capaCtr.splitUp=null;
            capaCtr.pieChat={
                option:{},
                totalCoust:'',
                data: []
            };
            capaCtr.barChat={
                option:{},
                data: []
            };
            capaCtr.capaGridOptions={
                columnDefs:[],
                data:[]
            };
            capaCtr.createChart = function() {
                capaCtr.pieChat = {
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
                            pie: {
                                valueFormat: function (d) {
                                    return d3.round(d);
                                }
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

                capaCtr.barChat = {
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
                                axisLabel: 'Count',
                                tickFormat: function (d) {
                                    return d3.round(d);
                                }
                            }
                        }
                    },
                    data: []
                };

                capaCtr.capaGridOptions = {
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
            capaCtr.getCapacityData=function(fltObj){
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
                    //param.url='http://d4d.rlcatalyst.com/analytics/capacity?parentEntityId=46d1da9a-d927-41dc-8e9e-7e926d927537&entityId=46d1da9a-d927-41dc-8e9e-7e926d927537&toTimeStamp=Mon%20Nov%2014%202016%2010:41:29%20GMT+0530%20(IST)&period=month';
                   param.url='/analytics/capacity?parentEntityId='+fltObj.org.id+'&entityId='+entityId+'&toTimeStamp='+new Date()+'&period=month';
                }

                genSevs.promiseGet(param).then(function (result) {
                    capaCtr.chartData=result;
                    $rootScope.splitUpCapacities=[];
                    if(result.splitUpCapacities && Object.keys(result.splitUpCapacities).length >0) {
                        angular.forEach(result.splitUpCapacities, function (val, key) {
                            var a=key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                                return str.toUpperCase();
                            });
                            $rootScope.splitUpCapacities.push({id:key,val:a});
                        });
                        if( $rootScope.splitUpCapacities && $rootScope.splitUpCapacities.length >0) {
                            $scope.$emit('CHANGE_splitUp', $rootScope.splitUpCapacities[0].id);
                            capaCtr.splitUp = $rootScope.splitUpCapacities[0].val;
                            capaCtr.createLable(result, $rootScope.splitUpCapacities[0].id);
                        }
                    } else {
                        capaCtr.createLable(result,'provider');
                    }
                });
            };
            capaCtr.createLable= function(result,viewType){
                capaCtr.createChart();
                if(result && result.capacity) {
                    capaCtr.capaGridOptions.data = [];
                    capaCtr.capaGridOptions.columnDefs = [
                        {name: 'name', field: 'name'},
                        {name: 'totalCapacity', field: 'capacity.totalCapacity'}
                    ];
                    capaCtr.pieChat.totalCoust = result.capacity.totalCapacity;
                    capaCtr.pieChat.data = [];
                    capaCtr.barChat.data = [];
                    // create bar
                    //if(viewType === 'ProviderView'){
                    capaCtr.capaGridOptions.data = result.splitUpCapacities[viewType];
                    if(result.splitUpCapacities && Object.keys(result.splitUpCapacities).length >0 ) {
                        angular.forEach(result.splitUpCapacities[viewType], function (value) {
                            capaCtr.pieChat.data.push({
                                key: value.name,
                                value: value.capacity.totalCapacity
                            });
                        });
                    } else{
                        capaCtr.pieChat.data.push({
                            key: result.entity.name,
                            value: result.capacity.totalCapacity
                        });
                    }
                    if(result.capacity && result.capacity.AWS && result.capacity.AWS.services) {
                        capaCtr.serviceCapacity = result.capacity.AWS.services;
                        angular.forEach(result.capacity.AWS.services, function (valueChild, keyChild) {
                            var va = [];
                            capaCtr.capaGridOptions.columnDefs.push({
                                name: keyChild,
                                field: 'capacity.AWS.services.' + keyChild
                            });
                            if(result.splitUpCapacities && Object.keys(result.splitUpCapacities).length >0 ) {
                                angular.forEach(result.splitUpCapacities[viewType], function (valBar) {
                                    var chVal = '';
                                    if (valBar.capacity.AWS.services[keyChild]) {
                                        chVal = valBar.capacity.AWS.services[keyChild];
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
                                if (result.capacity.AWS.services[keyChild]) {
                                    chVal =result.capacity.AWS.services[keyChild];
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
                            capaCtr.barChat.data.push({
                                "key": keyChild,
                                "values": va
                            });
                        });
                    }
                }
            };
            capaCtr.trendsChart=function(fltObj){
                capaCtr.trendLineChart={};
                capaCtr.trendLineChart.options = {
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
                            axisLabel: 'Count',
                            tickFormat: function (d) {
                                return d3.round(d);
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
                capaCtr.trendLineChart.data = [];
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
                   // param.url='/analytics/capacity/trend?parentEntityId='+fltObj.org.id+'&entityId='+fltObj.org.id+'&toTimeStamp='+new Date()+'&period='+fltObj.period+'&interval=86400'
                }

                genSevs.promiseGet(param).then(function (result) {
                    if(result.capacityTrends && result.capacityTrends.length) {
                        capaCtr.trendLineChart.totalCapacity = result.capacity.totalCapacity;
                        capaCtr.trendLineChart.data = [];
                        angular.forEach(result.capacity.AWS.services, function (valueChild, keyChild) {
                            var va = [];
                            angular.forEach(result.capacityTrends, function (value) {
                                var chVal='';
                                if(value.capacity.AWS.services[keyChild]){
                                    chVal=value.capacity.AWS.services[keyChild];
                                } else {
                                    chVal=0;
                                }
                                va.push([value.fromTime,chVal]);
                            });
                            capaCtr.trendLineChart.data.push({
                                "key": keyChild,
                                "values": va
                            });
                        });
                        capaCtr.trendLineChart.data[0].values.push([]);
                    }
                });
            };
            $scope.$on('CHANGE_VIEW', function (event, data) {
                if (data) {
                    capaCtr.splitUp = data.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) {
                        return str.toUpperCase();
                    });
                    capaCtr.createLable(capaCtr.chartData, data);
                }
            });
            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(filterApp,period);
                if($state.current.name === "dashboard.analytics.capacity") {
                    capaCtr.getCapacityData($rootScope.filterNewEnt);
                }
            };
            capaCtr.init =function(){
                analyticsServices.initFilter();
                capaCtr.createChart();
                $timeout(function () {
                    $rootScope.applyFilter(true,'month');
                    capaCtr.trendsChart($rootScope.filterNewEnt);
                    var treeNames = ['Cloud Management','Analytics','capacity'];
                    $rootScope.$emit('treeNameUpdate', treeNames);
                },500);
            };


            capaCtr.init();

        }]);
})(angular);
