(function (angular) {
    "use strict";
    angular.module('workzone.application').directive("pipelineCard",[function ($rootScope) {
        return {
            restrict: 'A',
            templateUrl: 'src/partials/sections/dashboard/workzone/application/pipelineCard.html',
            scope: {
                cardDetails:'=',
                appName :'=',
                envName:'@'
            },
            controller: 'PipeLineViewCtrl as pipeCtrl',
            link: function (scope, element) {
                scope.cardDetails = scope.cardDetails;
                scope.appName = scope.appName;
                scope.envName = scope.envName;

            }
        };
    }]);
})(angular);