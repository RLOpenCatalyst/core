(function (angular) {
    "use strict";
    angular.module('dashboard.settings')
        .controller('dashboardListCtrl', ['$scope', '$rootScope','genericServices', function ($scope,$rootScope,genericServices){
            var ctr=this;
            var treeNames = ['Setting','CI-CD Dashboard'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            ctr.dashboardList={};
            ctr.recordsTotal='';
            ///

            ctr.dashboardList.paginationPageSizes= [10, 20, 30];
            ctr.dashboardList.paginationPageSize= 10;
            ctr.dashboardList.enableGridMenu = true;
            ctr.dashboardList.enableSorting= false;
            ctr.dashboardList.columnDefs=[
                    { name:'dashboardName',minWidth:150,field:'dashboardName',displayName:'Dashboard Name',cellTooltip: true },
                    { name:'orgName',minWidth:150,field:'orgName',cellTooltip: true,displayName:'Org Name' },
                    { name:'BUName',minWidth:150,field:'BUName',cellTooltip: true ,displayName:'Bu Name'},
                    { name:'projectName',minWidth:150,field:'projectName',cellTooltip: true,displayName:'Project Name' },
                    { name:'dashboardURL',minWidth:150,field:'dashboardURL',cellTooltip: true,displayName:'Dashboard URL' },
                    { name:'Action',minWidth:150,cellTemplate: '<span class="cursor" title="Edit" ng-click=""><i class="fa fa-pencil font-size-16"></i></span>&nbsp; &nbsp; <span class="cursor " title="Delete" ng-click=""><i class="fa fa-trash-o red font-size-16"></i></span>',cellTooltip: true,displayName:'Action' }
                ];
            genericServices.promiseGet({url:'src/partials/sections/dashboard/setting/data/listDashboard.json'}).then(function (orgs) {
                ctr.dashboardList.data=orgs.data;
                ctr.recordsTotal=orgs.recordsTotal;
            });
        }]);
})(angular);
