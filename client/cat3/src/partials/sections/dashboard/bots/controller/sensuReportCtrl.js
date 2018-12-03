/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Feb 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('sensuReportCtrl',['$scope','$rootScope','analyticsServices', 'genericServices','$timeout', function ($scope, $rootScope,analyticsServices,genSevs,$timeout) {
      
        var treeNames = ['BOTs','SensuReport'];
        $rootScope.$emit('treeNameUpdate', treeNames);


        $scope.options = {
            chart: {
                type: 'multiBarChart',
                height: 450,
                margin : {
                    top: 40,
                    right: 20,
                    bottom: 45,
                    left: 45
                },
                clipEdge: true,
                duration: 500,
                stacked: true,
               
                xAxis: {
                    axisLabel: 'Name',
                                showMaxMin: false,
                                staggerLabels:false,
                                tickFormat: function(d){
                                    return d;
                                }
                },
                yAxis: {
                    axisLabel: 'Total Tickets',
                    axisLabelDistance: -20,
                    tickFormat: function(d){
                        return d3.format(',.1f')(d);
                    }
                }
            }
        };
        $scope.data = [{
            key: 'open',
            values: [{x:'TdmsBot',y:2,key:"open"},{x:'Office365',y:5,key:"open"},{x:'NEAccount',y:9,key:"open"},{x:'CreateDL',y:10,key:"open"},{x:'ADaccount',y:16,key:"open"},{x:'Harshit',y:18,key:"open"},{x:'Sundeep',y:9,key:"open"},{x:'AutoBot',y:20,key:"open"},{x:'akash',y:24,key:"open"},{x:'Hrushikesh',y:28,key:"open"},{x:'ADDisableUser',y:32,key:"open"},{x:'Manish',y:35,key:"open"}],
            color: "#f39c12"                
          
        },{
            key: 'Closed',
            values: [{x:'TdmsBot',y:3,key:"closed"},{x:'Office365',y:7,key:"closed"},{x:'NEAccount',y:11,key:"closed"},{x:'CreateDL',y:13,key:"closed"},{x:'ADaccount',y:17,key:"closed"},{x:'Harshit',y:23,key:"closed"},{x:'Sundeep',y:29,key:"closed"},{x:'AutoBot',y:33,key:"closed"},{x:'akash',y:27,key:"closed"},{x:'Hrushikesh',y:22,key:"closed"},{x:'ADDisableUser',y:37,key:"closed"},{x:'Manish',y:39,key:"closed"}],
            color: "#00875a"                
          
        },{
            key: 'InProgress',
            values: [{x:'TdmsBot',y:7,key:"Inprogress"},{x:'Office365',y:13,key:"Inprogress"},{x:'NEAccount',y:22,key:"Inprogress"},{x:'CreateDL',y:27,key:"Inprogress"},{x:'ADaccount',y:29,key:"Inprogress"},{x:'Harshit',y:34,key:"Inprogress"},{x:'Sundeep',y:38,key:"Inprogress"},{x:'AutoBot',y:40,key:"Inprogress"},{x:'akash',y:43,key:"Inprogress"},{x:'Hrushikesh',y:45,key:"Inprogress"},{x:'ADDisableUser',y:47,key:"Inprogress"},{x:'Manish',y:49,key:"Inprogress"}],
            color: "#0052cc"                
          
        }]

        /* Random Data Generator (took from nvd3.org) */
      

       
    }]);
})(angular);