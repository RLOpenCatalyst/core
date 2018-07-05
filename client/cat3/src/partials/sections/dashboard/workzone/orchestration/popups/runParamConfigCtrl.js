/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Aug 2015
 */

(function(){
	"use strict";
	angular.module('workzone.orchestration')
		.controller('runParamConfigCtrl',['$scope','items','$modalInstance',function($scope,items,$modalInstance){
			function selectValue(name,value){
				var list=$scope.jenkinsParams;
				for(var i=0;i<list.length;i++){
					if(list[i].name===name){
						list[i].defaultValue=[value];
					}
				}
			}
			$scope.jenkinsParams=items;
			angular.extend($scope,{
				cancel:function(){
					$modalInstance.dismiss('cancel');
				},
				ok:function(){
					//sending selected items.
					angular.element('.choiceParam').each(function(){
						selectValue(this.name,this.value);
					});
				   $modalInstance.close($scope.jenkinsParams);
				}
			});
		}
	]);
})();