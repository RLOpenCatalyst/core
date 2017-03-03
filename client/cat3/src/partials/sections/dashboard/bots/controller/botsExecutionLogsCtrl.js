/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botsExecutionLogsCtrl',['$scope', 'items', '$rootScope', 'orchestrationSetting','genericServices', 'toastr', '$modalInstance', '$timeout', function ($scope, items, $rootScope, orchestrationSetting,genSevs, toastr, $modalInstance, $timeout) {
        var helper = {
            lastTimeStamp: '',
            getlastTimeStamp: function (logObj) {
                if (logObj instanceof Array && logObj.length) {
                    var lastTime = logObj[logObj.length - 1].timestamp;
                    return lastTime;
                }
            },
            scrollBottom : function () {
                $timeout(function () {
                    var elm = angular.element(".logsArea");
                    elm.scrollTop(elm[0].scrollHeight);
                }, 100);
            },
            stopPolling: function () {
                $timeout.cancel();
            },
            formatLogs: function(str) {
                return str.replace(/\r?\n/g, "<br />");
            }
        };
        
        var param={
            inlineLoader: true,
            url:'/botsNew/' + items.botId + '/bots-History/' + items.actionId + '/logs'
        }; 

        genSevs.promiseGet(param).then(function (response) {
            if (response) {
                $scope.logsOutput = response;

                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            } else {
                $scope.jenkinsLogs = helper.formatLogs(response);
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            }
        })
        /*genSevs.promiseGet(param).then(function (response) {
            if (response) {
                $scope.logsOutput = helper.formatLogs(response.output);
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            } else {
                $scope.jenkinsLogs = helper.formatLogs(response.data.output);
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            }
        });*/

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);