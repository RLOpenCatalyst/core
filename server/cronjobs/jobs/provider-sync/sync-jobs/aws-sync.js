var logger = require('_pr/logger')(module);
var AWSProvider = require('_pr/model/classes/masters/cloudprovider/awsCloudProvider.js');
var MasterUtils = require('_pr/lib/utils/masterUtil.js');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var EC2 = require('_pr/lib/ec2.js');
var instancesDao = require('_pr/model/classes/instance/instance');

var unManagedInstancesDao = require('_pr/model/unmanaged-instance')


var socketIo = require('_pr/socket.io').getInstance();

var socketCloudFormationAutoScate = socketIo.of('/cloudFormationAutoScaleGroup');

socketCloudFormationAutoScate.on('connection', function(socket) {
	socket.on('joinCFRoom', function(data) {
		logger.debug('room joined', data);
		socket.join(data.orgId + ':' + data.bgId + ':' + data.projId + ':' + data.envId);
	});

});

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
							unManagedInstancesDao.getByOrgProviderId({
								orgId: org.rowid,
								providerId: provider._id,
							}, function(err, unManagedInstances) {
								if (err) {
									logger.error('Unable to fetch Unmanaged Instances by org,provider', err);
									return;
								}
								instancesDao.getByOrgProviderId({
									orgId: org.rowid,
									providerId: provider._id,
								}, function(err, instances) {
									if (err) {
										logger.error('Unable to fetch instance by org,provider', err);
										return;
									}
									var cryptoConfig = appConfig.cryptoSettings;
									var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
									var keys = [];
									keys.push(provider.accessKey);
									keys.push(provider.secretKey);
									cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding, function(err, decryptedKeys) {
										if (err) {
											logger.error('unable to decrypt keys', err);
											return;
										}

										var regionCount = 0;

										var regions = appConfig.aws.regions;
										for (var k = 0; k < regions.length; k++) {
											(function(region) {
												var ec2 = new EC2({
													"access_key": decryptedKeys[0],
													"secret_key": decryptedKeys[1],
													"region": region
												});
												
												ec2.describeInstances(null, function(err, awsRes) { 
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
																for (var n = 0; n < instances.length; n++) {
																	if (instances[n].platformId === awsInstances[m].InstanceId) {
																		instances[n].instanceState = awsInstances[m].State.Name;
																		if (instances[n].instanceState === 'running') {
																			instances[n].instanceIP = awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress;
																		}
																		instances[n].save();
																		found = true;

																		//sending socket event
																		socketCloudFormationAutoScate.to(instances[n].orgId + ':' + instances[n].bgId + ':' + instances[n].projectId + ':' + instances[n].envId).emit('instanceStateChanged', instances[n]);

																		instances.splice(n, 1);
																		break;
																	}
																}
																if (!found) {
																	var foundInUnManaged = false
																	for (var n = 0; n < unManagedInstances.length; n++) {
																		if (unManagedInstances[n].platformId === awsInstances[m].InstanceId) {
																			unManagedInstances[n].state = awsInstances[m].State.Name;
																			if (unManagedInstances[n].state === 'terminated') {
																				unManagedInstances[n].remove();
																			} else {
																				if (unManagedInstances[n].state === 'running') {
																					unManagedInstances[n].instanceIP = awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress;
																				}
																				unManagedInstances[n].save();
																			}

																			foundInUnManaged = true;
																			unManagedInstances.splice(n, 1);
																			break;
																		}
																	}
																	if (!foundInUnManaged) { //making entry in unmanaged database
																		var os = 'linux';
																		if (awsInstances[m].State.Name !== 'terminated') {
																			if (awsInstances[m].Platform && awsInstances[m].Platform === 'windows') {
																				os = 'windows';
																			}

																			unManagedInstancesDao.createNew({
																				orgId: org.rowid,
																				providerId: provider._id,
																				providerType: 'aws',
																				providerData: {
																					region: region
																				},
																				platformId: awsInstances[m].InstanceId,
																				ip: awsInstances[m].PublicIpAddress || awsInstances[m].PrivateIpAddress,
																				os: os,
																				state: awsInstances[m].State.Name,
																			});
																		}

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

						})(providers[j]);
					}
				});
			})(orgs[i])
		}
	});
}


module.exports = sync;