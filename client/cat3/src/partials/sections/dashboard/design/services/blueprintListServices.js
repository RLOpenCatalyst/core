(function (angular) {
    "use strict";
    angular.module('design.BpList',[])
        .service('blueprintService',['$rootScope','$http','$q','toastr','$state','$modal','confirmbox','designServices',function ($rootScope,$http,$q,toastr,$state,$modal,confirmbox,designServices) {
            var bpServ={};
             bpServ.createList = function(){
                var organObjectId=[];
                ///organObjectId.envOptions=$rootScope.organObject[$rootScope.organNewEnt.org].environments;
                if($rootScope.organObject){
                    organObjectId.org =$rootScope.organObject[$rootScope.organNewEnt.org].rowid;
                    organObjectId.buss=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].rowid;
                    organObjectId.proj=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].projects[$rootScope.organNewEnt.proj].rowid;
                    var params = {
                        url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/blueprintList?pagination=true&templateType='+$state.params.templateObj.templatetype+'&providerType='+angular.lowercase($state.params.subItem)
                    };
                    return designServices.promiseGet(params);
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
                    designServices.promisePost(params).then(function () {
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
                    var params = {
                        url: '/blueprints/copy/',
                        data:{
                            "orgid": $rootScope.organObject[orgDetails.copyOrg].rowid,
                            "buid": $rootScope.organObject[orgDetails.copyOrg].businessGroups[orgDetails.copyBuss].rowid,
                            "projid": $rootScope.organObject[orgDetails.copyOrg].businessGroups[orgDetails.copyBuss].projects[orgDetails.copyProj].rowid,
                            "blueprints":ids
                        }
                    };
                    designServices.promisePost(params).then(function () {
                        toastr.success('Successfully copied.');
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
                    var params = {
                        url: '/blueprints',
                        data:{
                            "blueprints":ids
                        }
                    };
                    designServices.promiseDelete(params).then(function(){
                        angular.each(ids,function (val) {
                            angular.element('#'+val).hide();
                        });
                        toastr.success('Successfully deleted');
                    });
                });
            };
            return bpServ;
        }]);
})(angular);