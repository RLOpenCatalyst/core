(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('createCompositeCtrl',['$scope','$rootScope','$state','toastr','blueprintService','genericServices', function ($scope,$rootScope,$state,toastr,bpServ,gencSers) {
            var createCBP = this;
            createCBP.ExBlueprintList=[];
            createCBP.SelectedBPList=[];
            createCBP.selectBlueprintId='';
            createCBP.selectedBPDetails='';
            createCBP.compositeBPType='chef';
            createCBP.onSubmit =false;
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
            createCBP.selectBpInfo  =function ($event,bpDetails){
                $event.stopPropagation();
                gencSers.moreInfo(bpDetails,null);
            };
            createCBP.editSelectBpInfo  =function ($event,bpDetails){
                createCBP.selectBlueprintId=bpDetails._id;
                createCBP.selectedBPDetails=bpDetails;
            };
            createCBP.ord  =function (){
                console.log(createCBP.selectedBpOrder);
            };
            $rootScope.compositeSave =function (vali) {
                createCBP.onSubmit =true;
                if(!createCBP.newEnt.bpName  || !createCBP.SelectedBPList.length > 0){
                    return true;
                }
                if($rootScope.organObject){
                    createCBP.newEnt.org =$rootScope.organObject[$rootScope.organNewEnt.org].rowid;
                    createCBP.newEnt.buss=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].rowid;
                    createCBP.newEnt.proj=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].projects[$rootScope.organNewEnt.proj].rowid;
                }
                var params = {
                    url: '/composite-blueprints/',
                    data:{
                        "name": createCBP.newEnt.bpName,
                        "organizationId":createCBP.newEnt.org,
                        "businessGroupId": createCBP.newEnt.buss,
                        "projectId":createCBP.newEnt.proj,
                        "blueprints": createCBP.SelectedBPList,
                        "cloudProviderType": 'aws'
                    }
                };
                gencSers.promisePost(params).then(function () {
                    toastr.success('Successfully Created.');
                    $state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'list'});
                });
            };
            createCBP.createList();
    }]);
})(angular);
