(function(angular) {
    "use strict";
    angular.module('global.messages', []).directive('messages', ['$timeout',function ($timeout) {
        return {
            restrict: 'A',
            templateUrl: 'src/partials/globals/messages/messages.html',
            scope: {
                msgConfig:'=',
            },
            link: function (scope) {
                $timeout(function(){
                    if(scope.msgConfig.role){
                        $('[data-toggle="tooltip"]').tooltip({
                            title:scope.msgConfig.text,
                            placement: scope.msgConfig.positions,
                            html:true
                        });
                    }
                },100);
                scope.msgConfig = scope.msgConfig;
            }
        };
    }]); 
})(angular);
