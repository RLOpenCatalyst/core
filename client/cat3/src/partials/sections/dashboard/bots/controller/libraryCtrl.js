(function (angular) {
    "use strict";
    angular.module('library.bots', [])
        .controller('libraryCtrl',['$scope', '$rootScope','$state','genericServices', function ($scope, $rootScope,$state,genSevs) {
            var treeNames = ['Bots','Library'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var lib=this;
            lib.gridOptions={
                gridOption:{
                    paginationPageSizes: [25, 50, 75],
                    paginationPageSize: 25,
                    enableColumnMenus:false,
                    multiSelect :false,
                },
                columnDefs: [
                    { name: 'Icon',field:'',width:100},
                    { name: 'bots type',field:'botType'},
                    { name: 'bots name',field:'name'},
                    { name: 'description',field:'shortDesc'},
                    { name: 'bot Action',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="Launch" ng-click="grid.appScope.launchInstance(row.entity);"><i class="fa fa-play white"></i></span>'}
                ],
                data:[]
            };
            $scope.launchInstance = function(lunch){
                    if(lunch.launcType === 'task'){
                        genSevs.executeTask(lunch);

                    } else if(lunch.launcType === 'bp') {
                        genSevs.lunchBlueprint(lunch);
                    }
            };
            lib.int =function(){
                lib.gridOptions.data=[];
                var param={
                    url:'/blueprints/serviceDelivery/?serviceDeliveryCheck=true'
                    //url:'src/partials/sections/dashboard/bots/data/bp.json'
                };
                genSevs.promiseGet(param).then(function (result) {
                    angular.forEach(result,function (val) {
                        angular.extend(val,{launcType:'bp'});
                        lib.gridOptions.data.push(val);
                    });
                });
                var param2={
                   url:'/tasks/serviceDelivery/?serviceDeliveryCheck=true'
                   // url:'src/partials/sections/dashboard/bots/data/t.json'
                };
                genSevs.promiseGet(param2).then(function (resultTask) {
                    angular.forEach(resultTask,function (val) {
                        angular.extend(val,{launcType:'task'});
                        lib.gridOptions.data.push(val);
                    });
                });
            };
            lib.int();

        }]);
})(angular);