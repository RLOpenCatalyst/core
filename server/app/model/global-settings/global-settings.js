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


var logger = require('_pr/logger')(module);
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');

// File which contains GobalSettings DB schema and DAO methods. 

var Schema = mongoose.Schema;

var GlobalSettingsSchema = new Schema({
    authStrategy: {
        local: Boolean,
        externals: Boolean
    },
    addLDAPUser: Boolean,
    ldapServer: {
        url: String,
        userName: String,
        password: String
    },
    kibanaUrl: String,
    zabbixUrl: String,
    jenkinsUrl: String,
    awsUsageUrl: String,
    awsCostUrl: String,
    awsNotificationUrl: String

});

// Get all GobalSettings informations.
GlobalSettingsSchema.statics.getGolbalSettings = function(callback) {
    this.find(function(err, globalSettings) {
        if (err) {
            logger.debug("Got error while fetching GobalSettings: ", err);
            callback(err, null);
        }
        if (globalSettings) {
            logger.debug("Got GobalSettings: ", JSON.stringify(globalSettings));
            callback(null, globalSettings);
        }
    });
};

// Save all GobalSettings informations.
GlobalSettingsSchema.statics.createNew = function(globalSettingsData, callback) {
    var gSettings = new this(globalSettingsData);
    gSettings.save(function(err, globalSettings) {
        if (err) {
            logger.debug("Got error while creating GobalSettings: ", err);
            callback(err, null);
        }
        if (globalSettings) {
            logger.debug("Creating GobalSettings: ", JSON.stringify(globalSettings));
            callback(null, globalSettings);
        }
    });
};

// Update all GobalSettings informations.
GlobalSettingsSchema.statics.updateSettings = function(gSettingsId, globalSettingsData, callback) {

    logger.debug("Going to Update settings data: ", JSON.stringify(globalSettingsData));
    var setData = {};
    var keys = Object.keys(globalSettingsData);
    for (var i = 0; i < keys.length; i++) {
        setData[keys[i]] = globalSettingsData[keys[i]];
    }
    this.update({
        "_id": gSettingsId
    }, {
        $set: setData
    }, {
        upsert: false
    }, function(err, globalSettings) {
        if (err) {
            logger.debug("Got error while creating GobalSettings: ", err);
            callback(err, null);
        }
        if (globalSettings) {
            logger.debug("Updating GobalSettings: ", JSON.stringify(globalSettings));
            callback(null, globalSettings);
        }
    });
};

// Get all GobalSettings informations.
GlobalSettingsSchema.statics.getGolbalSettingsById = function(gSettingsId, callback) {
    this.find({
        "_id": gSettingsId
    }, function(err, globalSettings) {
        if (err) {
            logger.debug("Got error while fetching GobalSettings: ", err);
            callback(err, null);
        }
        if (globalSettings) {
            logger.debug("Got GobalSettings: ", JSON.stringify(globalSettings[0]));
            callback(null, globalSettings[0]);
        }
    });
};

// Save or Update all GobalSettings informations.
GlobalSettingsSchema.statics.updateGlobalSettings = function(globalSettingsData, callback) {
    logger.debug("Going to Update settings data: ", JSON.stringify(globalSettingsData));
    var that = this;
    this.find(function(err, data) {
        if (err) {
            logger.debug("Gote err: ", err);
        }
        if (data.length > 0) {
            this.update({
                "_id": data[0]._id
            }, {
                $set: {
                    authStrategy: globalSettingsData.authStrategy,
                    addLDAPUser: globalSettingsData.addLDAPUser,
                    ldapServer: globalSettingsData.ldapServer,
                    kibanaUrl: globalSettingsData.kibanaUrl,
                    zabbixUrl: globalSettingsData.zabbixUrl,
                    jenkinsUrl: globalSettingsData.jenkinsUrl,
                    awsUsageUrl: globalSettingsData.awsUsageUrl,
                    awsCostUrl: globalSettingsData.awsCostUrl,
                    awsNotificationUrl: globalSettingsData.awsNotificationUrl
                }
            }, {
                upsert: false
            }, function(err, globalSettings) {
                if (err) {
                    logger.debug("Got error while creating GobalSettings: ", err);
                    callback(err, null);
                }
                if (globalSettings) {
                    logger.debug("Updated GobalSettings: ", JSON.stringify(globalSettings));
                    callback(null, globalSettings);
                }
            });
        } else {
            var gSettings = new that(globalSettingsData);
            gSettings.save(function(err, globalSettings) {
                if (err) {
                    logger.debug("Got error while creating GobalSettings: ", err);
                    callback(err, null);
                }
                if (globalSettings) {
                    logger.debug("Creating GobalSettings: ", JSON.stringify(globalSettings));
                    callback(null, globalSettings);
                }
            });
        }
    });
};

// Remove GobalSettings informations.
GlobalSettingsSchema.statics.removeGolbalSettings = function(gSettingsId, callback) {
    this.remove({
        "_id": gSettingsId
    }, function(err, globalSettings) {
        if (err) {
            logger.debug("Got error while removing GobalSettings: ", err);
            callback(err, null);
        }
        if (globalSettings) {
            logger.debug("Remove Success....");
            callback(null, globalSettings);
        }
    });
};

var GobalSettings = mongoose.model("globalSettings", GlobalSettingsSchema);
module.exports = GobalSettings;
