/*
Copyright [2016] [Relevance Lab]
loLicensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var aws = require('aws-sdk');
var logger = require('_pr/logger')(module);

if (process.env.http_proxy) {
	aws.config.update({
		httpOptions: {
			proxy: process.env.http_proxy
		}
	});
}

var instanceStateList = {
	RUNNING: 'running',
	STOPPED: 'stopped',
	TERMINATED: 'terminated',
	PENDING: 'pending'
}

var EC2 = function(awsSettings) {

	var that = this;
	var params = new Object();

	if (typeof awsSettings.region !== undefined) {
		params.region = awsSettings.region;
	}

	if (typeof awsSettings.isDefault !== undefined && awsSettings.isDefault === true) {
		params.credentials = new aws.EC2MetadataCredentials({httpOptions: {timeout: 5000}});
	} else if (typeof awsSettings.access_key !== undefined && typeof awsSettings.secret_key !== undefined) {
		params.accessKeyId = awsSettings.access_key;
		params.secretAccessKey = awsSettings.secret_key;
	}

	var ec = new aws.EC2(params);

	this.describeInstances = function(instanceIds, callback) {
		//logger.debug('fetching instances for ==>',instanceIds);
		var options = {};

		if (instanceIds && instanceIds.length) {
			options.InstanceIds = instanceIds;
		} else {
			options.MaxResults = 1000;
		}
		ec.describeInstances(options, function(err, data) {
			if (err) {
				logger.debug("Got instanceState info with error: ", err);
				callback(err, null);
				return;
			}
			callback(null, data);
		});

	};

	this.getInstanceState = function(instanceId, callback) {
		this.describeInstances([instanceId], function(err, data) {
			if (err) {
				logger.debug("error occured while checking instance state. instance Id ==> " + instanceId);
				callback(err, null);
				return;
			}
			if (data.Reservations.length && data.Reservations[0].Instances.length) {
				var instanceState = data.Reservations[0].Instances[0].State.Name
				logger.debug("instance state ==> " + instanceState);
				callback(null, instanceState);
			} else {
				callback(true, null);
			}

		});
	};



	this.launchInstance = function(image_id, intanceType, securityGroupIds, subnetId, instanceName, keyPairName, instanceCount, callback) {
		logger.debug("SecurityGroupIds and SubnetId %s %s ", securityGroupIds, subnetId);
		var that = this; //"m1.small"
		var param = {
			ImageId: image_id,
			/* required */
			MaxCount: parseInt(instanceCount),
			/* required */
			MinCount: 1,
			/* required */
			InstanceType: intanceType,
			/* required */
			KeyName: keyPairName,
			/* required */
			SecurityGroupIds: securityGroupIds,
			/* required */
			SubnetId: subnetId /* required if use vpc*/
		};

		ec.runInstances(param, function(err, data) {
			if (err) {
				logger.debug("error occured while launching instance");
				logger.debug(err);
				callback(err, null);
				return;
			}


			for (var j = 0; j < data.Instances.length; j++) {
				var params = {
					Resources: [data.Instances[j].InstanceId],
					Tags: [{
						Key: 'Name',
						Value: instanceName
					}]
				};
				ec.createTags(params, function(err) {
					logger.debug("Tagging instance", err ? "failure" : "success");
				});
				if (j >= data.Instances.length - 1)
					callback(null, data.Instances);
			}

		});
	};

	this.waitForInstanceRunnnigState = function(instanceId, callback) {

		function timeoutFunc(instanceId) {
			logger.debug("checking state of instance ==> " + instanceId);
			var t_timeout = setTimeout(function() {
				ec.describeInstances({
					InstanceIds: [instanceId]
				}, function(err, data) {
					if (err) {
						logger.debug("error occured while checking instance state. instance Id ==> " + instanceId);
						callback(err, null);
						return;
					}
					var instanceState = data.Reservations[0].Instances[0].State.Name
					logger.debug("instance state ==> " + instanceState);
					if (instanceState === instanceStateList.RUNNING) {
						logger.debug("instance has started running ");
						var instanceData = data.Reservations[0].Instances[0];
						callback(null, instanceData);

					} else if (instanceState === instanceStateList.PENDING) {
						timeoutFunc(instanceId);
					} else if (instanceState === instanceStateList.TERMINATED) {
						callback({
							"err": "Instance Terminated"
						});
					}
				});
			}, 30000);
		}
		timeoutFunc(instanceId);
	};

	function pollInstanceState(instanceId, state, callback) {
		function checkInstanceStatus(statusToCheck, delay) {
			var timeout = setTimeout(function() {
				that.getInstanceState(instanceId, function(err, instanceState) {
					if (err) {
						logger.debug('Unable to get instance state', err);
						callback(err, null);
						return;
					}
					if (statusToCheck === instanceState) {
						callback(null, instanceState);
					} else {
						checkInstanceStatus(state, 5000);
					}
				});
			}, delay);
		}
		checkInstanceStatus(state, 1);
	}

	this.stopInstance = function(instanceIds, callback) {
		ec.stopInstances({
			InstanceIds: instanceIds
		}, function(err, data) {
			if (err) {
				logger.debug("unable to stop instance : " + instanceIds);
				logger.debug(err);
				callback(err, null)
				return;
			}
			/*logger.debug("number of instances stopped " + data.StoppingInstances.length);
			callback(null, data.StoppingInstances);*/
			pollInstanceState(instanceIds[0], instanceStateList.STOPPED, function(err, state) {
				if (err) {
					callback(err, null)
					return;
				}
				callback(null,state);
			});

		});
	}

	this.startInstance = function(instanceIds, callback) {
		ec.startInstances({
			InstanceIds: instanceIds
		}, function(err, data) {
			if (err) {
				logger.debug("unable to start instances : " + instanceIds);
				logger.debug(err);
				callback(err, null)
				return;
			}
			/*logger.debug("number of instances stopped " + data.StartingInstances.length);
			callback(null, data.StartingInstances);*/
			pollInstanceState(instanceIds[0], instanceStateList.RUNNING, function(err, state) {
				if (err) {
					callback(err, null)
					return;
				}
				callback(null,state);
			});

		});
	}

	this.rebootInstance = function(instanceIds, callback, onStateChangedCompleteCallback) {
		ec.rebootInstances({
			InstanceIds: instanceIds
		}, function(err, data) {
			if (err) {
				logger.debug("unable to reboot instance : " + instanceIds);
				logger.debug(err);
				callback(err, null)
				return;
			}
			logger.debug("number of instances stopped " + data.length);
			callback(null, data);
			pollInstanceState(instanceIds[0], instanceStateList.RUNNING, function(err, state) {
				onStateChangedCompleteCallback(err, state);
			});

		});
	};

	this.terminateInstance = function(instanceIds, callback, onStateChangedCompleteCallback) {
		ec.terminateInstances({
			InstanceIds: instanceIds
		}, function(err, data) {
			if (err) {
				logger.debug("unable to terminate instance : " + instanceId);
				logger.debug(err);
				callback(err, null)
				return;
			}
			callback(null, data);

			pollInstanceState(instanceIds[0], instanceStateList.TERMINATED, function(err, state) {
				onStateChangedCompleteCallback(err, state);
			});
		});
	};


	this.getSecurityGroups = function(callback) {
		ec.describeSecurityGroups({}, function(err, data) {
			if (err) {
				logger.debug(err);
				callback(err, null);
				return;
			}
			callback(null, data.SecurityGroups);
		});
	}

	this.checkImageAvailability = function(imageid, callback) {
		var params = {
			ImageIds: [imageid]
		};
		ec.describeImages(params, function(err, data) {
			if (err) {
				logger.debug("Unable to describeImages from AWS.", err);
				callback(err, null);
				return;
			}
			logger.debug("Success to Describe Images from AWS.");
			callback(null, data);
		});
	}

	this.describeKeyPairs = function(callback) {

		ec.describeKeyPairs({}, function(err, data) {
			if (err) {
				logger.debug("Unable to describeKeyPairs from AWS.", err);
				callback(err, null);
				return;
			}
			logger.debug("Success to Describe KeyPairs from AWS.");
			callback(null, data);
		});
	}
	this.describeVpcs = function(callback) {

		ec.describeVpcs({}, function(err, data) {
			if (err) {
				logger.debug("Unable to describeVpcs from AWS.", err);
				callback(err, null);
				return;
			}
			logger.debug("Success to Describe Vpcs from AWS.");
			callback(null, data);
		});
	}

	this.describeSubnets = function(vpcId, callback) {
		var params = {
			Filters: [{
				Name: 'vpc-id',
				Values: [vpcId]
			}]
		};
		ec.describeSubnets(params, function(err, data) {
			if (err) {
				logger.debug("Unable to describeSubnets from AWS.", err);
				callback(err, null);
				return;
			}
			logger.debug("Success to describeSubnets from AWS.");
			callback(null, data);
		});
	}

	this.getSecurityGroupsForVPC = function(vpcId, callback) {
		var params = {
			Filters: [{
				Name: 'vpc-id',
				Values: [vpcId]
			}]
		};
		ec.describeSecurityGroups(params, function(err, data) {
			if (err) {
				logger.debug(err);
				callback(err, null);
				return;
			}
			callback(null, data.SecurityGroups);
		});
	};

	this.waitForEvent = function(instanceId, eventName, callback) {
		logger.debug("waiting for ==> ", instanceId, eventName);
		ec.waitFor(eventName, {
			InstanceIds: [instanceId]
		}, function(err, data) {
			if (err) {
				logger.debug(err, err.stack); // an error occurred
				callback(err, null);
			} else {
				logger.debug(data);
				callback(null, data);
			} // successful response
		});
	};

	this.listInstances = function(callback) {
		ec.describeInstances(function(err, instances) {
			if (err) {
				logger.debug("Error occurred for listing aws instances: ", err);
				callback(err, null);
			} else {
				logger.debug("Able to list all aws instances: ");
				callback(null, instances);
			}
		});
	};

	this.listActiveInstances = function(callback) {
		var params = {
			Filters: [{
					Name: 'instance-state-name',
					Values: ['running']
				}
				// ,{
				//     Name: 'key-name',
				//     Values: ['GoldenDemo']
				// }
			]
		};
		ec.describeInstances(params, function(err, instances) {
			if (err) {
				logger.debug("Error occurred for listing aws instances: ", err);
				callback(err, null);
			} else {
				logger.debug("Able to list all aws instances: ");
				callback(null, instances);
			}
		});
	};

	this.createTags = function(instanceId, tags, callback) {
		var tagsArray = [];
		for(var key in tags) {
			tagsArray.push({
				Key: key,
				Value: tags[key]
			});
		}
		var params = {
			Resources: [
				instanceId
			],
			Tags: tagsArray
		}
		ec.createTags(params, function(err, instanceData) {
			if(err) {
				callback(err);
			} else {
				callback(null, instanceData);
			}
		});
	}
}

module.exports = EC2;