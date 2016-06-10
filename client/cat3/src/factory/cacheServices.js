/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function (angular) {
	"use strict";
	angular.module('global.cache', []).service('cacheServices', ['$cacheFactory',
		function ($cacheFactory) {
			var defaultCache = $cacheFactory("catalyst"),
			workzoneCache = $cacheFactory("workzone"),
			designCache = $cacheFactory("design"),
			settingsCache = $cacheFactory("settings");
			var group = 'workzone';
			var getCacheFactory = function () {
				var selectedCache = '';
				switch (group) {
					case "workzone":
						selectedCache = workzoneCache;
						break;
					case "design":
						selectedCache = designCache;
						break;
					case "settings":
						selectedCache = settingsCache;
						break;
					default:
						selectedCache = defaultCache;
						break;
				}
				return selectedCache;
			};

			return {
				addToCache: function (key, data) {
					var cacheFactory = getCacheFactory();
					cacheFactory.put(key, data);
				},
				getFromCache: function (key) {
					var cacheFactory = getCacheFactory();
					return cacheFactory.get(key);
				},
				removeFromCache: function (key) {
					var cacheFactory = getCacheFactory();
					return cacheFactory.remove(key);
				},
				removeAllFromCache: function () {
					var cacheFactory = getCacheFactory();
					return cacheFactory.removeAll();
				}
			};
		}
	]);
})(angular);
