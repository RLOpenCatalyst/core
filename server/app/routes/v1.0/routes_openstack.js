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


// This file act as a Controller which contains openstack related all end points.

var Openstack = require('_pr/lib/openstack');
var logger = require('_pr/logger')(module);
var openstackProvider = require('_pr/model/classes/masters/cloudprovider/openstackCloudProvider.js');
var VMImage = require('_pr/model/classes/masters/vmImage.js');
var uuid = require('node-uuid');

module.exports.setRoutes = function(app, verificationFunc) {

	app.all('/openstack/*', verificationFunc);

	var getopenstackprovider = function(providerid, callback) {
		var openstackconfig = {
			host: "",
			username: "",
			password: "",
			tenantName: "",
			tenantId: "",
			serviceendpoints: {}
		};

		openstackProvider.getopenstackProviderById(providerid, function(err, data) {
			logger.debug('IN getopenstackProviderById: data: ');
			if (data) {
				openstackconfig.host = data.host;
				openstackconfig.username = data.username;
				openstackconfig.password = data.password;
				openstackconfig.tenantName = data.tenantname;
				openstackconfig.tenantId = data.tenantid;
				openstackconfig.serviceendpoints = data.serviceendpoints;
				logger.debug('IN getopenstackProviderById: openstackconfig: ', JSON.stringify(openstackconfig));
				callback(null, openstackconfig);

			} else {
				callback(null, null);
			}
		});

	}

	app.get('/openstack/:providerid/projects', function(req, res) {
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);

			openstack.getProjects(function(err, projects) {
				if (err) {
					logger.error('openstack tenants fetch error', err);
					res.status(500).send(err.error.message);
					return;
				}

				res.send(projects);
			});
		});
	});


	app.get('/openstack/:providerid/tenants', function(req, res) {
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {
			if (openstackconfig) {
				var openstack = new Openstack(openstackconfig);

				openstack.getTenants(function(err, tenants) {
					if (err) {
						logger.error('openstack tenants fetch error', err);
						res.status(500).send(err.error.message);
						return;
					}

					res.send(tenants);
				});
			} else {
				res.status(404).send("Provider not found");
				return;
			}
		});
	});

	app.get('/openstack/:providerid/images', function(req, res) {
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);

			openstack.getImages(openstackconfig.tenantid, function(err, images) {
				if (err) {
					logger.error('openstack images fetch error', err);
					res.status(500).send(err.error.message);
					return;
				}

				res.send(images);
			});
		});
	});

	app.get('/openstack/:providerid/:tenantId/servers', function(req, res) {
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);

			openstack.getServers(openstackconfig.tenantid, function(err, servers) {
				if (err) {
					logger.error('openstack servers fetch error', err);
					res.status(500).send(err);
					return;
				}

				res.send(servers);
			});
		});
	});

	app.get('/openstack/:providerid/networks', function(req, res) {
		logger.debug('Inside openstack get networks:');
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {
			var openstack = new Openstack(openstackconfig);
			if (openstackconfig.serviceendpoints.network) {
				openstack.getNetworks(function(err, networks) {
					if (err) {
						logger.error('openstack networks fetch error', err);
						res.status(500).send(err);
						return;
					}
					res.send(networks);
					logger.debug('Exit openstack get networks' + JSON.stringify(networks));
				});
			} else {
				res.send([]);
			}
		});
	});

	app.get('/openstack/:providerid/networks/:networkId', function(req, res) {
		logger.debug('Inside openstack get networks:');
		if(req.params.providerid === null || req.params.networkId){
			logger.debug("Provider Id or Network Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);
			if (openstackconfig.serviceendpoints.network) {
				openstack.getNetworks(function(err, networks) {
					if (err) {
						logger.error('openstack networks fetch error', err);
						res.status(500).send(err);
						return;
					}
					networks = networks.networks;
					if (networks) {
						for (var i = 0; i < networks.length; i++) {
							if (networks[i].id === req.params.networkId) {
								res.status(200).send(networks[i]);
								return;
							}
						}

					}
					res.status(404).send({
						message: "Network not found"
					});

				});
			} else {
				res.send([]);
			}
		});
	});

	app.get('/openstack/:providerid/flavors', function(req, res) {
		logger.debug('Inside openstack get flavors');
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);

			openstack.getFlavors(openstackconfig.tenantId, function(err, flavors) {
				if (err) {
					logger.error('openstack flavors fetch error', err);
					res.status(500).send(err);
					return;
				}

				res.send(flavors);
				logger.debug('Exit openstack get flavors' + JSON.stringify(flavors));
			});
		});
	});

	app.get('/openstack/:providerid/flavors/:flavorId', function(req, res) {
		logger.debug('Inside openstack get flavors');
		if(req.params.providerid === null || req.params.flavorId === null){
			logger.debug("Provider Id or Flavor Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);

			openstack.getFlavors(openstackconfig.tenantId, function(err, flavors) {
				if (err) {
					logger.error('openstack flavors fetch error', err);
					res.status(500).send(err);
					return;
				}

				flavors = flavors.flavors;
				if (flavors) {
					for (var i = 0; i < flavors.length; i++) {
						if (flavors[i].id === req.params.flavorId) {
							res.status(200).send(flavors[i]);
							return;
						}
					}
				}
				res.status(404).send({
					message: "flavor not found"
				});


				res.send(flavors);
				//logger.debug('Exit openstack get flavors' + JSON.stringify(flavors));
			});
		});
	});


	app.get('/openstack/:providerid/securityGroups', function(req, res) {
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);
			if (openstackconfig.serviceendpoints.network) {
				openstack.getSecurityGroups(function(err, securityGroups) {
					if (err) {
						logger.error('openstack securityGroups fetch error', err);
						res.status(500).send(err);
						return;
					}

					res.send(securityGroups);
					logger.debug('Exit openstack get securityGroups' + JSON.stringify(securityGroups));
				});
			} else {
				res.send([]);
			}
		});
	});

	app.get('/openstack/:providerid/securityGroups/:securityGroupId', function(req, res) {
		if(req.params.providerid === null || req.params.securityGroupId === null){
			logger.debug("Provider Id or Security Group Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);
			if (openstackconfig.serviceendpoints.network) {
				openstack.getSecurityGroups(function(err, securityGroups) {
					if (err) {
						logger.error('openstack securityGroups fetch error', err);
						res.status(500).send(err);
						return;
					}
                    //res.status(200).send(securityGroups);

					securityGroups = securityGroups.security_groups;
					if (securityGroups) {
						for (var i = 0; i < securityGroups.length; i++) {
							if (securityGroups[i].id === req.params.securityGroupId) {
								res.status(200).send(securityGroups[i]);
								return;
							}
						}
					}
					res.status(404).send({
						message: "security group not found"
					});



				});
			} else {
				res.send([]);
			}
		});
	});


	app.post('/openstack/:providerid/:tenantId/createServer', function(req, res) {
		var providerId = req.params.providerid;
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {
			logger.debug('Openstackconfig', openstackconfig);
			var openstack = new Openstack(openstackconfig);
			VMImage.getImageByProviderId(providerId, function(err, images) {
				if (err) {
					logger.error("Failed to fetch vmimages: ", err);
					res.status(500).send("Failed to fetch vmimages.");
					return;
				}
				if (images.length) {
					var opnstackBody = {
						server: {
							name: "server-test",
							imageRef: images[0].imageIdentifier,
							flavorRef: 2,
							max_count: 1,
							min_count: 1,
							networks: [{
								uuid: uuid.v4()
							}],
							security_groups: [{
								name: "default"
							}]
						}
					};
					openstack.createServer(openstackconfig.tenantId, JSON.stringify(opnstackBody.server), function(err, data) {
						if (err) {
							logger.error('openstack createServer error', err);
							res.status(500).send(err);
							return;
						}

						res.send(data);
						return;
					});
				} else {
					res.status(404).send("Image not found.");
					return;
				}
			});
		});

	});

	app.get('/openstack/:providerid/tenants/:tenantId/servers/:serverId', function(req, res) {
		if(req.params.providerid === null || req.params.tenantId === null || req.params.serverId === null){
			logger.debug("Provider Id or Tenant Id or Server Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getopenstackprovider(req.params.providerid, function(err, openstackconfig) {

			var openstack = new Openstack(openstackconfig);
			logger.debug("serverId:", req.params.serverId);

			openstack.getServerById(req.params.tenantId, req.params.serverId, function(err, data) {
				if (err) {
					logger.error('openstack createServer error', err);
					res.status(500).send(err);
					return;
				}

				res.send(data);
			});

		});
	});

}