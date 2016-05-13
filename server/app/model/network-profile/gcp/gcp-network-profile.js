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
var schemaValidator = require('_pr/model/utils/schema-validator');

// File which contains Network Profile DB schema and DAO methods. 

var Schema = mongoose.Schema;

var GCPNPSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    providerId: {
        type: String,
        required: true,
        trim: true
    },
    network: {
        type: String,
        required: true,
        trim: true
    },
    accessConfigs: {
        type: [{}]
    },
    accessConfigName: {
        type: String,
        trim: true
    },
    accessConfigType: {
        type: String,
        trim: true
    }
});

// Save NetworkProfile
GCPNPSchema.statics.save = function save(networkProfile callback) {
    var nProfile = new this(networkProfile);
    nProfile.save(function(err, data) {
        if (err) {
            logger.debug("Unable to save networkProfile: ", err);
            callback(err, null);
            return;
        }
        logger.debug("networkProfile saved successfully.");
        callback(null, data);
        return;
    });
};

var GCPNetworkProfile = mongoose.model("gcpNetworkProfile", GCPNPSchema);
module.exports = GCPNetworkProfile;
