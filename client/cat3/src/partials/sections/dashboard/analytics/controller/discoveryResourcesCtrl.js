(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryResourcesCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout','toastr', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout,toastr){
            var disResrc=this;
            $scope.TagName={
                environment:[],
                bg:[],
                project:[] ,bgTag:'',
                environmentTag:'',
                projectTag:''
            };
            // get gat name  Start
            disResrc.getAllTagNames=function () {
                $scope.TagName={
                    environment:[],
                    bg:[],
                    project:[],
                    bgTag:'',
                    environmentTag:'',
                    projectTag:''
                };
                // environment
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/environment'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    $scope.TagName.environmentTag=instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.environment.push({id:val,name:val})
                    });
                });
                // Bu
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/bgName'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    $scope.TagName.bgTag=instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.bg.push({id:val,name:val})
                    });
                });
                // project
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/project'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    $scope.TagName.projectTag=instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.project.push({id:val,name:val})
                    });

                });

                // get gat name  End##########
            };
            disResrc.init=function () {
                if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    disResrc.getAllTagNames();
                    $timeout(function () {
                        console.log( $scope.TagName);
                        disResrc.gridOptionInstances = {
                            columnDefs: [
                                {name: 'InstanceId', field: 'platformId',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {name: 'os', displayName: 'OS', enableCellEdit: false, type: 'number',enableCellEditOnFocus: false},
                                {name: 'privateIpAddress', displayName: 'IP Address',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {name: 'state', displayName: 'Status',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'Region',
                                    displayName: 'Region',
                                    field: 'providerData.region_name',
                                    cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {name: 'orgName', displayName: 'Org Name', field: 'orgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'aa',
                                    displayName: 'BG Tag Value',
                                    width: 200,
                                    cellClass: 'editCell',
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.bg,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                },
                                {
                                    name: $scope.TagName.projectTag,
                                    displayName: 'Project Tag Value',
                                    cellClass: 'editCell',
                                    width: 200,
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.project,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                },
                                {
                                    name: $scope.TagName.environmentTag,
                                    displayName: 'Env Tag Value',
                                    cellClass: 'editCell',
                                    width: 200,
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.environment,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                }
                            ],
                            onRegisterApi: function (gridApi) {
                                gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                                        var param = {
                                            url: '/providers/' + fltrObj.provider.id + '/unassigned-instances/' + rowEntity._id,
                                            data: {
                                                "tags": {
                                                    "environment": newValue,
                                                    "application": colDef.name
                                                }
                                            }
                                        };
                                    if(newValue !== oldValue) {
                                        genSevs.promisePatch(param).then(function () {
                                            toastr.success('Successfully updated.', 'Update');
                                        });
                                    }
                                });
                            }
                        };
                        disResrc.gridOptionInstances.data = [];
                            var param = {
                                url: '/providers/' + fltrObj.provider.id + '/' + $rootScope.organNewEnt.instanceType
                            };
                            genSevs.promiseGet(param).then(function (instResult) {
                                disResrc.gridOptionInstances.data = instResult.data;
                            });
                    }, 200);
                }
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
