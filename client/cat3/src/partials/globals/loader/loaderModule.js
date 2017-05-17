/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	'use strict';
	angular.module('directive.loading', [])
		.directive('loading', ['$compile',function($compile) {
			var getTemplate = function(type, extraClasses) {
				var template = '';
				switch (type) {
					case 'block':
						template = "<h1 class='catloader block'><i class='fa fa-cog fa-spin "+extraClasses+"'></i> Loading...</h1>";
						break;
					case 'inline':
						template = "<span class='catloader inline'><i class='fa fa-spinner fa-spin "+extraClasses+"'></i></span>";
						break;
					default:
						template = "<h1 class='catloader block'><i class='fa fa-cog fa-spin "+extraClasses+"'></i> Loading...</h1>";
						break;
				}
				return template;
			};
			return {
				restrict: 'E',
				replace: true,
				scope: true,
				link: function(scope, elm, attrs) {
					angular.extend(scope, {
						dirLoading: function() {
							return !!scope[attrs.name];
						}
					});
					var type = attrs.type;
					var extraClasses = (attrs.classes)?attrs.classes:'black';
					var template = getTemplate(type,extraClasses);
					elm.html('').append($compile(template)(scope));
					scope.$watch(scope.dirLoading, function(v) {
						var size = attrs.size;
						if (v) {
							elm.show().find('.catloader').addClass(size);
						} else {
							elm.hide();
						}
					});
				}
			};
		}]);
})(angular);