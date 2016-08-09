/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of $scope file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

angular.module('dashboard.analytics', [ 'apis.analytics'])
    .controller('analyticsCtrl', ['$scope', '$rootScope','$state','analyticsServices', analyticsCtrl])
    .controller('analyticsLeftMenu',['analyticsServices','$state',function (analyticsServices,$state){
        var analyticLeftMenu =this;
        var params = {
            url: '/organizations/getTreeNew'
        };
        analyticsServices.promiseGet(params).then(function(result){
            analyticLeftMenu.leftTree=result;
            if(result){
                var orga=result[0];
                $state.go('dashboard.analytics',{org:{name:orga.name,id:orga.rowid,env:orga.environments},bus:null,proj:null,env:null});
            }

        });
    }]);
function analyticsCtrl($scope, $rootScope,$state,analyticsServices) {
    var analytic =this;
    $rootScope.dashboardChild='analytics';
    analytic.stateParams=$state.params;
    var treeNames=['ANALYTICS'];
    if($state.params.org && $state.params.org.name){
        treeNames.push($state.params.org.name);
    }
    if($state.params.bus && $state.params.bus.name){
        treeNames.push($state.params.bus.name);
    }
    if($state.params.proj && $state.params.proj.name){
        treeNames.push($state.params.proj.name);
    }
       $rootScope.$emit('treeNameUpdate', treeNames);
    /*Note state params value is passed from routes, while state is already added in rootscope*/
    $scope.Text = "State Params Example : " + $rootScope.stateParams.activeSection;
    $rootScope.$emit('HEADER_NAV_CHANGE','ANALYTICS');
    analytic.envChange = function () {
    };
}


