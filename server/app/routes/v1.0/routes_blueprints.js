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
var usersDao = require('_pr/model/users.js');
var uuid = require('node-uuid');
var logger = require('_pr/logger')(module);
var credentialcryptography = require('_pr/lib/credentialcryptography');
var fs = require('fs');
var blueprintService = require('_pr/services/blueprintService.js');
var auditTrailService = require('_pr/services/auditTrailService');
var bots = require('_pr/model/bots/1.0/bots.js');
var botsService = require('_pr/services/botsService.js');

module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all('/blueprints*', sessionVerificationFunc);

	app.get('/blueprints', function(req, res) {
		var queryObj = {
			serviceDeliveryCheck : req.query.serviceDeliveryCheck === "true" ? true:false,
			actionStatus:req.query.actionStatus
		}
		blueprintService.getAllServiceDeliveryBlueprint(queryObj, function(err,data){
			if (err) {
				return res.status(500).send(err);
			} else {
				return res.status(200).send(data);
			}
		})
	});
    app.get('/blueprints/list', function(req, res) {
        blueprintService.getAllBlueprintsWithFilter(req.query, function(err,data){
            if (err) {
                return res.status(500).send(err);
            } else {
                return res.status(200).send(data);
            }
        })
    });
	app.delete('/blueprints/serviceDelivery/:blueprintId', function(req, res) {
		blueprintService.deleteServiceDeliveryBlueprint(req.params.blueprintId, function(err, data) {
			if (err) {
				logger.error("Failed to delete ", err);
				res.send(500, errorResponses.db.error);
				return;
			}
			res.send(200, {
				message: "deleted"
			});
		});
	});


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
				if(blueprintUpdateData.serviceDeliveryCheck === true){
					Blueprints.getById(req.params.blueprintId, function(err, blueprintData) {
						if (err) {
							logger.error("Failed to get blueprint ", err);
							return;
						} else {
							botsService.createNew(blueprintData, 'Blueprint', blueprintUpdateData.blueprintType, 'edit', function (err, data) {
								logger.error("Error in creating bots entry." + err);
							});
						}
					});
				}else{
					botsService.removeSoftBotsById(req.params.blueprintId, function (err, data) {
						if (err) {
							logger.error("Error in updating bots entry." + err);
						}
					});
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
			bots.removeBotsById(req.params.blueprintId,function(err,botsData){
				if(err){
					logger.error("Failed to delete Bots ", err);
				}
			});
			auditTrailService.removeAuditTrailById(req.params.taskId,function(err,auditTrailData){
				if(err){
					logger.error("Failed to delete Audit Trail ", err);
				}
			});
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
		var masterDetails = {
			orgId:req.body.orgid,
			bgId:req.body.buid,
			projectId:req.body.projid
		}
		blueprintService.copyBlueprint(req.body.blueprints,masterDetails, function(err, blueprint) {
			if(err){
				res.status(err.errCode).send(err.errMessage);
			}
			res.status(200).send(blueprint);
		});
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
		if (!req.query.envId) {
			res.send(400, {
				"message": "Invalid Environment Id"
			});
			return;
		}
		var reqBody = {
			userName:req.session.user.cn,
			category:"blueprints",
			permissionTo:"execute",
			permissionSet:req.session.user.permissionset,
			envId:req.query.envId,
			monitorId:req.query.monitorId,
			domainName:req.query.domainName,
			stackName:req.query.stackName,
			version:req.query.version,
			tagServer:req.query.tagServer
		}
		blueprintService.launch(req.params.blueprintId,reqBody,function(err,data){
			if (err) {
				res.status(500).send({
					message: "Server Behaved Unexpectedly"
				});
				return;
			}else{
				res.status(200).send(data);
				return;
			}
		});
	});
    app.get('/blueprints/organization/:orgId/businessgroup/:bgId/project/:projectId', function (req, res) {
        var orgId = req.params.orgId;
        var bgId = req.params.bgId;
        var projectId = req.params.projectId;

        if (!orgId || !bgId || !projectId) {
            res.status(400).send("Either orgId or bgId or projectId missing.");
            return;
        }

        var jsonData = {};
        jsonData['orgId'] = orgId;
        jsonData['bgId'] = bgId;
        jsonData['projectId'] = projectId;

        Blueprints.getBlueprintsByOrgBgProject(jsonData, function (err, blueprints) {
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
