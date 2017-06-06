(function (angular) {
    "use strict";
    angular.module('dashboard.analytics')
        .controller('discoveryResourcesCtrl', ['$scope', '$rootScope', '$state','analyticsServices', 'genericServices','$timeout','toastr','$modal','confirmbox', function ($scope,$rootScope,$state,analyticsServices,genSevs,$timeout,toastr,$modal,confirmbox){
            var disResrc=this;
            $scope.gridApi=null;
            disResrc.filterValue='';
            $scope.colArray=[];
            $scope.selectInstanceRow=[];
            $scope.TagName={
                environment:[],
                bg:[],
                project:[] ,bgTag:'',
                environmentTag:'',
                projectTag:''
            };
            // get gat name  Start
            disResrc.getAllTagNames=function () {
                $scope.TagName={
                    environment:[],
                    bg:[],
                    project:[],
                    bgTag:'bg',
                    environmentTag:'env',
                    projectTag:'pro'
                };
                // environment
                var param = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/environment'
                };
                genSevs.promiseGet(param).then(function (instResult) {
                    $scope.TagName.environmentTag=instResult.tagName+'-en';
                    $scope.TagName.envFild='tags.'+instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.environment.push({id:val,name:val});
                    });
                });
                // Bu
                var paramProviders = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/businessGroup'
                };
                genSevs.promiseGet(paramProviders).then(function (instResult) {
                    $scope.TagName.bgTag=instResult.tagName+'-bu';
                    $scope.TagName.bgFild='tags.'+instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.bg.push({id:val,name:val});
                    });
                });
                // project
                var paramP = {
                    url: '/providers/' + fltrObj.provider.id + '/tag-mappings/project'
                };
                genSevs.promiseGet(paramP).then(function (instResult) {
                    $scope.TagName.projectTag=instResult.tagName+'-pr';
                    $scope.TagName.projFild='tags.'+instResult.tagName;
                    angular.forEach(instResult.tagValues,function(val){
                        $scope.TagName.project.push({id:val,name:val});
                    });

                });

                // get gat name  End##########
            };
            disResrc.init=function () {
                if(fltrObj && fltrObj.provider && fltrObj.provider.id) {
                    disResrc.getAllTagNames();
                    $scope.instLoader=true;
                    $timeout(function () {

                        disResrc.gridOptionInstances = {
                            allowCellFocus : false,
                            paginationPageSizes: [25, 50, 100],
                            paginationPageSize:25,
                            columnDefs: [],
                            onRegisterApi: function (gridApi) {
                                //gridApi.grid.registerRowsProcessor( $scope.singleFilter, 200 );
                                $scope.gridApi=gridApi;
                                $scope.selectInstanceRow = [];
                                gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDefa, newValue, oldValue) {
                                    if(newValue !== oldValue) {
                                        confirmbox.showModal({}, {
                                            closeButtonText: 'Cancel',
                                            actionButtonText: 'Yes',
                                            actionButtonStyle: 'cat-btn-update',
                                            headerText: 'Update tag value',
                                            bodyText: 'Are you sure you want to Update ?'
                                        }).then(function () {
                                            var tagna = colDefa.name.substring(0, colDefa.name.length - 3);
                                            var param = {
                                                url: '/resources/' +rowEntity._id + '/provider/' + fltrObj.provider.id + '/tags',
                                                data: {
                                                    tags: {}
                                                }
                                            };
                                            param.data.tags[tagna] = newValue;
                                            if (newValue !== oldValue) {
                                                genSevs.promisePatch(param).then(function () {
                                                    toastr.success('Successfully updated.', 'Update');
                                                });
                                            }
                                        }, function () {
                                            var param = {
                                                url: '/resources?filterBy=providerDetails.id:'+fltrObj.provider.id+',resourceType:EC2,category:'+$rootScope.organNewEnt.instanceType.toLowerCase()
                                            };
                                            genSevs.promiseGet(param).then(function (instResult) {
                                                disResrc.gridOptionInstances.data = instResult.data;
                                                disResrc.gridOptionInstances.isRowSelectable = function (row) {
                                                    if(row.entity.state !== 'running') {
                                                        return false;
                                                    } else {
                                                        return true;
                                                    }
                                                };
                                            });
                                        });
                                    }
                                });
                                gridApi.selection.on.rowSelectionChanged($scope,function(row){
                                    if(row.isSelected){
                                        $scope.selectInstanceRow.push(row.entity._id);
                                    } else {
                                        $scope.selectInstanceRow.splice(row.entity._id,1);
                                    }
                                });
                                gridApi.selection.on.rowSelectionChangedBatch($scope,function(rows){
                                    angular.forEach(rows,function(row){
                                        if(row.isSelected){
                                            $scope.selectInstanceRow.push(row.entity._id);
                                        } else {
                                            $scope.selectInstanceRow.splice(row.entity._id,1);
                                        }
                                    });
                                });
                            }
                        };
                        disResrc.gridOptionInstances.data = [];
                        var param = {
                            inlineLoader: true
                        };
                        if($rootScope.organNewEnt.instanceType === 'Managed') {
                            disResrc.gridOptionInstances.enableRowHeaderSelection= false;
                            $scope.colArray=['resourceDetails.platformId','resourceDetails.privateIp','resourceDetails.state'];
                            disResrc.gridOptionInstances.columnDefs=[
                                {name: 'InstanceId', field: 'resourceDetails.platformId',enableCellEditOnFocus: false, cellTooltip: true,
                                    enableCellEdit: false,enableFiltering: true},
                                {name: 'os', enableFiltering: true,displayName: 'os', field:'resourceDetails.hardware.os',enableCellEdit: false,enableCellEditOnFocus: false},
                                {name: 'privateIp',field: 'resourceDetails.privateIp',enableFiltering: true, displayName: 'IP Address',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {name: 'state',field: 'resourceDetails.state',enableFiltering: true, displayName: 'State',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'Region',enableFiltering: true,
                                    displayName: 'Region',
                                    field: 'providerDetails.region.region',
                                    cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {name: 'orgName', enableFiltering: true,displayName: 'Org Name', field: 'masterDetails.orgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'bgName',
                                    displayName: 'BG Name',enableFiltering: true,
                                    field: 'masterDetails.bgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {
                                    name: 'projectName',enableFiltering: true,
                                    displayName: 'Project Name',
                                    field: 'masterDetails.projectName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {
                                    name: 'envName',enableFiltering: true,
                                    displayName: 'Env Name',
                                    field: 'masterDetails.envName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                }
                            ];
                            param.url = '/resources?filterBy=providerDetails.id:'+fltrObj.provider.id+',resourceType:EC2,category:'+$rootScope.organNewEnt.instanceType.toLowerCase();
                        } else if($rootScope.organNewEnt.instanceType === 'Assigned'){

                            $scope.colArray=['resourceDetails.platformId','resourceDetails.privateIp','resourceDetails.os','resourceDetails.state'];

                            disResrc.gridOptionInstances.columnDefs=[
                                {name: 'InstanceId', field: 'resourceDetails.platformId',enableCellEditOnFocus: false, cellTooltip: true,
                                    enableCellEdit: false,enableFiltering: true},
                                {name: 'os', enableFiltering: true,displayName: 'OS',field: 'resourceDetails.os', enableCellEdit: false, type: 'number',enableCellEditOnFocus: false},
                                {name: 'privateIp',field: 'resourceDetails.privateIp',enableFiltering: true, displayName: 'IP Address',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {name: 'state',enableFiltering: true, field: 'resourceDetails.state',displayName: 'State',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'Region',enableFiltering: true,
                                    displayName: 'Region',
                                    field: 'providerDetails.region.region',
                                    cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {name: 'orgName', enableFiltering: true,displayName: 'Org Name', field: 'masterDetails.orgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'bgName',
                                    displayName: 'BG Name',enableFiltering: true,
                                    field: 'masterDetails.bgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {
                                    name: 'projectName',enableFiltering: true,
                                    displayName: 'Project Name',
                                    field: 'masterDetails.projectName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {
                                    name: 'environmentName',enableFiltering: true,
                                    displayName: 'Env Name',
                                    field: 'masterDetails.envName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                }
                            ];
                            param.url = '/resources?filterBy=providerDetails.id:'+fltrObj.provider.id+',resourceType:EC2,category:'+$rootScope.organNewEnt.instanceType.toLowerCase();
                        } else if($rootScope.organNewEnt.instanceType === 'Unassigned'){
                            disResrc.gridOptionInstances.enableRowHeaderSelection= false;
                            $scope.colArray=['resourceDetails.platformId','resourceDetails.privateIp','resourceDetails.os','resourceDetails.state'];
                            disResrc.gridOptionInstances.columnDefs= [
                                {name: 'InstanceId', field: 'resourceDetails.platformId',enableCellEditOnFocus: false, cellTooltip: true,
                                    enableCellEdit: false},
                                {name: 'os', field: 'resourceDetails.os', displayName: 'OS', enableCellEdit: false, type: 'number',enableCellEditOnFocus: false},
                                {name: 'privateIp',field: 'resourceDetails.privateIp', displayName: 'IP Address',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {name: 'state',field: 'resourceDetails.state', displayName: 'State',enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: 'Region',
                                    displayName: 'Region',
                                    field: 'providerDetails.region.region',
                                    cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false
                                },
                                {name: 'orgName', displayName: 'Org Name', field: 'masterDetails.orgName', cellTooltip: true,enableCellEditOnFocus: false,
                                    enableCellEdit: false},
                                {
                                    name: $scope.TagName.bgTag,
                                    field:$scope.TagName.bgFild,
                                    displayName: 'BG Tag Value',
                                    width: 200,
                                    cellClass: 'editCell',
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.bg,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                },
                                {
                                    name: $scope.TagName.projectTag,
                                    field:$scope.TagName.projFild,
                                    displayName: 'Project Tag Value',
                                    cellClass: 'editCell',
                                    width: 200,
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.project,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                },
                                {
                                    name: $scope.TagName.environmentTag,
                                    field:$scope.TagName.envFild,
                                    displayName: 'Env Tag Value',
                                    cellClass: 'editCell',
                                    width: 200,
                                    enableCellEditOnFocus: true,
                                    enableCellEdit: true,
                                    editableCellTemplate: 'ui-grid/dropdownEditor',
                                    editDropdownOptionsArray: $scope.TagName.environment,
                                    editDropdownIdLabel: 'name',
                                    editDropdownValueLabel: 'id'
                                }
                            ];
                            param.url = '/resources?filterBy=providerDetails.id:'+fltrObj.provider.id+',resourceType:EC2,category:'+$rootScope.organNewEnt.instanceType.toLowerCase();
                        }
                            genSevs.promiseGet(param).then(function (instResult) {
                                disResrc.gridOptionInstances.data = instResult.data;
                                disResrc.gridOptionInstances.isRowSelectable = function(row){
                                    if(row.entity.state !== 'running'){
                                        return false;
                                    } else {
                                        return true;
                                    }
                                };
                            });
                        $scope.instLoader=false;
                    }, 1000);
                }
            };
            disResrc.importInstance =function () {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/analytics/view/instanceManage.html',
                    controller: 'instanceManageCtrl as insMang',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return  $scope.selectInstanceRow;
                        }
                    }
                });
                modalInstance.result.then(function() {

                }, function() {

                });
            };
            $rootScope.stateItems = $state.params;
            $rootScope.organNewEnt.provider='0';
            $rootScope.organNewEnt.instanceType='Unassigned';
            analyticsServices.applyFilter(true,null);
            var treeNames = ['Cloud Management','Discovery','Resources'];
            $rootScope.$emit('treeNameUpdate', treeNames);
            var fltrObj=$rootScope.filterNewEnt;
            $rootScope.applyFilter =function(){
                analyticsServices.applyFilter(true,null);
                disResrc.init();
            };
            $scope.filterInst = function() {
                $scope.gridApi.grid.refresh();
            };
            $scope.singleFilter = function( renderableRows ){
                var matcher = new RegExp(disResrc.filterValue);
                renderableRows.forEach( function( row ) {
                    var match = false;
                    angular.forEach($scope.colArray,function( field ){
                        if( row.entity[field] && row.entity[field].match(matcher) ){
                            match = true;
                        }
                    });
                    if ( !match ){
                        row.visible = false;
                    }
                });
                return renderableRows;
            };
            disResrc.init();
            
        }]).controller('instanceManageCtrl',['$scope','$rootScope','items','$modalInstance','genericServices','$modal','toastr',function ($scope,$rootScope,items,$modalInstance,genericServices,$modal,toastr) {
        $scope.items=items;
        var fltrObj=$rootScope.filterNewEnt;
        var reqBody = {};
        $scope.monitorList = [];
        $scope.monitorId = 'null';
        
        $scope.IMGNewEnt={
            passType:'password',
            org:$rootScope.organObject[0]
        };
        //get configmanagement
        var params={
            url:'/d4dMasters/organization/'+$scope.IMGNewEnt.org.orgid+'/configmanagement/list'
        };
        genericServices.promiseGet(params).then(function (list) {
            $scope.configOptions=list;
        });

        //get monitors
        var monitorParam={
            url:'/monitors?filterBy=orgId:' + $scope.IMGNewEnt.org.orgid
        };
        genericServices.promiseGet(monitorParam).then(function (list) {
            $scope.monitorList = list;
        });

        $scope.pemFileSelection = function($event) {
            if (FileReader) {
                var fileContent = new FileReader();
                fileContent.onload = function(e) {
                    $scope.addPemText(e.target.result);
                };
                fileContent.onerror = function(e) {
                    toastr.error(e);
                };
                fileContent.readAsText($event);
            } else {
                toastr.error('HTMl5 File Reader is not Supported. Please upgrade your browser');
            }
        };
        $scope.ok = function() {
            if($scope.monitorId === 'null') {
                $scope.monitorId = null;
            }
            $scope.importSpinner = true;
            $scope.importSync = true;
            reqBody.orgId = $scope.IMGNewEnt.org.orgid;
            reqBody.bgId = $scope.IMGNewEnt.buss.rowid;
            reqBody.projectId = $scope.IMGNewEnt.proj.rowId;
            reqBody.envId = $scope.IMGNewEnt.env.rowid;
            reqBody.orgName = $scope.IMGNewEnt.org.name; 
            reqBody.bgName = $scope.IMGNewEnt.buss.name;
            reqBody.projectName = $scope.IMGNewEnt.proj.name;
            reqBody.environmentName = $scope.IMGNewEnt.env.name;
            reqBody.configManagmentId = $scope.IMGNewEnt.serverTypeInd;
            reqBody.monitorId = $scope.monitorId;

            reqBody.credentials = {};
            reqBody.credentials.username = $scope.IMGNewEnt.userName;
            reqBody.instanceIds = [];
            reqBody.instanceIds = $scope.items;
            
            $scope.postMethodImportByIp = function(){
                var params = {
                    inlineLoader: true,
                    url:'/providers/' + fltrObj.provider.id + '/sync',
                    data:reqBody
                };
                genericServices.promisePost(params).then(function (response) {
                    
                    if(response.taskId){
                        $modalInstance.dismiss(response.taskId);
                        $scope.importSpinner = false;
                        $scope.importSync = false;
                        $modal.open({
                            animation: true,
                            templateUrl: 'src/partials/sections/dashboard/analytics/view/discoverySyncResult.html',
                            controller: 'discoverySyncResultCtrl',
                            backdrop: 'static',
                            keyboard: false,
                            resolve: {
                                items: function() {
                                    return {
                                        taskId:response.taskId,
                                        nodeIds:reqBody.instanceIds
                                    };
                                }
                            }
                        }).result.then(function() {
                        }, function() {
                            console.log("Dismiss at " + new Date());
                        });
                    }
                },function(response){
                    $scope.isStartStopInstanceLoading = false;
                    if(response.data.message){
                        $scope.authMsg = response.data.message;
                    }else{
                        $scope.authMsg = response.data;
                    }
                });
            };
            if ($scope.IMGNewEnt.passType === "password") {
                reqBody.credentials.password = $scope.IMGNewEnt.password;
                $scope.postMethodImportByIp();  
            } else {
                $scope.pemFileSelection($scope.pemfile);
            }
            $scope.addPemText = function(pemfileText){
                reqBody.credentials.pemFileData = pemfileText;
                $scope.postMethodImportByIp();
            };
        };
        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };
    }]);
})(angular);
