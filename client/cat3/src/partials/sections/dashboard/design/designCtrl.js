(function (angular) {
	"use strict";
	angular.module('dashboard.design', ['design.bpCreate'])//'services.blueprint'
	.controller('designCtrl',['$scope','$rootScope','$http','$q','toastr','$state','designServices', function ($scope,$rootScope,$http,$q,toastr,$state,designServices) {
		var design= {};
		$rootScope.dashboardChild='design';
		$rootScope.$emit('HEADER_NAV_CHANGE', 'DESIGN');
		$scope.showProviders = true;
			design.providersList= function () {
				var params = {
					url: 'src/partials/sections/dashboard/design/data/providers.json'
				};
				designServices.promiseGet(params).then(function (data){
					$rootScope.providersMenu=data;
					design.tempType(data);
					// $state.go('dashboard.designSubView',{subItem:data[0].name,view:'list'});
				});

			};
			design.tempType=function (providers) {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/16'
				};
				designServices.promiseGet(params).then(function (template){
					template.push({
						_id: "54bde11187f86fa0130asasc7563",
						templatetypename: "Composite",
						designtemplateicon_filename: "Docker.png",
						rowid: "b02de7dd-6101-4f0e-a95e-68d74cec86c0",
						id: "16",
						__v: 0,
						active: true,
						templatetype: "composite",
						orgname_rowid: ["46d1da9a-d927-41dc-8e9e-7e926d927537"],
						orgname: ["Phoenix"]
					});
					$rootScope.templateTypes=template;
					$state.go('dashboard.designSubView',{subItem:providers[0].name,view:'list',templateId:template[0]._id,templateName:template[0].templatetypename});
					
				});

			};
		design.providersList();
		return design;
	}]).controller('designSubItemCtrl',['$rootScope','$scope','$state', function ($rootScope,$scope,$state) {
			$rootScope.stateItems=$state;
			$scope.isOpenSidebar = false;
			$scope.myArray=[1,2,3,4,5,6,7,8,9];
			$scope.editBlue =function(){
				$rootScope.stateItems.current.params.blueId='11';
				$state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'edit'});
			};
		}]);
})(angular);