(function (angular) {
    "use strict";
    angular.module('dashboard.e-commerce', []).controller('e-commerceCtrl',['genericServices', function (genericServices) {
            var eCom=this;
            eCom.isTreeOpen = false;
            // create left tree
            genericServices.promiseGet({url:"src/partials/sections/dashboard/setting/data/treeMenu.JSON"}).then(function (treeResult) {
                eCom=treeResult;
            });
        }]);
})(angular);
