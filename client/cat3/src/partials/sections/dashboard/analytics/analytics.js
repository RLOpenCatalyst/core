(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['apis.analytics','nvd3'])
		.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.analytics.cost', {
				url: "cost/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/cost.html",
				controller: "costCtrl as cost",
				params:{filterView:{viewBy:true,splitUpType:true,org:true}},
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
				controller: "capacityCtrl as capacity",
				params:{filterView:{}},
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
				params:{filterView:{org:true,provi:true,region:false,instanceType:true,resources:true}},
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
		$scope.showTree = true;
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
				$state.params.filterView.provi=true;
			} else {
				$rootScope.organNewEnt.provider=''
				$rootScope.viewType='orgView';
				$state.params.filterView.provi=false;
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
		});
		if (!$rootScope.stateParams.view) {
			$state.go('dashboard.analytics.cost');
		}
		analytic.hideTreeOverlay =function (){
			genericServices.hideTreeOverlay();
		};
		analytic.showTreeOverlay =function (){
			genericServices.showTreeOverlay();
		};
		analytic.tabShow=function(chat,report){
			analytic.tabShowChat=chat;
			analytic.tabShowReport=report;
		};
		analytic.hideTreeOverlay();
		$scope.getAllRegionsList = function() {
            workzoneServices.getAllRegionsList().then(function(response) {
                $scope.allRegions = response.data;
            }, function(error) {
                toastr.error(error);
            });
        };
        $scope.getProviders = function() {
            workzoneServices.getProviders().then(function(response) {
				$rootScope.providers=response.data;
                $scope.providers = response.data;
                $scope.filter = [];
                $scope.filter.providerId = response.data[0]._id;
            }, function(error) {
                toastr.error(error);
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
        $scope.getProviders();
		$scope.fnProviderChange = function() {
            $scope.filter.regionId = '';
            $scope.filter.vpcId = '';
            $scope.regions = [];
            if ($scope.filter.providerId && $scope.filter.providerId !== '') {
                $scope.getProviderRegions();
            }
        };
        $scope.getResourse = function(instType) {
        	if(instType === 'Managed') {
	        	workzoneServices.getManagedInstances($scope.filter.providerId).then(function(response) {
	                $scope.resourceList = response.data;
	            }, function(error) {
	                toastr.error(error);
	            });
	        }
	        if(instType === 'Assigned') {
	            workzoneServices.getAssignedInstances($scope.filter.providerId).then(function(response) {
	                $scope.resourceList = response.data.unmanagedInstances;
	            }, function(error) {
	                toastr.error(error);
	            });
	        }
	        if(instType === 'Unassigned') {
	            workzoneServices.getUnassignedInstances($scope.filter.providerId).then(function(response) {
	                $scope.resourceList = response.data.data;
	            }, function(error) {
	                toastr.error(error);
	            });
	        }
        };
        $scope.toggleResourceSelection = function(resourceId) {
        	var idx = $scope.selectedResources.indexOf(resourceId);
        	if(idx > -1) {
        		$scope.selectedResources.splice(idx, 1);
    		} else {
    			if($scope.selectedResources.length === 5){
    				toastr.error('Maximum 5 resources allowed.');
    			}else{
    				$scope.selectedResources.push(resourceId);
    			}
    		}
		};
		if (!$rootScope.stateParams.view) {
			$state.go('dashboard.analytics.cost');
		}
	}]);
})(angular);
