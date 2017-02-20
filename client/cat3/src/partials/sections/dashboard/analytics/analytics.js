(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['apis.analytics','nvd3','multipleSelect','ui.grid.edit'])
		.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.analytics.cost', {
				url: "analytics/cost/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/cost.html",
				controller: "costCtrl as cost",
				params:{filterView:{cost:true,viewBy:true,splitUpType:true,org:true}},
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
			}).state('dashboard.analytics.capacity', {
				url: "analytics/capacity/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/capacity.html",
				controller: "capacityCtrl as capaCtr",
				params:{filterView:{period:true,cost:true,viewBy:true,splitUpType:true,org:true}},
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
			}).state('dashboard.analytics.capacityReport', {
				url: "analytics/capacityReport/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/capacityReport.html",
				controller: "capacityReportCtrl as capRept",
				params:{filterView:{usage:true,org:true,provi:true,instanceType:true,period:true},dashboardHide:true,otherTab:'Capacity',otherTabView:true,reportHide:true},
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
			}).state('dashboard.analytics.usage', {
				url: "analytics/usage/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/usage.html",
				controller: "usageCtrl as usage",
				params:{filterView:{period:true,usage:true,org:true,provi:true,instanceType:true,resources:true}},
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
			}).state('dashboard.analytics.tagMapping', {
				url: "discovery/tagMapping/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/discoveryTagMapping.html",
				controller: "discoveryTagMappingCtrl as disTgMap",
				params:{filterView:{period:true,org:true,provi:true},dashboardHide:true,reportHide:true,otherTab:'Tag mapping',otherTabView:true},
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
			}).state('dashboard.analytics.resources', {
				url: "discovery/resources/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/discoveryResources.html",
				controller: "discoveryResourcesCtrl as disResrc",
				params:{filterView:{period:true,org:true,provi:true,instanceType:true},dashboardHide:true,otherTab:'Resources',otherTabView:true,reportHide:true},
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
		}])
	.controller('analyticsCtrl',['$scope', '$rootScope','$state','genericServices','analyticsServices', 'workzoneServices', 'toastr', function ($scope, $rootScope, $state, genericServices,analyticsServices, workzoneServices, toastr) {
		var analytic = this;
		$scope.isTreeOpen = false;
		//var splitUp=null;
		analytic.tabShowChat=true;
		analytic.tabShowReport=false;
		$rootScope.isOpenSidebar = false;
		$rootScope.dashboardChild = 'analytics';
		$rootScope.stateItems = $state.params;
		analyticsServices.initFilter();
		//var treeNames = ['Analytics'];
		//$rootScope.$emit('treeNameUpdate', treeNames);
		$rootScope.$emit('HEADER_NAV_CHANGE', 'ANALYTICS');
		$scope.selectedResources = [];
		analytic.viewByFilter='orgView';
		$scope.$watch(function() { 
			return analytic.viewByFilter}, function(newVal) {
			if(newVal === 'ProviderView'){
				$rootScope.viewType='ProviderView';
				if($state.params && $state.params.filterView){
					analytic.ViewproviFilter=true;
				}
			} else {
				$rootScope.organNewEnt.provider='';
				$rootScope.viewType='orgView';
				if($state.params && $state.params.filterView){
					analytic.ViewproviFilter=false;
				}
			}
			$rootScope.stateItems = $state.params;
		}, true);
		
		analytic.applyCount=0;

		//get organisation
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject = orgs;
			$scope.getProviders(orgs[0].rowid);
		});
		if (!$rootScope.stateParams.view) {
			$state.go('dashboard.analytics.cost');
		}
		analytic.tabShow=function(chat,report){
			analytic.tabShowChat=chat;
			analytic.tabShowReport=report;
		};
		$scope.getAllRegionsList = function() {
            workzoneServices.getAllRegionsList().then(function(response) {
                $scope.allRegions = response.data;
            }, function(error) {
                toastr.error(error);
            });
        };
        $scope.getProviders = function(id) {
			var param = {
				 url: '/aws/providers/org/'+id
			};
			genericServices.promiseGet(param).then(function (result) {
				$rootScope.providers=[];
				if(result && result.length >0) {
					$rootScope.providers = result;
					$scope.filter = [];
					$scope.filter.providerId = result[0]._id;
				} else{
					$rootScope.organNewEnt.provider='';
				}
            });
        };
        $scope.getProviderRegions = function() {
            $scope.providerLoading = true;
            workzoneServices.getProviderRegions($scope.filter.providerId).then(function(response) {
                var keyPairs = response.data.keyPairs;
                var keyPairsLength = keyPairs.length;
                var regions = [];
                $scope.regions = [];
                if (keyPairsLength > 0 && $scope.allRegions.length > 0) {
                    for (var i = 0; i < keyPairsLength; i++) {
                        var regionId = keyPairs[i].region;
                        if (regions.indexOf(regionId) === -1) {
                            regions.push(regionId);
                            for (var j = 0; j < $scope.allRegions.length; j++) {
                                if ($scope.allRegions[j].region === regionId) {
                                    $scope.regions.push($scope.allRegions[j]);
                                    break;
                                }
                            }
                        }
                    }
                }
                $scope.providerLoading = false;
            }, function(error) {
                toastr.error(error);
                $scope.providerLoading = false;
            });
        };

        $scope.getAllRegionsList();
		$scope.ProviderChange = function(val) {
            $scope.filter.regionId = '';
            $scope.filter.vpcId = '';
            $scope.regions = [];
			$scope.filter.providerId=$rootScope.providers[val]._id;
            if ($scope.filter.providerId) {
                $scope.getResourse($rootScope.organNewEnt.instanceType);
            }
        };
        $scope.getResourse = function(instType) {
			$rootScope.filterNewEnt.resources=[];
			$scope.selectedResources=[];
        	if(instType === 'Managed') {
	        	workzoneServices.getManagedInstances($scope.filter.providerId).then(function(response) {
					if(response.data && response.data.managedInstances &&  response.data.managedInstances.length >0){
						$scope.resourceList = response.data.managedInstances;
						$scope.toggleResourceSelection($scope.resourceList[0]._id,$scope.resourceList[0].platformId);
					} else{
						$scope.resourceList=[];
					}
	            }, function(error) {
	                toastr.error(error);
	            });
	        }
	        if(instType === 'Assigned') {
	            workzoneServices.getAssignedInstances($scope.filter.providerId).then(function(response) {
					if(response.data && response.data.unmanagedInstances.length >0){
						$scope.resourceList = response.data.unmanagedInstances;
						$scope.toggleResourceSelection($scope.resourceList[0]._id,$scope.resourceList[0].platformId);
					} else{
						$scope.resourceList = [];
					}

	            }, function(error) {
	                toastr.error(error);
	            });
	        }
	        if(instType === 'Unassigned') {
	            workzoneServices.getUnassignedInstances($scope.filter.providerId).then(function(response) {
					if(response.data && response.data.data && response.data.data.length >0){
						$scope.resourceList = response.data.data;
						$scope.toggleResourceSelection(response.data.data[0]._id,response.data.data[0].platformId);
						$rootScope.filterNewEnt.resources=$scope.selectedResources;
						$rootScope.filterNewEnt.platformId[response.data.data[0]._id]=response.data.data[0].platformId;
					} else {
						$scope.resourceList = [];
					}
	            }, function(error) {
	                toastr.error(error);
	            });
	        }
        };
		$rootScope.$on('INI_usage', function (event, id) {
			$scope.getResourse(id);
		});
        $scope.toggleResourceSelection = function(resourceId,platformId) {
            var idx = $scope.selectedResources.indexOf(resourceId);
            if(idx > -1) {
        		$scope.selectedResources.splice(idx, 1);

    		} else {
    			if($scope.selectedResources.length === 10){
    				console.log($scope.selectedResources.length);
    				///toastr.error('Maximum 5 resources allowed.');
    			}else{
					$rootScope.filterNewEnt.platformId[resourceId]=platformId;
    				$scope.selectedResources.push(resourceId);
    			}
    		}
            // if($scope.selectedResources === resourceId){
				// $scope.selectedResources='';
            // } else{
				// $scope.selectedResources=resourceId;
            // }

			$rootScope.filterNewEnt.resources=$scope.selectedResources;
		};
		if (!$rootScope.stateParams.view && $rootScope.organObject) {
			$state.go('dashboard.analytics.cost');
		}
	}]);
})(angular);
