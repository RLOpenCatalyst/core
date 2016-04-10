/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
	.controller('chefPuppetCompositeLogsCtrl',["items",'$scope','$modalInstance','workzoneServices' ,function(items,$scope,$modalInstance,workzoneServices){
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			}
		});

		workzoneServices.getChefPuppetCompositeLogs().then(function() { //_instance._id,_actionItem._id
			
		});
	}]);
})();
