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
                        pbList.blueprintList.list.columnDefs = [];
                        angular.forEach(pbList.blueprintList.list.data, function(val){
                            if(val.templateType === 'docker'){
                                pbList.blueprintList.list.columnDefs = [
                                    { name:'Name',minWidth:150,field:'name',cellTooltip: true},
                                    { name:'Docker Path',minWidth:150,field:'blueprintConfig.dockerCompose[0].dockercontainerpaths',cellTooltip: true},
                                    { name:'Docker Path Title',minWidth:150,field:'blueprintConfig.dockerCompose[0].dockercontainerpathstitle',cellTooltip: true},
                                    { name:'Docker RepoTag',minWidth:150,field:'blueprintConfig.dockerCompose[0].dockerrepotags',cellTooltip: true}, 
                                    { name:'Action',minWidth:150,cellTemplate:'<span class="btn btn-xs cat-btn-update bpvicon" title="Clone" ng-click="grid.appScope.copyBp(row.entity._id)"><i class="fa fa-clone fa-2 white" aria-hidden="true"></i></span> ' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Info" ng-click="grid.appScope.blueprintInfo($event,row.entity,null);"><i class="fa fa-info fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Launch"  ng-click="grid.appScope.launchInstance($event,row.entity);"><i class="fa fa-location-arrow fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs btn-danger bpvicon" title="Delete"  ng-click="grid.appScope.deleteBp($event,row.entity,null);"><i class="fa fa-trash-o fa-2 white" aria-hidden="true"></i></span>'}
                                ];
                            } else if(val.templateType === 'chef' || val.templateType === 'ami'){
                                pbList.blueprintList.list.columnDefs = [
                                    { name:'Name',minWidth:150,field:'name',cellTooltip: true },
                                    { name:'InstanceOs',minWidth:150,field:'blueprintConfig.cloudProviderData.instanceOS',cellTooltip: true},
                                    { name:'vpcId',minWidth:150,field:'blueprintConfig.cloudProviderData.vpcId',cellTooltip: true},
                                    { name:'Region',minWidth:150,field:'blueprintConfig.cloudProviderData.region',visible: false},
                                    { name:'Template Type',minWidth:150,cellTemplate:'<div>{{grid.appScope.getTemplate(row.entity.templateType)}}</div>'},
                                    { name:'Instance Type',minWidth:150,field:'blueprintConfig.cloudProviderData.instanceType'},
                                    { name:'Subnet',minWidth:150,field:'blueprintConfig.cloudProviderData.subnetId',visible: false},
                                    { name:'Security Group',width:150,field:'blueprintConfig.cloudProviderData.securityGroupIds[0]',cellTooltip: true},
                                    { name:'Action',minWidth:200,cellTemplate:'<span class="btn btn-xs cat-btn-update bpvicon" title="Clone" ng-click="grid.appScope.copyBp(row.entity._id)"><i class="fa fa-clone fa-2 white" aria-hidden="true"></i></span> ' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Info" ng-click="grid.appScope.blueprintInfo($event,row.entity,null);"><i class="fa fa-info fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Launch"  ng-click="grid.appScope.launchInstance($event,row.entity);"><i class="fa fa-location-arrow fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs btn-danger bpvicon" title="Delete"  ng-click="grid.appScope.deleteBp($event,row.entity,null);"><i class="fa fa-trash-o fa-2 white" aria-hidden="true"></i></span>'}
                                ];
                            } else if(val.templateType === 'cft') {
                                pbList.blueprintList.list.columnDefs = [
                                    { name:'Name',minWidth:150,field:'name',cellTooltip: true },
                                    { name:'Cloud Provider',minWidth:150,field:'blueprintConfig.cloudProviderType'},
                                    { name:'Region',minWidth:150,field:'blueprintConfig.region'},
                                    { name:'Template Type',minWidth:150,cellTemplate:'<div>{{grid.appScope.getTemplate(row.entity.templateType)}}</div>'},
                                    { name:'Action',minWidth:150,cellTemplate:'<span class="btn btn-xs cat-btn-update bpvicon" title="Clone" ng-click="grid.appScope.copyBp(row.entity._id)"><i class="fa fa-clone fa-2 white" aria-hidden="true"></i></span> ' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Info" ng-click="grid.appScope.blueprintInfo($event,row.entity,null);"><i class="fa fa-info fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Launch"  ng-click="grid.appScope.launchInstance($event,row.entity);"><i class="fa fa-location-arrow fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs btn-danger bpvicon" title="Delete"  ng-click="grid.appScope.deleteBp($event,row.entity,null);"><i class="fa fa-trash-o fa-2 white" aria-hidden="true"></i></span>'}
                                ];

                            } else if(val.templateType === 'arm') {
                                pbList.blueprintList.list.columnDefs = [
                                    { name:'Name',minWidth:150,field:'name',cellTooltip: true },
                                    { name:'Infra Manager Type',minWidth:150,field:'blueprintConfig.infraMangerType'},
                                    { name:'Resource Group',minWidth:150,field:'blueprintConfig.resourceGroup',cellTooltip: true},
                                    { name:'Template Type',minWidth:150,cellTemplate:'<div>{{grid.appScope.getTemplate(row.entity.templateType)}}</div>'},
                                    { name:'Action',minWidth:150,cellTemplate:'<span class="btn btn-xs cat-btn-update bpvicon" title="Clone" ng-click="grid.appScope.copyBp(row.entity._id)"><i class="fa fa-clone fa-2 white" aria-hidden="true"></i></span> ' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Info" ng-click="grid.appScope.blueprintInfo($event,row.entity,null);"><i class="fa fa-info fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs cat-btn-update bpvicon" title="Launch"  ng-click="grid.appScope.launchInstance($event,row.entity);"><i class="fa fa-location-arrow fa-2 white" aria-hidden="true"></i></span>' +
                                    '&nbsp; <span class="btn btn-xs btn-danger bpvicon" title="Delete"  ng-click="grid.appScope.deleteBp($event,row.entity,null);"><i class="fa fa-trash-o fa-2 white" aria-hidden="true"></i></span>'}
                                ];
                            }
                            
                        });
                    });
                }
            };
            /*method to get the instance role*/
            $scope.getTemplate = function(templateType) {
                var templateName = '';
                var type = '';
                type = templateType;
                switch (type) {
                    case 'chef':
                        templateName = 'SoftwareStack';
                        break;
                    case 'ami':
                        templateName = 'OSImage';
                        break;
                    case 'cft':
                        templateName = 'CloudFormation';
                        break;
                    case 'docker':
                        templateName = 'Docker';
                        break;
                    case 'arm':
                        templateName = 'ArmTemplate';
                        break;
                }
                return templateName;
            };
            pbList.blueprintInfo = $scope.blueprintInfo =function($event,bpDetails,bpType){
                $event.stopPropagation();
                gencSers.moreInfo(bpDetails,bpType);
            };
            pbList.launchInstance  = $scope.launchInstance =function($event,pb){
                $event.stopPropagation();
                gencSers.launchBlueprint(pb);
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
            $scope.refreshCurrentPageBp = function() {
                pbList.createList();
            };
            pbList.cloneBlueprint = $scope.cloneBlueprint =function($event,pbId){
                $event.stopPropagation();
                $rootScope.stateItems.current.params.blueId=pbId;
                $state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'edit'});

            };
            $rootScope.$on('BP_BLUEPRINTS_REFRESH_CURRENT', function() {
                pbList.createList();
            });
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