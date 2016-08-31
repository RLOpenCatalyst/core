(function(){
	"use strict";
	angular.module('workzone.instance')
		.controller('deleteInstanceCtrl', ['$scope', '$modalInstance', 'items', 'workzoneServices','toastr', function($scope, $modalInstance, items, workzoneServices,toastr) {
			angular.extend($scope, {
				isChefChecked: true,
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
							toastr.success('Successfully deleted');
							$modalInstance.close(items);
						} else {
							toastr.error('Unexpected Behaviour');
						}
					}, function(error) {
						error = error.data || error;
						if (error.message) {
							toastr.error(error.message);
						} else {
							toastr.error('Unexpected Behaviour');
						}
					});
				}
			});
		}
	]);
})();
