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


var awsProviderSchema = new Schema({
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
    accessKey: {
        type: String,
        required: false,
        trim: true
    },
    secretKey: {
        type: String,
        required: false,
        trim: true
    },
    isDefault: {
        type: Boolean,
        required: true,
        trim: false,
        default: false
    },
    orgId: {
        type: [String],
        required: true,
        trim: true
    },
    s3BucketName: {
        type: String,
        required: false,
        trim: true
    },
    lastBillUpdateTime: {
        type: Number,
        required: false
    },
    plannedCost: {
        type: Number,
        required: false,
        default: 0.0
    }
});
awsProviderSchema.path('plannedCost').get(function (num) {
    return (num).toFixed(2);
});

// Static methods :-

// creates a new Provider
awsProviderSchema.statics.createNew = function (providerData, callback) {
    logger.debug("Enter createNew");
    var providerObj = providerData;
    var that = this;
    var provider = new that(providerObj);
    provider.save(function (err, aProvider) {
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

awsProviderSchema.statics.getAWSProviders = function (callback) {
    logger.debug("Enter getAWSProviders");
    this.find(function (err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }

        logger.debug("Exit getAWSProviders with providers present");
        callback(null, providers);
        return;

    });
};

awsProviderSchema.statics.getAWSProvidersForOrg = function (orgList, callback) {
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
    }, function (err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers.length) {
            logger.debug("Exit getAWSProvidersForOrg with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getAWSProvidersForOrg with no providers present");
            callback(null, null);
            return;
        }

    });
};

awsProviderSchema.statics.getAWSProviderById = function (providerId, callback) {
    logger.debug("Enter getAWSProviderById");
    if (!providerId) {
        process.nextTick(function () {
            callback({
                message: "Invalid provider Id"
            });
        });
        return;
    }
    this.find({
        "_id": new ObjectId(providerId)
    }, function (err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (aProvider.length) {
            logger.debug("Exit getAWSProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getAWSProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

awsProviderSchema.statics.getAWSProviderByName = function (providerName, orgId, callback) {
    logger.debug("Enter getAWSProviderById");
    this.find({
        "providerName": providerName,
        "orgId": orgId
    }, function (err, aProvider) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (aProvider.length) {
            logger.debug("Exit getAWSProviderById with provider present");
            callback(null, aProvider[0]);
            return;
        } else {
            logger.debug("Exit getAWSProviderById with no provider present");
            callback(null, null);
            return;
        }

    });
};

awsProviderSchema.statics.updateAWSProviderById = function (providerId, providerData, callback) {
    logger.debug("Enter updateAWSProviderById");
    this.update({
        "_id": new ObjectId(providerId)
    }, {
        $set: {
            id: providerData.id,
            providerName: providerData.providerName,
            accessKey: providerData.accessKey,
            secretKey: providerData.secretKey,
            s3BucketName: providerData.s3BucketName,
            plannedCost: providerData.plannedCost
        }
    }, {
        upsert: false
    }, function (err, updateCount) {
        if (err) {
            logger.debug("Exit updateAWSProviderById with no update.");
            callback(err, null);
            return;
        }
        logger.debug("Exit updateAWSProviderById with update success.");
        callback(null, updateCount);
        return;

    });
};

awsProviderSchema.statics.updateLastBillUpdateTime = function (providerId, billUpdateTime, callback) {
    this.update({
        "_id": new ObjectId(providerId)
    }, {
        $set: {
            lastBillUpdateTime: billUpdateTime
        }
    }, {
        upsert: false
    }, function (err, updateCount) {
        if (err) {
            return callback(err, null);
        }

        return callback(null);
    });
};

awsProviderSchema.statics.removeAWSProviderById = function (providerId, callback) {
    logger.debug("Enter removeAWSProviderById");
    this.remove({
        "_id": new ObjectId(providerId)
    }, function (err, deleteCount) {
        if (err) {
            logger.debug("Exit removeAWSProviderById with error.");
            callback(err, null);
            return;
        }
        logger.debug("Exit removeAWSProviderById with delete success.");
        callback(null, deleteCount);
        return;

    });
};

awsProviderSchema.statics.getAWSProvidersByOrgId = function (orgId, callback) {
    logger.debug("Enter getAWSProvidersByOrgId");
    logger.debug("org id: ", orgId);
    this.find({
        orgId: orgId
    }, function (err, providers) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
        if (providers.length) {
            logger.debug("Exit getAWSProvidersByOrgId with providers present");
            callback(null, providers);
            return;
        } else {
            logger.debug("Exit getAWSProvidersByOrgId with no providers present");
            callback(null, []);
            return;
        }

    });
};

awsProviderSchema.statics.hasDefault = function hasDefault(orgId, callback) {
    logger.debug("organization id: ", orgId);
    this.find({orgId: orgId, isDefault: true}).then(function (providers) {
        if (providers.length) {
            logger.debug("Default user present for organization ", orgId);
            callback(null, true);
            return;
        } else {
            logger.debug("Default user not present for organization ", orgId);
            callback(null, false);
            return;
        }
    }, function (error) {
        if (err) {
            logger.error(err);
            callback(err, null);
            return;
        }
    });
};




var AWSProvider = mongoose.model('AWSProvider', awsProviderSchema);

module.exports = AWSProvider;
