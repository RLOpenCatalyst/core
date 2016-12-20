/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.bots')
		.controller('botExecutionLogsCtrl', ['$q', '$scope', '$timeout', 'items','$modalInstance', function ($q, $scope, $timeout, items,$modalInstance) {
			console.log(items);
			$scope.parentItemDetail=items;
			var botExecLogCtrl={};
			botExecLogCtrl.taskLogType=items.taskType;
			botExecLogCtrl.cancelAll=function(){
				$scope.$broadcast ('closeWindow');
				$modalInstance.dismiss('cancel');
				return $scope.close;
			};
			return botExecLogCtrl;
		}
	]);
})(angular);
