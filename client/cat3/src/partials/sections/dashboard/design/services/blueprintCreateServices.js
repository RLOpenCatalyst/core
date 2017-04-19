(function (angular) {
    "use strict";
    angular.module('design.bpCreate',[])
        .service('blueprintCreateService',['$rootScope','$http','$q','toastr', 'genericServices', function ($rootScope,$http,$q,toastr,genericServices) {
        	var blueprintServices = this;
        	//for getting the list of templates.
        	blueprintServices.getTemplates = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/17',
					//url: 'src/partials/sections/dashboard/design/data/providers.json',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//services listed for aws blueprints save and update.
			blueprintServices.getImages = function () {
				var params = {
					url: '/vmimages',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//list of operatig systems supported.
			blueprintServices.getOperatingSytems = function () {
				var params = {
					url: '/aws/ec2/amiids',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);	
			};
			//listing down the aws providers.
			blueprintServices.getAWSProviders = function () {
				var params = {
					url: '/aws/providers',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			/*getting the aws provider with respect to ID that can be used to list down the vmimage.
			(gives region, key pair as well)*/
			blueprintServices.getAWSProviderWithId = function (providerId) {
				var params = {
					url: '/aws/providers/' + providerId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the images created on the basis on aws providers.
			blueprintServices.getImageLists = function (providerId) {
				var params = {
					url: '/vmimages/providers/' + providerId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the images created on the basis on aws providers.
			blueprintServices.getRegionLists = function () {
				var params = {
					url: '/vmimages/regions/list',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the instance type based upon the image selected.
			blueprintServices.getInstanceType = function () {
				var params = {
					url: '/vmimages/instancesizes/all/list',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the vpcs for aws providers.
			blueprintServices.postVpcs = function (providerId,region) {
				var params = {
					url: '/aws/providers/describe/vpcs',
					inlineLoader:true,
					data: {
	                    "providerId": providerId,
	                    "region": region
                	}
				};
				return genericServices.promisePost(params);
			};
			//listing down the subnets based upon the VPC ID.(set the instance count to 10 from Ctrl)
			blueprintServices.postSubnets = function (vpcId,providerId,region) {
				var params = {
					url: '/aws/providers/vpc/'+ vpcId +'/subnets',
					inlineLoader:true,
					data: {
	                    "providerId": providerId,
	                    "region": region
                	}
				};
				return genericServices.promisePost(params);
			};
			//listing down the security groups based upon the VPC ID.
			blueprintServices.postSecurityGroups = function (vpcId,providerId,region) {
				var params = {
					url: '/aws/providers/vpc/'+ vpcId +'/securitygroups',
					inlineLoader:true,
					data: {
	                    "providerId": providerId,
	                    "region": region
                	}
				};
				return genericServices.promisePost(params);
			};
			//listing down the subnets based upon the VPC ID.(set the instance count to 10 from Ctrl)
			blueprintServices.getOrgBuProj = function () {
				var params = {
					url: '/organizations/getTreeNew'
				};
				return genericServices.promiseGet(params);
			};
			//listing down the nexus server details associated to a project(on enabling checkbox, get GroupId)
			blueprintServices.getNexusServerList = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/26',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the docker details associate to a project(on enabling checkbox)
			blueprintServices.getDockerList = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/18',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down list of repositories along with the url
			blueprintServices.getNexusRepoList = function (nexusId,projectId) {
				var params = {
					url: '/app-deploy/nexus/'+nexusId+'/project/' + projectId + '/nexusRepositoryList',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the repos for nexus and docker based upon project and projectId(RepoName & group)
			blueprintServices.getRepoList = function (projectId) {
				var params = {
					url: '/d4dMasters/project/' + projectId,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the repo url related to the repository selected based upon nexusId
			blueprintServices.getRepoUrl = function (nexusId) {
				var params = {
					url: '/nexus/'+ nexusId +'/repositories',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the artifacts based upon nexusId,repo selected & the group.
			blueprintServices.getArtifacts = function (requestData) {
				var params = {
					url: '/nexus/' + requestData.nexus + '/repositories/' + requestData.repositories + '/group/' + requestData.group + '/artifact',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the versions based upon the nexuId, repo selected, group and artifact selected.
			blueprintServices.getNexusVersions = function (requestData) {
				var params = {
					url: '/app-deploy/nexus/'+requestData.nexus+'/repositories/'+requestData.repositories+'/group/'+requestData.group+'/artifact/'+requestData.artifactId+'/versionList',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//list down the chefServer. 
			blueprintServices.getChefServer = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/10',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//get the cft file details.
			blueprintServices.getCFTParams = function (cftTemplateFileName) {
				var params = {
					url: '/d4dMasters/cftTemplate?templateFile=' + cftTemplateFileName,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			
			//services listed for azure blueprints save and update.

			//listing down the azure providers
			blueprintServices.getAzureProviders = function() {
				var params = {
					url: '/azure/providers',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down azure locations
			blueprintServices.getAzureLocations = function (azureProviderId) {
				var params = {
					//displayName
					url: '/azure/' + azureProviderId + '/locations',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the azure networks(VPC)
			blueprintServices.getAzureVPC = function (azureProviderId,location) {
				var params = {
					url: '/azure/'+ azureProviderId +'/networks?location='+location,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//get the armTemplate file details.
			blueprintServices.getARMTemplateParams = function (armTemplateFileName) {
				var params = {
					url: '/d4dMasters/cftTemplate?templateFile=' + armTemplateFileName,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//get the resource group based upon the provider.
			blueprintServices.getProviderResourceGroup = function (providerId) {
				var params = {
					url: '/azure-arm/'+ providerId + '/resourceGroups'
				};
				return genericServices.promiseGet(params);
			};
			//post the azureEvalVM.
			blueprintServices.postAzureVM = function (armParameters,armVMEvalVariables,armVMS) {
				var params = {
					url: '/azure-arm/evaluateVMs',
					data: {
	                    'parameters': armParameters,
              			'variables': armVMEvalVariables,
              			'vms': armVMS
                	}
				};
				return genericServices.promisePost(params);
			};

			//services listed for openstack blueprints save and update.
			//listing down openstack providers
			blueprintServices.getOpenStackProviders = function() {
				var params = {
					url: '/openstack/providers',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the openstack flavors related to provider
			blueprintServices.getProviderFlavors = function(providerId) {
				var params = {
					url: '/openstack/' + providerId + '/flavors',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the openstack networks related to provider
			blueprintServices.getProviderNetwork = function(providerId) {
				var params = {
					url: '/openstack/' + providerId + '/networks',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down the security groups related to provider
			blueprintServices.getProviderSecurityGroup = function(providerId) {
				var params = {
					url: '/openstack/' + providerId + '/securityGroups',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			//services listed for vmware blueprints save and update.
			//listing down vmware providers.
			blueprintServices.getVmWareProviders = function() {
				var params = {
					url: '/vmware/providers',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};
			//listing down dataStore related to Provider.
			blueprintServices.getProviderDataStore = function(providerId) {
				var params = {
					url: '/vmware/' + providerId + '/datastores',
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			//listing down docker templates
			blueprintServices.getDockerTemplates = function(dockerTemplate,repoName) {
				var params = {
					url: '/d4dmasters/getdockertags?repopath='+encodeURIComponent(dockerTemplate)+'&dockerreponame=' + repoName,
					inlineLoader:true
				};
				return genericServices.promiseGet(params);
			};

			//save api for creating a blueprint
			blueprintServices.postBlueprintSave = function (orgId,bgId,projectId,blueprintData) {
				var params = {
					url: '/organizations/' + orgId + '/businessgroups/' + bgId + '/projects/' + projectId + '/blueprints',
					data: blueprintData
				};
				return genericServices.promisePost(params);
			};
        }]);
})(angular);