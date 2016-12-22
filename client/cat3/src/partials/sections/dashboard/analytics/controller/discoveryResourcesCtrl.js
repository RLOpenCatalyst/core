(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryResourcesCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
            var disResrc=this;
            $scope.TangName={};
            $scope.tagValue=[{'id':'a','value':'a'},{'id':'b','value':'b'}]

            // get gat name  Start
            disResrc.getAllTagNames=function () {
                    // environment
                    var param = {
                        url: '/providers/' + fltrObj.provider.id + '/tag-mappings/environment'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        $scope.TangName.environment = instResult.tagValues;
                    });
                    // Bu
                    var param = {
                        url: '/providers/' + fltrObj.provider.id + '/tag-mappings/bgName'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        $scope.TangName.bg = instResult.tagValues;
                    });
                    // project
                    var param = {
                        url: '/providers/' + fltrObj.provider.id + '/tag-mappings/project'
                    };
                    genSevs.promiseGet(param).then(function (instResult) {
                        $scope.TangName.project = instResult.tagValues;
                    });
                    console.log($scope.TangName);
                // get gat name  End##########
            };
            disResrc.gridOptionInstances = {
                columnDefs : [
                { name: 'InstanceId',field:'platformId' },
                { name: 'os', displayName:'OS', enableCellEdit: true, type: 'number'},
                { name: 'privateIpAddress', displayName: 'IP Address'},
                { name: 'state', displayName: 'Status'},
                { name: 'Region', displayName: 'Region',field:'providerData.region_name',cellTooltip: true},
                { name: 'Bg Tag Value',width:300, enableCellEdit: true,editableCellTemplate: 'ui-grid/dropdownEditor',
                    editDropdownOptionsArray: $scope.tagValue},
                { name: 'Project Tag Value', enableCellEdit: true},
                { name: 'Env. Tag Value', enableCellEdit: true}
            ]
            };
            $rootScope.stateItems = $state.params;
            $rootScope.organNewEnt.provider='0';
            $rootScope.organNewEnt.instanceType='unassigned-instances';
            analyticsServices.applyFilter(true,null);
            var treeNames = ['Cloud Management','Discovery','Resources'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var fltrObj=$rootScope.filterNewEnt;
            disResrc.getInstances =function () {
                disResrc.gridOptionInstances.data=[];
                if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    var param = {
                        url: '/providers/' + fltrObj.provider.id +'/'+ $rootScope.organNewEnt.instanceType
                    };
                    disResrc.getAllTagNames();
                    genSevs.promiseGet(param).then(function (instResult) {
                        disResrc.gridOptionInstances.data=instResult.data;
                    });
                }
            };

            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(true,null);
                disResrc.getInstances();
            };
            disResrc.getInstances();
            
        }]);
})(angular);
