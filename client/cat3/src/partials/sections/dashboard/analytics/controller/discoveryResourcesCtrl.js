(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryResourcesCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout){
            var disResrc=this;
            $scope.TangName={
                environment:[],
                bg:[],
                project:[]
            };
            // get gat name  Start
            disResrc.getAllTagNames=function () {
                // environment
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/environment'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TangName.environment.push({id:val,name:val})
                    });
                });
                // Bu
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/bgName'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TangName.bg.push({id:val,name:val})
                    });
                });
                // project
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/project'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TangName.project.push({id:val,name:val})
                    });

                });

                // get gat name  End##########
            };
            disResrc.init=function () {
                disResrc.getAllTagNames();
                $timeout(function () {
                disResrc.gridOptionInstances = {
                    columnDefs : [
                        { name: 'InstanceId',field:'platformId' },
                        { name: 'os', displayName:'OS', enableCellEdit: true, type: 'number'},
                        { name: 'privateIpAddress', displayName: 'IP Address'},
                        { name: 'state', displayName: 'Status'},
                        { name: 'Region', displayName: 'Region',field:'providerData.region_name',cellTooltip: true},
                        { name: 'Bg Tag Value',width:300, enableCellEdit: true,editableCellTemplate: 'ui-grid/dropdownEditor',
                            editDropdownOptionsArray:$scope.TangName.bg, editDropdownIdLabel: 'name',
                            editDropdownValueLabel: 'id'},
                        { name: 'Project Tag Value', enableCellEdit: true,editableCellTemplate: 'ui-grid/dropdownEditor',
                            editDropdownOptionsArray:$scope.TangName.project, editDropdownIdLabel: 'name',
                            editDropdownValueLabel: 'id'},
                        { name: 'Env. Tag Value', enableCellEdit: true,editableCellTemplate: 'ui-grid/dropdownEditor',
                            editDropdownOptionsArray:$scope.TangName.environment, editDropdownIdLabel: 'name',
                            editDropdownValueLabel: 'id'}
                    ]
                };
                    disResrc.gridOptionInstances.data=[];
                    if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                        var param = {
                            url: '/providers/' + fltrObj.provider.id +'/'+ $rootScope.organNewEnt.instanceType
                        };
                        genSevs.promiseGet(param).then(function (instResult) {
                            disResrc.gridOptionInstances.data=instResult.data;
                        });
                    }
                },200);
            };

            $rootScope.stateItems = $state.params;
            $rootScope.organNewEnt.provider='0';
            $rootScope.organNewEnt.instanceType='unassigned-instances';
            analyticsServices.applyFilter(true,null);
            var treeNames = ['Cloud Management','Discovery','Resources'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var fltrObj=$rootScope.filterNewEnt;
            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(true,null);
                disResrc.init();
            };
            disResrc.init();
            
        }]);
})(angular);
