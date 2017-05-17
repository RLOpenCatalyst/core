(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoverySyncResultCtrl', ['$scope','$rootScope', '$state', 'items','analyticsServices', 'genericServices','toastr','$modalInstance','$timeout', function ($scope, $rootScope, $state, items,analyticsServices,genSevs,toastr,$modalInstance,$timeout){
        	$scope.cancel = function() {
            	$modalInstance.dismiss('cancel');
        	};
        	$scope.isInstanceImporting = true;
        	$scope.pollTaskStatus = function(timestamp) {
    				$timeout(function () {
	        		var params={
			            url:'/taskstatus/' + items.taskId + '/status?timestamp=' + timestamp
			        };
			        $scope.progressValue = 0;
    				genSevs.promiseGet(params).then(function (data) {
    					if (!data.completed) {
	                        if (data.statusList && data.statusList.length) {
	                        	$scope.progressValue = data.statusList.length;
	                            for (var i = 0; i < data.statusList.length; i++) {
	                                $scope.statusMessage = data.statusList[i].status.message;
	                                $scope.isInstanceImporting = false;
	                            }
	                            $scope.pollTaskStatus(data.statusList[data.statusList.length - 1].timestamp);
	                        } else {
	                            $scope.pollTaskStatus(timestamp);
	                        }
                    	} else {
	                        if (data.statusList && data.statusList.length) {
	                        	$scope.progressValue = data.statusList.length;
	                            for (var ii = 0; ii < data.statusList.length; ii++) {
	                                $scope.statusMessage = data.statusList[ii].status.message;
	                                $scope.isInstanceImporting = false;
	                            }
	                        }
	                        $scope.progressValue = items.nodeIds.length; 
	                        $scope.instanceLength = items.nodeIds.length; 
                    	}
    				});
    			},1000);
            };
            $scope.pollTaskStatus(0);
       	}]);
})(angular);