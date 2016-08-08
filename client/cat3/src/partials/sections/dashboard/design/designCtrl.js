(function (angular) {
	"use strict";

	angular.module('dashboard.design', ['design.bpCreate','design.BpList'])//'services.blueprint'
		.filter('inArray',['$filter', function($filter){
			return function(list, arrayFilter, element){
				if(arrayFilter){
					return $filter("filter")(list, function(listItem){
						return arrayFilter.indexOf(listItem[element]) === -1;
					});
				}
			};
		}])
	.controller('designCtrl',['$scope','$rootScope','$http','$q','toastr','$state','designServices','genericServices', function ($scope,$rootScope,$http,$q,toastr,$state,designServices,genericServices) {
		var design= {};
		$rootScope.dashboardChild='design';
		$rootScope.organNewEnt=[];
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
					var treeNames=['DESIGN', $state.params.subItem,template[0].templateName,'list'];
					$rootScope.$emit('treeNameUpdate', treeNames);
					$state.go('dashboard.designSubView',{subItem:providers[0].name,view:'list',templateObj:template[0]});

				});
				// get organigetion
				genericServices.getTreeNew().then(function (orgs) {
					$rootScope.organObject=orgs;
				});
			};
		design.providersList();
		return design;
	}]).controller('designSubItemCtrl',['$rootScope','$scope','$state', function ($rootScope,$scope,$state) {
			var subDes=this;
			$rootScope.stateItems=$state;
			$rootScope.isOpenSidebar = false;
			subDes.selectedCards=[];
			subDes.newEnt=[];
			if($state.params  && $state.params.subItem && $state.params.templateObj && $state.params.templateObj.templatetypename && $state.params.view){
				var treeNames=['DESIGN', $state.params.subItem,$state.params.templateObj.templatetypename,$state.params.view];
				$rootScope.$emit('treeNameUpdate', treeNames);
			}
			if($state.params.view === 'list'){
				$rootScope.stateItems.current.params.blueId = null;
			}
			$rootScope.organNewEnt=[];
			$rootScope.organNewEnt.org = '0';
			$rootScope.organNewEnt.buss='0';
			$rootScope.organNewEnt.proj='0';

			subDes.cancelEdit = function () {
				$rootScope.stateItems.current.params.blueId=null;
				$state.go('dashboard.designSubView',{subItem:$state.params.subItem,view:'list'});
			};
		}]);
})(angular);