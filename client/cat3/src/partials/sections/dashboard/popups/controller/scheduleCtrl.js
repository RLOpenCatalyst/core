(function(){
    "use strict";
    angular.module('dashboard')
        .controller('scheduleCtrl', ['$scope', '$modalInstance', 'items','$filter','genericServices','toastr','$timeout',function($scope, $modalInstance, items,$filter,genericServices,toastr,$timeout) {
            var sch=this;
            sch.instanceIds=items;
            sch.interval=[{ind:0,"days":[],"action":"start","daySelect":''}];
            $timeout(function(){$('input.time').trigger('click');},100);
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
            $scope.addNewTime = function () {
                sch.interval.push({ind: sch.interval.length,"days":[],"action":"start","daySelect":''});
                $timeout(function(){$('input.time').trigger('click');},100);
            };
            $scope.selectDays=function (d,i) {
                if(sch.interval[i].days.indexOf(d) === -1){
                    sch.interval[i].days.push(d);
                } else {
                    sch.interval[i].days.splice(sch.interval[i].days.indexOf(d),1);
                }
                if(sch.interval[i].days.length >0){
                    sch.interval[i].daySelect=1;
                } else{
                    sch.interval[i].daySelect='';
                }
            };
            $scope.removeTime = function (ind) {
                sch.interval.splice(ind,1);
            };
            sch.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            sch.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
            sch.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            if(sch.instanceIds.length === 1){
                var params={
                    url:'/instances/'+sch.instanceIds[0]
                    //url:'src/partials/sections/dashboard/workzone/data/oneIns.json'
                };
                genericServices.promiseGet(params).then(function (result) {
                    sch.isScheduled=result.isScheduled;
                    sch.schedulerStartOn=moment(result.schedulerStartOn).format('MM/DD/YYYY');
                    sch.schedulerEndOn=moment(result.schedulerEndOn).format('MM/DD/YYYY');
                    sch.interval=result.interval;

                });
            }
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
