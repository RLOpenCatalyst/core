/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    var socketClient = io('/notify');
    angular.module('dashboard.bots')
    .controller('botsExecutionLogsNewCtrl',['$scope', 'items', '$rootScope', 'botsCreateService','genericServices', 'toastr', '$modalInstance', '$timeout', function ($scope, items, $rootScope, botsCreateService, genSevs, toastr, $modalInstance, $timeout) {
        angular.extend($scope, {
            logListInitial: [],
            logListDelta: []
        });
        var helper = {
            logsPolling : function() {
                socketClient.emit('join','client-'+items.logDetails.actionId);
                socketClient.on('update',function(data){
                    if(data.dataType == 'log'){
                        var logData = {
                            logs: data.updateData,
                            fullLogs: false
                        };
                        $scope.logListDelta.push(logData.logs);
                        helper.scrollBottom();
                    }
                })
            },
            scrollBottom : function () {
                $timeout(function () {
                    var elm = angular.element(".logsArea");
                    elm.scrollTop(elm[0].scrollHeight);
                }, 100);
            }
        };
    
        botsCreateService.getBotLogs(items.logDetails.botId,items.logDetails.actionId).then(function (response) {
            $scope.isLogsLoading = true;
            var logData = {
                logs: response,
                fullLogs: false
            };
            $scope.logListInitial = logData.logs;
            $scope.isLogsLoading = false;
            helper.logsPolling();
        }, function (error) {
            $scope.isLogsLoading = false;
            console.log(error);
            $scope.errorMessage = "Unable to fetch logs for this bots";
        });

        $scope.cancel = function() {
            socketClient.emit('leave', 'client-'+items.logDetails.actionId);
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);