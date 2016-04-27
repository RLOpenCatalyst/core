(function (angular) {
    "use strict";
    angular.module('workzone.application').directive("pipelineCard",[ '$rootScope',function ($rootScope) {
        return {
            restrict: 'A',
            templateUrl: 'src/partials/sections/dashboard/workzone/application/pipelineCard.html',
            scope: {
                cardDetails:'=',
                envName :'@'
            },
            controller: 'PipeLineViewCtrl as pipeCtrl',
            link: function (scope, element,attributes) {
                scope.cardDetails = scope.cardDetails;
                scope.envName = scope.envName;
            }
        };
    }]);
})(angular);