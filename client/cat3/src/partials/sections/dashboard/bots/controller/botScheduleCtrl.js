/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jan 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botScheduleCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', function ($scope, $rootScope, genSevs, workzoneServices, toastr) {
        
        var items;
        $scope.showForAll = true;
        $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
            $scope.templateSelected = reqParams;
        });
        

        if($scope.templateSelected) {
            items = $scope.templateSelected;
        }

        $rootScope.$on('BOTS_DESCRIPTION_REFRESH', function(event,reqParams) {
            $scope.templateSelected = reqParams;
            items = $scope.templateSelected;
            $scope.scheduleDeatils = items;
            $scope.checkForScheduler();
        });

        if(items.isScheduled === true){
            $scope.isScheduled = true;
        }else{
            $scope.isScheduled = false;
        }
        $scope.scheduleDeatils = items;
        $scope.botId = items._id;

        $scope.checkForScheduler = function() {
            if($scope.scheduleDeatils.type === 'blueprints') {
                if($scope.scheduleDeatils.executionCount <=0) {
                    $scope.showForBlueprints = true;
                    $scope.showForAll = false;
                } else {
                    $scope.showForBlueprints = false;
                    $scope.showForAll = true;
                }
            } else {
                $scope.showForBlueprints = false;
            }
        }

        $scope.defaultSelection = function() {
            $scope.repeatsType = 'Minutes';//default selection.
            $scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            $scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
        };

        if(items.isScheduled === true && items.scheduler !== null){
            if(items.scheduler.cronStartOn && items.scheduler.cronEndOn) {
                var newStartOn = parseInt(items.scheduler.cronStartOn);
                var newDate = new Date(newStartOn).toLocaleDateString();
                var datearray = newDate.split("/");
                var newdate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
                $scope.schedulerStartOn = newdate;
                var newEndOn = parseInt(items.scheduler.cronEndOn);
                var newEndData = new Date(newEndOn).toLocaleDateString();   
                var datearrayNew = newEndData.split("/");
                var newdateEnd = datearrayNew[1] + '/' + datearrayNew[0] + '/' + datearrayNew[2];
                $scope.schedulerEndOn = newdateEnd;
            } else {
                $scope.schedulerStartOn = items.scheduler.cronStartOn;
                $scope.schedulerEndOn = items.scheduler.cronEndOn;
            }

            $scope.repeatBy = items.scheduler.repeatBy || items.scheduler.cronRepeatEvery.toString();
            $scope.repeatsType = items.scheduler.repeats || items.scheduler.cronFrequency;
            $scope.timeEventType = items.scheduler.timeEventHour || (items.scheduler.cronHour && items.scheduler.cronHour !==null) ? items.scheduler.cronHour.toString() : '';
            $scope.timeEventMinute = items.scheduler.timeEventMinute || (items.scheduler.cronMinute && items.scheduler.cronMinute !==null) ? items.scheduler.cronMinute.toString() : '';
            $scope.weekOfTheDay = items.scheduler.weekOfTheDay ||  (items.scheduler.cronWeekDay && items.scheduler.cronWeekDay !==null) ?items.scheduler.cronWeekDay.toString(): '';
            $scope.selectedDayOfTheMonth = items.scheduler.selectedDayOfTheMonth || (items.scheduler.cronDate && items.scheduler.cronDate !==null) ?items.scheduler.cronDate.toString() : '';
            $scope.selectedMonth =  items.scheduler.selectedMonth || (items.scheduler.cronMonth && items.scheduler.cronMonth !==null)  ? items.scheduler.cronMonth.toString() : '';
            /*$scope.currentDate = items.scheduler.startDate;*/
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
            
            reqBody = {
                scheduler:$scope.eventParams,
                isScheduled:true
            }
            var param={
                url:'/botsNew/' + $scope.botId + '/scheduler',
                data: reqBody
            };
            genSevs.promisePut(param).then(function (response) {
                if(response){
                    toastr.success('BOTs Scheduler successfully updated');
                    $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                    $scope.$dismiss('cancel');
                }
            });
        };
        $scope.checkForScheduler();
    }]);
})(angular);