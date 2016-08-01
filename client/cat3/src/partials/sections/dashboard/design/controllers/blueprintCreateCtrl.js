(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintCreateCtrl',['$scope','$rootScope','$http','$q','toastr','$state','designServices', 'blueprintCreateService', function ($scope,$rootScope,$http,$q,toastr,$state,desServ,bpCreateSer) {
            var blueprintCreation = this;
            //to get the templates listing.
            $scope.bpType = $state.params.templateName;
            $scope.logo = 'images/global/cat-logo.png';
            blueprintCreation.newEnt = [];
            blueprintCreation.osListing = [];
            blueprintCreation.providerListing = [];
            blueprintCreation.imageListing = [];
            blueprintCreation.regionListing = ''; 
            blueprintCreation.keyPairListing = '';
            blueprintCreation.vpcListing = [];
            blueprintCreation.subnetListing = [];
            blueprintCreation.securityGroupListing = [];
            blueprintCreation.orgBUProjListing = [];
            blueprintCreation.buProjListing = [];
            blueprintCreation.projListing = [];

            blueprintCreation.templateListing = function(){
                bpCreateSer.getTemplates().then(function(data){
                    $scope.templateList = data;    
                });
            };

            blueprintCreation.getOperatingSytems = function(){
                $scope.isOSLoading = true;
                bpCreateSer.getOperatingSytems().then(function(data){
                    blueprintCreation.osListing = data;
                    $scope.isOSLoading = false;
                });
            };

            blueprintCreation.getAWSProviders = function(){
                bpCreateSer.getAWSProviders().then(function(data){
                    blueprintCreation.providerListing = data;
                });
            };

            blueprintCreation.getAWSProviderImage = function(){
                $scope.isImageLoading = true;
                $scope.isRegionKeyPairLoading = true;
                bpCreateSer.getImageLists(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        blueprintCreation.imageListing = data;    
                        $scope.isImageLoading = false;
                        blueprintCreation.instanceCount = function(max, step) {
                            step = step || 1;
                            var input = [];
                            for (var i = 1; i <= max; i += step) {
                                input.push(i);
                            }
                            return input;
                        };
                    }
                });
                bpCreateSer.getAWSProviderWithId(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        blueprintCreation.regionListing = data.keyPairs[0].region;
                        blueprintCreation.keyPairListing = data.keyPairs[0].keyPairName;
                        $scope.isRegionKeyPairLoading = false;
                    }
                });
            };

            blueprintCreation.getInstanceType = function(){
                $scope.isInstanceTypeLoading = true;
                bpCreateSer.getInstanceType().then(function(data){
                    if(blueprintCreation.newEnt.images){
                        blueprintCreation.instanceType = data;    
                        $scope.isInstanceTypeLoading = false;
                    }
                });
            };

            blueprintCreation.postVpcs = function(){
                $scope.isVPCLoading = true;
                bpCreateSer.postVpcs(blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                    if(blueprintCreation.newEnt.region){
                        blueprintCreation.vpcListing = data.Vpcs;    
                        $scope.isVPCLoading = false;
                    }
                });
            };

            blueprintCreation.postSubnets = function() {
                $scope.isSubnetLoading = true;
                bpCreateSer.postSubnets(blueprintCreation.newEnt.vpcId,blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                    if(blueprintCreation.newEnt.vpcId){
                        blueprintCreation.subnetListing = data.Subnets;
                        $scope.isSubnetLoading = false;
                    }    
                });
            };

            blueprintCreation.postSecurityGroups = function() {
                $scope.isSecurityGroupLoading = true;
                bpCreateSer.postSecurityGroups(blueprintCreation.newEnt.vpcId,blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                    if(blueprintCreation.newEnt.vpcId){
                        blueprintCreation.securityGroupListing = data;
                        $scope.isSecurityGroupLoading = false;
                    }    
                });
            };

            blueprintCreation.getOrgBUProjDetails = function() {
                bpCreateSer.getOrgBuProj().then(function(data){
                    blueprintCreation.orgBUProjListing = data;
                });
            };

            blueprintCreation.getBG = function() {
                if(blueprintCreation.newEnt.orgList) {
                    var buProjDetails = blueprintCreation.orgBUProjListing;
                    blueprintCreation.bgListing = buProjDetails;
                }
            };

            blueprintCreation.getProject = function() {
                if(blueprintCreation.newEnt.orgList && blueprintCreation.newEnt.orgList) {
                    var buProjDetails = blueprintCreation.orgBUProjListing;
                    blueprintCreation.projListing = buProjDetails;
                }
            };

            blueprintCreation.enableAppDeploy = function() {
                if(blueprintCreation.newEnt.projectList) {
                    $scope.showRepoServerName = true;
                }
            };

            blueprintCreation.selectServer = function() {
                if(blueprintCreation.newEnt.nexusDockerServer) {
                    $scope.showRepoDetails = true;
                }
            };                        

            blueprintCreation.templateListing();
            blueprintCreation.getOperatingSytems();
            blueprintCreation.getAWSProviders();
            blueprintCreation.getOrgBUProjDetails();                        

            $scope.blueprintTemplateClick = function(templateDetail) {
                templateDetail.selected = true;
                $scope.nextEnabled = true;
                $scope.templateSelected = templateDetail;
            };
            //wizard data setting for step 1 and step 2.
            var index = 0, // points to the current step in the steps array
            steps = $scope.steps = [{
                'isDisplayed': true,
                'name': 'choose templates',
                'title': 'Choose Templates'
            }, {
                'isDisplayed': false,
                'name': 'Create Blueprint',
                'title': 'Create Blueprint'
            }];
            $scope.nextEnabled = false;
            $scope.previousEnabled = false;
            $scope.isNextVisible = true;
            $scope.isSubmitVisible = false;
            /*Open only One Accordian-Group at a time*/
            $scope.oneAtATime = true;
            /*Initialising First Accordian-group open on load*/
            $scope.isFirstOpen = true;

            $scope.next = function() {
                if (steps.length === 0) {
                    console.debug('No steps provided.');
                    return;
                }
                // If we're at the last step, then stay there.
                if (index === steps.length - 1) {
                    return;
                }
                steps[index++].isDisplayed = false;
                steps[index].isDisplayed = true;
                $scope.setButtons();
            };

            /* Moves to the previous step*/
            $scope.previous = function() {
                if (steps.length === 0) {
                    console.debug('No steps provided.');
                    return;
                }
                if (index === 0) {
                    console.debug('At first step');
                    return;
                }
                steps[index--].isDisplayed = false;
                steps[index].isDisplayed = true;
                $scope.setButtons();
            }; 

            /* Sets the correct buttons to be enabled or disabled.*/
            $scope.setButtons = function() {
                if (index === steps.length - 1) {
                    $scope.isFirstOpen = true;
                    $scope.isNextVisible = false;
                    $scope.previousEnabled = true;
                    $scope.isSubmitVisible = true;
                } else if (index === 0) {
                    $scope.isNextVisible = true;
                    $scope.isSubmitVisible = false;
                    $scope.showRepoServerName = false;
                    $scope.showRepoDetails = false;
                    //disabling the card selected state.
                    $scope.templateSelected.selected = false;
                    $scope.previousEnabled = false;
                    $scope.nextEnabled = false;
                } else {
                    $scope.nextEnabled = true;
                    $scope.previousEnabled = true;
                }
            };

            /*method added for allowing the user to move the 
            table row up  in dockerLaunchParams section*/
            $scope.moveUpChoice = function(arr, index) {
                var currItem = index;
                if (currItem > 0) {
                    arr.splice(currItem - 1, 0, arr.splice(currItem, 1)[0]);
                }
            };
            /*method added for allowing the user to move the
             table row down in dockerLaunchParams section*/
            $scope.moveDownChoice = function(arr, index) {
                var currItem = index;
                var newPosition = index + 1;
                if (currItem < arr.length) {
                    arr.splice(newPosition, 0, arr.splice(currItem, 1)[0]);
                }
            };

            $scope.submit = function() {
                var blueprintCreateJSON = {
                    templateId: $scope.templateSelected.templatename,
                    templateType: $scope.templateSelected.templateType,
                    templateComponents: 'component0',
                    dockercontainerpathstitle: '',
                    dockerlaunchparameters: '',
                    dockerreponame: '',
                    runlist:$scope.templateSelected.templatescookbooks.split(','),
                    dockercompose[0][dockercontainerpathstitle]:'',
                    dockercompose[0][dockercontainerpaths]:'',
                    dockercompose[0][dockerrepotags]:'',
                    dockercompose[0][dockerlaunchparameters]: '',
                    dockercompose[0][dockerreponame]:'',
                    chefServerId:
                    instanceType:t2.micro
                    instanceOS:linux
                    instanceCount:1
                    instanceAmiid:ami-06116566
                    instanceUsername:root
                    dockerimagename:'',
                    orgId:
                    bgId:
                    projectId:
                    keyPairId:
                    securityGroupIds[]:sg-99a3bcfb
                    vpcId:
                    subnetId:
                    imageId:5795f13862ff7b3b6f1e3ee6
                    providerId:
                    region:
                    name:
                }
                bpCreate.postBlueprintSave(orgId,bgId,projectId,blueprintCreateJSON).then(function(){

                });
            };

            /*//modal to show the Docker Parameters Popup
            $scope.launchParam = function(launchObj, idx) {
                var modalInstance = $modal.open({
                    animation: true,
                    templateUrl: 'src/partials/sections/dashboard/workzone/blueprint/popups/dockerParams.html',
                    controller: 'dockerParamsCtrl',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        items: function() {
                            return launchObj.dockerlaunchparameters;
                        }
                    }
                });
                modalInstance.result.then(function(paramStr) {
                    $scope.dockerDetails[idx].dockerlaunchparameters = paramStr;
                    //updating the dockerLaunchParameters for the particular index.
                }, function() {
                    console.log('Modal Dismissed at ' + new Date());
                });
            };*/
    }]);
})(angular);