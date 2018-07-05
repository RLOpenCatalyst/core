(function (angular) {
    "use strict";
    angular.module('design.BpList',[])
        .service('blueprintService',['$rootScope','$http','$q','toastr','$state','$modal','confirmbox','genericServices',function ($rootScope,$http,$q,toastr,$state,$modal,confirmbox,genericServices) {
            var bpServ={};
             bpServ.createList = function(bpType){
                var organObjectId=[];
                ///organObjectId.envOptions=$rootScope.organObject[$rootScope.organNewEnt.org].environments;
                if($rootScope.organObject){
                    var tempType=(bpType) ? bpType :$state.params.templateObj.templatetype;
                    var pagination =(bpType) ? false :true;
                    organObjectId.org =$rootScope.organNewEnt.org.rowid;
                    organObjectId.buss=$rootScope.organNewEnt.buss.rowid;
                    organObjectId.proj=$rootScope.organNewEnt.proj.rowId;
                    var params;
                    if(tempType === 'docker' || tempType === 'arm' || tempType === 'composite'){
                        params = {
                            url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/blueprintList?pagination='+pagination+'&templateType='+tempType+'&providerType='
                        };    
                    }else {
                        params = {
                            url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/blueprintList?pagination='+pagination+'&templateType='+tempType+'&providerType='+angular.lowercase($state.params.providerName)
                        };
                    }
                    return genericServices.promiseGet(params);
                }
            };
            bpServ.launchBp = function (id) {
                $modal.open({
                    animate: true,
                    templateUrl: "src/partials/sections/dashboard/design/view/popups/blueprintLaunch.html",
                    controller: "bpLaunchInstanceCtrl as lanIns",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        bpItem: function() {
                            return {
                                id:id,
                                organObject:$rootScope.organObject
                            };
                        }
                    }
                }).result.then(function(env) {
                    var params = {
                        url: '/blueprint-frames/',
                        data:{
                            "blueprintId": id,
                            "environmentId": env
                        }
                    };
                    genericServices.promisePost(params).then(function () {
                        toastr.success('Successfully launched.');
                    });
                });
            };
            bpServ.copyBp = function (ids) {
                $modal.open({
                    animate: true,
                    templateUrl: "src/partials/sections/dashboard/design/view/popups/blueprintCopy.html",
                   controller: "bpCopyCtrl as bpCopy",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        bpItem: function() {
                            return {
                                ids:ids,
                                organObject:$rootScope.organObject
                            };
                        }
                    }
                }).result.then(function(orgDetails) {
                    var bPIds=[];
                    if(angular.isArray(ids)){
                        bPIds=ids;
                    } else {
                        bPIds.push(ids);
                    }
                    var params = {
                        url: '/blueprints/copy',
                        data:{
                            "orgid": $rootScope.organObject[orgDetails.copyOrg].rowid,
                            "buid": $rootScope.organObject[orgDetails.copyOrg].businessGroups[orgDetails.copyBuss].rowid,
                            "projid": $rootScope.organObject[orgDetails.copyOrg].businessGroups[orgDetails.copyBuss].projects[orgDetails.copyProj].rowId,
                            "blueprints":bPIds
                        }
                    };
                    genericServices.promisePost(params).then(function () {
                        toastr.success('Successfully copied.');
                        $rootScope.$emit('BP_BLUEPRINTS_REFRESH_CURRENT');
                    });
                });
            };
            bpServ.deleteBp = function (ids) {
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Delete',
                    actionButtonStyle: 'cat-btn-delete',
                    headerText: 'Delete  Blueprint',
                    bodyText: 'Are you sure you would like to remove the selected blueprints ?'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    var bPIds=[];
                    if(angular.isArray(ids)){
                        bPIds=ids;
                    } else {
                        bPIds.push(ids);
                    }
                    var params = {
                        url: '/blueprints',
                        data:{blueprints:bPIds}
                    };
                    genericServices.promiseDelete(params).then(function(){
                        toastr.success('Successfully deleted');
                        angular.each(ids,function (val) {
                            angular.element('#'+val).hide();
                        });
                    });
                });
            };
            return bpServ;
        }]);
})(angular);