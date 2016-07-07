(function(){
	"use strict";
	angular.module('workzone.instance')
		.controller('deleteInstanceCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices', function($scope, $modalInstance, items, workzoneServices) {
			angular.extend($scope, {
				isChefChecked: false,
				instance: items,
				serverType: (items.puppet ? "puppet" : "chef"),
				cancel: function() {
					$modalInstance.dismiss('cancel');
				},
				ok: function() {
					var urlParams = items._id;
					if ($scope.isChefChecked) {
						urlParams = urlParams + '?chefRemove=true';
					}
					workzoneServices.deleteInstance(urlParams).then(function(response) {
						if (response.data==="OK") {
							$modalInstance.close(items);
						} else {
							alert('Unexpected Behaviour');
						}
					}, function(error) {
						error = error.data || error;
						if (error.message) {
							alert(error.message);
						} else {
							alert('Unexpected Behaviour');
						}
					});
				}
			});
		}
	]);
})();