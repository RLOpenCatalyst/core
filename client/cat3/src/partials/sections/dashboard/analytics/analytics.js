(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['apis.analytics','nvd3'])
		.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.analytics.cost', {
				url: "cost/",
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
				url: "capacity/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/capacity.html",
				controller: "capacityCtrl as capaCtr",
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
			}).state('dashboard.analytics.usage', {
				url: "usage/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/usage.html",
				controller: "usageCtrl as usage",
				params:{filterView:{usage:true,org:true,provi:true,instanceType:true,resources:true}},
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
		}])
	.controller('analyticsCtrl',['$scope', '$rootScope','$state','genericServices','analyticsServices', 'workzoneServices', 'toastr', function ($scope, $rootScope, $state, genericServices,analyticsServices, workzoneServices, toastr) {
		var analytic = this;
		var splitUp=null;
		analytic.tabShowChat=true;
		analytic.tabShowReport=false;
		$rootScope.isOpenSidebar = false;
		$rootScope.dashboardChild = 'analytics';
		$rootScope.stateItems = $state.params;
		analyticsServices.initFilter();
		var treeNames = ['Analytics'];
		//$rootScope.$emit('treeNameUpdate', treeNames);
		$rootScope.$emit('HEADER_NAV_CHANGE', 'ANALYTICS');
		$scope.selectedResources = [];
		analytic.viewByFilter='orgView';
		$scope.$watch(function() { return analytic.viewByFilter}, function(newVal, oldVal) {
			if(newVal === 'ProviderView'){
				$rootScope.viewType='ProviderView';
				if($state.params && $state.params.filterView){
					analytic.ViewproviFilter=true;
				}
			} else {
				$rootScope.organNewEnt.provider=''
				$rootScope.viewType='orgView';
				if($state.params && $state.params.filterView){
					analytic.ViewproviFilter=false;
				}
			}
			$rootScope.stateItems = $state.params;
		}, true);
		$scope.$on('CHANGE_splitUp', function (event, data) {
			analytic.splitUp=data;
		});
		$scope.$watch(function() { return analytic.splitUp}, function(newVal, oldVal) {
			$scope.$broadcast('CHANGE_VIEW',newVal);
		}, true);
		analytic.applyCount=0

		//get organisation
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject = orgs;
			$scope.getProviders(orgs[0].rowid)
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
		$scope.fnProviderChange = function() {
            $scope.filter.regionId = '';
            $scope.filter.vpcId = '';
            $scope.regions = [];
            if ($scope.filter.providerId && $scope.filter.providerId !== '') {
                $scope.getProviderRegions();
            }
        };
        $scope.getResourse = function(instType) {
			$rootScope.filterNewEnt.resources=[];
			$scope.selectedResources=[];
        	if(instType === 'Managed') {
	        	workzoneServices.getManagedInstances($scope.filter.providerId).then(function(response) {
					if(response.data && response.data.managedInstances &&  response.data.managedInstances.length >0){
						$scope.resourceList = response.data.managedInstances;
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
						$scope.selectedResources.push(response.data.data[0]._id);
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
