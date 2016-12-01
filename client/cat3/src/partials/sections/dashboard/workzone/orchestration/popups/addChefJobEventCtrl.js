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
			$scope.defaultSelection = function() {
				$scope.repeatsType = 'Minutes';//default selection.
				$scope.schedulerStartOn=moment(new Date()).format('MM/DD/YYYY');
            	$scope.schedulerEndOn=moment(new Date()).format('MM/DD/YYYY');	
			};
			if(items.type !== 'new'){
				if(items.chefJenkScriptTaskObj !=null){
					if(items.chefJenkScriptTaskObj.cronStartOn && items.chefJenkScriptTaskObj.cronEndOn) {
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
					$scope.timeEventType = items.chefJenkScriptTaskObj.startTime;
					$scope.timeEventMinute = items.chefJenkScriptTaskObj.startTimeMinute;
					$scope.weekOfTheDay = items.chefJenkScriptTaskObj.dayOfWeek;
					$scope.currentDate = items.chefJenkScriptTaskObj.startDate;
					$scope.selectedDayOfTheMonth = items.chefJenkScriptTaskObj.selectedDayOfTheMonth;
					$scope.selectedMonth = items.chefJenkScriptTaskObj.monthOfYear;
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
            }
			
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