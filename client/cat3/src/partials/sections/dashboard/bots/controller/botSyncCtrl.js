/* Copyright (C) Relevance Lab Private Limited- All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Relevance UI Team,
 * Mar 2017
 */

(function (angular) {
    "use strict";
    angular.module('dashboard.bots')
    .controller('botSyncCtrl',['$scope', '$rootScope', '$state', '$timeout', 'genericServices', 'botsCreateService', 'uiGridOptionsService', 'toastr','$modal',
        function($scope, $rootScope, $state, $timeout, genericServices, botsCreateService, uiGridOptionsService, toastr,$modal){
            var treeNames = ['BOTs','BOTs Sync'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var botLibraryUIGridDefaults = uiGridOptionsService.options();
	        $scope.paginationParams = botLibraryUIGridDefaults.pagination;
	        $scope.paginationParams=[];
	        $scope.numofCardPages = 0;
	        $scope.paginationParams.page = 1;
	        $scope.paginationParams.pageSize = 24;
	        $scope.paginationParams.sortBy = 'lastRunTime';
	        $scope.paginationParams.sortOrder = 'desc';
            $scope.initGrids = function(){
	            $scope.botLibGridOptions={};
	            $scope.botLibGridOptions.columnDefs= [
	                { name:'BOT Name', field:'category' ,cellTemplate:'<img src="images/bots/activeDirectory.png" ng-show="row.entity.category==\'Active Directory\'" alt="row.entity.category" title="Active Directory" class="task-type-img" />'+
	                    '<img src="images/bots/userManagement.png" ng-show="row.entity.category==\'User Management\'" alt="row.entity.category" title="User Management" class="task-type-img" />'+
	                    '<img src="images/bots/applicationDeployment.png" ng-show="row.entity.category==\'Application Deployment\' || row.entity.category==\'Application Management\'" alt="row.entity.category" title="Application Deployment" class="task-type-img" />'+
	                    '<img src="images/bots/installation.png" ng-show="row.entity.category==\'Installation\'" alt="row.entity.category" title="Installation" class="task-type-img" />'+
	                    '<img src="images/bots/monitoring.png" ng-show="row.entity.category==\'Monitoring\'" alt="row.entity.category" title="Monitoring" class="task-type-img" />'+
	                    '<img src="images/bots/openDJ.png" ng-show="row.entity.category==\'OpenDJ LDAP\'" alt="row.entity.category" title="OpenDJ-LDAP" class="task-type-img" />'+
	                    '<img src="images/bots/serviceManagement.png" ng-show="row.entity.category==\'Service Management\'" alt="row.entity.category" title="Service Management" class="task-type-img" />'+
	                    '<img src="images/bots/upgrade.png" ng-show="row.entity.category==\'Upgrade\'" alt="row.entity.category" title="Upgrade" class="task-type-img" />',cellTooltip: true},
	                { name: 'BOT ID',displayName: 'Name',field:'name',cellTooltip: true},
	                { name: 'Type',displayName: 'Type',field:'id',cellTooltip: true},
	                { name: 'Description',field:'desc',cellTooltip: true},
	             //   { name: 'BOT Created From',displayName: 'BOT Created From',field:'botLinkedCategory',cellTooltip: true},
	                { name: 'Category',field:'orgName',cellTooltip: true},
	                { name: 'Last Run',field:'lastRunTime ',cellTemplate:'<span title="{{row.entity.lastRunTime  | timestampToLocaleTime}}">{{row.entity.lastRunTime  | timestampToLocaleTime}}</span>', cellTooltip: true},
	                { name: 'Saved Time',field:'savedTime', cellTemplate:'<span title="{{row.entity.savedTime.hours ? row.entity.savedTime.hours : 0}}h {{row.entity.savedTime.minutes ? row.entity.savedTime.minutes : 0}}m">{{row.entity.savedTime.hours ? row.entity.savedTime.hours : 0}}h {{row.entity.savedTime.minutes ? row.entity.savedTime.minutes : 0}}m</span>', cellTooltip: true},
	                { name: 'Total Runs',field:'executionCount'},
	                   { name: 'BOT Action',width:100,displayName: 'Action',cellTemplate:'<a title="Execute"><i class="fa fa-play font-size-16 cursor" ui-sref="dashboard.bots.botsDescription({botDetail:row.entity,listType:1})" ></i></a>'
	                }
	            ];
	            $scope.botLibGridOptions.data=[];
	            angular.extend($scope.botLibGridOptions,botLibraryUIGridDefaults.gridOption);
	        };
        	$scope.initGrids();
        }
    ]);
})(angular);