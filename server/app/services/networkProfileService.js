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
var gcpNetworkProfile = require('_pr/model/v2.0/network-profile/gcp-network-profiles.js');
var networkProfilesModel = require('_pr/model/v2.0/network-profile/network-profiles');
const errorType = 'networkProfile';

var networkProfileService = module.exports = {};

networkProfileService.checkIfNetworkProfileExists = function checkIfNetworkProfileExists(networkProfileId, callback) {
    networkProfilesModel.getNetworkProfileById(networkProfileId, function(err, networkProfile) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        } else if (!networkProfile) {
            var err = new Error('NetworkProfile not found');
            err.status = 404;
            return callback(err);
        } else {
            return callback(null, networkProfile);
        }
    });
};

networkProfileService.saveNetworkProfile = function saveNetworkProfile(networkProfile, callback) {
    switch (networkProfile.type) {
        case 'gcp':
            logger.debug('Creating new GCP NetworkProfile');
            gcpNetworkProfile.saveNetworkProfile(networkProfile, callback);
            break;
            defaut: break;
    }
};

networkProfileService.updateNetworkProfile = function updateNetworkProfile(networkProfileId, networkProfile, callback) {
    gcpNetworkProfile.updateNetworkProfile(networkProfileId, networkProfile, callback);
};

networkProfileService.removeNetworkProfile = function removeNetworkProfile(networkProfileId, callback) {
    gcpNetworkProfile.removeNetworkProfile(networkProfileId, callback);
};

networkProfileService.getAllNetworkProfiles = function getAllNetworkProfiles(callback) {
    networkProfilesModel.getAllNetworkProfiles(callback);
}

networkProfileService.getNetworkProfileById = function getNetworkProfileById(networkProfileId, callback) {
    networkProfilesModel.getNetworkProfileById(networkProfileId, function(err, networkProfile) {
        if (err) {
            err.status = 500;
            return callback(err);
        }
        if (!networkProfile) {
            var err = new Error("NetworkProfile Not found");
            err.status = 400;
            return callback(err);
        } else {
            callback(null, networkProfile);
        }
    });
}