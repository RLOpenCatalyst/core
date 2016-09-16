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
                        height:400,
                        x: function(d){return d.key;},
                        y: function(d){return d.y;},
                        showLabels: true,
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
                        height: 400,
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
                            "color": "#0000FF",
                            "values": []
                        },
                        {
                            "key": "RDS",
                            "color": "#A9A9A9",
                            "values": []
                        },
                        {
                            "key": "S3",
                            "color": "#006400",
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
                // angular.forEach(result.splitUpCosts.provider,function (valu) {
                //     costObj.pieChat.data.push( {
                //         key: valu.name,
                //         y:valu.cost.totalCost
                //     })
                // });
            });




        $scope.optionsLine= {
            chart: {
                type: 'cumulativeLineChart',
                height: 450,
                margin : {
                    top: 20,
                    right: 20,
                    bottom: 60,
                    left: 65
                },
                x: function(d){ return d[0]; },
                y: function(d){ return d[1]/100; },
                average: function(d) { return d.mean/100; },

                color: d3.scale.category10().range(),
                duration: 300,
                useInteractiveGuideline: true,
                clipVoronoi: false,

                xAxis: {
                    axisLabel: 'X Axis',
                    tickFormat: function(d) {
                        return ['BU-1'],['BU-2']
                    },
                    showMaxMin: false,
                    staggerLabels: true
                },

                yAxis: {
                    axisLabel: 'Y Axis',
                    tickFormat: function(d){
                        return d3.format(',.100')(d);
                    },
                    axisLabelDistance: 25
                }
            }
        };

        $scope.dataLine = [
            {
                key: "EC2",
                values: [ [ 1083297600000 , -2.974623048543] , [ 1085976000000 , -1.7740300785979] ]
            },
            {
                key: "RDS",
                values: [ [ 1083297600000 , -0.77078283705125] ]
            }
        ];
    }]);;
})(angular);
