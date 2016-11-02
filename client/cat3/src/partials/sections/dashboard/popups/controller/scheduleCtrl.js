(function(){
    "use strict";
    angular.module('dashboard')
        .controller('scheduleCtrl', ['$scope', '$modalInstance', 'items','$filter',function($scope, $modalInstance, items,$filter) {
            var sch=this;
            sch.schedule={
                repeat:'Daily',
                repeatTimes:'1',
                startsOn:new Date(),
                ends:'Never'
            }
            sch.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            sch.ok=function(){

            };
        }]);
})();
