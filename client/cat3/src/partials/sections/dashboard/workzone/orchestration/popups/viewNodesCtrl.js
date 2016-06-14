/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('viewNodesCtrl', ['$scope', 'items', '$modalInstance', 'workzoneServices', function($scope, items, $modalInstance, workzoneServices) {
			$scope.isViewNodesLoading = true;
			var historyItem = items.taskConfig;
			$scope.taskInstanceList = [];
			var requestObj = {
				"instanceIds": historyItem.nodeIds
			};
			workzoneServices.postRetrieveDetailsForInstanceNames(requestObj).then(function(response) {
				var _allInstances = response.data;
				var _taskInstanceList = [];
				//This API is now returning all instances & not the list of instances which are requested in input. 
				for(var i=0;i<historyItem.nodeIds.length;i++){
					for (var j = 0; j < _allInstances.length; j++) {
						if (historyItem.nodeIds[i] === _allInstances[j]._id){
							_taskInstanceList.push(_allInstances[j]);
						}
					}
				}
				$scope.isViewNodesLoading = false;
				$scope.taskInstanceList = _taskInstanceList;
			}, function(error) {
				console.log(error);
				$scope.isViewNodesLoading = false;
			});
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		}
	]);
})();