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
			$scope.parentItemDetail=items;
			var botExecLogCtrl={};
			botExecLogCtrl.taskLogType=items.taskType;
			$scope.cancel=function(){
				$scope.$broadcast ('closeWindow');
				$modalInstance.dismiss('cancel');
				return $scope.close;
			};
			return botExecLogCtrl;
		}
	]);
})(angular);
