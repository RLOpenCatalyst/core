(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryTagMappingCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout','toastr', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout,toastr){
            var disTgMap=this;
            $rootScope.stateItems = $state.params;
            $rootScope.organNewEnt.instanceType=false;
            $rootScope.organNewEnt.provider='0';
            analyticsServices.applyFilter(true,null);
            var treeNames = ['Cloud Management','Discovery','Tag Mapping'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            $scope.newEnt={};
            var fltrObj=$rootScope.filterNewEnt;
            disTgMap.tagOption=[];
            disTgMap.getTagMapping=function () {
                if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    var param = {
                        inlineLoader: true,
                        url: '/providers/' + fltrObj.provider.id + '/tag-mappings'
                        //url:'src/partials/sections/dashboard/analytics/data/tag.json'
                    };
                    genSevs.promiseGet(param).then(function (tagResult) {
                        disTgMap.getAllTags();
                        $scope.newEnt.project.tagName='';
                        $scope.newEnt.project.tagValues=[];
                        $scope.newEnt.businessGroup.tagValues=[];
                        $scope.newEnt.businessGroup.tagName='';
                        $scope.newEnt.environment.tagName='';
                        $scope.newEnt.environment.tagValues=[];
                        disTgMap.getTagValues(false,'businessGroup');
                        disTgMap.getTagValues(false,'environment');
                        disTgMap.getTagValues(false,'project');

                        angular.forEach(tagResult, function (val, key) {
                            $scope.newEnt[key].tagName = val.tagName;
                            $scope.newEnt[key].tagValues = val.tagValues;
                            $scope.newEnt[key].catalystEntityType = val.catalystEntityType;
                            angular.forEach(val.catalystEntityMapping, function (v, k) {
                                $scope.newEnt[key].catalystEntityMapping[k] = {
                                    tagValues: v.tagValues,
                                    catalystEntityId: v.catalystEntityId,
                                    catalystEntityName: v.catalystEntityName
                                };
                            });
                        });
                    });
                }
            };
            disTgMap.reset =function () {
                disTgMap.getTagMapping();
            };
            disTgMap.getAllTags =function () {
                    //$scope.newEnt.providerId = fltrObj.provider.id;
                    $scope.isLoadingTag = true;
                    var param = {
                        inlineLoader: true,
                        url: '/providers/' + fltrObj.provider.id + '/tags'
                    };
                    genSevs.promiseGet(param).then(function (tagResult) {
                        $scope.isLoadingTag = false;
                        disTgMap.tagOption = tagResult;
                    });
            };
            disTgMap.getTagValues= function (tagName,valueType) {
                if(tagName) {
                    var param = {
                        inlineLoader: true,
                        url: '/providers/' + fltrObj.provider.id + '/tags/' + tagName
                    };
                    genSevs.promiseGet(param).then(function (tagResult) {
                        $scope.isLoadingTagValue = false;
                            for (var key in $scope.newEnt[valueType].catalystEntityMapping) {
                                $scope.newEnt[valueType].catalystEntityMapping[key].tagValues = [];
                            }
                        $scope.newEnt[valueType].tagValues = tagResult.values;
                    });
                } else{
                    for (var key in $scope.newEnt[valueType].catalystEntityMapping) {
                        $scope.newEnt[valueType].catalystEntityMapping[key].tagValues = [];
                    }
                }
            };
            disTgMap.save =function(){
                console.log($scope.newEnt);
                var param = {
                    inlineLoader: true,
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings',
                    data:$scope.newEnt
                };
                genSevs.promisePost(param).then(function (tagResult) {
                  console.log(tagResult);
                    toastr.success('Successfully updated.','Update');
                });
            };
            $rootScope.applyFilter =function(){
                analyticsServices.applyFilter(true,null);
                disTgMap.getTagMapping();
            };
            disTgMap.getTagMapping();

        }]);
})(angular);
