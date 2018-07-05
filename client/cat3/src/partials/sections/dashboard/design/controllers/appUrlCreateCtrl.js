(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('appUrlCreateCtrl',['$scope', '$modalInstance', function ($scope,$modalInstance) {
           $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
            $scope.ok=function(){
                $scope.appUrls = {
                    name: $scope.appUrlItem.name,
                    url: $scope.appUrlItem.url
                };
                $modalInstance.close($scope.appUrls);    
            };
    }]);
})(angular);