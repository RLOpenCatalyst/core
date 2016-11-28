(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryResourcesCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
            $rootScope.stateItems = $state.params;
            $rootScope.organNewEnt.provider='0';
            analyticsServices.applyFilter(true,null);
            var treeNames = ['Cloud Management','Discovery','Resources'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            
        }]);
})(angular);
