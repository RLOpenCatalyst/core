(function (angular) {
    "use strict";
    angular.module('apis.analytics',[])
        .factory('analyticsServices',['$rootScope', function ($rootScope) {
            return {
                initFilter:function(){
                    $rootScope.organNewEnt=[];
                    $rootScope.filterNewEnt={};
                    $rootScope.organNewEnt.org = '0';
                    $rootScope.filterNewEnt.period='month';
                    $rootScope.splitUpCosts=[];
                },
                applyFilter : function(filterApp,period){
                    if($rootScope.organObject) {
                        var obj = $rootScope.organObject,
                            or = $rootScope.organNewEnt.org,
                            bu = $rootScope.organNewEnt.buss,
                            pr = $rootScope.organNewEnt.proj;
                        if (period)
                            $rootScope.filterNewEnt.period = period;

                        if (or) {
                            $rootScope.filterNewEnt.org = {name: obj[or].name, id: obj[or].rowid, title: 'Org'};
                            $rootScope.filterNewEnt.provider = '';
                        } else{
                            $rootScope.filterNewEnt.org = {id: obj[or].rowid, title: 'Org'};
                        }
                        if (filterApp) {
                            if (bu) {
                                $rootScope.filterNewEnt.buss = {
                                    name: obj[or].businessGroups[bu].name,
                                    id: obj[or].businessGroups[bu].rowid,
                                    title: 'BU'
                                };
                            }
                            if (pr) {
                                $rootScope.filterNewEnt.proj = {
                                    name: obj[or].businessGroups[bu].projects[pr].name,
                                    id: obj[or].businessGroups[bu].projects[pr].rowid,
                                    title: 'Project'
                                };
                            }

                            if ($rootScope.organNewEnt.provider) {
                                $rootScope.filterNewEnt.provider = {
                                    name: $rootScope.providers[$rootScope.organNewEnt.provider].providerName,
                                    id: $rootScope.providers[$rootScope.organNewEnt.provider]._id,
                                    title: 'Provider'
                                };
                            } else {
                                $rootScope.filterNewEnt.provider = '';
                            }
                        } else {
                            $rootScope.organNewEnt = {}
                            $rootScope.organNewEnt.org = or;
                        }
                    }
                    return 1;
                }
            };
        }]);
})(angular);