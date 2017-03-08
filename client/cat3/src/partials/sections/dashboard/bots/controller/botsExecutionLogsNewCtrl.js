/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .service('orchestrationSetting', [function() {
        return {
            orchestrationLogsPollerInterval: 5000
        };
    }])
    .controller('botsExecutionLogsNewCtrl',['$scope', 'items', '$rootScope', 'workzoneServices', 'orchestrationSetting','genericServices', 'toastr', '$modalInstance', '$timeout', function ($scope, items, $rootScope, workzoneServices, orchestrationSetting,genSevs, toastr, $modalInstance, $timeout) {

        angular.extend($scope, {
            logListInitial: [],
            logListDelta: []
        });

        $scope.getDate = new Date();
        $scope.getCurrentTime = $scope.getDate.getTime();

        var timerObject;
        var helper = {
            lastTimeStamp: '',
            getlastTimeStamp: function (logObj) {
                if (logObj instanceof Array && logObj.length) {
                    var lastTime = logObj[logObj.length - 1].timestamp;
                    return lastTime;
                }
            },
            logsPolling: function() {
                timerObject = $timeout(function() {
                    workzoneServices.getBotLogs(items.logDetails.botId,items.logDetails.actionId, helper.lastTimeStamp).then(function (resp) {
                        if (resp.data.length) {
                            var logData = {
                                logs: resp.data,
                                fullLogs: false
                            };
                            helper.lastTimeStamp = helper.getlastTimeStamp(logData.logs);
                            $scope.logListDelta.push.apply($scope.logListDelta, logData.logs);
                            helper.scrollBottom();
                        }
                        helper.logsPolling();
                    });
                }, orchestrationSetting.orchestrationLogsPollerInterval);
            },
            scrollBottom : function () {
                $timeout(function () {
                    var elm = angular.element(".logsArea");
                    elm.scrollTop(elm[0].scrollHeight);
                }, 100);
            },
            stopPolling: function () {
                $timeout.cancel(timerObject);
            }
        };
    
        workzoneServices.getBotLogs(items.logDetails.botId,items.logDetails.actionId, $scope.getCurrentTime).then(function (response) {
            $scope.isLogsLoading = true;
            helper.lastTimeStamp = helper.getlastTimeStamp(response.data);
            $scope.isLogsLoading = false;
            helper.logsPolling();
            var logData = {
                logs: response.data,
                fullLogs: true
            };
            $scope.logListInitial = logData.logs;
            helper.scrollBottom();
        }, function (error) {
            $scope.isLogsLoading = false;
            console.log(error);
            $scope.errorMessage = "Unable to fetch logs for this bots";
        });

        $scope.cancel = function() {
            helper.stopPolling();
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);