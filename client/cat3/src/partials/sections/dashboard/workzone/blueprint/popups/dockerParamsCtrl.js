/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(angular) {
	"use strict";
	angular.module('workzone.blueprint')
		.controller('dockerParamsCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) {
			console.log(items);
			var fullParams;
			fullParams = items;
			var execparam = fullParams.split(' -exec');
			if (execparam.length > 0 && typeof execparam[1] != "undefined") {
				var additionalStartUp = execparam[1].trim();
				$scope.addStartup = additionalStartUp;
				if (execparam[0].indexOf('-c') > 0) //found a startup command
				{
					startupparam = execparam[0].split(' -c');
					if (startupparam.length > 0) {
						var startupCommand = startupparam[1].trim();
						$scope.startupCommand = startupCommand;
						fullParams = startupparam[0];
					} else {
						fullParams = startupparam[0];
					}
				} else {
					fullParams = execparam[0];
				}
			} else {
				if (fullParams.indexOf(' -c') >= 0) {
					startupparam = fullParams.split(' -c');
					if (startupparam.length > 0) {
						startupCommand = startupparam[1].trim();
						$scope.startupCommand = startupCommand;
						fullParams = startupparam[0];
					}
				}
			}
			
			var startparam;
			var params = fullParams.split(' -');

			//for obtaining the name..
			angular.forEach(params, function(value, key) {
				var subparam = params[key].split(' ');
				if (subparam.length > 0) {
					$inp = $('[dockerparamkey="-' + subparam[0] + '"]').first();

					if ($inp.val() != '')
						$inp.val($inp.val() + ',' + subparam[1]);
					else
						$inp.val(subparam[1]);
				}
				$scope.subparam = subparam[1];

			});
		}]);
})(angular);