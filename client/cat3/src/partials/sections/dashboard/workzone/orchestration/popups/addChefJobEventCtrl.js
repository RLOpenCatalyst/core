/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('addChefJobEventCtrl',['$scope', '$modalInstance','toastr',function($scope, $modalInstance,toastr){
			$scope.repeatsType = 'Daily';//default selection.
			$scope.repeatEveryCount = function(max, step) {
                step = step || 1;
                var input = [];
                for (var i = 1; i <= max; i += step) {
                    input.push(i);
                }
                return input;
            };
            $scope.timeCount = function(max, step) {
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
            };
            $scope.currentDate = new Date();
            $scope.currentEndDate = new Date();
            $scope.isDaySelected = {
            	flag:true
            }
			$scope.clear = function () {
				$scope.dt = null;
			};


			$scope.open = function($event) {
				$event.preventDefault();
				$event.stopPropagation();

				$scope.opened = true;
			};

			$scope.dateOptions = {
				formatYear: 'yy',
				startingDay: 1
			};

			$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
			$scope.format = $scope.formats[0];
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
					startTime: $scope.timeEventType,
					startTimeMinute: $scope.timeEventMinute,
					dayOfWeek: $scope.weekOfTheDay,
					startDate: $scope.currentDate,
					selectedDayOfTheMonth: $scope.selectedDayOfTheMonth,
					monthOfYear: $scope.selectedMonth
				};
				$modalInstance.close($scope.eventParams);
			};
		}
	]);
})(angular);

