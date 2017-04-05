/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .service('botPollingSetting', [function() {
        return {
            botLogsPollerInterval: 5000
        };
    }])
    .controller('botsExecutionLogsNewCtrl',['$scope', 'items', '$rootScope', 'botsCreateService', 'botPollingSetting','genericServices', 'toastr', '$modalInstance', '$timeout', function ($scope, items, $rootScope, botsCreateService, botPollingSetting, genSevs, toastr, $modalInstance, $timeout) {
        $scope.isLogsLoading = true;
        angular.extend($scope, {
            logListInitial: [],
            logListDelta: []
        });
 
        $scope.getCurrentTime = new Date().getTime();
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
                    botsCreateService.getBotLogs(items.logDetails.botId,items.logDetails.actionId, helper.lastTimeStamp).then(function (resp) {
                        if (resp.length) {
                            var logData = {
                                logs: resp,
                                fullLogs: false
                            };
                            helper.lastTimeStamp = helper.getlastTimeStamp(logData.logs);
                            $scope.logListDelta.push.apply($scope.logListDelta, logData.logs);
                            $scope.isLogsLoading = false;
                            helper.scrollBottom();
                        }
                        helper.logsPolling();
                    });
                }, botPollingSetting.botLogsPollerInterval);
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
    
        botsCreateService.getBotLogs(items.logDetails.botId,items.logDetails.actionId, $scope.getCurrentTime).then(function (response) {
            helper.lastTimeStamp = helper.getlastTimeStamp(response);
            helper.logsPolling();
            var logData = {
                logs: response,
                fullLogs: true
            };
            $scope.logListInitial = logData.logs;
            if($scope.logListInitial.length === 0) {
                $scope.isLogsLoading = true;    
            }
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