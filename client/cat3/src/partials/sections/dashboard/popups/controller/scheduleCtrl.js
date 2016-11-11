(function(){
    "use strict";
    angular.module('dashboard')
        .controller('scheduleCtrl', ['$scope', '$modalInstance', 'items','$filter','genericServices','toastr',function($scope, $modalInstance, items,$filter,genericServices,toastr) {
            var sch=this;
            sch.instanceIds=items;
            $scope.openCalendarStart = function(e, picker) {
                $scope.openedStart = true;
            };
            $scope.openCalendarEnd = function(e, picker) {
                $scope.openedEnd = true;
            };
            sch.schedulerStartOn=new Date();
            sch.schedulerEndOn=new Date();
            sch.instanceStartScheduler={
                repeats:'Day',
                repeatEvery:'1'
            };
            sch.instanceStopScheduler={
                repeats:'Day',
                repeatEvery:'1'
            };
            sch.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            sch.ok=function(){
                var params={
                    url:'/instances/schedule',
                    data:sch
                }
                genericServices.promisePost(params).then(function(){
                    toastr.success('successfully created');
                });
            };
        }]);
})();
