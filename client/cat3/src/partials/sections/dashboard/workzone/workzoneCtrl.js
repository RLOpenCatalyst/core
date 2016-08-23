/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of $scope file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

function workzoneFunct($scope, $rootScope) {
	'use strict';
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
}
angular.module('dashboard.workzone', ['angularTreeview', 'mgcrea.ngStrap', 'workzone.instance', 'workzone.blueprint', 'workzone.orchestration', 'workzone.container', 'workzone.cloudFormation', 'workzone.azureARM', 'workzone.application', 'apis.workzone', 'workzone.factories'])
	.controller('workzoneCtrl', ['$scope', '$rootScope', workzoneFunct])
	.controller('workzoneTreeCtrl', ['$rootScope', '$scope', 'workzoneServices', 'workzoneEnvironment', '$timeout', 'modulePermission', function ($rootScope, $scope, workzoneServices, workzoneEnvironment, $timeout, modulePerms) {
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
			if($('[data-nodetype="env"]').text() && $('[data-nodetype="env"]').length){
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
				$scope.showTreeOverlay();
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
