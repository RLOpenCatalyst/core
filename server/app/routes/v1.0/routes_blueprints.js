/*
Copyright [2016] [Relevance Lab]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


// This file act as a Controller which contains blueprint related all end points.
var Blueprints = require('_pr/model/blueprint');

var instancesDao = require('_pr/model/classes/instance/instance');
var EC2 = require('_pr/lib/ec2.js');
var Chef = require('_pr/lib/chef.js');
var logsDao = require('_pr/model/dao/logsdao.js');
var Docker = require('_pr/model/docker.js');
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt');
var usersDao = require('_pr/model/users.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var fileIo = require('_pr/lib/utils/fileio');
var uuid = require('node-uuid');
var logger = require('_pr/logger')(module);
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var currentDirectory = __dirname;
var AWSKeyPair = require('_pr/model/classes/masters/cloudprovider/keyPair.js');
var credentialcryptography = require('_pr/lib/credentialcryptography');
var CloudFormation = require('_pr/model/cloud-formation');
var AWSCloudFormation = require('_pr/lib/awsCloudFormation.js');
var errorResponses = require('./error_responses');
var Openstack = require('_pr/lib/openstack');
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');
var Hppubliccloud = require('_pr/lib/hppubliccloud.js');
var hppubliccloudProvider = require('_pr/model/classes/masters/cloudprovider/hppublicCloudProvider.js');
var AzureCloud = require('_pr/lib/azure.js');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var VmwareCloud = require('_pr/lib/vmware.js');
var vmwareProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var AwsAutoScaleInstance = require('_pr/model/aws-auto-scale-instance');
var ARM = require('_pr/lib/azure-arm.js');
var fs = require('fs');
var AzureARM = require('_pr/model/azure-arm');
var blueprintService = require('_pr/services/blueprintService.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all('/blueprints/*', sessionVerificationFunc);

	// This post() Not in use
	app.post('/blueprints', function(req, res) {
		logger.debug("Enter post() for /blueprints");
		//validating if user has permission to save a blueprint
		logger.debug('Verifying User permission set');
		var user = req.session.user;
		var category = 'blueprints';
		var permissionto = 'create';
		var blueprintType = req.body.blueprintData.blueprintType;
		usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function(err, data) {
			if (!err) {
				logger.debug('Returned from haspermission : ' + data + ' : ' + (data == false));
				if (data == false) {
					logger.debug('No permission to ' + permissionto + ' on ' + category);
					res.send(401);

					return;
				}
			} else {
				logger.error("Hit and error in haspermission:", err);
				res.send(500);
				return;
			}
			if (!req.body.blueprintData.runlist) {
				req.body.blueprintData.runlist = [];
			}
			var blueprintData = {
				orgId: req.body.blueprintData.orgId,
				bgId: req.body.blueprintData.bgId,
				projectId: req.body.blueprintData.projectId,
				name: req.body.blueprintData.name,
				appUrls: req.body.blueprintData.appUrls,
				iconpath: req.body.blueprintData.iconpath,
				templateId: req.body.blueprintData.templateId,
				templateType: req.body.blueprintData.templateType,
				users: req.body.blueprintData.users,
				blueprintType: blueprintType,
				id:req.body.blueprintData.id
			};

			var dockerData, instanceData, cloudFormationData;

			if (blueprintType === 'docker') {

				dockerData = {
					dockerContainerPathsTitle: req.body.blueprintData.dockercontainerpathstitle,
					dockerContainerPaths: req.body.blueprintData.dockercontainerpaths,
					dockerLaunchParameters: req.body.blueprintData.dockerlaunchparameters,
					dockerRepoName: req.body.blueprintData.dockerreponame,
					dockerCompose: req.body.blueprintData.dockercompose,
					dockerRepoTags: req.body.blueprintData.dockerrepotags,
					dockerImageName: req.body.blueprintData.dockerimagename,
				};
				blueprintData.dockerData = dockerData;

			} else if (blueprintType === 'instance_launch') {
				instanceData = {
					keyPairId: req.body.blueprintData.keyPairId,
					securityGroupIds: req.body.blueprintData.securityGroupIds,
					instanceType: req.body.blueprintData.instanceType,
					instanceAmiid: req.body.blueprintData.instanceAmiid,
					instanceUsername: 'root',
					vpcId: req.body.blueprintData.vpcId,
					region: req.body.blueprintData.region,
					subnetId: req.body.blueprintData.subnetId,
					imageId: req.body.blueprintData.imageId,
					cloudProviderType: 'aws',
					cloudProviderId: req.body.blueprintData.providerId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist
				}
				blueprintData.instanceData = instanceData;
			} else if (blueprintType === 'aws_cf') {

				cloudFormationData = {
					cloudProviderId: req.body.blueprintData.cftProviderId,
					infraManagerType: 'chef',
					infraManagerId: req.body.blueprintData.chefServerId,
					runlist: req.body.blueprintData.runlist,
					stackParameters: req.body.blueprintData.cftStackParameters,
					//stackName: req.body.blueprintData.stackName,
					templateFile: req.body.blueprintData.cftTemplateFile,
					region: req.body.blueprintData.region,
					//instanceUsername: req.body.blueprintData.cftInstanceUserName
					instances: req.body.blueprintData.cftInstances
				}
				blueprintData.cloudFormationData = cloudFormationData;
			} else {
				res.send(400, {
					message: "Invalid Blueprint Type"
				});
				return;
			}


			if (!blueprintData.users || !blueprintData.users.length) {
				res.send(400);
				return;
			}

			Blueprints.createNew(blueprintData, function(err, data) {
				if (err) {
					logger.error('error occured while saving blueorint', err);
					res.send(500, {
						message: "DB error"
					});
					return;
				}
				res.send(data);
			});
			logger.debug("Exit post() for /blueprints");
		});
	});
	app.get('/blueprints/:blueprintId', function(req, res) {

		blueprintService.getById(req.params.blueprintId, function(err, blueprint) {
			if(err == 404){
				res.status(404).send({
					message: "Blueprint not found."
				});
				return;
			}else if (err) {
				res.status(500).send({
					message: "Blueprint fetch failed"
				});
				return;
			}

			res.status(200).send(blueprint);
		});

	});
	app.get('/blueprints/:blueprintId/blueprintInfo', function(req, res) {
		Blueprints.getBlueprintInfoById(req.params.blueprintId, function(err, blueprintInfo) {
			if (err) {
				res.status(500).send({
					code: 500,
					errMessage: "Blueprint Info fetch failed"
				});
				return;
			}
			res.status(200).send(blueprintInfo);
		});

	});
	app.post('/blueprints/:blueprintId/update', function(req, res) {
		logger.debug("Enter /blueprints/%s/update", req.params.blueprintId);

		if (req.session.user.rolename === 'Consumer') {
			res.send(401);
			return;
		}

		var blueprintUpdateData = req.body.blueprintUpdateData;
		if (!blueprintUpdateData.runlist) {
			blueprintUpdateData.runlist = [];
		}

		//blueprintUpdateData.runlist.splice(0, 0, 'recipe[ohai]');


		Blueprints.getById(req.params.blueprintId, function(err, blueprint) {
			if (err) {
				logger.error("Failed to get blueprint versions ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			blueprint.update(blueprintUpdateData, function(err, updatedBlueprint) {
				if (err) {
					logger.error("Failed to update blueprint ", err);
					res.send(500, errorResponses.db.error);
					return;
				}
				var latestVersionData = updatedBlueprint.getLatestVersion();
				if (latestVersionData) {
					res.send({
						version: latestVersionData.ver
					});
				} else {
					res.send(200);
				}


			});
		});

	}); // end app.post('/blueprints/:blueprintId/update' )

	app.get('/blueprints/:blueprintId/versions/:version', function(req, res) {
		logger.debug("Enter /blueprints/%s/versions/%s", req.params.blueprintId, req.params.version);

		Blueprints.getById(req.params.blueprintId, function(err, blueprint) {
			if (err) {
				logger.error("Failed to get blueprint versions ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			logger.debug(blueprint);

			var versionData = blueprint.getVersionData(req.params.version);
			res.send(200, versionData);


		});

	});

	app.get('/blueprints/:blueprintId', function(req, res) {
		logger.debug("Enter /blueprints/%s/versions/%s", req.params.blueprintId, req.params.version);

		Blueprints.getById(req.params.blueprintId, function(err, blueprint) {
			if (err) {
				logger.error("Failed to get blueprint versions ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			logger.debug(blueprint);

			res.send(200, blueprint);

		});

	});

	app.delete('/blueprints/:blueprintId', function(req, res) {
		logger.debug("Enter /blueprints/delete/%s", req.params.blueprintId);
		Blueprints.removeById(req.params.blueprintId, function(err, data) {
			if (err) {
				logger.error("Failed to delete blueprint ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			res.send(200, {
				message: "deleted"
			});
		});
	});

	app.delete('/blueprints', function(req, res) {
		var blueprintIds = req.body.blueprints;
		logger.debug("Enter /blueprints/delete/%s", req.body.blueprints);
		if(blueprintIds.length > 0)
		Blueprints.removeByIds(blueprintIds, function(err, data) {
			if (err) {
				logger.error("Failed to delete blueprint ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			res.send(200, {
				message: "deleted"
			});
		});
	});

	app.post('/blueprints/copy',function(req,res){
		var orgid = req.body.orgid;
		var buid = req.body.buid;
		var projid = req.body.projid;
		var bluepirntIds = req.body.blueprints;
		if(!orgid || !buid || !projid || !bluepirntIds){
			logger.error("Could not copy blueprint. Required data missing.");
			res.send(500, 'Would require a ORG, BU and Project to copy');
			return;
		}else{
			Blueprints.copyByIds(bluepirntIds,orgid,buid,projid,function(err,data){
				res.status('200').send(data);
				return;
			});

		}
	});

	//for testing
	app.get('/blueprints/azure/tryssh/:ip', function(req, res) {
		var azureCloud = new AzureCloud();
		azureCloud.trysshoninstance('Windows', req.params["ip"], 'testing', 'testing', function(err, data) {
			logger.debug('Output:', data);
			if (!err) {
				logger.debug('about to send response');
				res.send(200);
				return;
			} else {
				res.send(400, {
					message: err
				});
				return;
			}

		})
	});


	app.get('/blueprints/:blueprintId/launch', function(req, res) {
		logger.debug("Enter /blueprints/%s/launch -- ", req.params.blueprintId);
		//verifying if the user has permission
		logger.debug('Verifying User permission set for execute.');
		if (!req.query.envId) {
			res.send(400, {
				"message": "Invalid Environment Id"
			});
			return;
		}
		var user = req.session.user;
		var category = 'blueprints';
		var permissionto = 'execute';
		usersDao.haspermission(user.cn, category, permissionto, null, req.session.user.permissionset, function(err, data) {
			if (!err) {
				logger.debug('Returned from haspermission :  launch ' + data + ' , Condition State : ' + (data == false));
				if (data == false) {
					logger.debug('No permission to ' + permissionto + ' on ' + category);
					res.send(401);
					return;
				} else {

					Blueprints.getById(req.params.blueprintId, function(err, blueprint) {
						if (err) {
							logger.error('Failed to getBlueprint. Error = ', err);
							res.send(500, errorResponses.db.error);
							return;
						}
						if (!blueprint) {
							res.send(404, {
								message: "Blueprint Does Not Exist"
							});
							return;
						}

						var stackName = null;
						var domainName = null;
						if (blueprint.blueprintType === 'aws_cf' || blueprint.blueprintType === 'azure_arm') {
							stackName = req.query.stackName;
							if (!stackName) {
								res.send(400, {
									message: "Invalid stack name"
								});
								return;
							}
						}
						if(blueprint.domainNameCheck === true) {
							domainName = req.query.domainName;
							if (!domainName) {
								res.send(400, {
									message: "Invalid domainName"
								});
								return;
							}
						}
						blueprint.launch({
							envId: req.query.envId,
							ver: req.query.version,
							stackName: stackName,
							domainName:domainName,
							sessionUser: req.session.user.cn
						}, function(err, launchData) {
							if (err) {
								res.status(500).send({
									message: "Server Behaved Unexpectedly"
								});
								return;
							}
							res.status(200).send(launchData)

						});
					});
				}
			} else {
				logger.error("Hit and error in haspermission:", err);
				res.send(500);
				return;
			}
			return;

		}); // end haspermission
	});
    //  List blueprints w.r.t. org,bg and project
    /**
     * @api {get} /blueprints/organization/:orgId/businessgroup/:bgId/project/:projectId Request List of Blueprints
     * @apiName GetBlueprints
     * @apiGroup Blueprints
     *
     * @apiParam {string} orgId Organization unique ID.
     * @apiParam {string} bgId BusinessGroup unique ID.
     * @apiParam {string} projectId Project unique ID.
     *
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     {
        "_id": "56fca48a350326691735057b",
        "orgId": "46d1da9a-d927-41dc-8e9e-7e926d927537",
        "bgId": "7e3500f1-58f9-43e2-b9eb-347b2e4d129d",
        "projectId": "b38ccedc-da2c-4e2c-a278-c66333564719",
        "name": "Gobinda_WRL",
        "templateId": "ubuntu_new",
        "templateType": "ami",
        "blueprintConfig": {
            "_id": "56fca48a350326691735057a",
            "infraManagerData": {
                "versionsList": [
                    {
                        "runlist": [],
                        "_id": "56fca48a3503266917350579",
                        "ver": "0.1"
                    }
                ],
                "_id": "56fca48a3503266917350578",
                "latestVersion": "0.1"
            },
            "infraManagerId": "965cdb20-0b8e-413b-bda6-3877a503549a",
            "infraMangerType": "chef",
            "cloudProviderData": {
                "securityGroupIds": [
                    "sg-eeff688b"
                ],
                "_id": "56fca48a3503266917350577",
                "instanceCount": "1",
                "instanceOS": "linux",
                "imageId": "56fb5a7f9ee332570c311b63",
                "subnetId": "subnet-d7df258e",
                "vpcId": "vpc-bd815ad8",
                "instanceUsername": "root",
                "instanceAmiid": "ami-06116566",
                "instanceType": "t2.micro",
                "keyPairId": "56fb59bd9ee332570c311b31"
            },
            "cloudProviderId": "56fb59bd9ee332570c311b30",
            "cloudProviderType": "aws"
        },
        "blueprintType": "instance_launch",
        "__v": 0,
        "users": [
            "superadmin"
        ],
        "appUrls": []
    }
     ]
     *
     * @apiError Either orgId or bgId or projectId missing.
     * @apiError Blueprint fetch failed.
     *
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 400 Bad Request
     *     {
         *       "error": "Either orgId or bgId or projectId missing."
         *     }
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 500 Internal Server Error
     *     {
         *       "error": "Blueprint fetch failed."
         *     }
     **/


    app.get('/blueprints/organization/:orgId/businessgroup/:bgId/project/:projectId', function(req, res) {
        var orgId = req.params.orgId;
        var bgId = req.params.bgId;
        var projectId = req.params.projectId;
        var serviceDeliveryCheck = false;
        if(req.query.serviceDeliveryCheck){
            serviceDeliveryCheck = req.query.serviceDeliveryCheck;
        }
        if (!orgId || !bgId || !projectId) {
            res.status(400).send("Either orgId or bgId or projectId missing.");
            return;
        }

        var jsonData = {};
        jsonData['orgId'] = orgId;
        jsonData['bgId'] = bgId;
        jsonData['projectId'] = projectId;

        if(serviceDeliveryCheck === 'true' || serviceDeliveryCheck === true){
            jsonData['botType'] = {$ne:null};
            jsonData['shortDesc'] = {$ne:null};
        }

        Blueprints.getBlueprintsByOrgBgProject(jsonData, function(err, blueprints) {
            if (err) {
                res.status(500).send({
                    code: 500,
                    errMessage: "Blueprint fetch failed."
                });
                return;
            }
            res.status(200).send(blueprints);
        });
    });
};