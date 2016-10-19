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
                    { name: 'type'},
                    { name: 'name'},
                    { name: 'description'},
                    { name: 'run Bot' },
                    { name: 'history' },
                    { name: 'last run'},
                    { name: 'bot Action'}
                ],
                data:[{},{}]
            };

            lib.int =function(){
                var param={
                    url:'/config-data/bot-type'
                };
                genSevs.promiseGet(param).then(function (result) {

                });
            };
            lib.int();

        }]);
})(angular);