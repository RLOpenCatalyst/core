(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('capacityReportCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout','$location', '$anchorScroll','$modal',function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout,$location, $anchorScroll,$modal){
            $rootScope.stateItems = $state.params;
            //analyticsServices.initFilter();
            $scope.gototab = function(id) {
                // set the location.hash to the id of
                // the element you wish to scroll to.
                $location.hash(id);

                // call $anchorScroll()
                $anchorScroll();
            };
            var capRept =this;
            capRept.chartData=[];
            capRept.splitUp=null;
            capRept.getCapacityData=function(fltObj){
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
                    capRept.chartData=result;
                    $rootScope.splitUpCapacities=[];
                    capRept.serviceCapacity=result.capacity.AWS;
                    //capRept.serviceType=Object.keys(capRept.serviceCapacity.services)[0];
                    capRept.serviceType='EC2';
                    if(result.splitUpCapacities && Object.keys(result.splitUpCapacities).length >0) {
                        angular.forEach(result.splitUpCapacities, function (val, key) {
                            var a=key.replace(/([A-Z])/g, ' $1').replace(/^./, function(str) {
                                return str.toUpperCase();
                            });
                            $rootScope.splitUpCapacities.push({id:key,val:a});
                        });
                        if( $rootScope.splitUpCapacities && $rootScope.splitUpCapacities.length >0) {
                            $scope.$emit('CHANGE_splitUp', $rootScope.splitUpCapacities[0].id);
                            capRept.splitUp = $rootScope.splitUpCapacities[0].val;
                            capRept.createLable(result, $rootScope.splitUpCapacities[0].id);
                        }
                    }
                    capRept.createList();

                });
            };

            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(filterApp,period);
                if($state.current.name === "dashboard.analytics.capacityReport") {
                    capRept.createList();
                }
            };
            capRept.init =function(){
                $rootScope.organNewEnt.instanceType='Unassigned';
                $rootScope.organNewEnt.provider='0';
                $rootScope.$emit('INI_usage', 'Unassigned');
                $timeout(function () {
                    $rootScope.applyFilter(true,'month');
                    capRept.getCapacityData($rootScope.filterNewEnt);
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
            capRept.createList = function () {
                capRept.filterValue='';
                capRept.listGrid=[];
                var fltrObj=$rootScope.filterNewEnt;

               // for(var value in capRept.serviceCapacity) {
                var value=capRept.serviceType;
                    capRept.listGrid[value]=[];
                    capRept.listGrid[value].data=[];
                    capRept.listGrid[value].paginationPageSizes= [25, 50, 100];
                    capRept.listGrid[value].paginationPageSize=25;
                    $scope.colArray=['platformId','state','orgName','privateIpAddress','os'];
                    if(capRept.serviceType === 'EC2') {
                    capRept.listGrid[value].columnDefs = [
                        {name: 'Instance Id', field: 'platformId', cellTooltip: true},
                        {name: 'os', enableFiltering: true, displayName: 'OS', field: 'os', cellTooltip: true},
                        {name: 'privateIpAddress', displayName: 'IP Address', cellTooltip: true},
                        {name: 'state', displayName: 'Status', cellTooltip: true},
                        {
                            name: 'Region', displayName: 'Region',
                            field: 'region',
                            cellTooltip: true
                        },
                        {name: 'orgName', displayName: 'Org Name', field: 'orgName', cellTooltip: true},
                        {
                            name: 'cost',
                            displayName: 'Cost',
                            cellTemplate: '<span ng-bind-html="grid.appScope.aggregateInstanceCost(row.entity.cost)"></span>'
                        },
                        {
                            name: 'Action',
                            cellTooltip: true,
                            cellTemplate: "<span class='cursor' title='Usage' style='font-size: 14px;' ng-click='grid.appScope.openChart(row.entity)'><i class=\"fa fa-line-chart\"></i></span> " +
                            "&nbsp;&nbsp; <span ng-show='row.entity.showSchedule' class='cursor' ng-click='grid.appScope.Schedule(row.entity._id)' style='font-size: 14px;' title='Schedule'><i class=\"fa fa-calendar\"></i></span>"
                        }
                        // {name: 'Chef', cellTooltip: true,cellTemplate:"<span class='cursor' ng-click='grid.appScope.chefConfig(row.entity)'><i  class=\"fa fa-eye\" title=\"Chef Configuration\"></i></span>"}
                    ];
                }
                if(capRept.serviceType === 'RDS') {
                    $scope.colArray=['platformId','state','orgName','dbEngine']
                    capRept.listGrid[value].columnDefs = [
                        {name: 'Instance', field: 'platformId', cellTooltip: true},
                        {name: 'dbEngine', enableFiltering: true, displayName: 'Engine', field: 'dbEngine', cellTooltip: true},
                        {name: 'state', displayName: 'Status', cellTooltip: true},
                        {
                            name: 'Region', displayName: 'Region',
                            field: 'region',
                            cellTooltip: true
                        },
                        {name: 'orgName', displayName: 'Org Name', field: 'orgName', cellTooltip: true},
                        {
                            name: 'cost',
                            displayName: 'Cost',
                            cellTemplate: '<span ng-bind-html="grid.appScope.aggregateInstanceCost(row.entity.cost)"></span>'
                        },
                        {
                            name: 'Action',
                            cellTooltip: true,
                            cellTemplate: "<span class='cursor' title='Usage' style='font-size: 14px;' ng-click='grid.appScope.openChart(row.entity)'><i class=\"fa fa-line-chart\"></i></span> " +
                            "&nbsp;&nbsp; <span ng-show='row.entity.showSchedule' class='cursor' ng-click='grid.appScope.Schedule(row.entity._id)' style='font-size: 14px;' title='Schedule'><i class=\"fa fa-calendar\"></i></span>"
                        }
                        // {name: 'Chef', cellTooltip: true,cellTemplate:"<span class='cursor' ng-click='grid.appScope.chefConfig(row.entity)'><i  class=\"fa fa-eye\" title=\"Chef Configuration\"></i></span>"}
                    ];
                }
                if(capRept.serviceType === 'S3'){
                    $scope.colArray=['bucketName','bucketOwnerName','orgName'];
                    capRept.listGrid[value].columnDefs=[
                        {name: 'bucketName', field: 'bucketName', cellTooltip: true},
                        {name: 'bucketOwnerName', field: 'bucketOwnerName', cellTooltip: true},
                        {name: 'bucketSize', field: 'bucketSize', displayName:'Bucket Size (MB)', cellTooltip: true},
                        {name: 'orgName', field: 'orgName', cellTooltip: true},
                        {name: 'cost', displayName: 'Cost',cellTemplate: '<span ng-bind-html="grid.appScope.aggregateInstanceCost(row.entity.cost)"></span>'},
                        {name: 'Action', cellTooltip: true,cellTemplate:"<span class='cursor' title='Usage' style='font-size: 14px;' ng-click='grid.appScope.openChart(row.entity)'><i class=\"fa fa-line-chart\"></i></span> "}
                    ];
                }
                    capRept.listGrid[value].onRegisterApi=function (gridApi) {
                       gridApi.grid.registerRowsProcessor($scope.singleFilter, 200);
                        $scope.gridApi = gridApi;
                    };

                if(capRept.serviceType === 'EC2' && fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    if($rootScope.organNewEnt.instanceType === 'Managed') {
                        $scope.instanceType= 'managedInstances';
                    } else if($rootScope.organNewEnt.instanceType === 'Assigned'){
                        $scope.instanceType= 'unmanagedInstances';
                    } else if($rootScope.organNewEnt.instanceType === 'Unassigned'){
                        $scope.instanceType= 'unassigned-instances';
                    }
                    var param = {
                        inlineLoader:true,
                       url: '/providers/' + fltrObj.provider.id + '/'+$scope.instanceType
                        //url:'src/partials/sections/dashboard/analytics/data/ins.json'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        capRept.listGrid[value].data=[];
                        if($rootScope.organNewEnt.instanceType === 'Managed') {
                            capRept.listGrid[value].data= instResult.managedInstances;
                        } else if($rootScope.organNewEnt.instanceType === 'Assigned'){
                            capRept.listGrid[value].data= instResult.unmanagedInstances;
                        } else if($rootScope.organNewEnt.instanceType === 'Unassigned'){
                            capRept.listGrid[value].data = instResult.data;
                        }
                        angular.forEach( capRept.listGrid[value].data,function (rs,k) {
                            if(rs.hardware && rs.hardware.os){
                                capRept.listGrid[value].data[k].os=rs.hardware.os;
                            }
                            if(rs.providerData && rs.providerData.region){
                                capRept.listGrid[value].data[k].region=rs.providerData.region;
                            }
                            if(rs.instanceState){
                                capRept.listGrid[value].data[k].state=rs.instanceState;
                            }
                            if($rootScope.organNewEnt.instanceType === 'Managed'){
                                capRept.listGrid[value].data[k].showSchedule=true;
                            }
                        });
                        if(capRept.listGrid[value].data && capRept.listGrid[value].data.length === 0){
                            capRept.listGrid[value].nodataFound =true;
                        } else {
                            capRept.listGrid[value].nodataFound =false;
                        }
                    });
                } else if(fltrObj && fltrObj.provider && fltrObj.provider.id){
                    var param = {
                        inlineLoader:true,
                       url: '/resources?filterBy=providerDetails.id:'+fltrObj.provider.id+',resourceType:'+capRept.serviceType+',category:'+$rootScope.organNewEnt.instanceType.toLowerCase()
                       // url:'src/partials/sections/dashboard/analytics/data/ins.json'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        /////
                        capRept.listGrid[value].data = instResult.data;
                            if(capRept.serviceType === 'RDS'){
                                angular.forEach(instResult.data,function (va,ke) {
                                    capRept.listGrid[value].data[ke].platformId = va.resourceDetails.dbInstanceIdentifier;
                                    capRept.listGrid[value].data[ke].dbEngine = va.resourceDetails.dbEngine;
                                    capRept.listGrid[value].data[ke].state = va.resourceDetails.dbInstanceStatus;
                                    capRept.listGrid[value].data[ke].providerData={};
                                    capRept.listGrid[value].data[ke].providerData.region = va.resourceDetails.region;
                                    capRept.listGrid[value].data[ke].orgName = va.masterDetails.orgName;
                                    capRept.listGrid[value].data[ke].showSchedule=false;
                                });
                            }

                        if(capRept.serviceType === 'S3'){
                            angular.forEach(instResult.data,function (va,ke) {
                                capRept.listGrid[value].data[ke].platformId= va.resourceDetails.bucketName;
                                capRept.listGrid[value].data[ke].bucketName = va.resourceDetails.bucketName;
                                capRept.listGrid[value].data[ke].bucketOwnerName = va.resourceDetails.bucketOwnerName;
                                capRept.listGrid[value].data[ke].bucketSize = va.resourceDetails.bucketSize;
                                capRept.listGrid[value].data[ke].orgName = va.masterDetails.orgName;
                            });

                        }
                        ///


                        if(capRept.listGrid[value].data && capRept.listGrid[value].data.length === 0){
                            capRept.listGrid[value].nodataFound =true;
                        } else {
                            capRept.listGrid[value].nodataFound =false;
                        }
                    });
                }

                //}
            };
            $scope.$watch('capRept.serviceType',function (newValue, oldValue) {
                capRept.createList();
            });
            $scope.aggregateInstanceCost=function (cost) {
                if(cost){
                    return cost.symbol+' '+ cost.aggregateInstanceCost;
                } else {
                    return '....';
                }
            };
            $scope.Schedule =function (id) {
                var a=[];
                a.push(id);
                genSevs.scheduleTime(a);
            };
            $scope.filterInst = function() {
                $scope.gridApi.grid.refresh();
            };
            $scope.singleFilter = function( renderableRows ){
                var matcher = new RegExp(capRept.filterValue);
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
            capRept.init();


        }]).controller('capacityChartCtrl',['$scope','$rootScope','items','genericServices','$modalInstance',function($scope,$rootScope,items,genSevs,$modalInstance){
            var capChat=this;
            capChat.items=items;
        capChat.trendLineChart={
            options:{},
            data:[]
        };
        capChat.result=[];
            capChat.trendLineChart.options = {
                chart: {
                    //type: 'stackedAreaChart',
                    type: 'lineChart',
                    height: 200,
                    margin: {
                        top: 20,
                        right: 20,
                        bottom:70,
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
                        axisLabel: 'Date',
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
            capChat.sliptOptions=[];
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
                        angular.forEach(result,function (val,ke) {
                            capChat.sliptOptions.push(ke);
                        });
                        capChat.splitUp=Object.keys(result)[0];
                        capChat.result=result;
                        capChat.createChart();
                        // }
                    });
            }
        };
        capChat.createChart=function () {
            var va = [];
            capChat.trendLineChart.data = [];
            if (capChat.result) {
                capChat.trendLineChart.options.chart.yAxis.axisLabel=capChat.result[capChat.splitUp].unit;
                angular.forEach(capChat.result[capChat.splitUp].dataPoints, function (value) {
                    va.push([Date.parse(value.fromTime), value.average]);
                });
                capChat.trendLineChart.data.push({
                    "key": items.platformId,
                    "values": va
                });
            }
        };
        capChat.splitChange=function() {
            capChat.createChart();
        };
        capChat.getData($rootScope.filterNewEnt);
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);
