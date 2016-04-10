var logger = require('_pr/logger')(module);
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var EC2 = require('_pr/lib/ec2.js');
var instancesDao = require('_pr/model/classes/instance/instance');
var unManagedInstancesDao = require('_pr/model/unmanaged-instance');
var unassignedInstancesModel = require('_pr/model/unassigned-instances');
var async = require('async');
var tagsModel = require('_pr/model/tags');

var socketIo = require('_pr/socket.io').getInstance();

var socketCloudFormationAutoScate = socketIo.of('/cloudFormationAutoScaleGroup');

socketCloudFormationAutoScate.on('connection', function(socket) {
	socket.on('joinCFRoom', function(data) {
		logger.debug('room joined', data);
		socket.join(data.orgId + ':' + data.bgId + ':' + data.projId + ':' + data.envId);
	});

});

// @TODO To be refactored (High Priority)
function sync() {
	var orgs = MasterUtils.getAllActiveOrg(function(err, orgs) {
		if (err) {
			logger.error('Unable to fetch orgs ==>', err);
			return;
		}
		if (!(orgs && orgs.length)) {
			logger.warn('No org found');
			return;
		}
		logger.debug('orgs ==> ', JSON.stringify(orgs));
		for (var i = 0; i < orgs.length; i++) {
			(function(org) {
				AWSProvider.getAWSProvidersByOrgId(org._id, function(err, providers) {
					if (err) {
						logger.error("Unable to get aws providers :", err);
						return;
					}
					for (var j = 0; j < providers.length; j++) {
						(function(provider) {
							unassignedInstancesModel.getByProviderId(provider._id,
								function(err, unassignedInstances) {
								if (err) {
									logger.error('Unable to fetch unassigned Instances by provider', err);
									return;
								}
								unManagedInstancesDao.getByOrgProviderId({
									orgId: org.rowid,
									providerId: provider._id,
								}, function (err, unManagedInstances) {
									if (err) {
										logger.error('Unable to fetch Unmanaged Instances by org,provider', err);
										return;
									}
									instancesDao.getByOrgProviderId({
										orgId: org.rowid,
										providerId: provider._id,
									}, function (err, instances) {
										if (err) {
											logger.error('Unable to fetch instance by org,provider', err);
											return;
										}
										tagsModel.getTagsByProviderId(provider._id, function (err, tagDetails) {
											if (err) {
												logger.error("Unable to get tags", err);
												return;
											}

											var projectTag = null;
											var environmentTag = null;
											// @TODO enum to be used to compare against project and env
											for (var z = 0; z < tagDetails.length; z++) {
												if (('catalystEntityType' in tagDetails[z]) &&
													tagDetails[z].catalystEntityType == 'project') {
													projectTag = tagDetails[z];
												} else if (('catalystEntityType' in tagDetails[z]) &&
													tagDetails[z].catalystEntityType == 'environment') {
													environmentTag = tagDetails[z];
												}
											}

											var cryptoConfig = appConfig.cryptoSettings;
											var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
											var keys = [];
											keys.push(provider.accessKey);
											keys.push(provider.secretKey);
											cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding, function (err, decryptedKeys) {
												if (err) {
													logger.error('unable to decrypt keys', err);
													return;
												}

												var regionCount = 0;

												var regions = appConfig.aws.regions;
												for (var k = 0; k < regions.length; k++) {
													(function (region) {
														var ec2 = new EC2({
															"access_key": decryptedKeys[0],
															"secret_key": decryptedKeys[1],
															"region": region
														});

														ec2.describeInstances(null, function (err, awsRes) {
															regionCount++;
															if (err) {
																logger.error("Unable to fetch instances from aws", err);
																return;
															}
															var reservations = awsRes.Reservations;
															logger.debug('res==> ', reservations.length, ' region==> ', region);


															for (var l = 0; l < reservations.length; l++) {

																if (reservations[l].Instances && reservations[l].Instances.length) {
																	//instances = reservations[k].Instances;
																	var awsInstances = reservations[l].Instances;
																	for (var m = 0; m < awsInstances.length; m++) {

																		var found = false;
																		var tags = awsInstances[m].Tags;
																		var tagInfo = {};
																		for (var i = 0; i < tags.length; i++) {
																			var jsonData = tags[i];
																			tagInfo[jsonData.Key] = jsonData.Value;
																		}

																		var catalystProjectId = null;
																		var catalystProjectName = null;
																		var catalystEnvironmentId = null;
																		var catalystEnvironmentName = null;

																		if (projectTag && environmentTag && (awsInstances[m].State.Name !== 'terminated')
																			&& (projectTag.name in tagInfo) && (environmentTag.name in tagInfo)) {

																			for (var y = 0; y < projectTag.catalystEntityMapping.length; y++) {
																				if (projectTag.catalystEntityMapping[y].tagValue == tagInfo[projectTag.name]) {
																					catalystProjectId = projectTag.catalystEntityMapping[y].catalystEntityId;
																					catalystProjectName = projectTag.catalystEntityMapping[y].catalystEntityName;
																					break;
																				}
																			}
																			for (var y = 0; y < environmentTag.catalystEntityMapping.length; y++) {
																				if (environmentTag.catalystEntityMapping[y].tagValue == tagInfo[environmentTag.name]) {
																					catalystEnvironmentId = environmentTag.catalystEntityMapping[y].catalystEntityId;
																					catalystEnvironmentName = environmentTag.catalystEntityMapping[y].catalystEntityName;
																					break;
																				}
																			}

																		}

																		for (var n = 0; n < instances.length; n++) {
																			if (instances[n].platformId === awsInstances[m].InstanceId) {
																				instances[n].instanceState = awsInstances[m].State.Name;
																				if (instances[n].instanceState === 'running') {
																					instances[n].instanceIP = awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress;
																				}
																				instances[n].projectId = catalystProjectId;
																				instances[n].projectName = catalystProjectName;
																				instances[n].envId = catalystEnvironmentId;
																				instances[n].environmentName = catalystEnvironmentName;

																				instances[n].save();
																				found = true;

																				//sending socket event
																				socketCloudFormationAutoScate.to(instances[n].orgId + ':' + instances[n].bgId + ':' + instances[n].projectId + ':' + instances[n].envId).emit('instanceStateChanged', instances[n]);

																				instances.splice(n, 1);
																				break;
																			}
																		}
																		if (!found) {
																			var foundInUnManaged = false;
																			for (var n = 0; n < unManagedInstances.length; n++) {
																				if (unManagedInstances[n].platformId === awsInstances[m].InstanceId) {
																					unManagedInstances[n].state = awsInstances[m].State.Name;
																					if (unManagedInstances[n].state === 'terminated') {
																						unManagedInstances[n].remove();
																					} else {
																						if (unManagedInstances[n].state === 'running') {
																							unManagedInstances[n].instanceIP = awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress;
																						}
																						unManagedInstances[n].projectId = catalystProjectId;
																						unManagedInstances[n].projectName = catalystProjectName;
																						unManagedInstances[n].environmentId = catalystEnvironmentId;
																						unManagedInstances[n].environmentName = catalystEnvironmentName;

																						unManagedInstances[n].save();
																					}

																					foundInUnManaged = true;
																					unManagedInstances.splice(n, 1);
																					break;
																				}
																			}
																			if (!foundInUnManaged) { //making entry in unmanaged database
																				var addedToUnmanaged = false;
																				var os = 'linux';

																				if (projectTag && environmentTag && (awsInstances[m].State.Name !== 'terminated')
																					&& (projectTag.name in tagInfo) && (environmentTag.name in tagInfo)) {

																					if ((catalystProjectId && catalystProjectName)
																						&& (catalystEnvironmentId && catalystEnvironmentName)) {

																						addedToUnmanaged = true;
																						if (awsInstances[m].Platform && awsInstances[m].Platform === 'windows') {
																							os = 'windows';
																						}

																						unManagedInstancesDao.createNew({
																							orgId: org.rowid,
																							providerId: provider._id,
																							projectId: catalystProjectId,
																							projectName: catalystProjectName,
																							environmentId: catalystEnvironmentId,
																							environmentName: catalystEnvironmentName,
																							providerType: 'aws',
																							providerData: {
																								region: region
																							},
																							platformId: awsInstances[m].InstanceId,
																							ip: awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress,
																							os: os,
																							state: awsInstances[m].State.Name,
																							tags: tagInfo
																						});
																					}
																				}

																			}

																			if (!addedToUnmanaged) {
																				var foundInUnassigned = false;
																				for (var n = 0; n < unassignedInstances.length; n++) {
																					if (unassignedInstances[n].platformId === awsInstances[m].InstanceId) {
																						unassignedInstances[n].state = awsInstances[m].State.Name;
																						if (unassignedInstances[n].state === 'terminated') {
																							unassignedInstances[n].remove();
																						} else {
																							if (unassignedInstances[n].state === 'running') {
																								unassignedInstances[n].instanceIP = awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress;
																							}
																							unassignedInstances[n].project = {
																								id: catalystProjectId,
																								name: catalystProjectName
																							};
																							unassignedInstances[n].environment = {
																								id: catalystEnvironmentId,
																								name: catalystEnvironmentName
																							};

																							unassignedInstances[n].save();
																						}

																						foundInUnassigned = true;
																						unassignedInstances.splice(n, 1);
																						break;
																					}
																				}

																			} else if (addedToUnmanaged) {
																				unassignedInstancesModel.deleteByPlatformAndProviderId(provider._id,
																					awsInstances[m].InstanceId);
																			}

																			if (!foundInUnassigned) {
																				unassignedInstancesModel.createNew({
																					orgId: org.rowid,
																					providerId: provider._id,
																					providerType: 'aws',
																					providerData: {
																						region: region
																					},
																					project: {
																						id: catalystProjectId,
																						name: catalystProjectName
																					},
																					environment: {
																						id: catalystEnvironmentId,
																						name: catalystEnvironmentName
																					},
																					platformId: awsInstances[m].InstanceId,
																					ip: awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress,
																					os: os,
																					state: awsInstances[m].State.Name,
																					tags: tagInfo
																				});
																			}

																		}
																	}

																}
																// logger.debug('loop complete l==>',l ,' res==> ', reservations.length,' region==> ',region);
															}

															if (regionCount === regions.length) {
																fetchComplete();
															}

														});
													})(regions[k].region);
												}

												function fetchComplete() {
													for (var p = 0; p < instances.length; p++) {
														instances[p].instanceState = "terminated";
														socketCloudFormationAutoScate.to(instances[p].orgId + ':' + instances[p].bgId + ':' + instances[p].projectId + ':' + instances[p].envId).emit('instanceStateChanged', instances[p]);
														instances[p].save();
													}
													for (var r = 0; r < unManagedInstances.length; r++) {
														unManagedInstances[r].remove();
													}
												}
											});
										});

									});
								});
							});
						})(providers[j]);
					}
				});
			})(orgs[i])
		}
	});
}

module.exports = sync;