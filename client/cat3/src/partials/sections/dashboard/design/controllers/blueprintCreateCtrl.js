(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintCreateCtrl',['$scope','$rootScope','$http','$q','toastr','$state','designServices', 'blueprintCreateService','confirmbox', function ($scope,$rootScope,$http,$q,toastr,$state,desServ,bpCreateSer,confirmbox) {
            var blueprintCreation = this;
            //to get the templates listing.
            $scope.bpType = $state.params.templateName;
            $scope.logo = 'images/global/cat-logo.png';
            $scope.osImageLogo = 'images/global/linux.png';
            $scope.isOSImage = false;
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

            $scope.blueprintTemplateClick = function(templateDetail) {
                templateDetail.selected = true;
                $scope.nextEnabled = true;
                blueprintCreation.getOperatingSytems();
                blueprintCreation.getAWSProviders();
                blueprintCreation.getOrgBUProjDetails();
                $scope.templateSelected = templateDetail;
                console.log($scope.templateSelected);
                if($scope.bpType == 'CloudFormation'){
                    blueprintCreation.getCFTParams();
                }   
            };

            blueprintCreation.getImages = function(){
                bpCreateSer.getImages().then(function(data){
                    $scope.imageList = data;
                });
            };

            if($scope.bpType == 'OSImage'){
                blueprintCreation.getImages();
            } else {
                blueprintCreation.templateListing();
            }

            blueprintCreation.getOperatingSytems = function(){
                $scope.isOSLoading = true;
                bpCreateSer.getOperatingSytems().then(function(data){
                    blueprintCreation.osListing = data;
                    if($scope.bpType == 'OSImage'){
                        blueprintCreation.newEnt.osListing = $scope.templateSelected.osType;
                        $scope.isOSImage = true;
                    }
                    $scope.isOSLoading = false;
                });
            };

            blueprintCreation.getAWSProviders = function(){
                bpCreateSer.getAWSProviders().then(function(data){
                    blueprintCreation.providerListing = data;
                    if($scope.bpType == 'OSImage'){
                        blueprintCreation.newEnt.providers = $scope.templateSelected.providerId;
                        $scope.isOSImage = true;
                        blueprintCreation.getAWSProviderImage();
                    }
                });
            };

            blueprintCreation.getAWSProviderImage = function(){
                $scope.isImageLoading = true;
                $scope.isRegionKeyPairLoading = true;
                bpCreateSer.getImageLists(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        blueprintCreation.imageListing = data;
                        if($scope.bpType == 'OSImage'){
                            blueprintCreation.newEnt.images = $scope.templateSelected._id;
                            $scope.isOSImage = true;
                            blueprintCreation.getInstanceType();
                        }
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
                var imageDetails = blueprintCreation.imageListing;
                for(var i= 0; i<imageDetails.length;i++){
                    if(blueprintCreation.newEnt.images == imageDetails[i]._id){
                        $scope.imageIdentifier = imageDetails[i].imageIdentifier; 
                    }
                }
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
                blueprintCreation.getChefServer();
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

            blueprintCreation.getChefServer = function() {
                bpCreateSer.getChefServer().then(function(data){
                    for(var i =0;i<data.length;i++){
                        if(blueprintCreation.newEnt.orgList == data[i].orgname_rowid[0]){
                            $scope.getChefServerId = data[i].rowid;
                        }
                    }
                });
            }; 

            

            blueprintCreation.getCFTParams = function() {
                var cftTemplate = $scope.templateSelected;
                console.log(cftTemplate);
                cftTemplate = $scope.templateSelected.rowid + "__template__" + $scope.templateSelected.template_filename;
                console.log(cftTemplate);
                bpCreateSer.getCFTParams(cftTemplate).then(function(data){
                    $scope.getCFTDetails = data;
                    console.log($scope.getCFTDetails);
                });
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
            if($scope.bpType == "Docker" || $scope.bpType == "CloudFormation"){
                $scope.isOrgOpen = true;    
            } else {
                $scope.isOrgOpen = false;    
            }
            
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
                    $scope.isOrgOpen = true;
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

            $scope.submit = function() {
                var blueprintCreateJSON = {
                    templateComponents: 'component0',
                    dockercontainerpathstitle: '',
                    dockerlaunchparameters: '',
                    dockerreponame: '',
                    dockercompose : [],
                    chefServerId:$scope.getChefServerId,
                    instanceType:blueprintCreation.newEnt.instanceType,
                    instanceOS:blueprintCreation.newEnt.osListing,
                    instanceCount:blueprintCreation.newEnt.instanceCount,
                    instanceAmiid:$scope.imageIdentifier,
                    instanceUsername:'root',
                    dockerimagename:'',
                    orgId:blueprintCreation.newEnt.orgList,
                    bgId:blueprintCreation.newEnt.bgList,
                    projectId:blueprintCreation.newEnt.projectList,
                    keyPairId:blueprintCreation.newEnt.keyPair,
                    vpcId:blueprintCreation.newEnt.vpcId,
                    subnetId:blueprintCreation.newEnt.subnetId,
                    imageId:blueprintCreation.newEnt.images,
                    providerId:blueprintCreation.newEnt.providers,
                    region:blueprintCreation.newEnt.region,
                    name:blueprintCreation.newEnt.blueprintName,
                    blueprintType:'instance_launch',
                    appUrls:[]
                }

                if($scope.bpType == 'OSImage'){
                    blueprintCreateJSON.templateId = $scope.templateSelected.name;
                    blueprintCreateJSON.templateType = $scope.bpType;
                } else {
                    blueprintCreateJSON.templateId = $scope.templateSelected.templatename;
                    blueprintCreateJSON.templateType = $scope.templateSelected.templatetypename;
                }
                blueprintCreateJSON.runlist = [];
                if($scope.templateSelected.templatescookbooks){
                    blueprintCreateJSON.runlist = $scope.templateSelected.templatescookbooks.split(',');    
                }

                blueprintCreateJSON.securityGroupIds = [];
                for(var i =0;i<blueprintCreation.securityGroupListing.length;i++){
                    if(blueprintCreation.securityGroupListing[i]._isChecked){
                        blueprintCreateJSON.securityGroupIds.push(blueprintCreation.securityGroupListing[i].GroupId);
                    }
                }
                var reqBody = {
                    blueprintData: blueprintCreateJSON
                };
                var modalOptions = {
                    closeButtonText: 'Cancel',
                    actionButtonText: 'Submit',
                    actionButtonStyle: 'bp-btn-create',
                    headerText: 'Confirm Blueprint Creation',
                    bodyText: 'Are you sure want to submit this Blueprint Data? Press Ok to Continue'
                };
                confirmbox.showModal({}, modalOptions).then(function() {
                    bpCreateSer.postBlueprintSave(blueprintCreateJSON.orgId,blueprintCreateJSON.bgId,blueprintCreateJSON.projectId,reqBody).then(function(){
                        if($scope.bpType == 'OSImage'){
                            toastr.success('OSImage Blueprint Created Successfully');
                        } else {
                            toastr.success('Software Blueprint Created Successfully');
                        }
                    }, function(data) {
                        toastr.error('error:: ' + data.toString());
                    });
                });
            };
    }]);
})(angular);