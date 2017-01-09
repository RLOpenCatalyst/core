(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('capacityCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout','$location', '$anchorScroll','$modal',function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout,$location, $anchorScroll,$modal){
            $rootScope.stateItems = $state.params;
            //analyticsServices.initFilter();
            $scope.gototab = function(id) {
                // set the location.hash to the id of
                // the element you wish to scroll to.
                $location.hash(id);

                // call $anchorScroll()
                $anchorScroll();
            };
            var capaCtr =this;
            capaCtr.chartData=[];
            capaCtr.splitUp=null;
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

            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(filterApp,period);
                if($state.current.name === "dashboard.analytics.capacity") {
                    capaCtr.createList();
                }
            };
            capaCtr.init =function(){
                $rootScope.organNewEnt.instanceType='Unassigned';
                $rootScope.organNewEnt.provider='0';
                $rootScope.$emit('INI_usage', 'Unassigned');
                $timeout(function () {
                    $rootScope.applyFilter(true,'month');
                    var treeNames = ['Cloud Management','Analytics','capacity'];
                    $rootScope.$emit('treeNameUpdate', treeNames);
                },500);
            };
            // new e###################################
            $scope.openChart=function (id) {
                $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/analytics/view/capacityChart.html',
                    controller: 'capacityChartCtrl as capChat',
                    backdrop : 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return id;
                        }
                    }
                }).
                result.then(function() {

                }, function() {

                });
            };
            $scope.chefConfig=function (id) {
                var promise = genSevs.editRunlist(id);
            };
            capaCtr.createList = function () {
                capaCtr.listGrid=[];
                var fltrObj=$rootScope.filterNewEnt;

               // for(var value in capaCtr.serviceCapacity) {
                var value='RDS';
                    capaCtr.listGrid[value]=[];
                    capaCtr.listGrid[value].data=[];
                    capaCtr.listGrid[value].paginationPageSizes= [25, 50, 100];
                    capaCtr.listGrid[value].paginationPageSize=25;
                    $scope.colArray=['platformId','state','orgName','privateIpAddress','os']
                    capaCtr.listGrid[value].columnDefs=[
                        {name: 'Instance Id', field: 'platformId', cellTooltip: true},
                        {name: 'os', enableFiltering: true,displayName: 'os', field:'os',cellTooltip: true},
                        {name: 'privateIpAddress', displayName: 'IP Address',cellTooltip: true},
                        {name: 'state', displayName: 'Status',cellTooltip: true},
                        {name: 'Region',displayName: 'Region',
                            field: 'providerData.region',
                            cellTooltip: true
                        },
                        {name: 'orgName', displayName: 'Org Name', field: 'orgName', cellTooltip: true},
                        {name: 'cost', displayName: 'cost',cellTemplate: '<span>{{row.entity.cost.symbol}} {{row.entity.cost.aggregateInstanceCost}}</span>'},
                        {name: 'Usage', cellTooltip: true,cellTemplate:"<span class='cursor' ng-click='grid.appScope.openChart(row.entity)'><i class=\"fa fa-bar-chart\"></i></span>"},
                        // {name: 'Chef', cellTooltip: true,cellTemplate:"<span class='cursor' ng-click='grid.appScope.chefConfig(row.entity)'><i  class=\"fa fa-eye\" title=\"Chef Configuration\"></i></span>"}
                    ];
                    capaCtr.listGrid[value].onRegisterApi=function (gridApi) {
                        gridApi.grid.registerRowsProcessor($scope.singleFilter, 200);
                        $scope.gridApi = gridApi;
                    }
                if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    var param = {
                        url: '/providers/' + fltrObj.provider.id + '/unassigned-instances'
                        // url:'src/partials/sections/dashboard/analytics/data/ins.json'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        capaCtr.listGrid[value].data=instResult.data;
                    });
                }

                //}
            };
            $scope.filterInst = function() {
                $scope.gridApi.grid.refresh();
            };
            $scope.singleFilter = function( renderableRows ){
                var matcher = new RegExp(capaCtr.filterValue);
                renderableRows.forEach( function( row ) {
                    var match = false;
                    angular.forEach($scope.colArray,function( field ){
                        if ( row.entity[field] && row.entity[field].match(matcher) ){
                            match = true;
                        }
                    });
                    if ( !match ){
                        row.visible = false;
                    }
                });
                return renderableRows;
            };
            capaCtr.init();


        }]).controller('capacityChartCtrl',['$scope','$rootScope','items','genericServices','$modalInstance',function($scope,$rootScope,items,genSevs,$modalInstance){
            var capChat=this;
            capChat.items=items;
        capChat.trendLineChart={
            options:{},
            data:[]
        };
        capChat.splitUp='CPUUtilization';
            capChat.trendLineChart.options = {
                chart: {
                    //type: 'stackedAreaChart',
                    type: 'lineChart',
                    height: 200,
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
            capChat.legends=[];
        
        capChat.getData=function(fltObj){
            capChat.trendLineChart.data = [];
            var  $today = new Date();
            var $yesterday = new Date($today);
            $yesterday.setDate($today.getDate() - 1);
            if(fltObj && fltObj.resources && fltObj.resources.length >0) {
                var  $today = new Date();
                var $yesterday = new Date($today);
                $yesterday.setDate($today.getDate() - 1);
                    var param = {
                        url: '/analytics/trend/usage?resource=' + items._id + '&fromTimeStamp=' + $yesterday + '&toTimeStamp=' + $today + '&interval=3600'
                        //url:'src/partials/sections/dashboard/analytics/data/usage.json'
                    };
                    genSevs.promiseGet(param).then(function (result) {
                        var va = [];
                        if (result && result.length) {
                            angular.forEach(result[capChat.splitUp].dataPoints, function (value) {
                                va.push([Date.parse(value.fromTime), value.average]);
                            });
                            capChat.trendLineChart.data.push({
                                "key": items.platformId,
                                "values": va
                            });
                        }
                        // }
                    });
            }
        };
        capChat.splitChange=function() {
            capChat.getData($rootScope.filterNewEnt);
        };
        capChat.getData($rootScope.filterNewEnt);
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);
