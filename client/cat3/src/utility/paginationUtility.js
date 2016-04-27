/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */
(function (angular) {
    'use strict';
    angular.module('utility.pagination', [])
        .service('paginationUtil', [function () {
           
            var paginationInterface = {};
            /*pgOptions will come like this
                pages:{
                    page:'', // set the page number
                    pageSize:'' //set the pageSize
                },
                sort:{
                    field:'', //set the field by which you want to sort
                    direction:'' //set the direction in which you want to sort.
                }*/
            paginationInterface.pageObjectToString = function(pgOptions){
                var queryString = '';
                var _paramPageNum = '';
                var _paramPageSize = '';
                var _paramsortBy = '';
                var _paramsortOrder = '';
                var firstAvailable = '';
                var restAvailableArray = [];
                if(pgOptions.pages.page){
                    _paramPageNum = 'page='+pgOptions.pages.page;
                    if(!firstAvailable){
                        firstAvailable = _paramPageNum;     
                    }
                }
                if(pgOptions.pages.pageSize){
                    _paramPageSize = 'pageSize='+pgOptions.pages.pageSize;
                    if(!firstAvailable){
                        firstAvailable = _paramPageSize;
                    }
                    else{
                        restAvailableArray.push(_paramPageSize);
                    }
                }
                if(pgOptions.sort && pgOptions.sort.field){
                    _paramsortBy = 'sortBy='+pgOptions.sort.field;
                    if(!firstAvailable){
                        firstAvailable = _paramsortBy;
                    }else{
                        restAvailableArray.push(_paramsortBy);
                    }
                }
                if(pgOptions.sort && pgOptions.sort.direction){
                    _paramsortOrder = 'sortOrder='+pgOptions.sort.direction;
                    if(!firstAvailable){
                        firstAvailable = _paramsortOrder;
                    }else{
                        restAvailableArray.push(_paramsortOrder);
                    }
                }
                var firstAvailableParam='?'+ firstAvailable;
                var otherParams = '&' + restAvailableArray.join('&');

                queryString = firstAvailableParam + otherParams; 
                return queryString;
                /*?page=&pageSize=&sortBy=&sortOrder=*/
                /*This is the format on which the query string will be returned.*/
            };
            return paginationInterface;
        }]);
})(angular);