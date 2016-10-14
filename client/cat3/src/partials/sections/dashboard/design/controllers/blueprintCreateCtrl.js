(function (angular) {
    "use strict";
    angular.module('dashboard.design')
        .controller('blueprintCreateCtrl',['$scope','$rootScope','$modal','toastr','$state', 'blueprintCreateService','confirmbox', function ($scope,$rootScope,$modal,toastr,$state,bpCreateSer,confirmbox) {
            var blueprintCreation = this;
            $rootScope.state = $state;
            //to get the templates listing.
            if($state.params &&  $state.params.templateObj){
                $scope.providerType = $state.params.providerName.toUpperCase();
                $scope.bpTypeName = $state.params.templateObj.templatetypename;   
            }
            $scope.logo = 'images/global/cat-logo.png';
            $scope.osImageLogo = 'images/global/linux.png';
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
            blueprintCreation.keyPairListing = '';
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

            blueprintCreation.templateListing = function(){
                bpCreateSer.getTemplates().then(function(data){
                    $scope.templateList = data; 
                    console.log($scope.templateList);   
                });
            };

            $scope.blueprintTemplateClick = function(templateDetail) {
                templateDetail.selected = true;
                $scope.nextEnabled = true;
                $scope.templateSelected = templateDetail; 
                console.log($scope.templateSelected);

                $scope.dockerDetails = [];
                //items gives the details of the selected blueprint.
                var dockerParams = $scope.templateSelected;
                console.log(dockerParams);
                dockerParams.dockerlaunchparameters = '--name ' + dockerParams.templatename;
                dockerParams.tagValue = 'latest';
                console.log(dockerParams);
                //gives the dockerParams details to show up the image in the first step of wizard.
                $scope.dockerDetails.push(dockerParams);
                console.log($scope.dockerDetails);
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

            blueprintCreation.getProviderImage = function(){
                $scope.isImageLoading = true;
                $scope.isRegionKeyPairLoading = true;      
                bpCreateSer.getImageLists(blueprintCreation.newEnt.providers).then(function(data){
                    if(blueprintCreation.newEnt.providers){
                        blueprintCreation.imageListing = data;
                        if($scope.bpTypeName === 'OSImage'){
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
                            blueprintCreation.regionListing = data.keyPairs[0].region;
                            blueprintCreation.keyPairListing = data.keyPairs[0].keyPairName;
                            $scope.isRegionKeyPairLoading = false;
                        }
                    });    
                } else if($scope.providerType === 'AZURE'){
                    bpCreateSer.getAzureLocations(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.providers){
                            blueprintCreation.regionListingAzure = data.Locations.Location;
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
                if($scope.providerType === 'AWS'){
                    bpCreateSer.postVpcs(blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                        if(blueprintCreation.newEnt.region){
                            blueprintCreation.vpcListing = data.Vpcs;    
                            $scope.isVPCLoading = false;
                        }
                    });    
                } else if($scope.providerType === 'AZURE'){
                    bpCreateSer.getAzureVPC(blueprintCreation.newEnt.providers).then(function(data){
                        if(blueprintCreation.newEnt.region){
                            var azureVpc = data.VirtualNetworkSites.VirtualNetworkSite;
                            for(var i =0; i<azureVpc.length;i++){
                                if(blueprintCreation.newEnt.region === azureVpc[i].Location){
                                    blueprintCreation.vpcListing.push(azureVpc[i]);
                                    $scope.isVPCLoading = false;        
                                }
                            }
                        }
                    });
                    var regionInstanceType = blueprintCreation.regionListingAzure;
                    for(var i=0;i<regionInstanceType.length;i++){
                        if(blueprintCreation.newEnt.region === regionInstanceType[i].Name){
                            blueprintCreation.instanceType = regionInstanceType[i].ComputeCapabilities.VirtualMachinesRoleSizes.RoleSize;
                            $scope.isInstanceTypeLoading = false;
                        }
                    }
                }
            };

            blueprintCreation.postSubnets = function() {
                $scope.isSubnetLoading = true;
                if($scope.providerType === 'AWS'){
                    bpCreateSer.postSubnets(blueprintCreation.newEnt.vpcId,blueprintCreation.newEnt.providers,blueprintCreation.newEnt.region).then(function(data){
                        if(blueprintCreation.newEnt.vpcId){
                            blueprintCreation.subnetListing = data.Subnets;
                            $scope.isSubnetLoading = false;
                        }    
                    });    
                } else if($scope.providerType === 'AZURE'){
                    var subnetsAzure = blueprintCreation.vpcListing;
                    for(var i =0;i<subnetsAzure.length;i++){
                        if(blueprintCreation.newEnt.vpcId === subnetsAzure[i].Id){
                            blueprintCreation.subnetListingAzure = subnetsAzure[i].Subnets.Subnet;
                            $scope.isSubnetLoading = false;
                        }  
                    }
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
                        if(blueprintCreation.newEnt.orgList === data[i].orgname_rowid[0]){
                            $scope.getChefServerId = data[i].rowid;
                        }
                    }
                });
            }; 

            blueprintCreation.getTemplateParameters = function() {
                $scope.cftTemplate = $scope.templateSelected;
                $scope.cftTemplate = $scope.templateSelected.rowid + "__template__" + $scope.templateSelected.template_filename;
                if($scope.templateSelected.templatetypename === 'CloudFormation'){
                    bpCreateSer.getCFTParams($scope.cftTemplate).then(function(data){
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
            }

            blueprintCreation.checkForResource = function() {
                if(blueprintCreation.newEnt.armModelResources !==null){
                    $scope.isVMEvalsVisible = true;
                } 
            }
            
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
                $scope.isVMVisible = true;
                $scope.armParameters = {};
                $scope.armParameters = blueprintCreation.newEnt.armModelResources;
                for (var i = 0; i < blueprintCreation.newEnt.armModelVMResource.length; i++) {
                  if (blueprintCreation.newEnt.armModelVMResource[i].type === "Microsoft.Compute/virtualMachines") {
                    $scope.foundVMResources.push(blueprintCreation.newEnt.armModelVMResource[i]);
                    continue;
                  }
                }
                console.log($scope.foundVMResources);
                bpCreateSer.postAzureVM($scope.armParameters,blueprintCreation.newEnt.armModelVariable,$scope.foundVMResources).then(function(data){
                    blueprintCreation.getAzureVMDetails = data;
                });
            };



            //modal to show the Docker Parameters Popup                                             

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

            //on initial load.
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
                                console.log(launchObj);
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
                        console.log(dockerObj);
                        $scope.dockerDetails = $scope.dockerDetails.concat(dockerObj);
                        console.log($scope.dockerDetails);
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
                        /*dockercompose : [],*/
                        chefServerId:$scope.getChefServerId,
                        instanceType:blueprintCreation.newEnt.instanceType,
                        instanceOS:blueprintCreation.newEnt.osListing,
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
                        templateType:$state.params.templateObj.templatetype,
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
                        angular.forEach(blueprintCreation.newEnt.cftModel , function(value, key) {
                            var parameterObj = {
                                ParameterKey: key,
                                ParameterValue: value.Default
                            }
                            cftParameters.push(parameterObj);
                            blueprintCreateJSON.dockercompose = dockercompose;
                        });
                    }

                    if($scope.bpTypeName === 'CloudFormation'){
                        var cftParameters = [];
                        angular.forEach(blueprintCreation.newEnt.cftModel , function(value, key) {
                            var parameterObj = {
                                ParameterKey: key,
                                ParameterValue: value.Default
                            }
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
                        var cftParameters = [];
                        angular.forEach($scope.armParameters , function(value, key) {
                            var parameterObj = {
                                ParameterKey: key,
                                ParameterValue: value.value
                                //type: value.type
                            }
                            cftParameters.push(parameterObj);
                            blueprintCreateJSON.cftStackParameters = cftParameters;
                        });
                        blueprintCreateJSON.blueprintType = 'azure_arm';
                        blueprintCreateJSON.cftTemplateFile = $scope.cftTemplate;
                        var instanceObj = {};
                        for(var i =0;i<blueprintCreation.getAzureVMDetails.length;i++){
                            console.log(blueprintCreation.getAzureVMDetails[i]);
                            instanceObj[blueprintCreation.getAzureVMDetails[i].name]= {
                                username: blueprintCreation.getAzureVMDetails[i].username,
                                password: blueprintCreation.getAzureVMDetails[i].password
                                //runlist:[]
                            }
                            blueprintCreateJSON.cftInstances = instanceObj;
                            console.log(blueprintCreateJSON.cftInstances);
                        }
                        blueprintCreateJSON.resourceGroup = blueprintCreation.newEnt.resourceGroup;
                    }

                    blueprintCreateJSON.runlist = [];
                    if($scope.templateSelected.templatescookbooks){
                        blueprintCreateJSON.runlist = $scope.templateSelected.templatescookbooks.split(',');    
                    }
                    if($scope.providerType === 'AWS'){
                        blueprintCreateJSON.securityGroupIds = [];
                        for(var i =0;i<blueprintCreation.securityGroupListing.length;i++){
                            if(blueprintCreation.securityGroupListing[i]._isChecked){
                                blueprintCreateJSON.securityGroupIds.push(blueprintCreation.securityGroupListing[i].GroupId);
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
                        actionButtonStyle: 'bp-btn-create',
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
                        }, function(data) {
                            toastr.error('error:: ' + data.toString());
                        });
                    });
                } 
            });
    }]);
})(angular);