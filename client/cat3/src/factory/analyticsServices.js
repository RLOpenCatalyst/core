/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function (angular) {
    "use strict";
    angular.module('apis.analytics',['authentication', 'utility.pagination']).service(
            'analyticsEnvironment', [function () {
                    var requestParams;
                    var env = {
                        setParams: function (params) {
                            requestParams = params;
                        },
                        getParams: function () {
                            return requestParams;
                        }
                    };
                    return {
                        setEnvParams: env.setParams,
                        getEnvParams: env.getParams
                    };
                }]).service('analyticsServices', ['$http', 'session', 'analyticsEnvironment', 'paginationUtil',
        function ($http, Auth, analyticsEnvironment, paginationUtil) {
            var baseAPIUrl = uiConfigs.serverUrl;
            function fullUrl(relUrl){
                return baseAPIUrl + relUrl;
            }
            var serviceInterface = {
                getCurrentSelectedEnvInstanceList: function () {
                    /*params format
                     org: list[0],
                     bg: list[1],
                     proj: list[2],
                     env: list[3]
                     * */
                    var p = analyticsEnvironment.getEnvParams();
                    return serviceInterface.getInstanceBlueprintOrchestration(p.org, p.bg,
                            p.proj, p.env);
                },
                getTree: function () {
                    var url = '/organizations/getTreeForbtv';
                    return $http.get(fullUrl(url), Auth.getHeaderObject());
                },
                
            };
            return serviceInterface;
        }
    ]);
})(angular);