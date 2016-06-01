(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['angularTreeview'])
	.controller('analyticsCtrl',['$scope', '$rootScope', function ($scope, $rootScope) {
		/*Note state params value is passed from routes, while state is already added in rootscope*/
		$scope.Text = "State Params Example : " + $rootScope.stateParams.activeSection;
	}])
            .controller('analyticsTreeCtrl', ['$rootScope', '$scope', 'analyticsServices', 'analyticsEnvironment', '$timeout', 'modulePermission', function ($rootScope, $scope, analyticsServices, analyticsEnvironment, $timeout, modulePerms) {
		'use strict';
		//For showing menu icon in menu over breadcrumb without position flickering during load
		$scope.isLoading = true;
		$scope.showTree = true;
		function getParams(str) {
			var l = str.split('&');
			var list = [];

			for (var i = 0; i < l.length; i++) {
				list.push(l[i].split('=')[1]);
			}
			return {
				org: list[0],
				bg: list[1],
				proj: list[2],
				env: list[3]
			};
		}

		$scope.hideTreeOverlay = function () {
			$scope.showTree = false;
			$(".panelRight").css("width", "calc(100% - 39px)");
			$("#navigPage").addClass("tree-close");
			$(".minifyme").css("left", "0px");
			$(".minifyme").css("border-radius", "0px");
			$(".minifyme").css("width", "35px");
		};

		$scope.showTreeOverlay = function () {
			$scope.showTree = true;
			$(".panelRight").css("width", "calc(100% - 258px)");
			$("#navigPage").removeClass("tree-close");
			$(".minifyme").css("left", "216px");
			$(".minifyme").css("width", "38px");
			$(".minifyme").css("border-radius", "5px 0 0 5px");
		};

		//this function is applicable only if enviornments are only selectable items.
		function getNames(node) {
			return {
				bg: node.bgname,
				org: node.orgname,
				proj: node.projname,
				env: node.text
			};
		}

		function treeDefaultSelection() {
			if($('[data-nodetype="env"]').length){
				$('[data-nodetype="env"]').eq(0).click();	
			}else{
				if(modulePerms.settingsAccess()){
					$scope.setWorkZoneMessage('NO_ENV_CONFIGURED_CONFIGURE_SETTINGS');
				}
				else{
					$scope.setWorkZoneMessage('NO_ENV_CONFIGURED_NO_SETTINGS_ACCESS');	
				}
			}
		}

		analyticsServices.getTree().then(function (response) {
			$scope.isLoading = false;
			$scope.nodeList = response.data;
			$timeout(treeDefaultSelection, 0);
		}, function() {
			$rootScope.$emit("USER_LOGOUT");
		});

		$scope.relevancelab = {};
		$scope.relevancelab.selectNodeLabelCallback = function (node) {
			if (node.selectable === false) {
				$scope.relevancelab.selectNodeHead(node);
			} else {
				var requestParams = getParams(node.href);
				var requestParamNames = getNames(node);
				analyticsEnvironment.setEnvParams(requestParams);
				$rootScope.$emit('WZ_ENV_CHANGE_START', requestParams, requestParamNames);
				analyticsServices.getCurrentSelectedEnvInstanceList().then(function (response) {
					$rootScope.$emit('WZ_ENV_CHANGE_END', requestParams, response.data, requestParamNames);
					var treeNames = ['Workzone', requestParamNames.org, requestParamNames.bg, requestParamNames.proj, requestParamNames.env];
					$rootScope.$emit('treeNameUpdate', treeNames);
					$scope.showTreeOverlay();
				}, function(){
					var emptyData = {
						instances: [],
						blueprints:[],
						stacks:[],
						arms:[],
						tasks:[]
					};
					$rootScope.$emit('WZ_ENV_CHANGE_END', requestParams, emptyData, requestParamNames);
				});
			}
		};

		$scope.relevancelab.selectNodeHeadCallback = function (node) {
			//this will need to implement when you wants to add events on node parents
			if (node.selectable !== false) {
				$scope.relevancelab.selectNodeLabel(node);
			}
		};

		$rootScope.$on('WZ_REFRESH_ENV', function () {
			var requestParams = analyticsEnvironment.getEnvParams();
			analyticsServices.getCurrentSelectedEnvInstanceList().then(function (response) {
				$rootScope.$emit('WZ_ENV_CHANGE_END', requestParams, response.data);
			});
		});
	}]);
})(angular);
