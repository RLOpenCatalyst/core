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
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');

var GCPProviderSchema = new BaseProviderSchema({
    providerDetails: {
        projectId: {
            type: String,
            required: true,
            trim: false
        },
        keyFile: {
            type: String,
            required: true,
            trim: false
        },
        sshPrivateKey: {
            type: String,
            required: true,
            trim: false
        },
        sshPublicKey: {
            type: String,
            required: true,
            trim: false
        }
    }
});

GCPProviderSchema.pre('save', function(next) {
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

    this.providerDetails.keyFile = cryptography.encryptText(this.providerDetails.keyFile,
        cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
    this.providerDetails.sshPublicKey = cryptography.encryptText(this.providerDetails.sshPublicKey,
        cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
    this.providerDetails.sshPrivateKey = cryptography.encryptText(this.providerDetails.sshPrivateKey,
        cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);

    next();
});

GCPProviderSchema.statics.createNew = function createNew(data, callback) {
    var self = this;
    var GCPProvider = new self(data);
    GCPProvider.save(function (err, data) {
        if (err) {
            logger.error(err);
            return callback(err);
        } else {
            return callback(null, GCPProvider);
        }
    });
};

GCPProviderSchema.statics.updateById
    = function updateById(providerId, fields, callback) {
    this.update(
        {_id: providerId},
        fields,
        function(err, result) {
            if (err) {
                return callback(err, null);
            } else if(result.ok == 1 && result.n == 1)  {
                return callback(null, true);
            }
        }
    );
};

var GCPProvider = Providers.discriminator('GCPProviders', GCPProviderSchema);
module.exports = GCPProvider;