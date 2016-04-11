/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.cloudFormation')
	.controller('stackInfoCtrl', ['$scope', '$modalInstance', 'items', 'CftSetting', 'workzoneServices', '$interval',
		function($scope, $modalInstance, items, CftSetting, workzoneServices, $interval) {
			angular.extend($scope, {
				cftEvents: [],
				timerObject: '',
				cancel: function() {
					helper.stopPolling();
					$modalInstance.dismiss('cancel');
				}
			});

			var helper = {
				eventsPolling: function() {
					$scope.timerObject = $interval(function() {
						workzoneServices.getCftEventsInfo(items)
							.then(function(response) {
								if (response.data) {
									$scope.cftEvents = response.data;
								} else {
									$scope.cftEvents = response;
								}
							});
						}, CftSetting.stackEventsPollerTime * 100);
					},

				 stopPolling: function() {
					$interval.cancel($scope.timerObject);
				}
			};

			 workzoneServices.getCftEventsInfo(items).then(function(response) {
				if (response.data) {
					$scope.cftEvents = response.data;
				} else {
					$scope.cftEvents = response;
				}
				helper.eventsPolling();

				}, function(error) {
				$scope.cftEvents = error.responseText;
			});

			$scope.$on('$destroy', function() {
				$interval.cancel($scope.timerObject);
			});
		}
	]);
})();