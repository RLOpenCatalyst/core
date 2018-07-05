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
var BaseNetworkProfileSchema = require('./base-network-profile');
var NetworkProfiles = require('./network-profiles');
var ObjectId = require('mongoose').Types.ObjectId;

// File which contains Network Profile DB schema and DAO methods. 

var GCPNetworkProfileSchema = new BaseNetworkProfileSchema({
    networkDetails: {
        zone: {
            type: String,
            required: true,
            trim: true
        },
        network: {
            type: String,
            trim: true
        },
        subNetwork: {
            type: String,
            trim: true
        },
        accessConfigs: [{
            accessConfigName: String,
            accessConfigType: String,
            _id: false
        }]
    }
});

// Save NetworkProfile
GCPNetworkProfileSchema.statics.saveNetworkProfile = function saveNetworkProfile(networkProfile, callback) {
    var networkProfileObj = new this(networkProfile);
    networkProfileObj.save(function(err, data) {
        if (err) {
            logger.debug("Unable to save networkProfile: ", err);
            return callback(err, null);
        }
        logger.debug("networkProfile saved successfully.", JSON.stringify(data));
        return callback(null, data);
    });
};

GCPNetworkProfileSchema.statics.removeNetworkProfile = function removeNetworkProfile(networkProfileId, callback) {
    this.remove({
        "_id": networkProfileId
    }, function(err, data) {
        if (err) {
            logger.debug("Unable to Remove networkProfile: ", err);
            return callback(err, null);
        }
        logger.debug("networkProfile Removed successfully.");
        return callback(null, data);
    });
};

// Save NetworkProfile
GCPNetworkProfileSchema.statics.updateNetworkProfile = function saveNetworkProfile(networkProfileId, networkProfile, callback) {
    var setData = {};
    var keys = Object.keys(networkProfile);
    for (var i = 0; i < keys.length; i++) {
        setData[keys[i]] = networkProfile[keys[i]];
    }
    this.update({
        "_id": networkProfileId
    }, {
        $set: setData
    }, {
        upsert: false
    }, function(err, updatedRecord) {
        if (err) {
            logger.debug("Unable to update networkProfile: ", err);
            return callback(err, null);
        }
        logger.debug("networkProfile updated successfully.", JSON.stringify(updatedRecord));
        return callback(null, updatedRecord);
    });
};


var GCPNetworkProfile = NetworkProfiles.discriminator('GCPNetworkProfiles', GCPNetworkProfileSchema);
module.exports = GCPNetworkProfile;