/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addChefJobEventCtrl',['$scope', '$modalInstance', 'items',function($scope, $modalInstance , items){
			console.log(items);
			$scope.checkFrequencyCheck=false;
			$scope.defaultSelection = function() {
				$scope.repeatsType = 'Minutes';//default selection.
				$scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            	$scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');	
			};
			if(items.type !== 'new') {
				if (items.chefJenkScriptTaskObj) {
					if (items.chefJenkScriptTaskObj.cronStartOn && items.chefJenkScriptTaskObj.cronEndOn) {
						var newStartOn = parseInt(items.chefJenkScriptTaskObj.cronStartOn);
						var newDate = new Date(newStartOn).toLocaleDateString();
						var datearray = newDate.split("/");
						var newdate = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
						$scope.schedulerStartOn = newdate;
						var newEndOn = parseInt(items.chefJenkScriptTaskObj.cronEndOn);
						var newEndData = new Date(newEndOn).toLocaleDateString();
						var datearrayNew = newEndData.split("/");
						var newdateEnd = datearrayNew[1] + '/' + datearrayNew[0] + '/' + datearrayNew[2];
						$scope.schedulerEndOn = newdateEnd;
					} else {
						$scope.schedulerStartOn = items.chefJenkScriptTaskObj.cronStart;
						$scope.schedulerEndOn = items.chefJenkScriptTaskObj.cronEnd;
					}
					$scope.repeatBy = items.chefJenkScriptTaskObj.repeatBy || items.chefJenkScriptTaskObj.cronRepeatEvery.toString();
					$scope.repeatsType = items.chefJenkScriptTaskObj.repeats || items.chefJenkScriptTaskObj.cronFrequency;
					$scope.timeEventHour = items.chefJenkScriptTaskObj.timeEventHour || (items.chefJenkScriptTaskObj.cronMinute && items.chefJenkScriptTaskObj.cronMinute !==null) ? items.chefJenkScriptTaskObj.cronHour.toString() : '';
					$scope.timeEventMinute = items.chefJenkScriptTaskObj.timeEventMinute || (items.chefJenkScriptTaskObj.cronMinute && items.chefJenkScriptTaskObj.cronMinute !==null) ? items.chefJenkScriptTaskObj.cronMinute.toString() : '';
					$scope.weekOfTheDay = items.chefJenkScriptTaskObj.weekOfTheDay ||  (items.chefJenkScriptTaskObj.cronWeekDay && items.chefJenkScriptTaskObj.cronWeekDay !==null) ?items.chefJenkScriptTaskObj.cronWeekDay.toString(): '';
					$scope.selectedDayOfTheMonth = items.chefJenkScriptTaskObj.selectedDayOfTheMonth || (items.chefJenkScriptTaskObj.cronDate && items.chefJenkScriptTaskObj.cronDate !==null) ?items.chefJenkScriptTaskObj.cronDate.toString() : '';
					$scope.selectedMonth =  items.chefJenkScriptTaskObj.selectedMonth || (items.chefJenkScriptTaskObj.cronMonth && items.chefJenkScriptTaskObj.cronMonth !==null)  ? items.chefJenkScriptTaskObj.cronMonth.toString() : '';
					if ($scope.repeatsType === 'Minutes' || $scope.repeatsType === 'Hourly') {
						$scope.checkFrequencyCheck = false;
					} else {
						$scope.checkFrequencyCheck = true;
					}
				} else {
					$scope.defaultSelection();
				}
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

			$scope.checkFrequency = function(){
				if($scope.repeatsType === 'Minutes' || $scope.repeatsType === 'Hourly'){
					$scope.checkFrequencyCheck = false;
				}else{
					$scope.checkFrequencyCheck = true;
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
			$scope.repeatHourCount = function(max, step) {
				step = step || 1;
				var input = [];
				for (var i = 0; i <= max; i += step) {
					input.push(i);
				}
				return input;
			};
            $scope.isDaySelected = {
            	flag:true
            };
			
			$scope.daysOfWeek = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

			$scope.monthOfYear = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok=function(){
				$scope.eventParams = {
					repeats: $scope.repeatsType,
					repeatBy: $scope.repeatBy,
					cronStart: $scope.schedulerStartOn,
					cronEnd: $scope.schedulerEndOn,
					startTime: $scope.timeEventHour,
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
