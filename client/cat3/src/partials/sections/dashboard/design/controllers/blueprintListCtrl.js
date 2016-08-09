(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintListCtrl',['$scope','$rootScope','$state','$modal','toastr','blueprintService','genericServices', function ($scope,$rootScope,$state,$modal,toastr,bpServ,gencSers) {
            var pbList = this;
            pbList.blueprintList=[];
            pbList.selectedCards=[];
            pbList.blueprintType=$state.params.templateName;
            pbList.createList = function (){
                var getResult = bpServ.createList();
                if(getResult){
                    getResult.then(function (result){
                        pbList.blueprintList=result.blueprints;
                        pbList.pager=result.metaData;
                    });
                }
            };
            pbList.blueprintInfo =function($event,bpDetails,bpType){
                $event.stopPropagation();
                gencSers.moreInfo(bpDetails,bpType);
            };
            pbList.launchInstance  =function($event,pbId){
                $event.stopPropagation();
                bpServ.launchBp(pbId);
            };
            pbList.selectCard = function (cardObj){
                pbList[cardObj._id] = !pbList[cardObj._id];
                if(pbList.selectedCards.indexOf(cardObj._id) === -1){
                    pbList.selectedCards.push(cardObj._id);
                } else {
                    pbList.selectedCards.splice(pbList.selectedCards.indexOf(cardObj._id),1);
                }

            };
            pbList.copyBp =function(ids){
                bpServ.copyBp(ids);
            };
            pbList.deleteBp =function(ids){
                bpServ.deleteBp(ids);
            };
            pbList.editBlueprint =function($event,pbId){
                $event.stopPropagation();
                $rootScope.stateItems.current.params.blueId=pbId;
                $state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'edit'});

            };
            pbList.createList();
    }]).controller('bpLaunchInstanceCtrl',['$rootScope','$modalInstance',function ($rootScope,$modalInstance) {
        var lanIns = this;
        lanIns.newEnt=[];
        if($rootScope.organObject){
            lanIns.envOptions=$rootScope.organObject[$rootScope.organNewEnt.org].environments;
            lanIns.newEnt.org =$rootScope.organObject[$rootScope.organNewEnt.org].name;
            lanIns.newEnt.buss=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].name;
            lanIns.newEnt.proj=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].projects[$rootScope.organNewEnt.proj].name;
        }
        lanIns.launch = function (){
            $modalInstance.close(lanIns.newEnt.env);
        };
    }]).controller('bpCopyCtrl',['$rootScope','$modalInstance',function ($rootScope,$modalInstance) {
        var bpCopy = this;
        bpCopy.newEnt=[];
        bpCopy.newEnt.copyOrg='0';
        bpCopy.newEnt.copyBuss='0';
        bpCopy.newEnt.copyProj='0';
        bpCopy.cancel = function (){
            $modalInstance.dismiss('cancel');
        };
        bpCopy.copySelectedBlueprint = function (){
            $modalInstance.close(bpCopy.newEnt);
        };
    }]);
})(angular);