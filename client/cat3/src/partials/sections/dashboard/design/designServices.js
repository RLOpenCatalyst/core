(function (angular) {
    "use strict";
    angular.module('services.design',[])
        .factory('designServices',['$rootScope','$http','$q','toastr', function ($rootScope,$http,$q,toastr) {
            return {
                promiseGet : function (paramsObject) {
                   var deferred = $q.defer();
                    $http.get(paramsObject.url)
                    .success(function(data) {
                        deferred.resolve(data);
                    })
                    .error(function(data, status) {
                        deferred.reject();
                        toastr.error(data, status);
                    });
                    return deferred.promise;
            }
        };
        }]);
})(angular);