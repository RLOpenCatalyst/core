/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('workzone.instance')
		.controller('controlPanelCtrl', ['$scope', '$rootScope', 'instance', 'workzoneServices', 'workzoneEnvironment', '$modalInstance', 'instanceLogs', function ($scope, $rootScope, instance, workzoneServices, workzoneEnvironment, $modalInstance, instanceLogs) {
			$scope.cancel = function () {
				instanceLogs.stopLogsPolling();
				$modalInstance.dismiss('cancel');
			};
			$scope.tileView = true;
			$scope.selectedTab = 'Information';
			var _tab = {
				//To activate the Information tab on Control Panel Page Load
				tab : 'Information',
				setTab : function (tabId) {
					$scope.selectedTab = tabId;
					_tab.tab = tabId;
					if(tabId==='Logs') {
						instanceLogs.scrollBottom();
					}     
				},
				isSet : function (tabId) {
					return _tab.tab === tabId;
				},
				templates: {
					actionhistory: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActionHistory.html"
					},
					Schedule: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpSchedule.html"
					},
					information: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpInfo.html"
					}, 
					services: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpServices.html"
					},
					logs: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpLogs.html"
					}, 
					instanceactions: {
						"url": "src/partials/sections/dashboard/workzone/instance/manage/templates/cpActions.html"
					}
				}
			};
			$scope.tab = _tab;
			if (instance.puppet) {
				//Dont show Services tab for puppet instance
				$scope.showServicesTab = false;
			} else {
				$scope.showServicesTab = true;
			}
			//The cpInstance from this scope is used in the controllers of child tabs.
			$scope.cpInstance = instance;
			console.log(instance);
			$scope.instInfo = $scope.cpInstance;
			//To activate the selected tab
			$scope.activateTab = function (tabName) {
				$scope.tab.setTab(tabName);
			};
		}
	]).controller('cpScheduleCtrl', ['$scope','genericServices','toastr','$timeout', function ($scope, genericServices,toastr,$timeout) {
		var cpInstance = $scope.$parent.cpInstance;
		$scope.schedule={
			instanceIds:[cpInstance._id],
			schedulerStartOn:moment(new Date()).format('MM/DD/YYYY'),
			schedulerEndOn:moment(new Date()).format('MM/DD/YYYY'),
			interval:[{ind:0,"days":[],"action":"start","daySelect":''}]
		};
		$timeout(function(){$('input.time').trigger('click');},100);
		var params={
			url:'/instances/'+cpInstance._id
			//url:'src/partials/sections/dashboard/workzone/data/oneIns.json'
		};
		genericServices.promiseGet(params).then(function (result) {
			$scope.schedule={
				instanceIds:[cpInstance._id],
				isScheduled:result.isScheduled,
				schedulerStartOn:moment(result.schedulerStartOn).format('MM/DD/YYYY'),
				schedulerEndOn:moment(result.schedulerEndOn).format('MM/DD/YYYY'),
				interval:result.interval
			};
		});
		$scope.addNewTime = function () {
			$scope.schedule.interval.push({ind: $scope.schedule.length,"days":[],"action":"start","daySelect":''});
			$timeout(function(){$('input.time').trigger('click');},100);
		};
		$scope.selectDays=function (d,i) {
			if($scope.schedule.interval[i].days.indexOf(d) === -1){
				$scope.schedule.interval[i].days.push(d);
			} else {
				$scope.schedule.interval[i].days.splice($scope.schedule.interval[i].days.indexOf(d),1);
			}
			if($scope.schedule.interval[i].days.length >0){
				$scope.schedule.interval[i].daySelect=1;
			} else{
				$scope.schedule.interval[i].daySelect='';
			}
		};
		$scope.removeTime = function (ind) {
			$scope.schedule.interval.splice(ind,1);
		};
		$scope.saveOk=function () {
			var params={
				url:'/instances/schedule',
				data:$scope.schedule
			};
			genericServices.promisePut(params).then(function(){
				toastr.success('successfully created');
			});

		};
	}]);
})(angular);