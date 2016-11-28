/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addChefJobEventCtrl',['$scope', '$modalInstance', 'items' ,'toastr',function($scope, $modalInstance , items , toastr){
			console.log(items);
			if(items.type !== 'new'){
				$scope.schedulerStartOn = items.chefJenkScriptTaskObj.cronStart;
				$scope.schedulerEndOn = items.chefJenkScriptTaskObj.cronEnd;
				$scope.repeatBy = items.chefJenkScriptTaskObj.repeatBy;
				$scope.repeatsType = items.chefJenkScriptTaskObj.repeats;
				$scope.timeEventType = items.chefJenkScriptTaskObj.startTime;
				$scope.timeEventMinute = items.chefJenkScriptTaskObj.startTimeMinute;
				$scope.weekOfTheDay = items.chefJenkScriptTaskObj.dayOfWeek;
				$scope.currentDate = items.chefJenkScriptTaskObj.startDate;
				$scope.selectedDayOfTheMonth = items.chefJenkScriptTaskObj.selectedDayOfTheMonth;
				$scope.selectedMonth = items.chefJenkScriptTaskObj.monthOfYear;
			} else {
				$scope.repeatsType = 'Minutes';//default selection.
				$scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            	$scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');
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
            /*$scope.timeCount = function(max, step) {
                step = step || 1;
                var input = [];
                for (var i = 0; i <= max; i += step) {
                    input.push(i);
                }
                return input;
            };
            $scope.timeCountMinutes = function(max, step) {
                step = step || 1;
                var input = [];
                for (var i = 0; i <= max; i += step) {
                    input.push(i);
                }
                return input;
            };
            $scope.dayOfTheMonth = function(max, step) {
                step = step || 1;
                var input = [];
                for (var i = 1; i <= max; i += step) {
                    input.push(i);
                }
                return input;
            };*/
            /*$scope.currentDate = new Date();
            $scope.currentEndDate = new Date();*/
            $scope.isDaySelected = {
            	flag:true
            }
			
			$scope.daysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ]
			;

			$scope.monthOfYear = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
			;
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				$scope.eventParams = {
					repeats: $scope.repeatsType,
					repeatBy: $scope.repeatBy,
					cronStart: $scope.schedulerStartOn,
					cronEnd: $scope.schedulerEndOn,
					startTime: $scope.timeEventType,
					startTimeMinute: $scope.timeEventMinute,
					dayOfWeek: $scope.weekOfTheDay,
					selectedDayOfTheMonth: $scope.selectedDayOfTheMonth,
					monthOfYear: $scope.selectedMonth
				};
				$modalInstance.close($scope.eventParams);
			};
		}
	]);
})(angular);

