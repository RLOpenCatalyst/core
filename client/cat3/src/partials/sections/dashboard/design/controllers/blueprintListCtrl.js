(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintListCtrl',['$scope','$rootScope','$state','$modal','toastr','blueprintService','genericServices', function ($scope,$rootScope,$state,$modal,toastr,bpServ,gencSers) {
            var pbList = this;
            $rootScope.state = $state;
            pbList.blueprintList={
                list:[],
                card:[]
            };
            pbList.viewTypeList=true;
            pbList.selectedCards=[];
            pbList.blueprintType=$state.params.templateName;
            
            var treeNames=['Design', $state.params.providerName,$state.params.templateObj.templatetypename];
            $rootScope.$emit('treeNameUpdate', treeNames);
            pbList.createList = function (){
                var getResult = bpServ.createList();
                if(getResult){
                    getResult.then(function (result){
                        pbList.blueprintList.card=result.blueprints;
                        pbList.pager=result.metaData;
                        pbList.blueprintList.list.data=result.blueprints;
                        pbList.blueprintList.list.paginationPageSizes= [10, 20, 30];
                        pbList.blueprintList.list.paginationPageSize= 10;
                        pbList.blueprintList.list.enableGridMenu = true;
                        pbList.blueprintList.list.enableSorting= false;
                        pbList.blueprintList.list.columnDefs = [
                            { name:'Name',minWidth:150,field:'name' },
                            { name:'InstanceOs',minWidth:150,field:'blueprintConfig.cloudProviderData.instanceOS'},
                            { name:'vpcId',minWidth:150,field:'blueprintConfig.cloudProviderData.vpcId'},
                            { name:'Region',minWidth:150,field:'blueprintConfig.cloudProviderData.region',visible: false},
                            { name:'Template Type',minWidth:150,field:'templateType'},
                            { name:'Instance Type',minWidth:150,field:'blueprintConfig.cloudProviderData.instanceType'},
                            { name:'Keypair',minWidth:150,field:'blueprintConfig.cloudProviderData.keyPairId',visible: false},
                            { name:'Subnet',minWidth:150,field:'blueprintConfig.cloudProviderData.subnetId',visible: false},
                            { name:'Security Group',width:150,field:'blueprintConfig.cloudProviderData.securityGroupIds[0]'},
                            { name:'Action',minWidth:150,cellTemplate:'<span class="badge cat-btn-update" title="Clone" ng-click="grid.appScope.copyBp(row.entity._id)"><i class="fa fa-clone fa-2 white" aria-hidden="true"></i></span> ' +
                            '&nbsp; <span class="badge cat-btn-update" title="Info" ng-click="grid.appScope.blueprintInfo($event,row.entity,null);"><i class="fa fa-info fa-2 white" aria-hidden="true"></i></span>' +
                            '&nbsp; <span class="badge cat-btn-update" title="Launch"  ng-click="grid.appScope.launchInstance($event,row.entity);"><i class="fa fa-location-arrow fa-2 white" aria-hidden="true"></i></span>' +
                            '&nbsp; <span class="badge cat-btn-update" title="Delete"  ng-click="grid.appScope.deleteBp($event,row.entity,null);"><i class="fa fa-trash-o fa-2 white" aria-hidden="true"></i></span>'}
                        ];
                    });
                }
            };
            pbList.blueprintInfo = $scope.blueprintInfo =function($event,bpDetails,bpType){
                $event.stopPropagation();
                gencSers.moreInfo(bpDetails,bpType);
            };
            pbList.launchInstance  = $scope.launchInstance =function($event,pb){
                $event.stopPropagation();
                gencSers.lunchBlueprint(pb);
            };
            pbList.selectCard = function (cardObj){
                pbList[cardObj._id] = !pbList[cardObj._id];
                if(pbList.selectedCards.indexOf(cardObj._id) === -1){
                    pbList.selectedCards.push(cardObj._id);
                } else {
                    pbList.selectedCards.splice(pbList.selectedCards.indexOf(cardObj._id),1);
                }

            };
            pbList.copyBp = $scope.copyBp =function(ids){
                bpServ.copyBp(ids);
            };
            pbList.deleteBp = $scope.deleteBp =function($event,bpDetails,bpType){
                $event.stopPropagation();
                gencSers.removeBlueprint(bpDetails,bpType);
            };
            pbList.cloneBlueprint = $scope.cloneBlueprint =function($event,pbId){
                $event.stopPropagation();
                $rootScope.stateItems.current.params.blueId=pbId;
                $state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'edit'});

            };
            pbList.createList();
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