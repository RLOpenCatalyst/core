(function(angular) {
	"use strict";
	angular.module('global.uiGridOptions', []).factory('uiGridOptionsServices', function () {
		return{
			options :function(){
				return {
					pagination:{
						pageSize: 10,
						page: 1,
						sortBy: "",
						sortOrder: ""
					},
					gridOption:{
						paginationPageSizes: [10,20, 50, 75],
						paginationPageSize: 10,
						enableColumnMenus:false,
						enableScrollbars :true,
						enableHorizontalScrollbar: 0,
						enableVerticalScrollbar: 1,
						useExternalPagination: true,
						useExternalSorting: true,
						multiSelect :false,
						modifierKeysToMultiSelect:false,
						enableRowSelection :true,
						enableRowHeaderSelection:false
					}
				};
			}
		};
	});
})(angular);
