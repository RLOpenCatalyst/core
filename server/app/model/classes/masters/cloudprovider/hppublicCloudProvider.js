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


var hppubliccloudProviderSchema = new Schema({
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
    username: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    host: {
        type: String,
        required: true,
        trim: true
    },
    serviceendpoints: {
        compute: {
            type: String,
            trim: true
        },
        network: {
            type: String,
            trim: true
        },
        image: {
            type: String,
            trim: true
        },
        ec2: {
            type: String,
            trim: true
        },
        identity: {
            type: String,
            trim: true
        }
    },
    tenantid: {
        type: String,
        required: true,
        trim: true
    },
    tenantname: {
        type: String,
        required: true,
        trim: true
    },
    projectname: {
        type: String,
        required: true,
        trim: true
    },
    region: {
        type: String,
        required: true,
        trim: true
    },
    keyname: {
        type: String,
        required: true,
        trim: true
    },
    hpFileName: {
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
hppubliccloudProviderSchema.statics.createNew = function(req, providerData, callback) {
    logger.debug("Enter createNew");
    var providerObj = providerData;
    var that = this;
    logger.debug(JSON.stringify(providerObj));
    var provider = new that(providerObj);
    var inFiles = req.files.hpFileName;

    logger.debug('Files found: ' + inFiles.fieldName);

    provider.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug(JSON.stringify(aProvider));
        ProviderUtil.saveAwsPemFiles(aProvider['_id'], inFiles, function(err, flag) {
            if (err) {
                logger.debug("Unable to save pem files.");
                callback(err, null);
                return;
            }
        });
        logger.debug("Exit createNew with provider present");
        callback(null, aProvider);
        return;
    });
};

hppubliccloudProviderSchema.statics.gethppubliccloudProviders = function(callback) {
    logger.debug("Enter gethppubliccloudProviders");
    this.find({
        "id": 9
    }, function(err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers.length) {
            logger.debug("Exit gethppubliccloudProviders with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit gethppubliccloudProviders with no providers present");
            callback(null, null);
            return;
        }

    });
};

hppubliccloudProviderSchema.statics.gethppubliccloudProvidersForOrg = function(orgList, callback) {
    logger.debug("Enter getAWSProvidersForOrg");
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
            logger.debug("Exit gethppubliccloudProvidersForOrg with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit gethppubliccloudProvidersForOrg with no providers present");
            callback(null, null);
            return;
        }

    });
};

hppubliccloudProviderSchema.statics.gethppubliccloudProviderById = function(providerId, callback) {
    logger.debug("Enter getAWSProviderById");
    this.find({
        "_id": new ObjectId(providerId)
    }, function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (aProvider.length) {
            logger.debug("Exit gethppubliccloudProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit gethppubliccloudProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

hppubliccloudProviderSchema.statics.gethppubliccloudProviderByName = function(providerName, orgId, callback) {
    logger.debug("Enter gethppubliccloudProviderById");
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
            logger.debug("Exit gethppubliccloudProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit gethppubliccloudProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

hppubliccloudProviderSchema.statics.updatehppubliccloudProviderById = function(providerId, providerData, callback) {
    logger.debug("Enter updatehppubliccloudProviderById");
    this.update({
        "_id": new ObjectId(providerId)
    }, {
        $set: {
            id: providerData.id,
            providerName: providerData.providerName,
            username: providerData.username,
            password: providerData.password,
            host: providerData.host,
            tenantid: providerData.tenantid,
            tenantname: providerData.tenantname,
            providerType: providerData.providerType,
            keyname: providerData.keyname,
            hpFileName: providerData.hpFileName,
            serviceendpoints: {
                compute: providerData.serviceendpoints.compute,
                network: providerData.serviceendpoints.network,
                image: providerData.serviceendpoints.image,
                ec2: providerData.serviceendpoints.ec2,
                identity: providerData.serviceendpoints.identity
            }
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Exit updatehppubliccloudProviderById with no update.");
            callback(err, null);
            return;
        }

        logger.debug("Exit updatehppubliccloudProviderById with update success.");
        callback(null, updateCount);
        return;

    });
};

hppubliccloudProviderSchema.statics.removehppubliccloudProviderById = function(providerId, callback) {
    logger.debug("Enter removeAWSProviderById");
    this.remove({
        "_id": new ObjectId(providerId)
    }, function(err, deleteCount) {
        if (err) {
            logger.debug("Exit removehppubliccloudProviderById with error.");
            callback(err, null);
            return;
        }
        logger.debug("Exit removehppubliccloudProviderById with delete success.");
        callback(null, deleteCount);
        return;

    });
};

hppubliccloudProviderSchema.statics.gethppubliccloudProvidersByOrgId = function(orgId, callback) {
    logger.debug("Enter gethppubliccloudProvidersByOrgId");
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
            logger.debug("Exit gethppubliccloudProvidersByOrgId with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit gethppubliccloudProvidersByOrgId with no providers present");
            callback(null, null);
            return;
        }

    });
};

var hppubliccloudProvider = mongoose.model('hppubliccloudprovider', hppubliccloudProviderSchema);

module.exports = hppubliccloudProvider;
