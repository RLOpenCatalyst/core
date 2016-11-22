/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.bots')
    .controller('botLogsCtrl',['$scope', '$rootScope', '$http', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', '$timeout', function ($scope, $rootScope, $http, genSevs, workzoneServices, toastr, $modalInstance, items, $timeout) {
        $scope.actionId = items.actionId;
        $scope.botName = items.name;
        $scope.nodeIds = items.nodeIds;
        $scope.taskType = items.taskType;
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
            var url = '/audit-trail/' + $scope.selectedInstance.actionLogId + '/logs';
            $http.get(url).then(function (result) {
                $scope.botLogs = result.data;
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
                //if blueprint job, use blueprintExecutionResults
                for (var k = 0; k < $scope.nodeIdsWithActionLog.length; k++) {
                        for (var l = 0; l < _jobInstances.length; l++) {
                            if ($scope.nodeIdsWithActionLog[k].nodeId === _jobInstances[l]._id) {
                                $scope.nodeIdsWithActionLog[k].uiNodeName = _jobInstances[l].name;
                                console.log($scope.nodeIdsWithActionLog[k].uiNodeName);
                            }
                        }
                    }
                 $scope.selectedInstance = $scope.nodeIdsWithActionLog[0];
                $scope.instanceChange();    
               /*chefLogData.chefHistoryItem = historyItem; //saved as we need timestamps from the historyItem
                chefLogData.nodeIdsWithActionLog = nodeIdWithActionLogs; //this can now be used to show instance dropdown
                if (chefLogData.nodeIdsWithActionLog[0]) {
                    $scope.isInstanceListLoading = false;
                    selectFirstInstance(chefLogData.nodeIdsWithActionLog[0]);
                }*/
            },
            function (error) {
                $scope.isBotLogsLoading = false;
                console.log(error);
            });

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        }
    }]);
})(angular);