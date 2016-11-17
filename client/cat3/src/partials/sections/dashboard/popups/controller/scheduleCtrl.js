(function(){
    "use strict";
    angular.module('dashboard')
        .controller('scheduleCtrl', ['$scope', '$modalInstance', 'items','$filter','genericServices','toastr',function($scope, $modalInstance, items,$filter,genericServices,toastr) {
            var sch=this;
            sch.instanceIds=items;
            $scope.openCalendarStart = function() {
                $scope.openedStart = true;
            };
            $scope.openCalendarEnd = function() {
                $scope.openedEnd = true;
            };
            $scope.validDateRange=false;
            $scope.dateChange= function () {
                var startDate =  Date.parse(sch.schedulerStartOn);
                var endDate =  Date.parse(sch.schedulerEndOn);
                if(startDate > endDate){
                    $scope.validDateRange=true;
                } else {
                    $scope.validDateRange=false;
                }
            };
            sch.schedulerStartOn=new Date();
            sch.schedulerEndOn=new Date();
            sch.instanceStartScheduler={
                repeats:'Minutes',
                repeatEvery:'1'
            };
            sch.instanceStopScheduler={
                repeats:'Minutes',
                repeatEvery:'1'
            };
            sch.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            sch.ok=function(){
                var params={
                    url:'/instances/schedule',
                    data:sch
                };
                genericServices.promisePut(params).then(function(){
                    toastr.success('successfully created');
                    $modalInstance.dismiss('cancel');
                });
            };
        }]);
})();
