(function (angular) {
	"use strict";
	angular.module('dashboard.analytics', ['apis.analytics','nvd3'])
		.config(['$stateProvider', '$urlRouterProvider', '$httpProvider', 'modulePermissionProvider', function($stateProvider, $urlRouterProvider, $httpProvider, modulePermissionProvider) {
			var modulePerms = modulePermissionProvider.$get();
			$stateProvider.state('dashboard.analytics.cost', {
				url: "cost/",
				templateUrl: "src/partials/sections/dashboard/analytics/view/cost.html",
				controller: "costCtrl as cost",
				params:{filterView:'cost'},
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
				params:{filterView:'capacity'},
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
				params:{filterView:'usage'},
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
	.controller('analyticsCtrl',['$scope', '$rootScope','$state','genericServices', 'workzoneServices', function ($scope,$rootScope,$state,genericServices, workzoneServices) {
		var analytic = this;
		analytic.tabShowChat=true;
		analytic.tabShowReport=false;
		$scope.showTree = true;
		$rootScope.isOpenSidebar = false;
		$rootScope.dashboardChild = 'analytics';
		$rootScope.stateParams = $state.params;
		var treeNames = ['Analytics'];
		//$rootScope.$emit('treeNameUpdate', treeNames);
		$rootScope.$emit('HEADER_NAV_CHANGE', 'ANALYTICS');
		$rootScope.organNewEnt=[];
		$rootScope.organNewEnt.org = '0';
		$rootScope.filterNewEnt={};
		analytic.applyCount=0
		//$rootScope.organNewEnt.buss='0';
		//	$rootScope.organNewEnt.proj='0';
		analytic.applyFilter = function(filterApp){
			$rootScope.filterApply= new Date();
			var obj=$rootScope.organObject,
				or=$rootScope.organNewEnt.org,
				bu=$rootScope.organNewEnt.buss,
				pr=$rootScope.organNewEnt.proj;
			$rootScope.filterNewEnt={}
			if(or){
				$rootScope.filterNewEnt.org={name:obj[or].name,id:obj[or].rowid,title:'Organization'};
				$rootScope.filterNewEnt.provider='';
			}
			if(filterApp){
				if(bu){
					$rootScope.filterNewEnt.buss = {name:obj[or].businessGroups[bu].name,id:obj[or].businessGroups[bu].rowid,title:'Business Group'};
				}
				if(pr){
					$rootScope.filterNewEnt.proj = {name:obj[or].businessGroups[bu].projects[pr].name,id:obj[or].businessGroups[bu].projects[pr].rowid,title:'Project'};
				}

				if($rootScope.organNewEnt.provider){
					$rootScope.filterNewEnt.provider={name:$scope.providers[$rootScope.organNewEnt.provider].providerName,id:$scope.providers[$rootScope.organNewEnt.provider]._id,title:'Provider'};
				} else{
					$rootScope.filterNewEnt.provider='';
				}
			} else{
				$rootScope.organNewEnt={}
				$rootScope.organNewEnt.org=or; 
			}



		};
		// // get organigetion
		genericServices.getTreeNew().then(function (orgs) {
			$rootScope.organObject = orgs;
			analytic.applyFilter(true);
		});
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
                console.log($scope.allRegions);
            }, function(error) {
                console.log(error);
            });
        };

        $scope.getProviders = function() {
            workzoneServices.getProviders().then(function(response) {
                $scope.providers = response.data;
            }, function(error) {
                console.log(error);
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
                                    console.log($scope.regions);
                                    break;
                                }
                            }
                        }
                    }
                }
                $scope.providerLoading = false;
            }, function(error) {
                console.log(error);
                $scope.providerLoading = false;
            });
        };
		if (!$rootScope.stateParams.view) {
			$state.go('dashboard.analytics.cost');
		}
        $scope.getAllRegionsList();
        $scope.getProviders();

        // $scope.fnProviderChange = function() {
        //     $scope.filter.regionId = '';
        //     $scope.filter.vpcId = '';
        //     $scope.regions = [];
        //     if ($scope.filter.providerId && $scope.filter.providerId !== '') {
        //         $scope.getProviderRegions();
        //     }
        // };
	}]);
})(angular);
