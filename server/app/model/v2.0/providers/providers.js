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
var BaseProviderSchema = require('./base-provider');

var ProvidersSchema = new BaseProviderSchema();

ProvidersSchema.statics.getAllByOrgs = function getAllProviders(orgIds, callback) {
    this.find({
          organizationId: {$in: orgIds}
        },
        function(err, providers) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else {
                return callback(null, providers);
            }
        }
    );
};

ProvidersSchema.statics.updateById
    = function updateById(providerId, fields, callback) {
    this.update(
        {_id: providerId},
        { $set: fields },
        function(err, result) {
            if (err) {
                return callback(err, null);
            } else if(result.ok == 1 && result.n == 1)  {
                return callback(null, true);
            }
        }
    );
};

ProvidersSchema.statics.getById = function getById(providerId, callback) {
    this.find(
        {'_id': providerId, 'isDeleted': false },
        function(err, providers) {
            if (err) {
                logger.error(err);
                return callback(err, null);
            } else if(providers && providers.length > 0){
                return callback(null, providers[0]);
            } else {
                return callback(null, null);
            }
        }
    );
};

var Providers = mongoose.model('Providers', ProvidersSchema);
module.exports = Providers;