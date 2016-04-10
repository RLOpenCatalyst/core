/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('orchestrationHistoryCtrl',["items",'$scope','$modalInstance','workzoneServices','$modal',
			function(items,$scope,$modalInstance,workzoneServices,$modal){
				$scope.task=items;
				workzoneServices.getHistory(items._id).then(function(response) {
					var data;
					if(response.data){
						data=response.data;
					}else if(response){
						data=response;
					}
					$scope.history=data;
				});

				$scope.historyLogs=function(hist) {
					var modalInstance = $modal.open({
						animation: true,
						templateUrl: 'src/partials/sections/dashboard/workzone/orchestration/popups/orchestrationLog.html',
						controller: 'orchestrationLogCtrl as orchLogCtrl',
						backdrop : 'static',
						keyboard: false,
						resolve: {
							items: function() {
								return {
									taskId : hist.taskId,
									historyId : hist._id,
									taskType:hist.taskType
								}
							}
						}
					});
					modalInstance.result.then(function(selectedItem) {
						$scope.selected = selectedItem;
					}, function() {
						console.log('Modal Dismissed at ' + new Date());
					});
				};
				$scope.cancel= function() {
					$modalInstance.dismiss('cancel');
				};
			}
		]
	);
})();
