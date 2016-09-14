 function usageCtrl($scope,$rootScope,$state){
            $rootScope.stateItems = $state.params;
             $rootScope.organNewEnt=[];
             $rootScope.organNewEnt.org = '0';
             $rootScope.organNewEnt.buss='0';
             $rootScope.organNewEnt.proj='0';
            $scope.options = {
                chart: {
                    type: 'pieChart',
                    height:400,
                    x: function(d){return d.key;},
                    y: function(d){return d.y;},
                    showLabels: true,
                    labelThreshold: 0.01,
                    labelSunbeamLayout: true,
                    legend: {

                    }
                }
            };
            $scope.optionsBar = {
                chart: {
                    type: 'multiBarHorizontalChart',
                    height:350,
                    margin : {
                        top: 20,
                        right: 20,
                        bottom: 60,
                        left: 40
                    },
                    duration: 50,
                    x: function(d){return d.label;},
                    y: function(d){return d.value;},
                    showControls: false,
                    showValues: true,
                    xAxis: {
                        showMaxMin: false
                    },
                    yAxis: {
                        axisLabel: 'Values',
                        tickFormat: function(d){
                            return d3.format(',.2f')(d);
                        }
                    }
                }
            };
            $scope.dataBar=[ {
                "key": "RDS",
                "color": "#0E3A6E",
                "values": [
                    {
                        "label" : "Bu-1" ,
                        "value" : 20
                    } ,
                    {
                        "label" : "Bu-2" ,
                        "value" : 22
                    } ,
                    {
                        "label" : "Bu-3" ,
                        "value" : 10
                    } ,
                    {
                        "label" : "Bu-4" ,
                        "value" : 30
                    } ,
                    {
                        "label" : "Bu-5" ,
                        "value" : 14
                    }
                ]
            }, {
                "key": "EC2",
                "color": "#40BAF1",
                "values": [
                    {
                        "label" : "Bu-1" ,
                        "value" : 40
                    } ,
                    {
                        "label" : "Bu-2" ,
                        "value" : 10
                    } ,
                    {
                        "label" : "Bu-3" ,
                        "value" : 39
                    } ,
                    {
                        "label" : "Bu-4" ,
                        "value" :22
                    } ,
                    {
                        "label" : "Bu-5" ,
                        "value" : 10
                    }
                ]
            }]
            $scope.data = [
                {
                    key: "Business Unit 1",
                    y:100
                },
                {
                    key: "Business Unit 2",
                    y: 100
                },
                {
                    key: "Business Unit 3",
                    y: 100
                },
                {
                    key: "Business Unit 4",
                    y: 100
                }
            ];

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
        }