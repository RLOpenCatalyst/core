(function (angular) {
    "use strict";
    angular.module('design.BpList',[])
        .service('blueprintService',['$rootScope','$http','$q','toastr','$state','$modal','designServices',function ($rootScope,$http,$q,toastr,$state,$modal,designServices) {
            var bpServ={};
            bpServ.createList = function(){
                var organObjectId=[];
                ///organObjectId.envOptions=$rootScope.organObject[$rootScope.organNewEnt.org].environments;
                organObjectId.org =$rootScope.organObject[$rootScope.organNewEnt.org].rowid;
                organObjectId.buss=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].rowid;
                organObjectId.proj=$rootScope.organObject[$rootScope.organNewEnt.org].businessGroups[$rootScope.organNewEnt.buss].projects[$rootScope.organNewEnt.proj].rowid;
                var params = {
                    url:'/composite-blueprints'
                    //url: '/organizations/'+organObjectId.org+'/businessgroups/'+organObjectId.buss+'/projects/'+organObjectId.proj+'/?provider='+$state.params.subItem+'&templatetype='+$state.params.templateId
                };
                return designServices.promiseGet(params);

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
                            }
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
                        toastr.success('Successfully launched that blueprint');
                    });
                });
            };
            bpServ.copyBp = function (id) {
                $modal.open({
                    animate: true,
                    templateUrl: "src/partials/sections/dashboard/design/view/popups/blueprintCopy.html",
                   controller: "bpCopyCtrl as bpCopy",
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        bpItem: function() {
                            return {
                                id:id,
                                organObject:$rootScope.organObject
                            }
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
                        toastr.success('Successfully launched that blueprint');
                    });
                });
            };
            return bpServ;
        }]);
})(angular);