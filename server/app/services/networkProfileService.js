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
//var gcpNetworkProfile = require('_pr/model/network-profile/gcp/gcp-network-profile');
var gcpNetworkProfile ={};
const errorType = 'networkProfile';

var networkProfileService = module.exports = {};

networkProfileService.save = function networkProfileService(nProfile, callback) {
    gcpNetworkProfile.save(nProfile, function(err, gcpData) {
        if (err) {
            var err = new Error('Internal server error');
            err.status = 500;
            return callback(err);
        }
        return callback(null, gcpData);
    });
};
