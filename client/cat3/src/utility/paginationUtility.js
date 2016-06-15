/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */
 
(function (angular) {
	"use strict";
	angular.module('utility.pagination', []).service('uiGridOptionsService', [function(){
		return {
			options: function() {
				return {
					pagination: {
						page: 1,
						pageSize: 10,
						sortBy: '',
						sortOrder: ''
					},
					gridOption: {
						paginationPageSizes: [10, 20, 50, 75],
						paginationPageSize: 10,
						enableColumnMenus: false,
						enableScrollbars: true,
						enableHorizontalScrollbar: 0,
						enableVerticalScrollbar: 1,
						useExternalPagination: true,
						useExternalSorting: true,
						multiSelect: false,
						modifierKeysToMultiSelect: false,
						enableRowSelection: true,
						enableRowHeaderSelection: false
					}
				};
			}
		};
	}])
	.service('uiGridOptionsClient', [function(){
		return {
			options: function() {
				return {
					gridOption: {
						paginationPageSizes: [10, 25, 50],
						paginationPageSize: 10,
						enableColumnMenus: false,
						enableScrollbars: true,
						enableHorizontalScrollbar: 0,
						enableVerticalScrollbar: 1
					}
				};
			}
		};
	}])
	.service('paginationUtil', [function () {
		var paginationInterface = {};
		/*pgOptions will come like this
			page:'', // set the page number
			pageSize:'' //set the pageSize
			field:'', //set the field by which you want to sort
			direction:'' //set the direction in which you want to sort.
		*/
		paginationInterface.pageObjectToString = function(pgOptions){
			var queryString = '';
			var _paramPageNum = '';
			var _paramPageSize = '';
			var _paramsortBy = '';
			var _paramsortOrder = '';
			var firstAvailable = '';
			var restAvailableArray = [];
			if(pgOptions.page){
				_paramPageNum = 'page='+pgOptions.page;
				if(!firstAvailable){
					firstAvailable = _paramPageNum;     
				}
			}
			if(pgOptions.pageSize){
				_paramPageSize = 'pageSize='+pgOptions.pageSize;
				if(!firstAvailable){
					firstAvailable = _paramPageSize;
				}
				else{
					restAvailableArray.push(_paramPageSize);
				}
			}
			if(pgOptions && pgOptions.sortBy){
				_paramsortBy = 'sortBy='+pgOptions.sortBy;
				if(!firstAvailable){
					firstAvailable = _paramsortBy;
				}else{
					restAvailableArray.push(_paramsortBy);
				}
			}
			if(pgOptions && pgOptions.sortOrder){
				_paramsortOrder = 'sortOrder='+pgOptions.sortOrder;
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
			/*This is the format on which the query string will be returned.*/
		};
		return paginationInterface;
	}]);
})(angular);