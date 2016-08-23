/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('workzone.instance')
		.controller('viewRunListCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
			$scope.items = items;
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			if(items.viewType === 'appVersion' &&  items.appInfo && items.appInfo.length){
				$scope.appInfo =[];
				for(var i=0; i< items.appInfo.length; i++){
					$scope.appInfo.push(items.appInfo[i].version);
				}
				return true;
			}else{
				$scope.cookbookList = items.runlist;
			}
		}
	]);
})(angular);