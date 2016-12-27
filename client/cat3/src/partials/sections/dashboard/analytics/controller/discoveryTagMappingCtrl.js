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
                    };
                    genSevs.promiseGet(param).then(function (tagResult) {
                        $scope.newEnt = tagResult;
                        disTgMap.getAllTags();
                    });
                }
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
            disTgMap.getTagValues= function (tagName,valueType,selectType) {
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
            $rootScope.applyFilter =function(filterApp,period){
                analyticsServices.applyFilter(true,null);
                disTgMap.getTagMapping();
            };
            disTgMap.getTagMapping();

        }]);
})(angular);
