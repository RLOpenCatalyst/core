(function (angular) {
	"use strict";
	angular.module('dashboard.design', ['design.BpList','design.bpCreate']).config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.design.list', {
				url: "/:providerName/list",
				templateUrl: "src/partials/sections/dashboard/design/view/designListView.html",
				controller: "blueprintListCtrl as bpList",
				params:{filterhide: false, templateObj:{}},
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
				url: "/:providerName/new",
				templateUrl: "src/partials/sections/dashboard/design/view/blueprintCreate.html",
				controller: "blueprintCreateCtrl as bpCreate",
				params:{filterhide:true, templateObj:{}},
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
			}).state('dashboard.design.compositeNew', {
				url: "/:providerName/composite",
				templateUrl: "src/partials/sections/dashboard/design/view/createComposite.html",
				controller: "createCompositeCtrl as createCBP",
				params:{templateObj:{}},
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
			});
		}]).filter('inArray',['$filter', function($filter){
			return function(list, arrayFilter, element){
				if(arrayFilter){
					return $filter("filter")(list, function(listItem){
						return arrayFilter.indexOf(listItem[element]) === -1;
					});
				}
			};
		}])
	.controller('designCtrl',['$scope','$rootScope','$state','genericServices', function ($scope,$rootScope,$state,genericServices) {
		var design= this;
		$scope.isTreeOpen = false;
		$rootScope.state = $state;
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
				var treeNames=['Design', $state.params.providerName,template[0].templatetypename];
				$rootScope.$emit('treeNameUpdate', treeNames);
				$state.go('dashboard.design.list',{providerName:$state.params.providerName,templateObj:template[0],view:'list'});

			// get organigetion
				genericServices.getTreeNew().then(function (orgs) {
					$rootScope.organObject=orgs;
					$rootScope.organNewEnt=[];
					$rootScope.organNewEnt.org = orgs[0];
					$rootScope.organNewEnt.buss = orgs[0].businessGroups[0];
					$rootScope.organNewEnt.proj = orgs[0].businessGroups[0].projects[0];
					$state.go('dashboard.design.list',{providerName:providers[0].name,templateObj:template[0]});
					$rootScope.$emit('BP_BLUEPRINTS_REFRESH_CURRENT');
				});
			});

		};
		$scope.applyFilter = function(bpType) {
			var organObjectId=[];
            ///organObjectId.envOptions=$rootScope.organObject[$rootScope.organNewEnt.org].environments;
            if($rootScope.organObject){
                var tempType=(bpType) ? bpType :$state.params.templateObj.templatetype;
                var pagination =(bpType) ? true :false;
                organObjectId.org =$rootScope.organNewEnt.org.rowid;
                organObjectId.buss=$rootScope.organNewEnt.buss.rowid;
                organObjectId.proj=$rootScope.organNewEnt.proj.rowId;
                var params;
                if(tempType === 'docker' || tempType === 'arm' || tempType === 'composite'){
                    params = {
                        url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/blueprintList?pagination='+pagination+'&templateType='+tempType+'&providerType='
                    };    
                }else {
                    params = {
                        url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/blueprintList?pagination='+pagination+'&templateType='+tempType+'&providerType='+angular.lowercase($state.params.providerName)
                    };
                }
                $rootScope.$emit('BP_BLUEPRINTS_REFRESH_CURRENT');
                return genericServices.promiseGet(params);
            }
		};
		design.providersList();
		return design;
	}]);
})(angular);