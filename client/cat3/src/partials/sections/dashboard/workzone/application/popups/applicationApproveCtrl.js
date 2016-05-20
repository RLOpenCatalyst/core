/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2016
 */

(function(){
"use strict";
angular.module('workzone.application')
	.controller('applicationApproveCtrl', ['items','$scope', '$modalInstance','workzoneServices', function(items,$scope, $modalInstance,wzService) {

		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			items:items,
			approveAppCommt:'',
			resultMsg:'',
			submitAppApprove :function(){
				var requestObject={
					projectId: items.params.proj,
					envName: items.envName,
					appName:items.appName.name,
					version:items.appName.version,
					comments:$scope.approveAppCommt,
					isApproved:true
				};
				wzService.postAppApprove(requestObject).success(function(Saveresult){
					$scope.msgText='approved';
					$scope.resultMsg='success';
					items.isApproved=true;
					$modalInstance.close(items);
				}).error(function(data) {
					$scope.msgText=data.message;
					$scope.resultMsg='error';
				});
			},
			submitAppRevoke :function(){
				var requestObject={
					projectId: items.params.proj,
					envName: items.envName,
					appName:items.appName.name,
					version:items.appName.version,
					comments:$scope.approveAppCommt,
					isApproved:false
				};
				wzService.postAppApprove(requestObject).success(function(Saveresult){
					$scope.msgText='revoked';
					$scope.resultMsg='success';
					items.isApproved=false;
					$modalInstance.close(items);
				}).error(function(data, status, headers, config) {
					$scope.msgText=data.message;
					$scope.resultMsg='error';
				});
			}
		});
	}]);
})();