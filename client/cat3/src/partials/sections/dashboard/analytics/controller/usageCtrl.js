(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('usageCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
        $rootScope.stateItems = $state.params;
            var usage =this;
            usage.trendLineChart={
                data:[]
            };
            usage.trendsChart=function(fltObj){
                usage.trendLineChart.options = {
                    chart: {
                        //type: 'stackedAreaChart',
                        type: 'lineChart',
                        height: 350,
                        margin: {
                            top: 20,
                            right: 20,
                            bottom: 50,
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
                usage.trendLineChart.data = [];
                usage.legends=[];
                usage.costGridOptions.columnDefs = [];
                usage.getData(fltObj);
                 };
                usage.getData=function(fltObj){
                    usage.trendLineChart.data = [];
                    var  $today = new Date();
                    var $yesterday = new Date($today);
                    $yesterday.setDate($today.getDate() - 1);
                    if(fltObj && fltObj.resources && fltObj.resources.length >0) {
                    angular.forEach(fltObj.resources, function (resId) {
                    var param = {
                        url: '/analytics/trend/usage?resource='+resId+'&fromTimeStamp='+$yesterday+'&toTimeStamp='+ $today+'&interval=3600'
                    };
                    genSevs.promiseGet(param).then(function (result) {
                        angular.forEach(result, function (valu, keyChild) {
                            var va = [];
                            if(usage.splitUp === keyChild) {
                                angular.forEach(valu.dataPoints, function (value) {
                                    va.push([Date.parse(value.fromTime), value.average]);
                                });
                                usage.trendLineChart.data.push({
                                    "key":$rootScope.filterNewEnt.platformId[resId],
                                    "values": va
                                });
                            }
                        });
                    });
                    });
                    }
                };
                $rootScope.applyFilter =function(filterApp,period){
                    analyticsServices.applyFilter(filterApp,period);
                    if($state.current.name === "dashboard.analytics.usage") {
                        usage.splitUp='CPUUtilization';
                       usage.trendsChart($rootScope.filterNewEnt);
                    }
                };
                usage.splitChange=function() {
                    usage.getData($rootScope.filterNewEnt);
                };
                usage.init =function(){
                        $rootScope.organNewEnt.instanceType='Unassigned';
                        $rootScope.organNewEnt.provider='0';
                    $rootScope.$emit('INI_usage', 'Unassigned');
                        $timeout(function(){$rootScope.applyFilter(true,'month')},500);
                        var treeNames = ['Analytics','Usage'];
                        $rootScope.$emit('treeNameUpdate', treeNames);

                };
            usage.init();

        }]);
})(angular);
