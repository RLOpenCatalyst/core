/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots',[])
    .controller('botLogsCtrl',['$scope', '$rootScope', '$http', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', '$timeout', function ($scope, $rootScope, $http, genSevs, workzoneServices, toastr, $modalInstance, items, $timeout) {
        $scope.actionId = items.actionId;
        $scope.botName = items.name;
        $scope.nodeIds = items.nodeIds;
        $scope.nodeIdsWithActionLog = items.nodeIdsWithActionLog;
        //$scope.selectedInstance = items.nodeIds[0];
        $scope.isBotLogsLoading = true;
        var helper = {
            scrollBottom : function () {
                $timeout(function () {
                    var elm = angular.element(".logsArea");
                    elm.scrollTop(elm[0].scrollHeight);
                }, 100);
            },
            stopPolling: function () {
                $timeout.cancel();
            }
        };
        $scope.instanceChange =function(){
            $scope.botLogs=[];
            var url = '/audit-trail/' + $scope.actionId + '/logs';
            $http.get(url).then(function (result) {
                console.log(result.data);
                $scope.botLogs = result.data;
                $scope.isBotLogsLoading = false;
            });
        };
        $scope.instanceChange();

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        }
    }]);
})(angular);