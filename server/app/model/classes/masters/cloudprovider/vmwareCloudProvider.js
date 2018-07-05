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


var Schema = mongoose.Schema;


var vmwareProviderSchema = new Schema({
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
    dc: {
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
vmwareProviderSchema.statics.createNew = function(providerData, callback) {
    logger.debug("Enter createNew");
    var providerObj = providerData;
    var that = this;
    var provider = new that(providerObj);
    provider.save(function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        logger.debug("Exit createNew with provider present");
        callback(null, aProvider);
        return;
    });
};

vmwareProviderSchema.statics.getvmwareProviders = function(callback) {
    logger.debug("Enter getvmwareProviders");
    this.find({
        "id": 9
    }, function(err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers.length) {
            logger.debug("Exit getvmwareProviders with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getvmwareProviders with no providers present");
            callback(null, null);
            return;
        }

    });
};

vmwareProviderSchema.statics.getvmwareProvidersForOrg = function(orgList, callback) {
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
            logger.debug("Exit getvmwareProvidersForOrg with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getvmwareProvidersForOrg with no providers present");
            callback(null, null);
            return;
        }

    });
};

vmwareProviderSchema.statics.getvmwareProviderById = function(providerId, callback) {
    logger.debug("Enter getvmwareProviderById");
    this.find({
        "_id": new ObjectId(providerId)
    }, function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (aProvider.length) {
            logger.debug("Exit getvmwareProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getvmwareProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

vmwareProviderSchema.statics.getvmwareProviderByName = function(providerName, orgId, callback) {
    logger.debug("Enter getvmwareProviderById");
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
            logger.debug("Exit getvmwareProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getvmwareProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

vmwareProviderSchema.statics.updatevmwareProviderById = function(providerId, providerData, callback) {
    logger.debug("Enter updatevmwareProviderById");
    this.update({
        "_id": new ObjectId(providerId)
    }, {
        $set: {
            id: providerData.id,
            providerName: providerData.providerName,
            username: providerData.username,
            password: providerData.password,
            host: providerData.host,
            dc: providerData.tenantid
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Exit updatevmwareProviderById with no update.");
            callback(err, null);
            return;
        }
        logger.debug("Exit updatevmwareProviderById with update success.");
        callback(null, updateCount);
        return;

    });
};

vmwareProviderSchema.statics.removevmwareProviderById = function(providerId, callback) {
    logger.debug("Enter removeAWSProviderById");
    this.remove({
        "_id": new ObjectId(providerId)
    }, function(err, deleteCount) {
        if (err) {
            logger.debug("Exit removevmwareProviderById with error.");
            callback(err, null);
            return;
        }
        logger.debug("Exit removevmwareProviderById with delete success.");

        callback(null, deleteCount);
        return;

    });
};


vmwareProviderSchema.statics.getvmwareProvidersByOrgId = function(orgId, callback) {
    logger.debug("Enter getvmwareProvidersByOrgId");
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
            logger.debug("Exit getvmwareProvidersByOrgId with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getvmwareProvidersByOrgId with no providers present");
            callback(null, null);
            return;
        }

    });
};

var vmwareProvider = mongoose.model('vmwareProvider', vmwareProviderSchema);

module.exports = vmwareProvider;
