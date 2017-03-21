/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
    .controller('editParamsCtrl',['$scope', '$rootScope', '$state', 'genericServices', 'botsCreateService', 'workzoneServices', 'toastr', '$modal', function ($scope, $rootScope, $state, genSevs, botsCreateService,workzoneServices, toastr, $modal) {
        
        var items;

        $rootScope.$on('BOTS_TEMPLATE_SELECTED', function(event,reqParams) {
            $scope.templateSelected = reqParams;
        });
        
        if($scope.templateSelected) {
            items = $scope.templateSelected;
        }    
        
        $scope.botName = items.name;
        $scope.botParams = items.inputFormFields;
        $scope.botEditParams = [];
        $scope.botParameters = [];
        $scope.botType = items.type;
        $scope.botInfo = $scope.templateSelected;
        $scope.selectedInstanceList = [];

        $scope.IMGNewEnt={
            org:$rootScope.organObject[0],
            buss:$rootScope.organObject[0].businessGroups[0],
            proj:$rootScope.organObject[0].businessGroups[0].projects[0],
            env:$rootScope.organObject[0].businessGroups[0].projects[0].environments[0]
        };

        $scope.getInstanceList = function() {
            botsCreateService.getCurrentEnvInstances($scope.IMGNewEnt.org.orgid,$scope.IMGNewEnt.buss.rowid,$scope.IMGNewEnt.proj.rowId,$scope.IMGNewEnt.env.rowid).then(function(response){
                if(response){
                    $scope.originalInstanceList = response;    
                }
                else {
                    $scope.originalInstanceList = [];   
                }
                
            });
        };

        $scope.addInstance = function (indexArr) {
            $scope.selectedInstanceList.push($scope.originalInstanceList[indexArr]);
            $scope.originalInstanceList.splice(indexArr,1);
        };

        $scope.instanceInfo = function($event,instanceDetails) {
            botsCreateService.getInstanceDetails(instanceDetails._id).then(function(response){
                console.log(response);
            });
        }

        $scope.deSelectInstance = function ($event,indexArr){
            $event.stopPropagation();
            $scope.originalInstanceList.push($scope.selectedInstanceList[indexArr]);
            $scope.selectedInstanceList.splice(indexArr,1);

        };

        $scope.executeTask = function(){
            var reqBody = {};
            $scope.botParameters = $scope.botParameters.concat($scope.botEditParams);
            reqBody = {
                params:$scope.botParameters
            };
            var param={
                inlineLoader:true,
                url:'/botsNew/' + items.id + '/execute',
                data: reqBody
            };
            genSevs.promisePost(param).then(function (response) {
                $modalInstance.close(response);
                $rootScope.$emit('BOTS_LIBRARY_REFRESH');
                botsCreateService.getBOTDetails(items._id).then(function(response){
                    for(var i=0;i<response.data.bots.length;i++) {
                        var botObj = response.data.bots[i];
                        $rootScope.$emit('BOTS_DESCRIPTION_REFRESH', botObj);   
                    }
                });    
            },
            function (error) {
                if(error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                }
            });
        };

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };

        $scope.init = function() {
            $scope.getInstanceList();
        };
        $scope.init();
    }]);
})(angular);