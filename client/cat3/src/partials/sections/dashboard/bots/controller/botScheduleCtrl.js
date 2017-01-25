/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botScheduleCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', function ($scope, $rootScope, genSevs, workzoneServices, toastr) {
        
        var items = $rootScope.botSchedule;

        $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
            $scope.templateSelected = reqParams;
        });
        
        if($scope.templateSelected) {
            items = $scope.templateSelected;
        }

        if(items.isBotScheduled === true){
            $scope._isEventSelected = true;
            $scope.isScheduled = true;
        }else{
            $scope._isEventSelected = false;
            $scope.isScheduled = false;
        }
        $scope.scheduleDeatils = items;
        $scope.botId = items.botId;
        $scope.defaultSelection = function() {
            $scope.repeatsType = 'Minutes';//default selection.
            $scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            $scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
        };
        $scope.selectBotCheckbox = function(){
            if($scope.isScheduled === true || $scope.isScheduled === 'true') {
                $scope._isEventSelected = true;
            }else{
                $scope._isEventSelected = false;
            }
        };
        if(items.botScheduler){
            if(items.botScheduler.cronStartOn && items.botScheduler.cronEndOn) {
                var newStartOn = parseInt(items.botScheduler.cronStartOn);
                var newDate = new Date(newStartOn).toLocaleDateString();
                var datearray = newDate.split("/");
                var newdate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                $scope.schedulerStartOn = newdate;
                var newEndOn = parseInt(items.botScheduler.cronEndOn);
                var newEndData = new Date(newEndOn).toLocaleDateString();   
                var datearrayNew = newEndData.split("/");
                var newdateEnd = datearrayNew[1] + '/' + datearrayNew[0] + '/' + datearrayNew[2];
                $scope.schedulerEndOn = newdateEnd;
            } else {
                $scope.schedulerStartOn = items.botScheduler.cronStartOn;
                $scope.schedulerEndOn = items.botScheduler.cronEndOn;    
            }

            $scope.repeatBy = items.botScheduler.repeatBy || items.botScheduler.cronRepeatEvery.toString();
            $scope.repeatsType = items.botScheduler.repeats || items.botScheduler.cronFrequency;
            $scope.timeEventType = items.botScheduler.timeEventHour || (items.botScheduler.cronHour && items.botScheduler.cronHour !==null) ? items.botScheduler.cronHour.toString() : '';
            $scope.timeEventMinute = items.botScheduler.timeEventMinute || (items.botScheduler.cronMinute && items.botScheduler.cronMinute !==null) ? items.botScheduler.cronMinute.toString() : '';
            $scope.weekOfTheDay = items.botScheduler.weekOfTheDay ||  (items.botScheduler.cronWeekDay && items.botScheduler.cronWeekDay !==null) ?items.botScheduler.cronWeekDay.toString(): '';
            $scope.selectedDayOfTheMonth = items.botScheduler.selectedDayOfTheMonth || (items.botScheduler.cronDate && items.botScheduler.cronDate !==null) ?items.botScheduler.cronDate.toString() : '';
            $scope.selectedMonth =  items.botScheduler.selectedMonth || (items.botScheduler.cronMonth && items.botScheduler.cronMonth !==null)  ? items.botScheduler.cronMonth.toString() : '';
            /*$scope.currentDate = items.botScheduler.startDate;*/
        } else {
            $scope.defaultSelection();
        }
        
        $scope.dateChange= function () {
            var startDate =  Date.parse($scope.schedulerStartOn);
            var endDate =  Date.parse($scope.schedulerEndOn);
            if(startDate > endDate){
                $scope.validDateRange=true;
            } else {
                $scope.validDateRange=false;
            }
        };

        $scope.repeatCount = function(max, step) {
            step = step || 1;
            var input = [];
            for (var i = 1; i <= max; i += step) {
                input.push(i);
            }
            return input;
        };
        $scope.isDaySelected = {
            flag:true
        };

        $scope.daysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

        $scope.monthOfYear = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

        $scope.ok=function(){
            $scope.eventParams = {
                cronFrequency: $scope.repeatsType,
                cronRepeatEvery: $scope.repeatBy,
                cronStartOn: $scope.schedulerStartOn,
                cronEndOn: $scope.schedulerEndOn,
                cronHour: $scope.timeEventType,
                cronMinute: $scope.timeEventMinute,
                cronWeekDay: $scope.weekOfTheDay,
                cronDate: $scope.selectedDayOfTheMonth,
                cronMonth: $scope.selectedMonth
            };
            var reqBody = null;
            if($scope.isScheduled === true || $scope.isScheduled === 'true'){
                reqBody = {
                    botScheduler:$scope.eventParams,
                    isBotScheduled:true
                };
            }else{
                reqBody = {
                    botScheduler:{},
                    isBotScheduled:false
                };
            }
            var param={
                url:'/bots/' + $scope.botId + '/scheduler',
                data: reqBody
            };
            genSevs.promisePut(param).then(function (response) {
                if(response){
                    toastr.success('BOTs Scheduler successfully updated');
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                    //$modalInstance.dismiss('cancel');
                }
            });
        };

        $scope.cancel = function() {
            //$modalInstance.dismiss('cancel');
        };
    }]);
})(angular);