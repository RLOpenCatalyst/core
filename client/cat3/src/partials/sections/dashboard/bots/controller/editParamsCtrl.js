/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Oct 2016
 */

(function (angular) {
    "use strict";
    angular.module('library.params', [])
    .controller('editParamsCtrl',['$scope', '$rootScope', 'genericServices', 'workzoneServices', 'toastr', '$modalInstance', 'items', 'responseFormatter', '$modal', function ($scope, $rootScope, genSevs, workzoneServices, toastr, $modalInstance, items, responseFormatter, $modal) {
        $scope.botName = items.name;
        $scope.botParams = items.inputFormFields;
        $scope.botEditParams = [];
        $scope.botParameters = [];
        
        
        $scope.executeTask = function(){
            var reqBody = {};
            $scope.botParameters = $scope.botParameters.concat($scope.botEditParams);
            reqBody = $scope.botParameters;
            var param={
                inlineLoader:true,
                url:'/botsNew/' + items._id + '/execute',
                data: reqBody
            };
            genSevs.promisePost(param).then(function (response) {
                $modalInstance.close(response);
                console.log(response);
                $rootScope.$emit('BOTS_LIBRARY_REFRESH');
            },
            function (error) {
                if(error) {
                    error = error.responseText || error;
                    if (error.message) {
                        toastr.error(error.message);
                    } else {
                        toastr.error(error);
                    }
                }
            });
        };

        $scope.cancel= function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);