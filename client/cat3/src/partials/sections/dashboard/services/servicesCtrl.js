/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
	"use strict";
	angular.module('dashboard.services',[]).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
		var modulePerms = modulePermissionProvider.$get();
		$stateProvider.state('dashboard.services.servicesList', {
			url: "/servicesList",
			templateUrl: "src/partials/sections/dashboard/services/view/servicesList.html",
			controller: "servicesListCtrl",
			parameters:{filterView:{services:true}},
			resolve: {
				auth: ["$q", function ($q) {
					var deferred = $q.defer();
					// instead, go to a different page
					if (modulePerms.servicesBool()) {
						// everything is fine, proceed
						deferred.resolve();
					} else {
						deferred.reject({redirectTo: 'dashboard'});
					}
					return deferred.promise;
				}]
			}
		})
	}]).controller('servicesTreeMenu',['$rootScope', '$scope', '$http','workzoneServices', 'workzoneEnvironment','genericServices', 'workzoneNode', '$timeout', 'modulePermission', '$window', function ($rootScope, $scope, $http, workzoneServices, workzoneEnvironment,genSevs, workzoneNode, $timeout, modulePerms, $window){
            //For showing menu icon in menu over breadcrumb without position flickering during load
            $scope.isLoading = true;
            $scope.dashboardUrl = "";
            $scope.d4dData = "";
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
                var node = workzoneNode.getWorkzoneNode();
                console.log(node);
                if (node) {
                    $scope.relevancelab.selectNodeLabel(node);
                } else if ($('[data-nodetype="env"]').length) {
                    $('[data-nodetype="env"]').eq(0).click();
                } else {
                    if (modulePerms.settingsAccess()) {
                        $window.location.href = "/private/index.html#ajax/Settings/Dashboard.html";

                        //$location.path('/private/index.html#ajax/Settings/Dashboard.html');
                        //$scope.setWorkZoneMessage('NO_ENV_CONFIGURED_CONFIGURE_SETTINGS');
                    } else {
                        $scope.setWorkZoneMessage('NO_ENV_CONFIGURED_NO_SETTINGS_ACCESS');
                    }
                }
            }

            workzoneServices.getTree().then(function (response) {
                $scope.isLoading = false;
                $scope.roleList = response.data;
                $timeout(treeDefaultSelection, 0);
            }, function () {
                $rootScope.$emit("USER_LOGOUT");
            });

            $scope.relevancelab = {};
            $scope.relevancelab.selectNodeLabelCallback = function (node) {
                if (node.selectable === false) {
                    $scope.relevancelab.selectNodeHead(node);
                } else {
                    var requestParamNames = getNames(node);
                    workzoneNode.setWorkzoneNode(node);
                    //$rootScope.$emit('WZ_ENV_CHANGE_START', requestParamNames);
                }
            };
            $scope.relevancelab.selectNodeHeadCallback = function (node) {
                //this will need to implement when you wants to add events on node parents
                if (node.selectable !== false) {
                    $scope.relevancelab.selectNodeLabel(node);
                }
            };
	}])
	.controller('servicesCtrl',['$scope', '$rootScope', '$state','genericServices', function ($scope, $rootScope, $state, genericServices) {
		$state.go('dashboard.services.servicesList');
		$scope.$watch(function() {
			$rootScope.stateItems = $state.current.name;
		});
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject=orgs;
			$rootScope.organNewEnt=[];
			$rootScope.organNewEnt.org = orgs[0];
			$rootScope.organNewEnt.buss = orgs[0].businessGroups[0];
			$rootScope.organNewEnt.proj = orgs[0].businessGroups[0].projects[0];
		});
	}]);
})(angular);