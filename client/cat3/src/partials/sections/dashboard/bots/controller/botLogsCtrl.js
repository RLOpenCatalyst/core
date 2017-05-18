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
        //$scope.nodeIds = items.auditTrailConfig.nodeIds;
        $scope.nodeIds = [];
        for(var i = 0; i < items.auditTrailConfig.nodeIdsWithActionLog.length;i++){
            $scope.nodeIds.push(items.auditTrailConfig.nodeIdsWithActionLog[i].nodeId);
        }
        $scope.taskType = items.auditTrailConfig.executionType;
        $scope.nodeIdsWithActionLog = items.auditTrailConfig.nodeIdsWithActionLog;
        $scope.jenkinsJobName = items.auditTrailConfig.jenkinsJobName;
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
            $scope.isBotLogsLoading = true;
            $scope.botLogs=[];
            var param={
                inlineLoader: true,
                url:'/audit-trail/' + $scope.selectedInstance.actionLogId + '/logs'
            };
            genSevs.promiseGet(param).then(function (response) {
                $scope.botLogs = response;
                helper.scrollBottom();
                $scope.isBotLogsLoading = false;
            });
        };
     
        var nodeIds = $scope.nodeIds;
        var requestObj = {
            "instanceIds": nodeIds
        };
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
                inlineLoader: true,
                url:'/jenkins/' + $scope.jenkinsActionLogId + '/jobs/' + $scope.jenkinsJobName + '/builds/' + $scope.jenkinsBuildNumber + '/output'
            };
            genSevs.promiseGet(param).then(function (response) {
                if (response) {
                    $scope.jenkinsLogs = helper.formatLogs(response.output);
                    helper.scrollBottom();
                    $scope.isBotLogsLoading = false;
                } else {
                    $scope.jenkinsLogs = helper.formatLogs(response.data.output);
                    helper.scrollBottom();
                    $scope.isBotLogsLoading = false;
                }
            });
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);