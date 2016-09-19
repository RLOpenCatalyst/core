(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('costCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices', function ($scope,$rootScope,$state,analyticsServices,genSevs){
        $rootScope.stateItems = $state.params;
        $rootScope.organNewEnt=[];
        $rootScope.organNewEnt.org = '0';
        $rootScope.organNewEnt.buss='0';
        $rootScope.organNewEnt.proj='0';
            var costObj =this;
            costObj.pieChat={
                option:{
                    chart: {
                        type: 'pieChart',
                        margin: {
                            top: 20,
                            right: 0,
                            bottom: 60,
                            left:0
                        },
                        height:300,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showLabels: false,
                        showValues: true,
                        labelThreshold: 0.01,
                        labelSunbeamLayout: true,
                        legend: {

                        }
                    }
                },
                totalCoust:'',
                data:[]
            };

            costObj.barChat ={
                option: {
                    chart: {
                        type: 'multiBarHorizontalChart',
                        height: 300,
                        margin: {
                            top: 20,
                            right: 20,
                            bottom: 60,
                            left: 40
                        },
                        duration: 50,
                        x: function (d) {
                            return d.label;
                        },
                        y: function (d) {
                            return d.value;
                        },
                        showControls: false,
                        showValues: true,
                        xAxis: {
                            showMaxMin: false
                        },
                        yAxis: {
                            axisLabel: 'Values',
                            tickFormat: function (d) {
                                return d3.format(',.2f')(d);
                            }
                        }
                    }
                },
                data:
                    [
                       {
                            "key": "EC2",
                            "color": "#58AAE2",
                            "values": []
                        },
                        {
                            "key": "RDS",
                            "color": "#EF892F",
                            "values": []
                        },
                        {
                            "key": "S3",
                            "color": "#8CAEDA",
                            "values": []
                        }
                    ]

            };

            var param={
                url:'src/partials/sections/dashboard/analytics/data/cost.json'
            };
            genSevs.promiseGet(param).then(function(result){
                costObj.pieChat.totalCoust= result.cost.totalCost;
                angular.forEach(result.splitUpCosts.businessUnits,function (value) {
                    costObj.pieChat.data.push( {
                        key: value.name,
                        y:value.cost.totalCost
                    });
                    costObj.barChat.data[0].values.push( {
                        "label" :value.name ,
                        "value" : value.cost.awsCosts.serviceCosts.ec2
                    });
                    costObj.barChat.data[1].values.push( {
                        "label" :value.name ,
                        "value" : value.cost.awsCosts.serviceCosts.rds
                    });
                    costObj.barChat.data[2].values.push( {
                        "label" :value.name ,
                        "value" : value.cost.awsCosts.serviceCosts.s3
                    });
                });
                // angular.forEach(result.splitUpCosts.providers,function (valu) {
                //     costObj.pieChat.data.push( {
                //         key: valu.name,
                //         y:valu.cost.totalCost
                //     });
                // });
            });




        $scope.optionsLine= {
            chart: {
                type: 'cumulativeLineChart',
                height:250,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 65
                },
                x: function(d){ return d[0]; },
                y: function(d){ return d[1]/10; },
                color: d3.scale.category10().range(),
                duration: 300,
                useInteractiveGuideline: true,
                clipVoronoi: false,

                xAxis: {
                    axisLabel: 'X Axis',
                    tickFormat: function(d) {
                        return d3.time.format('%Y/%m/%d')(new Date(d))
                    },
                    showMaxMin: false,
                    staggerLabels: true
                },

                yAxis: {
                    axisLabel: 'Y Axis',
                    tickFormat: function(d){
                        return d3.format(',.2f')(d);
                    },
                    axisLabelDistance: 20
                }
            }
        };

        $scope.dataLine = [  {
            key: "EC2",
            values: [ [ 1083297600000 , 30] , [ 1085976000000 , 50] , [ 1088568000000 , 20] ]

        },
            {
                key: "RDS",
                values: [ [ 1083297600000 , 20] , [ 1085976000000 ,20] , [ 1088568000000 , 60]]

            },


            {
                key: "S3",
                values: [ [ 1083297600000 , 10] , [ 1085976000000 , 50],[ 1088568000000 , 40]]
            }];

    }]);
})(angular);
