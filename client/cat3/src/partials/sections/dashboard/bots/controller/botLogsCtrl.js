/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots',[])
    .controller('botLogsCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', '$timeout', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, $timeout) {
        $scope.botName = items.auditTrailConfig.name;
        $scope.nodeIds = items.auditTrailConfig.nodeIds;
        $scope.taskType = items.auditTrailConfig.executionType;
        $scope.nodeIdsWithActionLog = items.auditTrailConfig.nodeIdsWithActionLog;
        $scope.isBotLogsLoading = true;
        if($scope.taskType === 'jenkins') {
            $scope.jenkinsActionLogId = items.actionLogId;
            $scope.jenkinsBuildNumber = items.auditTrailConfig.jenkinsBuildNumber;
        }
        var helper = {
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
        $scope.instanceChange =function(){
            $scope.botLogs=[];
            var param={
                url:'/audit-trail/' + $scope.selectedInstance.actionLogId + '/logs'
            };
            genSevs.promiseGet(param).then(function (response) {
                $scope.botLogs = response;
                $scope.isBotLogsLoading = false;
            });
        };
     
        var nodeIds = $scope.nodeIds;
        var requestObj = {
            "instanceIds": nodeIds
        };
        var bluePrintJob = false;
        workzoneServices.postRetrieveDetailsForInstanceNames(requestObj).then(function (response) {
            var _jobInstances = response.data;
            for (var k = 0; k < $scope.nodeIdsWithActionLog.length; k++) {
                for (var l = 0; l < _jobInstances.length; l++) {
                    if ($scope.nodeIdsWithActionLog[k].nodeId === _jobInstances[l]._id) {
                        $scope.nodeIdsWithActionLog[k].uiNodeName = _jobInstances[l].name;
                    }
                }
            }
            $scope.selectedInstance = $scope.nodeIdsWithActionLog[0];
            $scope.instanceChange();    
        },
        function (error) {
            $scope.isBotLogsLoading = false;
            console.log(error);
        });
        if($scope.taskType === 'jenkins') {
            var param={
                url:'/jenkins/' + $scope.jenkinsActionLogId + '/jobs/testmail/builds/' + $scope.jenkinsBuildNumber + '/output'
            };
            genSevs.promiseGet(param).then(function (response) {
                if (response.data) {
                    $scope.jenkinsLogs = helper.formatLogs(response.data.output);
                    $scope.isBotLogsLoading = false;
                } else {
                    $scope.jenkinsLogs = helper.formatLogs(response.output);
                    $scope.isBotLogsLoading = false;
                }
            });
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        }
    }]);
})(angular);