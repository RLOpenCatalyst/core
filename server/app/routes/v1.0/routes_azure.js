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

// This file act as a Controller which contains azure related all end points.


var AzureCloud = require('_pr/lib/azure');
var logger = require('_pr/logger')(module);
var xml2json = require('xml2json');
var azureProvider = require('_pr/model/classes/masters/cloudprovider/azureCloudProvider.js');
var fs = require('fs');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');
var uuid = require('node-uuid');

module.exports.setRoutes = function(app, verificationFunc) {

    app.all('/azure/*', verificationFunc);

    app.get('/azure/:id/networks', function(req, res) {

        logger.debug('Inside azure get networks');
        logger.debug('Provider id:', req.params.id);

        azureProvider.getAzureCloudProviderById(req.params.id, function(err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ' + err);
                return;
            }

            logger.debug('providerdata:', providerdata);
            providerdata = JSON.parse(providerdata);

            var settings = appConfig;
            var pemFile = settings.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
            var keyFile = settings.instancePemFilesDir + providerdata._id + providerdata.keyFileName;


            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

            var uniqueVal = uuid.v4().split('-')[0];

            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';

            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function(err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    return;
                }

                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function(err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        return;
                    }

                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile
                    };

                    var azureCloud = new AzureCloud(options);

                    azureCloud.getNetworks(function(err, networks) {
                        if (err) {
                            logger.error('azurecloud networks fetch error', err);
                            res.status(500).send(err);
                            return;
                        }
                        var json = xml2json.toJson(networks);
                        res.send(json);
                        logger.debug('Exit azure get networks:' + JSON.stringify(networks));

                        fs.unlink(decryptedPemFile, function(err) {
                            logger.debug("Deleting decryptedPemFile..");
                            if (err) {
                                logger.error("Error in deleting decryptedPemFile..");
                            }

                            fs.unlink(decryptedKeyFile, function(err) {
                                logger.debug("Deleting decryptedKeyFile ..");
                                if (err) {
                                    logger.error("Error in deleting decryptedKeyFile..");
                                }
                            });
                        });
                    });
                });
            });

        });
    });

    app.get('/azure/:id/locations', function(req, res) {

        logger.debug('Inside azure get locations');
        logger.debug('Provider Id:', req.params.id);

        azureProvider.getAzureCloudProviderById(req.params.id, function(err, providerdata) {
            if (err) {
                logger.error('getAzureCloudProviderById ' + err);
                return;
            }

            logger.debug('providerdata:', providerdata);
            providerdata = JSON.parse(providerdata);

            var settings = appConfig;
            var pemFile = settings.instancePemFilesDir + providerdata._id + providerdata.pemFileName;
            var keyFile = settings.instancePemFilesDir + providerdata._id + providerdata.keyFileName;


            var cryptoConfig = appConfig.cryptoSettings;
            var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

            var uniqueVal = uuid.v4().split('-')[0];

            var decryptedPemFile = pemFile + '_' + uniqueVal + '_decypted';
            var decryptedKeyFile = keyFile + '_' + uniqueVal + '_decypted';

            cryptography.decryptFile(pemFile, cryptoConfig.decryptionEncoding, decryptedPemFile, cryptoConfig.encryptionEncoding, function(err) {
                if (err) {
                    logger.error('Pem file decryption failed>> ', err);
                    return;
                }

                cryptography.decryptFile(keyFile, cryptoConfig.decryptionEncoding, decryptedKeyFile, cryptoConfig.encryptionEncoding, function(err) {
                    if (err) {
                        logger.error('key file decryption failed>> ', err);
                        return;
                    }

                    var options = {
                        subscriptionId: providerdata.subscriptionId,
                        certLocation: decryptedPemFile,
                        keyLocation: decryptedKeyFile
                    };

                    var azureCloud = new AzureCloud(options);

                    azureCloud.getLocations(function(err, locations) {
                        if (err) {
                            logger.error('azurecloud locations fetch error', err);
                            res.status(500).send(err);
                            return;
                        }
                        var json = xml2json.toJson(locations);
                        res.send(json);
                        logger.debug('Exit azure get locations:' + JSON.stringify(locations));

                        fs.unlink(decryptedPemFile, function(err) {
                            logger.debug("Deleting decryptedPemFile..");
                            if (err) {
                                logger.error("Error in deleting decryptedPemFile..");
                            }

                            fs.unlink(decryptedKeyFile, function(err) {
                                logger.debug("Deleting decryptedKeyFile ..");
                                if (err) {
                                    logger.error("Error in deleting decryptedKeyFile..");
                                }
                            });
                        });
                    });

                });

            });

        });
    });

}
