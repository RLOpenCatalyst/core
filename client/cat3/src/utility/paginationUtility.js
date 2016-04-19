/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */
(function (angular) {
    'use strict';
    angular.module('utility.pagination', [])
        .service('paginationUtil', [function () {
           
            /*return {
                  "request":[{
                    "pageSize": 5,
                    "currentPage": 1,
                    "sortBy": "",
                    "sortOrder": "",
                    "filterBy":{},
                    "search":''
                    }],
                 "paginationPageSizes": [5,10, 20, 50]
            };*/
            var paginationInterface = {};
            paginationInterface.pageObjectToString = function(pgOptions){
                var queryString = '';
                var _strPageSize = '';
                var _paramPageNum = '?page=';
                var _paramPageSize = '&pageSize=';
                var _paramsortBy = '&sortBy=';
                var _paramsortOrder = '&sortOrder=';
                if(pgOptions.pages.page){
                    _strPageSize = _paramPageNum + pgOptions.pages.page;
                }
                if(pgOptions.pages.pageSize){
                    _strPageSize = _strPageSize + _paramPageSize + pgOptions.pages.pageSize;
                }
                if(pgOptions.sort && pgOptions.sort.field){
                    _strPageSize = _strPageSize + _paramsortBy + pgOptions.sort.field;
                }
                if(pgOptions.sort && pgOptions.sort.direction){
                    _strPageSize = _strPageSize + _paramsortOrder + pgOptions.sort.direction;
                }

                queryString = _strPageSize; 
                return queryString;
            };
            return paginationInterface;
        }]);
})(angular);