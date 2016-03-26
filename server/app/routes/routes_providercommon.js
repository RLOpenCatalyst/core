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


var logger = require('_pr/logger')(module);
var configmgmtDao = require('_pr/model/d4dmasters/configmgmt.js');
var Cryptography = require('_pr/lib/utils/cryptography');
var appConfig = require('_pr/config');
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var waitForPort = require('wait-for-port');
var uuid = require('node-uuid');
var taskStatusModule = require('_pr/model/taskstatus');
var credentialCryptography = require('_pr/lib/credentialcryptography');
var fileIo = require('_pr/lib/utils/fileio');
var logsDao = require('_pr/model/dao/logsdao.js');
var Chef = require('_pr/lib/chef');
var Puppet = require('_pr/lib/puppet');
var tagsDao = require('_pr/model/tags');
var constantData = require('_pr/lib/utils/constant.js');


module.exports.setRoutes = function(app, sessionVerificationFunc) {
	app.all("/providers/*", sessionVerificationFunc);

	app.get('/providers/:providerId', function(req, res) {
		AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {
			if (err) {
				res.status(500).send({
					message: "Server Behaved Unexpectedly"
				});
				return;
			}
			if (!provider) {
				res.status(404).send({
					message: "provider not found"
				});
				return;
			}

			MasterUtils.getOrgById(provider.orgId[0], function(err, orgs) {
				if (err) {
					res.status(500).send({
						message: "Server Behaved Unexpectedly"
					});
					return;
				}
				if (!orgs) {
					res.status(500).send({
						message: "Data Corrupt"
					});
					return;
				}


				var tempProvider = JSON.parse(JSON.stringify(provider));
				tempProvider.org = orgs[0];
				res.status(200).send(tempProvider)
			});

		});
	});
	app.get('/providers/:providerId/managedInstances', function(req, res) {
		MasterUtils.paginationRequest(req.query,function(err, paginationReq){
			if (err) {
				res.status(400).send({
					message: "Bad Request"
				});
				return;
			}
			paginationReq['providerId']=req.params.providerId;
			paginationReq['id']='managedInstances';
			AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {

				if (err) {
					res.status(500).send({
						message: "Internal Server Error"
					});
					return;
				}
				if (!provider) {
					res.status(204).send({
						message: "The server successfully processed the request and is not returning any content"
					});
					return;
				}
				instancesDao.getByProviderId(paginationReq, function(err, managedInstances) {
					if (err) {
						res.status(400).send(managedInstances);
						return;
					}
					MasterUtils.paginationResponse(managedInstances,paginationReq,function(err, paginationRes){
						if (err) {
							res.status(400).send({
								message: "Bad Request"
							});
							return;
						}
						if (!paginationRes.managedInstances.length>0) {
							res.status(204).send({
								message: "The server successfully processed the request and is not returning any content"
							});
							return;
						}
						res.status(200).send(paginationRes);
					});


				});
			});
		});
	});
	app.get('/providers/:providerId/unmanagedInstances', function(req, res) {
		MasterUtils.paginationRequest(req.query,function(err, paginationReq){
			if (err) {
				res.status(400).send({
					message: "Bad Request"
				});
				return;
			}
			paginationReq['providerId']=req.params.providerId;
			paginationReq['id']='unmanagedInstances';
			AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {

				if (err) {
					res.status(500).send({
						message: "Internal Server Error"
					});
					return;
				}
				if (!provider) {
					res.status(204).send({
						message: "The server successfully processed the request and is not returning any content"
					});
					return;
				}
				unManagedInstancesDao.getByProviderId(paginationReq, function(err, unmanagedInstances) {
					if (err) {
						res.status(400).send(unmanagedInstances);
						return;
					}
					MasterUtils.paginationResponse(unmanagedInstances,paginationReq,function(err, paginationRes){
						if (err) {
							res.status(400).send({
								message: "Bad Request"
							});
							return;
						}
						if (!paginationRes.unmanagedInstances.length>0) {
							res.status(204).send({
								message: "The server successfully processed the request and is not returning any content"
							});
							return;
						}
						res.status(200).send(paginationRes);
					});


				});
			});
		});
	});

	//Added By Durgesh for Tags Information
	app.get('/providers/:providerId/tags', function(req, res) {
		AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {
			if (err) {
				res.status(500).send({
					message: "Server Behaved Unexpectedly"
				});
				return;
			}
			if (!provider) {
				res.status(404).send({
					message: "provider not found"
				});
				return;
			}

			tagsDao.getTagByProviderId(provider._id, function(err, tag) {
				if (err) {
					res.status(500).send(tag);
					return;
				}
				res.status(200).send(tag);
			});
		});

	});
	//End By Durgesh

	//Added By Durgesh for Tags Information
	app.post('/providers/:providerId/updateTags', function(req, res) {
		AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {
			if (err) {
				res.status(500).send({
					message: "Server Behaved Unexpectedly"
				});
				return;
			}
			if (!provider) {
				res.status(204).send({
					message: "The server successfully processed the request and is not returning any content"
				});
				return;
			}

			tagsDao.getTagByProviderId(provider._id,data, function(err, tag) {
				if (err) {
					res.status(500).send(tag);
					return;
				}
				res.status(200).send(tag);
			});
		});

	});
	//End By Durgesh


	app.post('/providers/:providerId/sync', function(req, res) {
		AWSProvider.getAWSProviderById(req.params.providerId, function(err, provider) {
			if (err) {
				res.status(500).send({
					message: "Server Behaved Unexpectedly"
				});
				return;
			}
			if (!provider) {
				res.status(404).send({
					message: "provider not found"
				});
				return;
			}

			configmgmtDao.getEnvNameFromEnvId(req.body.envId, function(err, envName) {
				if (err) {
					res.status(500).send({
						message: "Server Behaved Unexpectedly"
					});
					return;
				}

				function getCredentialsFromReq(callback) {
					var credentials = req.body.credentials;
					if (req.body.credentials.pemFileData) {
						credentials.pemFileLocation = appConfig.tempDir + uuid.v4();
						fileIo.writeFile(credentials.pemFileLocation, req.body.credentials.pemFileData, null, function(err) {
							if (err) {
								logger.error('unable to create pem file ', err);
								callback(err, null);
								return;
							}
							callback(null, credentials);
						});
					} else {
						callback(null, credentials);
					}
				}
				getCredentialsFromReq(function(err, credentials) {
					if (err) {
						res.status(500).send({
							message: "Server Behaved Unexpectedly"
						});
						return;
					}
					if (!req.body.configManagmentId) {
						res.status(400).send({
							message: "Invalid Config Management Id"
						});
						return;
					}
					MasterUtils.getCongifMgmtsById(req.body.configManagmentId, function(err, infraManagerDetails) {
						if (err) {
							res.status(500).send({
								message: "Server Behaved Unexpectedly"
							});
							return;
						}
						logger.debug("infraManagerDetails", infraManagerDetails);
						if (!infraManagerDetails) {
							res.status(500).send({
								message: "Config Management not found"
							});
							return;
						}

						if (infraManagerDetails.configType === 'chef') {
							var chef = new Chef({
								userChefRepoLocation: infraManagerDetails.chefRepoLocation,
								chefUserName: infraManagerDetails.loginname,
								chefUserPemFile: infraManagerDetails.userpemfile,
								chefValidationPemFile: infraManagerDetails.validatorpemfile,
								hostedChefUrl: infraManagerDetails.url
							});

							chef.getEnvironment(envName, function(err, env) {
								if (err) {
									logger.error("Failed chef.getEnvironment", err);
									res.status(500).send({
										message: "Unable to get chef environment"
									});
									return;
								}

								if (!env) {
									logger.debug("Blueprint env ID = ", req.query.envId);
									chef.createEnvironment(envName, function(err) {
										if (err) {
											logger.error("Failed chef.getEnvironment", err);
											res.status(500).send({
												message: "unable to create environment in chef"
											});
											return;
										}
										addAndBootstrapInstances();
									});
								} else {
									addAndBootstrapInstances();
								}

							});
						} else {
							addAndBootstrapInstances();

						}

						function addAndBootstrapInstances() {

							var ids = req.body.instanceIds;

							unManagedInstancesDao.getByIds(ids, function(err, unmanagedInstances) {
								if (err) {
									res.status(500).send(unmanagedInstances);
									return;
								}
								if (!unmanagedInstances.length) {
									res.status(404).send({
										message: "Unmanaged instances not found"
									});
									return;
								}

								var appUrls = [];

								if (appConfig.appUrls && appConfig.appUrls.length) {
									appUrls = appUrls.concat(appConfig.appUrls);
								}

								credentialCryptography.encryptCredential(credentials, function(err, encryptedCredentials) {
									if (err) {
										logger.error("unable to encrypt credentials", err);
										res.status(500).send({
											message: "unable to encrypt credentials"
										});
										return;
									}
									var taskStatusObj = null;
									var count = 0;

									function updateTaskStatusNode(nodeName, msg, err, i) {
										count++;
										var status = {};
										status.nodeName = nodeName;
										status.message = msg;
										status.err = err;

										logger.debug('taskstatus updated');

										if (count == unmanagedInstances.length) {
											logger.debug('setting complete');
											taskstatus.endTaskStatus(true, status);
										} else {
											logger.debug('setting task status');
											taskstatus.updateTaskStatus(status);
										}

									};

									taskStatusModule.getTaskStatus(null, function(err, obj) {
										if (err) {
											res.send(500);
											return;
										}
										taskstatus = obj;
										for (var i = 0; i < unmanagedInstances.length; i++) {
											(function(unmanagedInstance) {
												var openport = 22;
												if (unmanagedInstance.os === 'windows') {
													openport = 5985;
												}

												waitForPort(unmanagedInstance.ip, openport, function(err) {
													if (err) {
														logger.debug(err);
														updateTaskStatusNode(unmanagedInstance.platformId, "Unable to ssh/winrm into instance " + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
														return;
													}

													var instance = {
														name: unmanagedInstance.platformId,
														orgId: req.body.orgId,
														bgId: req.body.bgId,
														projectId: req.body.projectId,
														//Added by Durgesh For Project Name
														projectName: req.body.projectName,
														//End By Durgesh
														envId: req.body.envId,
														providerId: provider._id,
														providerType: 'aws',
														providerData: {
															region: unmanagedInstance.providerData.region
														},
														chefNodeName: unmanagedInstance.platformId,
														runlist: [],
														platformId: unmanagedInstance.platformId,
														appUrls: appUrls,
														instanceIP: unmanagedInstance.ip,
														instanceState: unmanagedInstance.state,
														bootStrapStatus: 'waiting',
														hardware: {
															platform: 'unknown',
															platformVersion: 'unknown',
															architecture: 'unknown',
															memory: {
																total: 'unknown',
																free: 'unknown',
															},
															os: unmanagedInstance.os
														},
														credentials: encryptedCredentials,
														blueprintData: {
															blueprintName: unmanagedInstance.platformId,
															templateId: "chef_import",
															iconPath: "../private/img/templateicons/chef_import.png"
														}
													};

													if (infraManagerDetails.configType === 'chef') {
														instance.chef = {
															serverId: infraManagerDetails.rowid,
															chefNodeName: unmanagedInstance.platformId
														}
													} else {
														instance.puppet = {
															serverId: infraManagerDetails.rowid

														}
													}


													instancesDao.createInstance(instance, function(err, data) {
														if (err) {
															logger.error('Unable to create Instance ', err);
															updateTaskStatusNode(unmanagedInstance.platformId, "server beahved unexpectedly while importing instance :" + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);
															return;
														}
														instance.id = data._id;
														instance._id = data._id;
														var timestampStarded = new Date().getTime();
														var actionLog = instancesDao.insertBootstrapActionLog(instance.id, [], req.session.user.cn, timestampStarded);
														var logsRefernceIds = [instance.id, actionLog._id];
														logsDao.insertLog({
															referenceId: logsRefernceIds,
															err: false,
															log: "Bootstrapping instance",
															timestamp: timestampStarded
														});

														credentialCryptography.decryptCredential(encryptedCredentials, function(err, decryptedCredentials) {
															if (err) {
																logger.error("unable to decrypt credentials", err);
																var timestampEnded = new Date().getTime();
																logsDao.insertLog({
																	referenceId: logsRefernceIds,
																	err: true,
																	log: "Unable to decrypt credentials. Bootstrap Failed",
																	timestamp: timestampEnded
																});
																instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);
																updateTaskStatusNode(unmanagedInstance.platformId, "server beahved unexpectedly while importing instance :" + unmanagedInstance.platformId + ". Cannot sync this node.", true, count);

																return;
															}
															var infraManager;
															var bootstarpOption;
															var deleteOptions;
															if (infraManagerDetails.configType === 'chef') {
																logger.debug('In chef ');
																infraManager = new Chef({
																	userChefRepoLocation: infraManagerDetails.chefRepoLocation,
																	chefUserName: infraManagerDetails.loginname,
																	chefUserPemFile: infraManagerDetails.userpemfile,
																	chefValidationPemFile: infraManagerDetails.validatorpemfile,
																	hostedChefUrl: infraManagerDetails.url
																});
																bootstarpOption = {
																	instanceIp: instance.instanceIP,
																	pemFilePath: decryptedCredentials.pemFileLocation,
																	instancePassword: decryptedCredentials.password,
																	instanceUsername: instance.credentials.username,
																	nodeName: instance.chef.chefNodeName,
																	environment: envName,
																	instanceOS: instance.hardware.os
																};
																deleteOptions = {
																	privateKey: decryptedCredentials.pemFileLocation,
																	username: decryptedCredentials.username,
																	host: instance.instanceIP,
																	instanceOS: instance.hardware.os,
																	port: 22,
																	cmds: ["rm -rf /etc/chef/", "rm -rf /var/chef/"],
																	cmdswin: ["del "]
																}
																if (decryptedCredentials.pemFileLocation) {
																	deleteOptions.privateKey = decryptedCredentials.pemFileLocation;
																} else {
																	deleteOptions.password = decryptedCredentials.password;
																}

															} else {
																var puppetSettings = {
																	host: infraManagerDetails.hostname,
																	username: infraManagerDetails.username,
																};
																if (infraManagerDetails.pemFileLocation) {
																	puppetSettings.pemFileLocation = infraManagerDetails.pemFileLocation;
																} else {
																	puppetSettings.password = infraManagerDetails.puppetpassword;
																}
																logger.debug('puppet pemfile ==> ' + puppetSettings.pemFileLocation);
																bootstarpOption = {
																	host: instance.instanceIP,
																	username: instance.credentials.username,
																	pemFileLocation: decryptedCredentials.pemFileLocation,
																	password: decryptedCredentials.password,
																	environment: envName
																};

																var deleteOptions = {
																	username: decryptedCredentials.username,
																	host: instance.instanceIP,
																	port: 22,
																}

																if (decryptedCredentials.pemFileLocation) {
																	deleteOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
																} else {
																	deleteOptions.password = decryptedCredentials.password;
																}

																infraManager = new Puppet(puppetSettings);
															}


															//removing files on node to facilitate re-bootstrap
															logger.debug("Node OS : %s", instance.hardware.os);
															logger.debug('Cleaning instance');
															infraManager.cleanClient(deleteOptions, function(err, retCode) {
																logger.debug("Entering chef.bootstarp");
																infraManager.bootstrapInstance(bootstarpOption, function(err, code, bootstrapData) {

																	if (err) {
																		logger.error("knife launch err ==>", err);
																		instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {

																		});
																		if (err.message) {
																			var timestampEnded = new Date().getTime();
																			logsDao.insertLog({
																				referenceId: logsRefernceIds,
																				err: true,
																				log: err.message,
																				timestamp: timestampEnded
																			});

																		}
																		var timestampEnded = new Date().getTime();
																		logsDao.insertLog({
																			referenceId: logsRefernceIds,
																			err: true,
																			log: "Bootstrap Failed",
																			timestamp: timestampEnded
																		});
																		instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

																	} else {
																		if (code == 0) {
																			instancesDao.updateInstanceBootstrapStatus(instance.id, 'success', function(err, updateData) {
																				if (err) {
																					logger.error("Unable to set instance bootstarp status. code 0");
																				} else {
																					logger.debug("Instance bootstrap status set to success");
																				}
																			});

																			// updating puppet node name
																			var nodeName;
																			if (bootstrapData && bootstrapData.puppetNodeName) {
																				instancesDao.updateInstancePuppetNodeName(instance.id, bootstrapData.puppetNodeName, function(err, updateData) {
																					if (err) {
																						logger.error("Unable to set puppet node name");
																					} else {
																						logger.debug("puppet node name updated successfully");
																					}
																				});
																				nodeName = bootstrapData.puppetNodeName;
																			} else {
																				nodeName = instance.chef.chefNodeName;
																			}


																			var timestampEnded = new Date().getTime();
																			logsDao.insertLog({
																				referenceId: logsRefernceIds,
																				err: false,
																				log: "Instance Bootstrapped Successfully",
																				timestamp: timestampEnded
																			});
																			instancesDao.updateActionLog(instance.id, actionLog._id, true, timestampEnded);
																			var hardwareData = {};
																			if (bootstrapData && bootstrapData.puppetNodeName) {
																				var runOptions = {
																					username: decryptedCredentials.username,
																					host: instance.instanceIP,
																					port: 22,
																				}

																				if (decryptedCredentials.pemFileLocation) {
																					runOptions.pemFileLocation = decryptedCredentials.pemFileLocation;
																				} else {
																					runOptions.password = decryptedCredentials.password;
																				}

																				infraManager.runClient(runOptions, function(err, retCode) {
																					if (decryptedCredentials.pemFileLocation) {
																						fileIo.removeFile(decryptedCredentials.pemFileLocation, function(err) {
																							if (err) {
																								logger.debug("Unable to delete temp pem file =>", err);
																							} else {
																								logger.debug("temp pem file deleted =>", err);
																							}
																						});
																					}
																					if (err) {
																						logger.error("Unable to run puppet client", err);
																						return;
																					}
																					// waiting for 30 sec to update node data
																					setTimeout(function() {
																						infraManager.getNode(nodeName, function(err, nodeData) {
																							if (err) {
																								logger.error(err);
																								return;
																							}
																							// is puppet node
																							hardwareData.architecture = nodeData.facts.values.hardwaremodel;
																							hardwareData.platform = nodeData.facts.values.operatingsystem;
																							hardwareData.platformVersion = nodeData.facts.values.operatingsystemrelease;
																							hardwareData.memory = {
																								total: 'unknown',
																								free: 'unknown'
																							};
																							hardwareData.memory.total = nodeData.facts.values.memorysize;
																							hardwareData.memory.free = nodeData.facts.values.memoryfree;
																							hardwareData.os = instance.hardware.os;
																							instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
																								if (err) {
																									logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
																								} else {
																									logger.debug("Instance hardware details set successessfully");
																								}
																							});
																						});
																					}, 30000);
																				});

																			} else {
																				infraManager.getNode(nodeName, function(err, nodeData) {
																					if (err) {
																						logger.error(err);
																						return;
																					}
																					hardwareData.architecture = nodeData.automatic.kernel.machine;
																					hardwareData.platform = nodeData.automatic.platform;
																					hardwareData.platformVersion = nodeData.automatic.platform_version;
																					hardwareData.memory = {
																						total: 'unknown',
																						free: 'unknown'
																					};
																					if (nodeData.automatic.memory) {
																						hardwareData.memory.total = nodeData.automatic.memory.total;
																						hardwareData.memory.free = nodeData.automatic.memory.free;
																					}
																					hardwareData.os = instance.hardware.os;
																					instancesDao.setHardwareDetails(instance.id, hardwareData, function(err, updateData) {
																						if (err) {
																							logger.error("Unable to set instance hardware details  code (setHardwareDetails)", err);
																						} else {
																							logger.debug("Instance hardware details set successessfully");
																						}
																					});
																					if (decryptedCredentials.pemFilePath) {
																						fileIo.removeFile(decryptedCredentials.pemFilePath, function(err) {
																							if (err) {
																								logger.error("Unable to delete temp pem file =>", err);
																							} else {
																								logger.debug("temp pem file deleted");
																							}
																						});
																					}
																				});
																			}

																		} else {
																			instancesDao.updateInstanceBootstrapStatus(instance.id, 'failed', function(err, updateData) {
																				if (err) {
																					logger.error("Unable to set instance bootstarp status code != 0");
																				} else {
																					logger.debug("Instance bootstrap status set to failed");
																				}
																			});

																			var timestampEnded = new Date().getTime();
																			logsDao.insertLog({
																				referenceId: logsRefernceIds,
																				err: true,
																				log: "Bootstrap Failed",
																				timestamp: timestampEnded
																			});
																			instancesDao.updateActionLog(instance.id, actionLog._id, false, timestampEnded);

																		}
																	}

																}, function(stdOutData) {

																	logsDao.insertLog({
																		referenceId: logsRefernceIds,
																		err: false,
																		log: stdOutData.toString('ascii'),
																		timestamp: new Date().getTime()
																	});

																}, function(stdErrData) {

																	logsDao.insertLog({
																		referenceId: logsRefernceIds,
																		err: true,
																		log: stdErrData.toString('ascii'),
																		timestamp: new Date().getTime()
																	});
																});
															}); //end of chefcleanup

															updateTaskStatusNode(unmanagedInstance.platformId, "Instance Imported : " + unmanagedInstance.platformId, false, count);
															unmanagedInstance.remove({});

														});


													});
												});

											})(unmanagedInstances[i])
										}

										res.status(200).send({
											taskId: taskstatus.getTaskId()
										});
									});


								});



							});
						}
					});


				});
			});
		});
	});
};