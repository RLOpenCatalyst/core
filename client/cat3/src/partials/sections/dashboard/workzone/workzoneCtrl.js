/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of $scope file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

angular.module('dashboard.workzone', ['angularTreeview', 'mgcrea.ngStrap', 'workzone.instance', 'workzone.blueprint', 'workzone.orchestration', 'workzone.container', 'workzone.cloudFormation', 'workzone.azureARM', 'workzone.factories'])
	.controller('workzoneCtrl', ['$scope', '$rootScope','workzoneServices','modulePermission','$timeout', function ($scope, $rootScope,workzoneServices,modulePerms,$timeout) {
		'use strict';
		$rootScope.dashboardChild='workzone';
		$scope.config = {
			message : '',
			type: ''
		};
		var _tab = {
			tab : "Instances",
			setTab : function (tabId) {
				_tab.tab = tabId;
			},
			isSet : function (tabId) {
				return _tab.tab === tabId;
			},
			templates:   {
				instance: {
					"title": "Instances",
					"url": "src/partials/sections/dashboard/workzone/instance/instance.html"
				},
				blueprint: {
					"title": "Blueprints",
					"url": "src/partials/sections/dashboard/workzone/blueprint/blueprint.html"
				},
				cloudFormation: {
					"title": "CloudFormation",
					"url": "src/partials/sections/dashboard/workzone/cloudFormation/cloudFormation.html"
				},
				azureARM: {
					"title": "azureARM",
					"url": "src/partials/sections/dashboard/workzone/azureARM/azureARM.html"
				},
				container: {
					"title": "container",
					"url": "src/partials/sections/dashboard/workzone/container/container.html"
				},
				orchestration: {
					"title": "orchestration",
					"url": "src/partials/sections/dashboard/workzone/orchestration/orchestration.html"
				},
				application: {
					"title": "application",
					"url": "src/partials/sections/dashboard/workzone/application/application.html"
				}
			}
		};
		$scope.tab = _tab;
		$scope.removeActive = function () {
			$('.InfrastructureLocalStorage').removeClass('active');
		};
		$scope.addActive = function () {
			$('.InfrastructureLocalStorage').addClass('active');
		};
		$scope.$watch('tab.tab', function () {
			$rootScope.$emit('RIGHT_PANEL_NAVIGATION', $scope.tab.tab, 0);
		});
		$rootScope.$emit('HEADER_NAV_CHANGE', 'WORKZONE');
		$scope.activateTab = function (tabName) {
			$scope.tab.setTab(tabName);
		};
		$scope.setWorkZoneMessage = function(type, msg) {
			var message;
			/*If type comes, find a configured message for that type*/
			switch(type){
				case  'NO_ENV_CONFIGURED_CONFIGURE_SETTINGS':
					message = 'Please configure your Chef Server & Environments. Check your <a href="/private/index.html#ajax/Settings/Dashboard.html">SETTINGS</a>';
					break;
				case 'NO_ENV_CONFIGURED_NO_SETTINGS_ACCESS':
					message = 'There are no <b>WORKZONE</b> items to display';
					break;
			}
			/*Consider message received as priority */
			if(msg){
				message = msg;
			}
			$scope.config = {
				message : message,
				type : type
			};
		};

	}])
	.controller('workzoneTreeCtrl', ['$rootScope', '$scope', 'workzoneServices', 'workzoneEnvironment', '$timeout', 'modulePermission', function ($rootScope, $scope, workzoneServices, workzoneEnvironment, $timeout, modulePerms) {
		'use strict';
		$scope.isLoading = true;
		//For showing menu icon in menu over breadcrumb without position flickering during load
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
		//this function is applicable only if enviornments are only selectable items.
		function getNames(node) {
			return {
				bg: node.bgname,
				org: node.orgname,
				proj: node.projname,
				env: node.text
			};
		}	function treeDefaultSelection() {
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
		workzoneServices.getTree().then(function (response) {
			$scope.isLoading = false;
			$scope.roleList = response.data;
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
				workzoneEnvironment.setEnvParams(requestParams);
				$rootScope.$emit('WZ_ENV_CHANGE_START', requestParams, requestParamNames);
				var treeNames = ['Workzone', requestParamNames.org, requestParamNames.bg, requestParamNames.proj, requestParamNames.env];
				$rootScope.$emit('treeNameUpdate', treeNames);
			}
		};
		$scope.relevancelab.selectNodeHeadCallback = function (node) {
			//this will need to implement when you wants to add events on node parents
			if (node.selectable !== false) {
				$scope.relevancelab.selectNodeLabel(node);
			}
		};
	}
]);
