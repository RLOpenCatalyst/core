/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2016
 */

(function(angular){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('orchestrationLogCtrl',["items", '$scope', '$modalInstance', function(items, $scope, $modalInstance){
			$scope.parentItemDetail=items;
			var orchLogCtrl={};
			orchLogCtrl.taskLogType=items.taskType;
			orchLogCtrl.cancelAll=function(){
				$scope.$broadcast ('closeWindow');
				$modalInstance.dismiss('cancel');
				return  $scope.close;
			};
			return orchLogCtrl;
		}
	]);
})(angular);
