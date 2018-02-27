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


// This file act as a Model which contains provider schema and dao methods.

var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var ObjectId = require('mongoose').Types.ObjectId;
var schemaValidator = require('_pr/model/dao/schema-validator');
var uniqueValidator = require('mongoose-unique-validator');
var ProviderUtil = require('_pr/lib/utils/providerUtil.js');


var Schema = mongoose.Schema;


var azurecloudProviderSchema = new Schema({
	id: {
		type: Number,
		required: true
	},
	providerName: {
		type: String,
		required: true,
		trim: true
	},
	providerType: {
		type: String,
		required: true,
		trim: true
	},
	subscriptionId: {
		type: String,
		required: true,
		trim: true
	},
	clientId: {
		type: String,
		required: true,
		trim: true
	},
	clientSecret: {
		type: String,
		required: true,
		trim: true
	},
	tenant: {
		type: String,
		required: true,
		trim: true
	},
	pemFileName: {
		type: String,
		required: true,
		trim: true
	},
	keyFileName: {
		type: String,
		required: true,
		trim: true
	},
	orgId: {
		type: [String],
		required: true,
		trim: true
	}
});

// Static methods :- 

// creates a new Provider
azurecloudProviderSchema.statics.createNew = function(req, providerData, callback) {
	logger.debug("Enter createNew");
	var providerObj = providerData;
	var that = this;
	logger.debug(JSON.stringify(providerObj));
	var provider = new that(providerObj);

	var inFiles = req.files.azurepem;

	logger.debug('Files found: ' + req.files.azurepem + '::' + req.files.azurekey);

	provider.save(function(err, aProvider) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		logger.debug(JSON.stringify(aProvider));
		var pemId = aProvider['_id'] +'_'+ req.files.azurepem.originalFilename;
		logger.debug("Saving azure pem file with id as:", pemId);
		ProviderUtil.saveAwsPemFiles(pemId, req.files.azurepem, function(err, flag) {
			if (err) {
				logger.debug("Unable to save pem files.");
                callback(err,null);
				return;
			}

			var keyId = aProvider['_id'] +'_'+ req.files.azurekey.originalFilename;
			logger.debug("Saving azure key file with id as:", keyId);
			ProviderUtil.saveAwsPemFiles(keyId, req.files.azurekey, function(err, flag) {
				if (err) {
					logger.debug("Unable to save pem files.");
                    callback(err,null);
					return;
				}

			});

		});
		logger.debug("Exit createNew with provider present");
		callback(null, aProvider);
		return;
	});
};

azurecloudProviderSchema.statics.getAzureCloudProviderByName = function(providerName, orgId, callback) {
	logger.debug("Enter getAzureCloudProviderByName");
	this.find({
		"providerName": providerName,
		"orgId": orgId
	}, function(err, aProvider) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		if (aProvider.length) {
			logger.debug("Exit getAzureCloudProviderByName with provider present");
			callback(null, aProvider[0]);
			return;
		} else {
			logger.debug("Exit getAzureCloudProviderByName with no provider present");
			callback(null, null);
			return;
		}

	});
};

azurecloudProviderSchema.statics.getAzureCloudProviders = function(callback) {
	logger.debug("Enter getAzureCloudProviders");
	this.find({
		"id": 9
	}, function(err, providers) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		if (providers.length) {
			logger.debug("Exit getAzureCloudProviders with providers present");
			callback(null, providers);
			return;
		} else {
			logger.debug("Exit getAzureCloudProviders with no providers present");
			callback(null, null);
			return;
		}
	});
};

azurecloudProviderSchema.statics.getAzureCloudProvidersForOrg = function(orgList, callback) {
	logger.debug("Enter getAzureCloudProvidersForOrg");
	var orgIds = [];
	for (var x = 0; x < orgList.length; x++) {
		orgIds.push(orgList[x].rowid);
	}
	logger.debug("org id: ", orgIds);
	this.find({
		orgId: {
			$in: orgIds
		}
	}, function(err, providers) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		if (providers.length) {
			logger.debug("Exit getAzureCloudProvidersForOrg with providers present");
			callback(null, providers);
			return;
		} else {
			logger.debug("Exit getAzureCloudProvidersForOrg with no providers present");
			callback(null, null);
			return;
		}

	});
};

azurecloudProviderSchema.statics.getAzureCloudProviderById = function(providerId, callback) {
	this.find({
		"_id": new ObjectId(providerId)
	}, function(err, aProvider) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		if (aProvider.length) {
			var p = JSON.stringify(aProvider[0]);
			callback(null, p);
			return;
		} else {
			logger.debug("Exit getAzureCloudProviderById with no provider present");
			callback(null, null);
			return;
		}

	});
};

azurecloudProviderSchema.statics.updateAzureCloudProviderById = function(providerId, providerData, callback) {
	logger.debug("Enter updateAzureCloudProviderById");
	this.update({
		"_id": new ObjectId(providerId)
	}, {
		$set: {
			id: providerData.id,
			providerName: providerData.providerName,
			subscriptionId: providerData.azureSubscriptionId,
			orgId: providerData.orgId,
			clientId: providerData.clientId,
			clientSecret: providerData.clientSecret,
			tenant: providerData.tenant
		}
	}, {
		upsert: false
	}, function(err, updateCount) {
		if (err) {
			logger.debug("Exit updateAzureCloudProviderById with no update.");
			callback(err, null);
			return;
		}
		logger.debug("Exit updateAzureCloudProviderById with update success.");
		callback(null, updateCount);
		return;

	});
};

azurecloudProviderSchema.statics.removeAzureCloudProviderById = function(providerId, callback) {
	logger.debug("Enter removeAzureCloudProviderById");
	this.remove({
		"_id": new ObjectId(providerId)
	}, function(err, deleteCount) {
		if (err) {
			logger.debug("Exit removeAzureCloudProviderById with error.");
			callback(err, null);
			return;
		}
		logger.debug("Exit removeAzureCloudProviderById with delete success.");
		callback(null, deleteCount);
		return;

	});
};


azurecloudProviderSchema.statics.getAzureCloudProvidersByOrgId = function(orgId, callback) {
	logger.debug("Enter getAzureCloudProvidersByOrgId");
	logger.debug("org id: ", orgId);
	this.find({
		orgId: orgId
	}, function(err, providers) {
		if (err) {
			logger.error(err);
			callback(err, null);
			return;
		}
		if (providers.length) {
			logger.debug("Exit getAzureCloudProvidersByOrgId with providers present");
			callback(null, providers);
			return;
		} else {
			logger.debug("Exit getAzureCloudProvidersByOrgId with no providers present");
			callback(null, null);
			return;
		}

	});
};

var azurecloudProvider = mongoose.model('azurecloudprovider', azurecloudProviderSchema);

module.exports = azurecloudProvider;