/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Jun 2016
 */

(function (angular) {
    "use strict";
    angular.module('workzone.orchestration')
        .controller('confirmJobRunCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function ($scope, $modalInstance, items, workzoneServices) {
            $scope.isJobRunExecuting = false;
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
            $scope.runJob = function () {
                $scope.isJobRunExecuting = true;
                workzoneServices.runTask(items).then(
                    function (response) {
                        $scope.isJobRunExecuting = false;
                        $modalInstance.close(response.data);
                    },
                    function (error) {
                        error = error.responseText || error;
                        $scope.isJobRunExecuting = false;
                        if (error.message) {
                            alert(error.message);
                        } else {
                            alert(error);
                        }
                    }
                );
            };
        }
    ]);
})(angular);