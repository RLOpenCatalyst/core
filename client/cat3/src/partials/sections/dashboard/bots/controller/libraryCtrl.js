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
                    { name: 'type',field:'botType'},
                    { name: 'name',field:'name'},
                    { name: 'description',field:'shortDesc'},
                    { name: 'run Bot' },
                    { name: 'history' },
                    { name: 'last run'},
                    { name: 'bot Action',cellTemplate:'<span class="btn cat-btn-update control-panel-button" title="Launch" ng-click="grid.appScope.launchInstance(row.rowEntity);"><i class="fa fa-location-arrow white"></i></span>'}
                ],
                data:[]
            };
            $scope.launchInstance = function(lunch){
                    if(lunch.botType === 'Task'){
                        genSevs.executeTask(lunch);

                    } else if(lunch.botType === 'blueprint') {
                        genSevs.lunchBlueprint(lunch);
                    }
            };
            lib.int =function(){
                lib.gridOptions.data=[];
                var param={
                    url:'/blueprints/serviceDelivery/?serviceDeliveryCheck=true'
                };
                genSevs.promiseGet(param).then(function (result) {
                    angular.extend(lib.gridOptions.data,result);
                });
                var param2={
                    url:'/tasks/serviceDelivery/?serviceDeliveryCheck=true'
                };
                genSevs.promiseGet(param2).then(function (resultTask) {
                    angular.extend(lib.gridOptions.data,resultTask);
                });
            };
            lib.int();

        }]);
})(angular);