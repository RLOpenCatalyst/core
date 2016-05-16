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
var BaseProviderSchema = require('./base-provider');
var Providers = require('./providers');

var GCPProviderSchema = new BaseProviderSchema({
    providerDetails: {
        keyFile: {
            type: String,
            required: true,
            trim: false
        },
        projectId: {
            type: String,
            required: true,
            trim: false
        }
    }
});

GCPProviderSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var GCPProvider = new self(data);
    GCPProvider.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err, null);
        } else {
            return callback(null, GCPProvider);
        }
    });
};

var GCPProvider = Providers.discriminator('Providers', GCPProviderSchema);
module.exports = GCPProvider;