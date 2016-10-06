(function (angular) {
    "use strict";
    angular.module('services.design',[])
        .factory('designServices',['$rootScope','$http','$q','toastr', function ($rootScope,$http,$q,toastr) {
            return {
                promiseGet : function (paramsObject) {
                    if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
                   var deferred = $q.defer();
                    $http.get(paramsObject.url)
                    .success(function(data) {
                        if(!paramsObject.inlineLoader){$rootScope.onBodyLoading=false;}
                        deferred.resolve(data);
                    })
                    .error(function(data, status) {
                        if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=false;}
                        deferred.reject();
                        toastr.error(data.message, status);
                    });
                    return deferred.promise;
                },
                promisePost : function (paramsObject) {
                    if(!paramsObject.inlineLoader){ $rootScope.onBodyLoading=true;}
                    var deferred = $q.defer();
                    $http.post(paramsObject.url,paramsObject.data)
                        .success(function(data) {
                            $rootScope.onBodyLoading=false;
                            deferred.resolve(data);
                        })
                        .error(function(data, status) {
                            $rootScope.onBodyLoading=false;
                            deferred.reject();
                            toastr.error(data.message, status);
                        });
                    return deferred.promise;
                },
                promiseDelete : function (paramsObject) {
                    $rootScope.onBodyLoading=true;
                    var deferred = $q.defer();
                    $http({
                        method: 'DELETE',
                        url: paramsObject.url,
                        data:paramsObject.data
                    }).success(function(data) {
                            $rootScope.onBodyLoading=false;
                            deferred.resolve(data);
                        })
                        .error(function(data, status) {
                            $rootScope.onBodyLoading=false;
                            deferred.reject();
                            toastr.error(data.message, status);
                        });
                    return deferred.promise;
                }
            };
        }]);
})(angular);