(function (angular) {
    "use strict";
    angular.module('design.bpCreate',[])
        .service('blueprintCreateService',['$rootScope','$http','$q','toastr', 'designServices', function ($rootScope,$http,$q,toastr,designServices) {
        	var blueprintServices = this;
        	//for getting the list of templates.
        	blueprintServices.getTemplates = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/17',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			blueprintServices.getImages = function () {
				var params = {
					url: '/vmimages',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//list of operatig systems supported.
			blueprintServices.getOperatingSytems = function () {
				var params = {
					url: '/aws/ec2/amiids',
					inlineLoader:true
				};
				return designServices.promiseGet(params);	
			};
			//listing down the aws providers.
			blueprintServices.getAWSProviders = function () {
				var params = {
					url: '/aws/providers',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			/*getting the aws provider with respect to ID that can be used to list down the vmimage.
			(gives region, key pair as well)*/
			blueprintServices.getAWSProviderWithId = function (providerId) {
				var params = {
					url: '/aws/providers/' + providerId,
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the images created on the basis on aws providers.
			blueprintServices.getImageLists = function (providerId) {
				var params = {
					url: '/vmimages/providers/' + providerId,
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the images created on the basis on aws providers.
			blueprintServices.getRegionLists = function () {
				var params = {
					url: '/vmimages/regions/list',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the instance type based upon the image selected.
			blueprintServices.getInstanceType = function () {
				var params = {
					url: '/vmimages/instancesizes/all/list',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
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
				return designServices.promisePost(params);
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
				return designServices.promisePost(params);
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
				return designServices.promisePost(params);
			};
			//listing down the subnets based upon the VPC ID.(set the instance count to 10 from Ctrl)
			blueprintServices.getOrgBuProj = function () {
				var params = {
					url: '/organizations/getTreeNew'
				};
				return designServices.promiseGet(params);
			};
			//listing down the nexus server details associated to a project(on enabling checkbox, get GroupId)
			blueprintServices.getNexusServerList = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/26',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the docker details associate to a project(on enabling checkbox)
			blueprintServices.getDockerList = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/18',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the repos for nexus and docker based upon project and projectId(RepoName & group)
			blueprintServices.getRepoList = function (projectId) {
				var params = {
					url: '/d4dMasters/project/' + projectId,
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the repo url related to the repository selected based upon nexusId
			blueprintServices.getRepoUrl = function (nexusId) {
				var params = {
					url: '/nexus/'+ nexusId +'/repositories',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the artifacts based upon nexusId,repo selected & the group.
			blueprintServices.getArtifacts = function (nexusId, repoName, groupId) {
				var params = {
					url: '/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//listing down the versions based upon the nexuId, repo selected, group and artifact selected.
			blueprintServices.getVersions = function (nexusId, repoName, groupId, artifactId) {
				var params = {
					url: '/nexus/' + nexusId + '/repositories/' + repoName + '/group/' + groupId + '/artifact/' + artifactId + '/versions',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//list down the chefServer. 
			blueprintServices.getChefServer = function () {
				var params = {
					url: '/d4dMasters/readmasterjsonnew/10',
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//get the cft file details.
			blueprintServices.getCFTParams = function (cftTemplateFileName) {
				var params = {
					url: '/d4dMasters/cftTemplate?templateFile=' + cftTemplateFileName,
					inlineLoader:true
				};
				return designServices.promiseGet(params);
			};
			//save api for creating a blueprint
			blueprintServices.postBlueprintSave = function (orgId,bgId,projectId,blueprintData) {
				var params = {
					url: '/organizations/' + orgId + '/businessgroups/' + bgId + '/projects/' + projectId + '/blueprints',
					data: blueprintData
				};
				return designServices.promisePost(params);
			};
        }]);
})(angular);