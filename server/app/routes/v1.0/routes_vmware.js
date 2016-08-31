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


// This file act as a Controller which contains vmware related all end points.


var VMware = require('_pr/lib/vmware');
var logger = require('_pr/logger')(module);
var vmwareCloudProvider = require('_pr/model/classes/masters/cloudprovider/vmwareCloudProvider.js');
var appConfig = require('_pr/config');

module.exports.setRoutes = function(app, verificationFunc) {

	app.all('/vmware/*', verificationFunc);

	var getvmwareprovider = function(providerid, callback) {

		var vmwareconfig = {
			host: "",
			username: "",
			password: "",
			dc: "",
			serviceHost: ""
		};

		vmwareCloudProvider.getvmwareProviderById(providerid, function(err, data) {
			logger.debug('IN getvmwareProviderById: data: ');
			logger.debug(JSON.stringify(data));
			if (data) {
				vmwareconfig.host = data.host;
				vmwareconfig.username = data.username;
				vmwareconfig.password = data.password;
				vmwareconfig.dc = data.dc;
				vmwareconfig.serviceHost = appConfig.vmware.serviceHost;
				logger.debug('IN getvmwareProviderById: vmwareconfig: ');
				logger.debug(JSON.stringify(appConfig.vmware));
				logger.debug(JSON.stringify(vmwareconfig));
			} else {
				vmwareconfig = null;
			}
			callback(null, vmwareconfig);
		});

	}

	app.get('/vmware/:providerid/datastores', function(req, res) {
		logger.debug('Inside vmware get datastores');
		if(req.params.providerid === null){
			logger.debug("Provider Id is pass as Null in params");
			res.status(500).send(req.params.providerid);
			return;
		}
		getvmwareprovider(req.params.providerid, function(err, vmwareconfig) {
			if (vmwareconfig) {
				var vmware = new VMware(vmwareconfig);
				vmware.getDatastores(vmwareconfig.serviceHost, function(err, data) {
					if (!err) {
						try {
							res.send('200', JSON.parse(data));
						} catch (err) {
							res.send('500', null);
						}
					} else {
						logger.debug('Error in datastores query :', err);
						res.send('500', null);
					}
				});
			} else {
				//no provider found.
				logger.debug('No Provider found :');
				res.send('400', 'No Provider found');
			}

		});

	});

	app.put('/vmware/:providerid/:vmname/:action', function(req, res) {
		if (req.params.action) {
			var action = '';
			switch (req.params.action) {
				case "start":
					action = 'poweron';
					break;
				case "stop":
					action = 'poweroff';
					break;
			}
			getvmwareprovider(req.params.providerid, function(err, vmwareconfig) {
				if (vmwareconfig) {
					var vmware = new VMware(vmwareconfig);
					vmware.startstopVM(vmwareconfig.serviceHost, req.params.vmname, action, function(err, data) {
						if (!err) {
							logger.debug('Recvd:', JSON.stringify(JSON.parse(data)));
							res.send('200', JSON.parse(data));
						} else {
							logger.debug('Error in action query :', err);
							res.send('500', null);
						}
					});
				} else {
					//no provider found.
					logger.debug('No Provider found :');
					res.send('400', 'No Provider found');
				}

			});

		} else {
			res.send('400', 'No Action defined');
		}
	});
}