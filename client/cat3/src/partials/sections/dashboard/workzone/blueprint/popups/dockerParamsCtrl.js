/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * April 2016
 */
 
(function(angular) {
	"use strict";
	angular.module('workzone.blueprint')
		.controller('dockerParamsCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
			angular.extend($scope, {
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
			});
			$scope.dockerParams = {};
			var fullParams;
			//assigning items to fullParams. items gives a string which is the dockerLaunchParams.
			fullParams = items;
			//splitting the additional startup from the full params and assigning to scope.
			var execparam = fullParams.split(' -exec');
			var startupparam;
			var startupCommand;
			if (execparam.length > 0 && typeof execparam[1] !== "undefined") {
				var additionalStartUp = execparam[1].trim();
				$scope.dockerParams.addStartup = additionalStartUp;
				if (execparam[0].indexOf('-c') > 0) //found a startup command
				{
					startupparam = execparam[0].split(' -c');
					if (startupparam.length > 0) {
						startupCommand = startupparam[1].trim();
						$scope.dockerParams.startupCommand = startupCommand;
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
						$scope.dockerParams.startupCommand = startupCommand;
						fullParams = startupparam[0];
					}
				}
			}
			var params = fullParams.split(' -');
			//for obtaining the data from the string and showing in the modal.
			angular.forEach(params, function(value, key) {
				var subparam = params[key].split(' ');
				if (subparam.length > 0) {
					/*Checking if the one of the known parameters are present in the 0th position*/
					/*When present, a value is assumed to be present as well in the 1st position*/
					if (subparam.indexOf('p') === 0) {
						$scope.dockerParams.port = subparam[1];
					} else if (subparam.indexOf('-link') === 0) {
						$scope.dockerParams.link = subparam[1];
					} else if (subparam.indexOf('-name') === 0 || subparam.indexOf('--name') === 0) {
						$scope.dockerParams.name = subparam[1];
					} else if (subparam.indexOf('v') === 0) {
						$scope.dockerParams.volumes = subparam[1];
					} else if (subparam.indexOf('-volumes-from') === 0) {
						$scope.dockerParams.volumesFrom = subparam[1];
					} else if (subparam.indexOf('e') === 0) {
						$scope.dockerParams.environment = subparam[1];
					}
				}
			});
			//helper method for coverting the object to a string and calling at the modal close.
			var helper = {
				dockerParamsString: function() {
					var dockerParameters = null;
					if ($scope.dockerParams.name) {
						dockerParameters = '-name ' + $scope.dockerParams.name;
					}
					if ($scope.dockerParams.port) {
						dockerParameters += ' -p ' + $scope.dockerParams.port;
					}
					if ($scope.dockerParams.volumes) {
						dockerParameters += ' -v ' + $scope.dockerParams.volumes;
					}
					if ($scope.dockerParams.volumesFrom) {
						dockerParameters += ' --volumes-from ' + $scope.dockerParams.volumesFrom;
					}
					if ($scope.dockerParams.link) {
						dockerParameters += ' --link ' + $scope.dockerParams.link;
					}
					if ($scope.dockerParams.environment) {
						dockerParameters += ' -e ' + $scope.dockerParams.environment;
					}
					if ($scope.dockerParams.startupCommand) {
						dockerParameters += ' -c ' + $scope.dockerParams.startupCommand;
					}
					if ($scope.dockerParams.addStartup) {
						dockerParameters += ' -exec ' + $scope.dockerParams.addStartup;
					}
					items = dockerParameters;
				}
			};

			$scope.ok = function() {
				helper.dockerParamsString();
				$modalInstance.close(items);
			};
		}
	]);
})(angular);