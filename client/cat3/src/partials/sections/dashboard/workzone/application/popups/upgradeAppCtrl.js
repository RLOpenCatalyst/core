/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * May 2016
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('upgradeAppCtrl', ['items','$scope', '$modalInstance','workzoneServices', function(items,$scope, $modalInstance,wzService) {
		var upgrdApp={
			newEnt:[]
		};
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			init :function(){
				wzService.getAppUpgrade(items).then(function (FrzData){
					var FrzData=FrzData.data;
					upgrdApp.newEnt.serverType=
					upgrdApp.newEnt.repository =FrzData.repository;
					upgrdApp.newEnt.artifact =FrzData.artifactId;
					upgrdApp.newEnt.groupId=FrzData.groupId;
					upgrdApp.newEnt.version =FrzData.version;
					upgrdApp.newEnt.ContNameId=FrzData.containerName;
					upgrdApp.newEnt.contPort= FrzData.containerPort;
					upgrdApp.newEnt.tag=FrzData.imageTag;
				});
			}
		});
		return upgrdApp;
		$scope.init();
	}]);
})();