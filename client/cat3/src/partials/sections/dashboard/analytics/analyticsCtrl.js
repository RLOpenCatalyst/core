/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of $scope file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

angular.module('dashboard.analytics', ['analyticsTreeView', 'apis.analytics', 'nvd3','analytics.businessUnit','analytics.enivronment','analytics.organization', 'analytics.project'])
    .controller('analyticsCtrl', ['$scope', '$rootScope', analyticsCtrl])
    .controller('analyticsTreeCtrl', ['$rootScope', '$scope', 'analyticsServices', 'analyticsEnvironment', '$timeout', 'modulePermission', analyticsTreeCtrl]);
function analyticsCtrl($scope, $rootScope) {
    /*Note state params value is passed from routes, while state is already added in rootscope*/
    $scope.Text = "State Params Example : " + $rootScope.stateParams.activeSection;
    $rootScope.$emit('HEADER_NAV_CHANGE', 'ANALYTICS');
    $(".panelRight").css("width", "calc(100% - 258px)");
    $scope.options = {
        chart: {
            type: 'pieChart',
            height: 300,
            x: function (d) {
                return d.key;
            },
            y: function (d) {
                return d.y;
            },
            showLabels: true,
            duration: 500,
            labelThreshold: 0.01,
            labelSunbeamLayout: true,
            legend: {
                margin: {
                    top: 5,
                    right: 35,
                    bottom: 5,
                    left: 0
                }
            },
            callback: function (chart) {
                console.log(chart);
                chart.pie.dispatch.on('elementClick', function (e) {
                    console.log('elementClick in callback', e.data);
                });
            }
        }
    };

    $scope.data = [
        {
            key: "One",
            y: 5
        },
        {
            key: "Two",
            y: 2
        },
        {
            key: "Three",
            y: 9
        },
        {
            key: "Four",
            y: 7
        },
        {
            key: "Five",
            y: 4
        },
        {
            key: "Six",
            y: 3
        },
        {
            key: "Seven",
            y: .5
        }
    ];
    
    $scope.setAnalyticsMessage = function(type, msg) {
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

function analyticsTreeCtrl($rootScope, $scope, analyticsServices, analyticsEnvironment, $timeout, modulePerms) {
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
        if ($('[data-nodetype="env"]').length) {
//            $('[data-nodetype="env"]').eq(0).click();
        } else {
            if (modulePerms.settingsAccess()) {
                $scope.setAnalyticsMessage('NO_ENV_CONFIGURED_CONFIGURE_SETTINGS');
            } else {
                $scope.setAnalyticsMessage('NO_ENV_CONFIGURED_NO_SETTINGS_ACCESS');
            }
        }
    }

    analyticsServices.getTree().then(function (response) {
        $scope.isLoading = false;
        $scope.roleList = response.data;
        console.log($scope.roleList);
        $timeout(treeDefaultSelection, 0);
    }, function () {
        $rootScope.$emit("USER_LOGOUT");
    });
    $scope.relevancelab = {};
    var treeNames = ['ANALYTICS'];
    $rootScope.$emit('treeNameUpdate', treeNames);
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
            }, function () {
                var emptyData = {
                    instances: [],
                    blueprints: [],
                    stacks: [],
                    arms: [],
                    tasks: []
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
}
