/*
Copyright [2019] [Relevance Lab]

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


var digitalOceanProviderSchema = new Schema({
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
    token: {
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
digitalOceanProviderSchema.statics.createNew = function(providerData, callback) {
    logger.debug("Enter createNew");
    var providerObj = providerData;
    var that = this;
    var provider = new that(providerData);
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

digitalOceanProviderSchema.statics.getdigitalOceanProviders = function(providerName, orgId, callback) {
    logger.debug("Enter getdigitalOceanProviderById");
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
            logger.debug("Exit getdigitalOceanProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getdigitalOceanProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};
digitalOceanProviderSchema.statics.getDigitalOceanProvidersForOrg = function (orgList, callback) {
    logger.debug("Enter getdigitalOceanProvidersForOrg");
    var orgIds = [];
    for (var x = 0; x < orgList.length; x++) {
        orgIds.push(orgList[x].rowid);
    }
    logger.debug("org id: ", orgIds);
    this.find({
        orgId: {
            $in: orgIds
        }
    }, function (err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers.length) {
            logger.debug("Exit getdigitalOceanProvidersForOrg with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getdigitalOceanProvidersForOrg with no providers present");
            callback(null, null);
            return;
        }

    });
};

digitalOceanProviderSchema.statics.getDigitalOceanProviderById = function(providerId, callback) {
    logger.debug("Enter getDigitalOceanProviderById");
    this.find({
        "_id": new ObjectId(providerId)
    }, function(err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (aProvider.length) {
            logger.debug("Exit getDigitalOceanProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getDigitalOceanProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

digitalOceanProviderSchema.statics.getDigitalOceanProvidersByOrgId = function (orgId, callback) {
    logger.debug("Enter getDigitalOceanProvidersByOrgId");
    logger.debug("org id: ", orgId);
    this.find({
        orgId: orgId
    }, function (err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers) {
            logger.debug("Exit getDigitalOceanProvidersByOrgId with providers present---------", providers);
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getDigitalOceanProvidersByOrgId with no providers present");
            callback(null, []);
            return;
        }

    });
};

//     });
// };

// digitalOceanProviderSchema.statics.getopenstackProviderByName = function(providerName, orgId, callback) {
//     logger.debug("Enter getopenstackProviderById");
//     this.find({
//         "providerName": providerName,
//         "orgId": orgId
//     }, function(err, aProvider) {
//         if (err) {
//             logger.error(err);
//             callback(err, null);
//             return;
//         }
//         if (aProvider.length) {
//             logger.debug("Exit getopenstackProviderById with provider present");
//             callback(null, aProvider[0]);
//             return;
//         } else {
//             logger.debug("Exit getopenstackProviderById with no provider present");
//             callback(null, null);
//             return;
//         }

//     });
// };

digitalOceanProviderSchema.statics.updatedigitalOceanProviderById = function(providerId, providerData, callback) {
    logger.debug("Enter updatedigitalOceanProviderById");
    this.update({
        "_id": new ObjectId(providerId)
    }, {
        $set: {
            id: providerData.id,
            providerName: providerData.providerName,
            token:providerData.token
        }
    }, {
        upsert: false
    }, function(err, updateCount) {
        if (err) {
            logger.debug("Exit updatedigitalOceanProviderById with no update.");
            callback(err, null);
            return;
        }
        logger.debug("Exit updatedigitalOceanProviderById with update success.");
        callback(null, updateCount);
        return;

    });
};

digitalOceanProviderSchema.statics.removedigitalOceanProviderById = function(providerId, callback) {
    logger.debug("Enter removedigitalOceanProviderById");
    this.remove({
        "_id": new ObjectId(providerId)
    }, function(err, deleteCount) {
        if (err) {
            logger.debug("Exit removedigitalOceanProviderById with error.");
            callback(err, null);
            return;
        }
        logger.debug("Exit removedigitalOceanProviderById with delete success.");
        callback(null, deleteCount);
        return;

    });
};


var digitalOceanProvider = mongoose.model('digitalOceanProvider', digitalOceanProviderSchema);

module.exports = digitalOceanProvider;