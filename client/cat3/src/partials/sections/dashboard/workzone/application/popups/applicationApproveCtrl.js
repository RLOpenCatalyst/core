/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2016
 */

(function(angular){
"use strict";
angular.module('workzone.application')
	.controller('applicationApproveCtrl', ['items','$scope', '$modalInstance','workzoneServices', function(items,$scope, $modalInstance,wzService) {
		angular.extend($scope, {
			cancel: function() {
				$modalInstance.dismiss('cancel');
			},
			init:function(){
				var version =(items.appName.version)?items.appName.version:items.version;
				wzService.getApprove(items,version).then(function(result){
					$scope.approveAppCommt=result.data.comments;
				});
			},
			items:items,
			approveAppCommt:'',
			resultMsg:'',
			submitAppApprove :function(flg){
				var requestObject={
					projectId: items.params.proj,
					envName: items.envName,
					appName:items.appName.name,
					comments:$scope.approveAppCommt,
					version:(items.appName.version)?(items.appName.version):items.version,
					isApproved:flg
				};
				wzService.postAppApprove(requestObject).success(function(){
					$scope.msgText='approved';
					$scope.resultMsg='success';
					items.isApproved=flg;
					$modalInstance.close(items);
				}).error(function(data) {
					$scope.msgText=data.message;
					$scope.resultMsg='error';
				});
			}
		});
		$scope.init();
	}]);
})(angular);