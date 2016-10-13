(function (angular) {
	"use strict";
	angular.module('dashboard.design', []).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.design.list', {
				url: "/:provider/list",
				templateUrl: "src/partials/sections/dashboard/design/view/designListView.html",
				controller: "blueprintListCtrl as bpList",
				params:{templateObj:null},
				resolve: {
					auth: ["$q", function ($q) {
						var deferred = $q.defer();
						// instead, go to a different page
						if (modulePerms.analyticsBool()) {
							// everything is fine, proceed
							deferred.resolve();
						} else {
							deferred.reject({redirectTo: 'dashboard'});
						}
						return deferred.promise;
					}]
				}
			}).state('dashboard.design.add', {
				url: "/:provider/new",
				templateUrl: "src/partials/sections/dashboard/design/view/blueprintCreate.html",
				controller: "blueprintCreateCtrl as bpAdd",
				params:{templateObj:null},
				resolve: {
					auth: ["$q", function ($q) {
						var deferred = $q.defer();
						// instead, go to a different page
						if (modulePerms.analyticsBool()) {
							// everything is fine, proceed
							deferred.resolve();
						} else {
							deferred.reject({redirectTo: 'dashboard'});
						}
						return deferred.promise;
					}]
				}
			})
		}]).filter('inArray',['$filter', function($filter){
			return function(list, arrayFilter, element){
				if(arrayFilter){
					return $filter("filter")(list, function(listItem){
						return arrayFilter.indexOf(listItem[element]) === -1;
					});
				}
			};
		}])
	.controller('designCtrl',['$scope','$state','genericServices', function ($scope,$state,genericServices) {
		var design= this;
		design.providersList= function () {
			var params = {
				url: 'src/partials/sections/dashboard/design/data/providers.json'
			};
			genericServices.promiseGet(params).then(function (data){
				design.providersMenu=data;
				design.tempType(data);
				// $state.go('dashboard.designSubView',{subItem:data[0].name,view:'list'});
			});

		};
		design.tempType=function (providers) {
			var params = {
				url: '/d4dMasters/readmasterjsonnew/16'
			};
			genericServices.promiseGet(params).then(function (template){
				design.templateTypes=template;

				//var treeNames=['DESIGN', $state.params.subItem,template[0].templateName,'list'];
				//$rootScope.$emit('treeNameUpdate', treeNames);
				//$state.go('dashboard.designSubView',{subItem:providers[0].name,view:'list',templateObj:template[0]});

			});
			// get organigetion
			genericServices.getTreeNew().then(function (orgs) {
				design.organObject=orgs;
			});
		};
		design.providersList();
		return design;
	}]);
})(angular);