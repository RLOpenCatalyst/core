/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular){
	"use strict";
	angular.module('global.breadcrumb',[]).factory('breadcrumb', function () {
		var currentState = [];
		var lastState = [];
		return {
			setBreadcrumb: function () {

			},
			resetBreadCrumb: function () {
				lastState = currentState;
				currentState.length = 0;
			},
			setEnviornment: function () {

			},
			getCurrentState: function () {

			}
		};
	}).controller('breadcrumbCtrl', ['$scope', '$rootScope','$state', function ($scope, $rootScope,$state) {

		$scope.treeCrmbData = [];
		$scope.rightCrmbData = [];
		$rootScope.$on('HEADER_NAV_CHANGE', function(event, headerName) {
			$scope.sectionName = headerName;
		});
		
		$rootScope.$on('treeNameUpdate', function(event, treeParams) {
			$scope.getActMenu=false;
			if($state.current.parameters && $state.current.parameters.actMenu) {
				$scope.getActMenu = $state.current.parameters.actMenu;
			}
			$rootScope.$emit('GET_LIBRARY',$scope.getActMenu);
			$scope.treeCrmbData = treeParams;
			var _arrayPart1 = treeParams;
			var _arrayPart2 = $scope.rightCrmbData;
			$scope.breadcrumbData = _arrayPart1.concat(_arrayPart2);
		});

		$rootScope.$on('rightPanelNavigation', function(event, rightPanelName, level) {
			$scope.rightCrmbData[level] = rightPanelName;
			var _arrayPart1 = $scope.treeCrmbData;
			var _arrayPart2 = $scope.rightCrmbData;
			$scope.breadcrumbData = _arrayPart1.concat(_arrayPart2);
		});

		$rootScope.$on('HIDE_BREADCRUMB',function(){
			$rootScope.isBreadCrumbAvailable=false;
		});
		$rootScope.showTree=false;
		$rootScope.showTreeOverlay = function () {
	        $rootScope.showTree = true;
	    };

	    $rootScope.hideTreeOverlay = function () {
	        $rootScope.showTree = false;
	    };
	}]);
})(angular);