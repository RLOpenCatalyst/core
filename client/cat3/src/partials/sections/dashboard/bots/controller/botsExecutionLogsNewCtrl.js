/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botsExecutionLogsNewCtrl',['$scope', 'items', '$rootScope', 'orchestrationSetting','genericServices', 'toastr', '$modalInstance', '$timeout', function ($scope, items, $rootScope, orchestrationSetting,genSevs, toastr, $modalInstance, $timeout) {
        $scope.isBotsNew = items.isBotNew;
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
            url:'/botsNew/' + items.logDetails.botId + '/bots-History/' + items.logDetails.actionId + '/logs'
        }; 

        genSevs.promiseGet(param).then(function (response) {
            if (response) {
                $scope.logsOutput = response;
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            } else {
                $scope.logsOutput = response.data;
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            }
            if(response === null) {
                $scope.logsOutput = 'No Logs Generated';
            }
        });

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);