(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintCreateCtrl',['$scope','$rootScope','$modal','toastr','$state', 'blueprintCreateService','responseFormatter','genericServices','confirmbox', function ($scope,$rootScope,$modal,toastr,$state,bpCreateSer,responseFormatter,genericServices,confirmbox) {
            var blueprintCreation = this;
            //$rootScope.state = $state;
            //to get the templates listing.
            if($state.params &&  $state.params.templateObj){
                $scope.providerType = $state.params.providerName.toUpperCase();
                $scope.bpTypeName = $state.params.templateObj.templatetypename;   
            }
            
            $scope.logo = 'images/global/cat-logo.png';
            $scope.osImageLogo = 'images/global/linux.png';
            $scope.osImageLogoWindows = 'images/osIcons/windows.png';
            $scope.isOSImage = false;
            $scope.isVMEvalsVisible = false;
            $scope.isVMVisible = false;
            $scope.imageList = [];
            $scope.foundVMResources = [];
            $scope.armVMTemplate = {};
            //on initial load.
            $scope.nextEnabled = false;
            $scope.previousEnabled = false;
            $scope.isNextVisible = true;
            $scope.isSubmitVisible = false;
            /*Open only One Accordian-Group at a time*/
            $scope.oneAtATime = true;
            /*Initialising First Accordian-group open on load*/
            $scope.isFirstOpen = true;
            if( $scope.bpTypeName === 'Composite'){
                $scope.isNextVisible = false;
                $scope.isSubmitComposite = true;
            }
            blueprintCreation.newEnt = [];
            blueprintCreation.osListing = [];
            blueprintCreation.providerListing = [];
            blueprintCreation.imageListing = [];
            blueprintCreation.regionListing = ''; 
            blueprintCreation.keyPairListing = [];
            blueprintCreation.vpcListing = [];
            blueprintCreation.subnetListing = [];
            blueprintCreation.securityGroupListing = [];
            blueprintCreation.instanceType = [];
            blueprintCreation.orgBUProjListing = [];
            blueprintCreation.buProjListing = [];
            blueprintCreation.projListing = [];
            blueprintCreation.appUrlList = [];
            blueprintCreation.getCFTDetails = [];
            blueprintCreation.providerListingAzure = [];
            blueprintCreation.regionListingAzure = []; 
            blueprintCreation.subnetListingAzure = [];
            blueprintCreation.dataStore = [];
            blueprintCreation.artifactsOptions = [];
            blueprintCreation.artifactsVersion = [];
            blueprintCreation.versionsOptions = [];
            blueprintCreation.newEnt.domainCheck = false;
            $scope.chefrunlist = [];
            $scope.cookbookAttributes = [];
            blueprintCreation.templateListing = function(){
                bpCreateSer.getTemplates().then(function(data){
                    $scope.templateList = data;
                    for(var i=0;i<$scope.templateList.length;i++){
                        if($scope.templateList[i].templatesicon_filePath){
                            $scope.templateList[i].templatesicon_filePath = '/d4dMasters/image/' + $scope.templateList[i].templatesicon_filePath;
                        }
                    }    
                });
            };

            $scope.blueprintTemplateClick = function(templateDetail) {
                templateDetail.selected = true;
                $scope.nextEnabled = true;
                $scope.templateSelected = templateDetail;
                if($scope.templateSelected.templatescookbooks !== '' && $scope.templateSelected.templatetypename === "SoftwareStack"){
                    var chefComponentSelector = $scope.templateSelected.templatescookbooks;
                    var chefRunlist = chefComponentSelector.split(',');
                    $scope.chefComponentSelectorList = responseFormatter.findDataForEditValue(chefRunlist);
                    $scope.chefrunlist = responseFormatter.chefRunlistFormatter($scope.chefComponentSelectorList);
                } 
                $scope.dockerDetails = [];
                //items gives the details of the selected blueprint.
                if($scope.templateSelected.templatetypename === 'Docker'){

                    var dockerParams = {
                        dockercontainerpathstitle : $scope.templateSelected.templatename,
                        dockercontainerpaths : $scope.templateSelected.dockercontainerpaths,
                        dockerrepotags : '',
                        dockerlaunchparameters : '',
                        dockerreponame : $scope.templateSelected.dockerreponame
                    };
                    dockerParams.dockerlaunchparameters = ' --name ' + dockerParams.dockercontainerpathstitle;
                    dockerParams.dockerrepotags = 'latest';
                    //gives the dockerParams details to show up the image in the first step of wizard.
                    $scope.dockerDetails.push(dockerParams);
                }
                $scope.next();
            };

            blueprintCreation.getImages = function(){
                bpCreateSer.getImages().then(function(data){
                    //Note: The provider type should come in lowercase from the API.
                    var providerType = $scope.providerType.toLowerCase();
                    for(var i=0;i<data.length;i++){
                        if(providerType === data[i].providerType){
                            $scope.imageList.push(data[i]);        
                        }
                    }
                });
            };

            if($scope.bpTypeName === 'OSImage'){
                blueprintCreation.getImages();
            } else {
                blueprintCreation.templateListing();
            }

            blueprintCreation.getOperatingSytems = function(){
                $scope.isOSLoading = true;
                bpCreateSer.getOperatingSytems().then(function(data){
                    blueprintCreation.osListing = data;
                    if($scope.bpTypeName === 'OSImage'){
                        blueprintCreation.newEnt.osListing = $scope.templateSelected.osType;
                        $scope.isOSImage = true;
                    }
                    $scope.isOSLoading = false;
                });
            };

            blueprintCreation.getAllProviders = function(){
                if($scope.providerType === 'AWS'){
                    bpCreateSer.getAWSProviders().then(function(data){
                        blueprintCreation.providerListing = data;
                    });    
                } else if($scope.providerType === 'AZURE'){
                    bpCreateSer.getAzureProviders().then(function(data){
                        blueprintCreation.providerListing = data;
                    });    
                } else if($scope.providerType === 'OPENSTACK'){
                    bpCreateSer.getOpenStackProviders().then(function(data){
                        blueprintCreation.providerListing = data;
                    });
                } else if($scope.providerType === 'VMWARE'){
                    bpCreateSer.getVmWareProviders().then(function(data){
                        blueprintCreation.providerListing = data;
                    });
                }
                if($scope.bpTypeName === 'OSImage'){
                    blueprintCreation.newEnt.providers = $scope.templateSelected.providerId;
                    $scope.isOSImage = true;
                    blueprintCreation.getProviderImage();
                }
            };

            blueprintCreation.changeImageOS = function(){
                blueprintCreation.newEnt.providers = null;
                blueprintCreation.providerListing = [];
                blueprintCreation.newEnt.images = null;
                blueprintCreation.imageListing = [];
                blueprintCreation.instanceType = [];
                blueprintCreation.regionListing = null;
                blueprintCreation.keyPairListing = [];
                blueprintCreation.regionListingAzure = [];
                blueprintCreation.newEnt.vpcId = null;
                blueprintCreation.vpcListing = [];
                blueprintCreation.subnetListing = [];
                blueprintCreation.newEnt.subnetId = null;
                blueprintCreation.securityGroupListing = [];
                if(blueprintCreation.newEnt.osListing !== undefined){
                    blueprintCreation.getAllProviders();
                }
            };

            blueprintCreation.getProviderImage = function(){
                $scope.isImageLoading = true;
                $scope.isRegionKeyPairLoading = true;      
                bpCreateSer.getImageLists(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        if($scope.bpTypeName === 'SoftwareStack'){
                            for(var i=0;i<data.length;i++){
                               if(blueprintCreation.newEnt.osListing.os_name === data[i].osName){
                                    blueprintCreation.imageListing.push(data[i]);
                               } 
                            }
                        }
                        if($scope.bpTypeName === 'OSImage'){
                            blueprintCreation.imageListing = data;
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
                if($scope.providerType === 'AWS'){
                    bpCreateSer.getAWSProviderWithId(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.providers){
                            blueprintCreation.regionListing = data.providerRegion;
                            blueprintCreation.keyPairListing = data.keyPairs;
                            $scope.isRegionKeyPairLoading = false;
                        }
                    });    
                } else if($scope.providerType === 'AZURE'){
                    bpCreateSer.getAzureLocations(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.providers){
                            blueprintCreation.regionListingAzure = data.locationList;
                            blueprintCreation.instanceSizeListingAzure = data.instanceSizeList;
                            $scope.isRegionKeyPairLoading = false;
                        }
                    });
                } else if($scope.providerType === 'VMWARE'){
                    bpCreateSer.getProviderDataStore(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.providers){
                            blueprintCreation.dataStore = data.datastores;
                            $scope.isRegionKeyPairLoading = false;
                        }
                    });
                } else if($scope.providerType === 'OPENSTACK'){
                    bpCreateSer.getProviderFlavors(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.providers){
                            blueprintCreation.getFlavourProviders = data;
                        }
                    });
                }
                
            };

            blueprintCreation.getInstanceType = function(){
                var imageDetails = blueprintCreation.imageListing;
                for(var i= 0; i<imageDetails.length;i++){
                    if(blueprintCreation.newEnt.images === imageDetails[i]._id){
                        $scope.imageIdentifier = imageDetails[i].imageIdentifier; 
                    }
                }
                if($scope.providerType === 'AWS'){
                    $scope.isInstanceTypeLoading = true;
                    bpCreateSer.getInstanceType().then(function(data){
                        if(blueprintCreation.newEnt.images){
                            blueprintCreation.instanceType = data;    
                            $scope.isInstanceTypeLoading = false;
                        }
                    });
                }
            };    

            blueprintCreation.listVpcs = function(){
                $scope.isVPCLoading = true;
                if(blueprintCreation.newEnt.region) {
                    if ($scope.providerType === 'AWS') {
                        bpCreateSer.postVpcs(blueprintCreation.newEnt.providers, blueprintCreation.newEnt.region).then(function (data) {
                                blueprintCreation.vpcListing = data.Vpcs;
                                $scope.isVPCLoading = false;
                        });
                    } else if ($scope.providerType === 'AZURE') {
                        bpCreateSer.getAzureVPC(blueprintCreation.newEnt.providers, blueprintCreation.newEnt.region).then(function (data) {
                                blueprintCreation.vpcListing = data.vpcList;
                                blueprintCreation.subnetListing = data.subnetList;
                                $scope.isVPCLoading = false;
                        });
                        var instanceSizeList = blueprintCreation.instanceSizeListingAzure;
                        for (var i = 0; i < instanceSizeList.length; i++) {
                            if (blueprintCreation.newEnt.region === Object.keys(instanceSizeList[i])[0]) {
                                blueprintCreation.instanceType = instanceSizeList[i][blueprintCreation.newEnt.region];
                                $scope.isInstanceTypeLoading = false;
                            }
                        }
                    }
                }
            };

            blueprintCreation.postSubnets = function() {
                if(blueprintCreation.newEnt.vpcId){
                    if($scope.providerType === 'AWS'){
                        $scope.isSubnetLoading = true;
                        bpCreateSer.postSubnets(blueprintCreation.newEnt.vpcId,blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                            if(blueprintCreation.newEnt.vpcId){
                                blueprintCreation.securityGroupListing = [];
                                blueprintCreation.newEnt.subnetId = null;
                                blueprintCreation.subnetListing = data.Subnets;
                                $scope.isSubnetLoading = false;
                            }    
                        });    
                    } else if($scope.providerType === 'AZURE'){
                        var subnetList = blueprintCreation.subnetListing;
                        for(var i=0;i<subnetList.length;i++){
                            if(blueprintCreation.newEnt.vpcId === Object.keys(subnetList[i])[0]){
                                blueprintCreation.subnetListingAzure = subnetList[i][blueprintCreation.newEnt.vpcId];
                            }
                        }
                    }
                }else{
                    blueprintCreation.subnetListing = [];
                    blueprintCreation.newEnt.subnetId = null;
                    blueprintCreation.securityGroupListing = [];
                }
                
            };    
            
            if($scope.providerType === 'AWS'){
                blueprintCreation.postSecurityGroups = function() {
                    $scope.isSecurityGroupLoading = true;
                    bpCreateSer.postSecurityGroups(blueprintCreation.newEnt.vpcId,blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                        if(blueprintCreation.newEnt.vpcId){
                            blueprintCreation.securityGroupListing = data;
                            $scope.isSecurityGroupLoading = false;
                        } 
                    });
                };    
            }
            

            blueprintCreation.getOrgBUProjDetails = function() {
                /*bpCreateSer.getOrgBuProj().then(function(data){
                    blueprintCreation.orgBUProjListing = data;
                });*/
                blueprintCreation.newEnt.orgList='0';
                blueprintCreation.newEnt.bgList='0';
                blueprintCreation.newEnt.projectList='0';
                blueprintCreation.getChefServer();
                blueprintCreation.enableAppDeploy();
            };

            /*blueprintCreation.getBG = function() {
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
            };*/

            blueprintCreation.enableAppDeploy = function() {
                if(blueprintCreation.newEnt.projectList) {
                    $scope.showRepoServerName = true;
                } else {
                    $scope.showRepoServerName = false;
                }
            };

            blueprintCreation.botTypes = function() {
                if(blueprintCreation.newEnt.serviceDelivery_isChecked) {
                    $scope.botTypes = true;
                    blueprintCreation.newEnt.botTypeValue = "Task";
                    blueprintCreation.newEnt.botCategoryValue  = "Active Directory";
                } else {
                    $scope.botTypes = false;
                }
            };

            blueprintCreation.showRepoServers = function() {
                $scope.showNexusDocker = true;
                if(blueprintCreation.newEnt.appDeployCheck_isChecked) {
                    bpCreateSer.getNexusServerList().then(function(data){
                        blueprintCreation.serverRepos = data;
                    });
                    bpCreateSer.getDockerList().then(function(data){
                        blueprintCreation.serverRepos = blueprintCreation.serverRepos.concat(data);
                    });
                } else {
                    $scope.showNexusDocker = false;
                    blueprintCreation.newEnt.nexusDockerServer = null;
                    blueprintCreation.serverRepos = [];
                }
            };

            blueprintCreation.getRepository = function(){
                if (blueprintCreation.newEnt.nexusDockerServer){
                    blueprintCreation.newEnt.serverType = blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].configType;
                } else {
                    blueprintCreation.newEnt.serverType = '';
                }
                $scope.isLoadingNexus = true;
                if(blueprintCreation.newEnt.serverType === 'nexus'){
                    // create group select box options
                    blueprintCreation.groupOptions = blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].groupid;
                    bpCreateSer.getNexusRepoList(blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid,$rootScope.organObject[blueprintCreation.newEnt.orgList].businessGroups[blueprintCreation.newEnt.bgList].projects[blueprintCreation.newEnt.projectList].rowId).then(function (data) {
                        blueprintCreation.repositoryOptions = data;
                        $scope.isLoadingNexus = false;
                    });
                } else if(blueprintCreation.newEnt.serverType === 'docker'){
                    bpCreateSer.getRepoList(blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid).then(function (repositoryResult) {
                        $scope.isLoadingNexus = false;
                        blueprintCreation.repositoryOptions = repositoryResult.data[0].repositories.docker;
                        if(blueprintCreation.repositoryOptions.length === 0){
                            blueprintCreation.errorMsg= {
                                text: "Repository is not defined",
                                type: "warning",
                                repository:true,
                                role:"tooltip",
                                positions:"bottom"
                            };
                        }
                    });
                }
            };

            blueprintCreation.changeRepository = function(){
                if(blueprintCreation.newEnt.serverType === 'docker') {
                    var repository=blueprintCreation.newEnt.repositoryIMG.split('/');
                    blueprintCreation.newEnt.repository=blueprintCreation.newEnt.repositoryIMG;
                    var tagRep='';
                    if(blueprintCreation.newEnt.repositoryIMG && blueprintCreation.newEnt.repositoryIMG.indexOf('/') === -1){
                        tagRep='library';
                        blueprintCreation.newEnt.image=blueprintCreation.newEnt.repository;
                    } else {
                        tagRep=repository[0];
                        blueprintCreation.newEnt.image=repository[1];
                    }
                    $scope.isLoadingDocTag=true;
                    var requestObject={
                        dockerId:blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid,
                        repository:tagRep,
                        image:blueprintCreation.newEnt.image
                    };
                    genericServices.getDockerImageTags(requestObject).then(function(tagResult){
                        blueprintCreation.tagOptions = tagResult.data;
                        $scope.isLoadingDocTag=false;
                    });
                } else {
                    blueprintCreation.newEnt.repository = blueprintCreation.repositoryOptions[blueprintCreation.newEnt.repositoryInd].id;
                    blueprintCreation.newEnt.repositoryURL = blueprintCreation.repositoryOptions[blueprintCreation.newEnt.repositoryInd].resourceURI;
                }
            };

            blueprintCreation.getArtifacts= function(){
                $scope.isLoadingArtifacts = true;
                blueprintCreation.requestData={
                    nexus:blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid,
                    repositories:blueprintCreation.newEnt.repository,
                    group:blueprintCreation.newEnt.groupId
                };
                bpCreateSer.getArtifacts(blueprintCreation.requestData).then(function (artifactsResult) {
                    var artVerObj=[];
                    angular.forEach(artifactsResult,function(val){
                        artVerObj[val.version]=val;
                        blueprintCreation.artifactsVersion[val.artifactId]=artVerObj;
                        if (blueprintCreation.artifactsOptions.indexOf(val.artifactId) === -1) {
                            blueprintCreation.artifactsOptions.push(val.artifactId);
                        }
                    });
                    $scope.isLoadingArtifacts = false;
                });
            };
            blueprintCreation.getVersions= function(){
                $scope.isLoadingNexusVersion = true;
                blueprintCreation.requestData.artifactId = blueprintCreation.newEnt.artifact;
                    bpCreateSer.getNexusVersions(blueprintCreation.requestData).then(function (versionsResult) {
                    blueprintCreation.versionsOptions = versionsResult;
                    $scope.isLoadingNexusVersion = false;
                });
            };

            blueprintCreation.getRepositoryDetails = function() {
                if(blueprintCreation.newEnt.nexusDockerRepo.configType === 'nexus') {
                    console.log('nexus');
                }
            };

            blueprintCreation.selectServer = function() {
                if(blueprintCreation.newEnt.nexusDockerRepo) {
                    $scope.showRepoDetails = true;
                }
            };

            blueprintCreation.getChefServer = function() {
                bpCreateSer.getChefServer().then(function(data){
                    for(var i =0;i<data.length;i++){
                        if($rootScope.organObject[blueprintCreation.newEnt.orgList].rowid === data[i].orgname_rowid[0]){
                            $scope.getChefServerId = data[i].rowid;
                        }
                    }
                });
            };

            blueprintCreation.getRegionLists = function() {
                bpCreateSer.getRegionLists().then(function(data){
                    blueprintCreation.getRegionLists = data;
                });
            }; 

            blueprintCreation.getTemplateParameters = function() {
                $scope.cftTemplate = $scope.templateSelected;
                $scope.cftTemplate = $scope.templateSelected.rowid + "__template__" + $scope.templateSelected.template_filename;
                if($scope.templateSelected.templatetypename === 'CloudFormation'){
                    bpCreateSer.getCFTParams($scope.cftTemplate).then(function(data){
                        blueprintCreation.getRegionLists();
                        blueprintCreation.getCFTDetails = data;
                        blueprintCreation.newEnt.cftModel = data.Parameters;
                        blueprintCreation.newEnt.cftModelResources = {};
                    });    
                } else if($scope.templateSelected.templatetypename === 'ARMTemplate'){
                    bpCreateSer.getARMTemplateParams($scope.cftTemplate).then(function(data){
                        blueprintCreation.getARMDetails = data;
                        blueprintCreation.newEnt.armModelVariable = data.variables;
                        blueprintCreation.newEnt.armModelVMResource = data.resources;
                        blueprintCreation.newEnt.armModelResources = {};
                    });
                }
            };

            blueprintCreation.hideVMEvals = function() {
                $scope.isVMEvalsVisible = false;
            };

            blueprintCreation.checkForResource = function() {
                if(blueprintCreation.newEnt.armModelResources !==null){
                    $scope.isVMEvalsVisible = true;
                } 
            };
            
            blueprintCreation.getResourceGroups = function() {
                $scope.isResourceGroupLoading = true;
                bpCreateSer.getProviderResourceGroup(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        blueprintCreation.resourceGroupListing = data.value;
                        $scope.isResourceGroupLoading = false;
                    }
                });
            };

            blueprintCreation.showVMs= function(test) {
                test='';
                $scope.isVMVisible = true;
                $scope.vmEnabled = true;
                $scope.armParameters = {};
                $scope.armParameters = blueprintCreation.newEnt.armModelResources;
                for (var i = 0; i < blueprintCreation.newEnt.armModelVMResource.length; i++) {
                  if (blueprintCreation.newEnt.armModelVMResource[i].type === "Microsoft.Compute/virtualMachines") {
                    $scope.foundVMResources.push(blueprintCreation.newEnt.armModelVMResource[i]);
                    continue;
                  }
                }
                bpCreateSer.postAzureVM($scope.armParameters,blueprintCreation.newEnt.armModelVariable,$scope.foundVMResources).then(function(data){
                    blueprintCreation.getAzureVMDetails = data;
                    $scope.vmEnabled = false;
                });
            };


            $scope.updateCookbook = function() {
                genericServices.editRunlist($scope.chefrunlist,$scope.cookbookAttributes);
            };

            $rootScope.$on('WZ_ORCHESTRATION_REFRESH_CURRENT', function(event,reqParams) {
                $scope.chefrunlist = reqParams.list;
                $scope.cookbookAttributes = reqParams.cbAttributes;
            });
            //modal to show the Docker Parameters Popup                                             
            //on initial load.
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
            if($scope.bpTypeName === 'Docker' || $scope.bpTypeName === 'CloudFormation' || $scope.bpTypeName === 'ARMTemplate'){
                $scope.isOrgOpen = true;    
            } else {
                $scope.isOrgOpen = false;    
            }
            angular.extend($scope, {
                /* Moves to the next step*/
                next : function () {
                    if (steps.length === 0) {
                        return;
                    }
                    // If we're at the last step, then stay there.
                    if (index === steps.length - 1) {
                        return;
                    }
                    steps[index++].isDisplayed = false;
                    steps[index].isDisplayed = true;
                    $scope.setButtons();
                },
                /* Moves to the previous step*/
                previous : function () {
                    if (steps.length === 0) {
                        return;
                    }
                    if (index === 0) {
                        return;
                    }
                    steps[index--].isDisplayed = false;
                    steps[index].isDisplayed = true;
                    $scope.setButtons();
                },
                /* Sets the correct buttons to be enabled or disabled.*/
                setButtons : function() {
                    if (index === steps.length - 1) {
                        $scope.isFirstOpen = true;
                        $scope.isOrgOpen = true;
                        $scope.isNextVisible = false;
                        $scope.previousEnabled = true;
                        $scope.isSubmitVisible = true;
                        if($scope.bpTypeName !=='Docker'){
                            blueprintCreation.getOperatingSytems();
                            blueprintCreation.getAllProviders();        
                        }
                        blueprintCreation.getOrgBUProjDetails();
                        if($scope.bpTypeName === 'CloudFormation' || $scope.bpTypeName ==='ARMTemplate'){
                            blueprintCreation.getTemplateParameters();
                        }  
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
                },
                createAppUrl : function() {
                $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/workzone/instance/manage/popups/applicationUrl.html',
                        controller: 'appUrlCreateCtrl',
                        backdrop: 'static',
                        keyboard: false
                    }).result.then(function(appUrlItem) {
                        blueprintCreation.appUrlList.push(appUrlItem);
                    }, function() {
                    });
                },
                removeAppUrl : function(appUrl) {
                    var idx = blueprintCreation.appUrlList.indexOf(appUrl);
                    blueprintCreation.appUrlList.splice(idx,1); 
                },
                launchParam : function(launchObj, idx) {
                $modal.open({
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
                    }).result.then(function(paramStr) {
                        $scope.dockerDetails[idx].dockerlaunchparameters = paramStr;
                        //updating the dockerLaunchParameters for the particular index.
                    }, function() {
                        console.log('Modal Dismissed at ' + new Date());
                    });
                },
                addDockerTemplate : function() {
                $modal.open({
                        animation: true,
                        templateUrl: 'src/partials/sections/dashboard/design/view/popups/addDockerTemplate.html',
                        controller: 'addDockerTemplateCtrl',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            items: function() {
                                return $scope.templateList;
                            }
                        }
                    }).result.then(function(dockerObj) {
                        $scope.dockerDetails = $scope.dockerDetails.concat(dockerObj);
                        //updating the dockerLaunchParameters for the particular index.
                    }, function() {
                        console.log('Modal Dismissed at ' + new Date());
                    });
                },
        
                submit : function() {
                    var blueprintCreateJSON = {
                        templateComponents:'component0',
                        dockercontainerpathstitle: '',
                        dockerlaunchparameters: '',
                        dockerreponame: '',
                        chefServerId:$scope.getChefServerId,
                        instanceType:blueprintCreation.newEnt.instanceType,
                        instanceAmiid:$scope.imageIdentifier,
                        instanceUsername:'root',
                        dockerimagename:'',
                        orgId:$rootScope.organObject[blueprintCreation.newEnt.orgList].rowid,
                        bgId:$rootScope.organObject[blueprintCreation.newEnt.orgList].businessGroups[blueprintCreation.newEnt.bgList].rowid,
                        projectId:$rootScope.organObject[blueprintCreation.newEnt.orgList].businessGroups[blueprintCreation.newEnt.bgList].projects[blueprintCreation.newEnt.projectList].rowId,
                        keyPairId:blueprintCreation.newEnt.keyPair,
                        vpcId:blueprintCreation.newEnt.vpcId,
                        subnetId:blueprintCreation.newEnt.subnetId,
                        imageId:blueprintCreation.newEnt.images,
                        providerId:blueprintCreation.newEnt.providers,
                        region:blueprintCreation.newEnt.region,
                        templateType:$state.params.templateObj.templatetype,
                        domainNameCheck:blueprintCreation.newEnt.domainCheck,
                        name:blueprintCreation.newEnt.blueprintName
                    };
                    if($scope.bpTypeName === 'OSImage'){
                        blueprintCreateJSON.templateId = $scope.templateSelected.name;
                    } else {
                        blueprintCreateJSON.templateId = $scope.templateSelected.templatename;
                    }

                    if($scope.bpTypeName === 'OSImage' || $scope.bpTypeName === 'SoftwareStack') {
                        if($scope.providerType === 'AWS'){
                            blueprintCreateJSON.blueprintType = 'instance_launch';
                            blueprintCreateJSON.instanceCount = blueprintCreation.newEnt.instanceCount;    
                        } else if($scope.providerType === 'AZURE'){
                            blueprintCreateJSON.blueprintType = 'azure_launch';
                            blueprintCreateJSON.instanceCount = blueprintCreation.newEnt.instanceCount;
                        } else if($scope.providerType === 'VMWARE'){
                            blueprintCreateJSON.blueprintType = 'vmware_launch';
                            blueprintCreateJSON.instanceCount = '1';
                            //not required as it is already getting used. Need to check for new API.
                            blueprintCreateJSON.instanceImageName = $scope.imageIdentifier;
                            //not required as it is already getting used. Need to check for new API.
                            blueprintCreateJSON.imageIdentifier = blueprintCreation.newEnt.images;
                            blueprintCreateJSON.datastore = blueprintCreation.newEnt.dataStore;        
                        } else if($scope.providerType === 'OPENSTACK'){
                            blueprintCreateJSON.blueprintType = 'openstack_launch';
                            blueprintCreateJSON.instanceCount = '1';
                        }
                    }

                    if($scope.bpTypeName === 'Docker'){
                        blueprintCreateJSON.blueprintType = 'docker';
                        var dockercompose = [];
                        angular.forEach($scope.dockerDetails , function() {
                            dockercompose = $scope.dockerDetails;
                            blueprintCreateJSON.dockercompose = dockercompose;
                        });
                    }
                    if(blueprintCreation.newEnt.serviceDelivery_isChecked){
                        blueprintCreateJSON.botType = blueprintCreation.newEnt.botTypeValue;
                        blueprintCreateJSON.shortDesc = blueprintCreation.newEnt.botDescription;
                        blueprintCreateJSON.botCategory = blueprintCreation.newEnt.botCategoryValue;
                        blueprintCreateJSON.manualExecutionTime = blueprintCreation.newEnt.manualExecutionTime;
                        blueprintCreateJSON.serviceDeliveryCheck = true;
                    }
                    if(blueprintCreation.newEnt.appDeployCheck_isChecked){
                        if(blueprintCreation.newEnt.serverType === 'nexus'){
                            var nexus = {
                                "rowId": blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid,
                                "repoId": blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid,
                                "url": blueprintCreation.artifactsVersion[blueprintCreation.newEnt.artifact][blueprintCreation.newEnt.version].resourceURI,
                                "version": blueprintCreation.newEnt.version,
                                "repoName": blueprintCreation.repositoryOptions[blueprintCreation.newEnt.repositoryInd].name,
                                "artifactId": blueprintCreation.newEnt.artifact,
                                "groupId": blueprintCreation.newEnt.groupId
                            };
                            blueprintCreateJSON.nexus = nexus;
                        }else{
                            var docker = {
                                "image": blueprintCreation.newEnt.repositoryIMG,
                                "containerName": blueprintCreation.newEnt.ContNameId,
                                "containerPort": blueprintCreation.newEnt.contPort,
                                "hostPort": blueprintCreation.newEnt.hostPort,
                                "imageTag": blueprintCreation.newEnt.tag,
                                "rowId":blueprintCreation.serverRepos[blueprintCreation.newEnt.nexusDockerServer].rowid
                            };
                            blueprintCreateJSON.docker = docker;
                        }
                    }

                    if($scope.bpTypeName === 'SoftwareStack'){
                        blueprintCreateJSON.instanceOS=blueprintCreation.newEnt.osListing.osType;
                    }
                    if($scope.bpTypeName === 'OSImage'){
                        blueprintCreateJSON.instanceOS=blueprintCreation.newEnt.osListing;   
                    }
                    var cftParameters = [];
                    if($scope.bpTypeName === 'CloudFormation'){
                        angular.forEach(blueprintCreation.newEnt.cftModel , function(value, key) {
                            var parameterObj = {
                                ParameterKey: key,
                                ParameterValue: value.Default
                            };
                            cftParameters.push(parameterObj);
                            blueprintCreateJSON.cftStackParameters = cftParameters;
                        });
                        blueprintCreateJSON.blueprintType = 'aws_cf';
                        blueprintCreateJSON.cftTemplateFile = $scope.cftTemplate;
                        var cftInstances = [];
                        angular.forEach(blueprintCreation.newEnt.cftModelResources , function(value, key) {
                            var instanceObj = {
                                logicalId: key,
                                username: value,
                                runlist: []
                            };
                            cftInstances.push(instanceObj);
                            blueprintCreateJSON.cftInstances = cftInstances;
                        });
                    }

                    if($scope.bpTypeName === 'ARMTemplate'){
                        angular.forEach($scope.armParameters , function(value, key) {
                            var parameterObj = {
                                ParameterKey: key,
                                ParameterValue: value.value
                                //type: value.type
                            };
                            cftParameters.push(parameterObj);
                            blueprintCreateJSON.cftStackParameters = cftParameters;
                        });
                        blueprintCreateJSON.blueprintType = 'azure_arm';
                        blueprintCreateJSON.cftTemplateFile = $scope.cftTemplate;
                        var instanceObj = {};
                        for(var i =0;i<blueprintCreation.getAzureVMDetails.length;i++){
                            
                            instanceObj[blueprintCreation.getAzureVMDetails[i].name]= {
                                username: blueprintCreation.getAzureVMDetails[i].username,
                                password: blueprintCreation.getAzureVMDetails[i].password
                                //runlist:[]
                            };
                            blueprintCreateJSON.cftInstances = instanceObj;
                            
                        }
                        blueprintCreateJSON.resourceGroup = blueprintCreation.newEnt.resourceGroup;
                    }

                    blueprintCreateJSON.runlist = [];
                    if($scope.chefrunlist){
                        blueprintCreateJSON.runlist = responseFormatter.formatSelectedChefRunList($scope.chefrunlist);    
                        blueprintCreateJSON.attributes = responseFormatter.formatSelectedCookbookAttributes($scope.cookbookAttributes);
                    }
                    if($scope.providerType === 'AWS'){
                        blueprintCreateJSON.securityGroupIds = [];
                        for(var ii =0;ii<blueprintCreation.securityGroupListing.length;ii++){
                            if(blueprintCreation.securityGroupListing[ii]._isChecked){
                                blueprintCreateJSON.securityGroupIds.push(blueprintCreation.securityGroupListing[ii].GroupId);
                            }
                        }    
                    }
                    
                    if(blueprintCreation.appUrlList && blueprintCreation.appUrlList.length){
                        blueprintCreateJSON.appUrls = blueprintCreation.appUrlList;
                    }
                    if($scope.providerType === 'AZURE'){
                        blueprintCreateJSON.securityGroupPorts = blueprintCreation.newEnt.blueprintSecurityGroupPort;
                    }
                    var reqBody = {
                        blueprintData: blueprintCreateJSON
                    };
                    var modalOptions = {
                        closeButtonText: 'Cancel',
                        actionButtonText: 'Submit',
                        actionButtonStyle: 'btn cat-btn-update',
                        headerText: 'Confirm Blueprint Creation',
                        bodyText: 'Are you sure want to submit this Blueprint Data? Press Ok to Continue'
                    };
                    confirmbox.showModal({}, modalOptions).then(function() {
                        bpCreateSer.postBlueprintSave(blueprintCreateJSON.orgId,blueprintCreateJSON.bgId,blueprintCreateJSON.projectId,reqBody).then(function(){
                            if($scope.bpTypeName === 'OSImage'){
                                toastr.success('OSImage Blueprint Created Successfully');
                            } else if($scope.bpTypeName === 'SoftwareStack') {
                                toastr.success('Software Blueprint Created Successfully');
                            } else if($scope.bpTypeName === 'CloudFormation') {
                                toastr.success('CFT Blueprint Created Successfully');
                            } else if($scope.bpTypeName === 'ARMTemplate') {
                                toastr.success('ARM Template Blueprint Created Successfully');
                            }
                            $state.go('dashboard.design.list',{providerName:$state.params.providerName,templateObj:$state.params.templateObj});
                        }, function(data) {
                            toastr.error('error:: ' + data.toString());
                        });
                    });
                } 
            });
    }]);
})(angular);