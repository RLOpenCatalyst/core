/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	'use strict';
	angular.module('utility.array', [])
		.service('arrayUtil', [function () {
			function insensitive(s1, s2) {
				var s1lower = s1.toLowerCase();
				var s2lower = s2.toLowerCase();
				return s1lower > s2lower ? 1 : (s1lower < s2lower ? -1 : 0);
			}

			return {
				isValueAvailable: function (list, id) {
					var p = false;

					for (var i = 0; i < list.length; i++) {
						if (list[i].id === id) {
							p = true;
							break;
						}
					}
					return p;
				},
				deleteObjectById: function (objList, id) {
					return _.rest(objList, function (o) {
						if (o._id === id) {
							return true;
						}
						return false;
					});
				},
				sort: function (list) {
					if (list.sort) {
						//If sort method is available in the native array , we will utilize that otherwise we need to implement manually.
						return list.sort(insensitive);
					} else {
						//Here we need to implemenet the sort method for array of strings,
						list.sort = function () {

						};
						return list.sort();
					}
				},
				deleteByValue: function (list, value) {
					return _.rest(list, function (o) {
						if (o === value) {
							return true;
						}
						return false;
					});
				},
				deleteBySpecificPropertyName: function (list, keyName, value) {
					return _.rest(list, function (o) {
						if (o[keyName] === value) {
							return true;
						}
						return false;
					});
				},
				differenceInArray: function (array1, array2) { // will return non duplicate values in array2
					return array2.filter(function (obj) {
						return array1.indexOf(obj) === -1;
					});
				},
				isEmptyObject: function(obj) { //validates if an object is empty like {}
					return Object.keys(obj).length === 0 && JSON.stringify(obj) === JSON.stringify({});    
				}
			};
		}
	]);
})(angular);