/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
"use strict";
angular.module('workzone.blueprint')
	.controller('blueprintMoreInfoCtrl', ['$scope', '$modalInstance', 'items', function($scope, $modalInstance, items) {
		var blueprintName;
		switch (items.templateType) {
			case "chef":
				blueprintName = 'Software Stack';
				break;
			case "ami":
				blueprintName = 'OSImage';
				break;
			case "cft":
				blueprintName = 'cloudFormation';
				break;
			case "docker":
				blueprintName = 'Docker';
				break;
			case "arm":
				blueprintName = 'Azure ARM';
			break;
		}

		angular.extend($scope, {
			blueprintType: blueprintName,
			blueprintInfo: items,
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});
	}]);
})();