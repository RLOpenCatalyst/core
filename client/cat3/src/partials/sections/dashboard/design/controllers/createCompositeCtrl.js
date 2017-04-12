(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('createCompositeCtrl',['$scope','$rootScope','$state','toastr','blueprintService','genericServices','responseFormatter', function ($scope,$rootScope,$state,toastr,bpServ,gencSers,responseFormatter) {
            var createCBP = this;
            createCBP.ExBlueprintList=[];
            createCBP.SelectedBPList=[];
            createCBP.selectBlueprintId='';
            createCBP.selectedBPDetails='';
            createCBP.compositeBPType='chef';
            $scope.chefrunlist=[];
            $scope.cookbookAttributes = [];
            createCBP.onSubmit =false;
            $scope.compositeEnabled = true;
            createCBP.newEnt={
                bpName:''
            };
            createCBP.createList = function (){
                createCBP.ExBlueprintList=[];
                createCBP.SelectedBPList=[];
                var getResult = bpServ.createList(createCBP.compositeBPType);
                if(getResult){
                    getResult.then(function (result){
                        createCBP.ExBlueprintList=result;
                    });
                }
            };
            createCBP.addBP = function (indexArr){
                createCBP.SelectedBPList.push(createCBP.ExBlueprintList[indexArr]);
                createCBP.ExBlueprintList.splice(indexArr,1);
            };
            createCBP.deSelect =function ($event,indexArr){
                $event.stopPropagation();
                createCBP.ExBlueprintList.push(createCBP.SelectedBPList[indexArr]);
                if(createCBP.SelectedBPList[indexArr]._id === createCBP.selectBlueprintId){
                    createCBP.selectBlueprintId='';
                    createCBP.selectedBPDetails='';
                }
                createCBP.SelectedBPList.splice(indexArr,1);

            };
            createCBP.selectBpInfo  =function ($event,bpDetails,bpType){
                $event.stopPropagation();
                gencSers.moreInfo(bpDetails,bpType);
            };
            createCBP.editSelectBpInfo  =function ($event,bpDetails){
                createCBP.selectBlueprintId=bpDetails._id;
                createCBP.selectedBPDetails=bpDetails;
                $scope.cookbookAttributes = [];
                if(createCBP.selectedBPDetails.blueprintConfig.infraManagerData.versionsList[0].runlist) {
                    $scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(createCBP.selectedBPDetails.blueprintConfig.infraManagerData.versionsList[0].runlist);
                    if(createCBP.selectedBPDetails.blueprintConfig.infraManagerData.versionsList[0].attributes){
                        $scope.cookbookAttributes = responseFormatter.formatSavedCookbookAttributes(createCBP.selectedBPDetails.blueprintConfig.infraManagerData.versionsList[0].attributes);
                    }
                    $scope.chefrunlist = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
                }
            };
            $scope.updateCookbook = function() {
                gencSers.editRunlist($scope.chefrunlist,$scope.cookbookAttributes);
            };
            $rootScope.$on('WZ_ORCHESTRATION_REFRESH_CURRENT', function(event,reqParams) {
                $scope.chefrunlist = reqParams.list;
                $scope.cookbookAttributes = reqParams.cbAttributes;
            });
            createCBP.ord  =function (){
                console.log(createCBP.selectedBpOrder);
            };
            $scope.compositeSave =function () {
                createCBP.onSubmit =true;
                $scope.compositeEnabled = false;
                if(!createCBP.newEnt.bpName  || createCBP.SelectedBPList.length < 0){
                    return true;
                }
                if($rootScope.organObject){
                    createCBP.newEnt.org =$rootScope.organNewEnt.org.rowid;
                    createCBP.newEnt.buss=$rootScope.organNewEnt.buss.rowid;
                    createCBP.newEnt.proj=$rootScope.organNewEnt.proj.rowId;
                }
                $scope.blueprintList = [];
                angular.forEach(createCBP.SelectedBPList, function(val){
                    var blueprintObj={
                        id: val._id,
                        attributes: val.blueprintConfig.infraManagerData.versionsList[0].attributes
                    };
                    $scope.blueprintList.push(blueprintObj);
                });
                var params = {
                    url: '/composite-blueprints/',
                    data:{
                        "name": createCBP.newEnt.bpName,
                        "organizationId":createCBP.newEnt.org,
                        "businessGroupId": createCBP.newEnt.buss,
                        "projectId":createCBP.newEnt.proj,
                        "blueprints": $scope.blueprintList
                    }
                };
                gencSers.promisePost(params).then(function () {
                    toastr.success('Successfully Created.');
                    $state.go('dashboard.design.list',{providerName:$state.params.providerName,templateObj:$state.params.templateObj});
                    $scope.compositeEnabled = true;
                });
            };
            createCBP.createList();
    }]);
})(angular);
