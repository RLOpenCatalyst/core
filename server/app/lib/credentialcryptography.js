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


/*
This is a temproray class. these methods will me moved to model once mvc comes into pictured
*/
var Cryptography = require('./utils/cryptography');
var appConfig = require('_pr/config');
var uuid = require('node-uuid');
var fileIo = require('./utils/fileio');
var fs = require('fs');
var logger = require('_pr/logger')(module);

module.exports.encryptCredential = function(credentials, callback) {
    logger.debug(credentials);
    var cryptoConfig = appConfig.cryptoSettings;
    var encryptedCredentials = {};

    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
    if (credentials) {
        encryptedCredentials.username = credentials.username;
        if (credentials.password) {
            encryptedCredentials.password = cryptography.encryptText(credentials.password, cryptoConfig.encryptionEncoding, cryptoConfig.decryptionEncoding);
            callback(null, encryptedCredentials);
        } else {
            var encryptedPemFileLocation = appConfig.instancePemFilesDir + uuid.v4();
            cryptography.encryptFile(credentials.pemFileLocation, cryptoConfig.encryptionEncoding, encryptedPemFileLocation, cryptoConfig.decryptionEncoding, function(err) {
                fileIo.removeFile(credentials.pemFileLocation, function(err) {
                    if (err) {
                        logger.debug("Unable to delete temp pem file =>", err);
                    } else {
                        logger.debug("temp pem file deleted =>");
                    }
                });

                if (err) {
                    callback(err, null);
                    return;
                }
                encryptedCredentials.pemFileLocation = encryptedPemFileLocation;
                callback(null, encryptedCredentials);
            });
        }

    }

};

module.exports.decryptCredential = function(credentials, callback) {
    var decryptedCredentials = {};
    decryptedCredentials.username = credentials.username;
    var cryptoConfig = appConfig.cryptoSettings;
    var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);

    if (credentials.pemFileLocation && credentials.source && credentials.source !== null) {
        cryptography.decryptFileContentToBase64(credentials.pemFileLocation, cryptoConfig.decryptionEncoding,cryptoConfig.encryptionEncoding, function(err,data) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }else{
                decryptedCredentials.fileData = data.base64Data;
                decryptedCredentials.decryptedData = data.decryptedData;
                callback(null,decryptedCredentials);
                return
            }
        });
    }else if (credentials.pemFileLocation) {
        var tempUncryptedPemFileLoc = appConfig.tempDir + uuid.v4();
        cryptography.decryptFile(credentials.pemFileLocation, cryptoConfig.decryptionEncoding, tempUncryptedPemFileLoc, cryptoConfig.encryptionEncoding, function(err) {
            if (err) {
                logger.debug(err);
                callback(err, null);
                return;
            }
            fs.chmod(tempUncryptedPemFileLoc, 0600, function(err) {
                if (err) {
                    logger.debug(err);
                    callback(err, null);
                    return;
                }
                decryptedCredentials.pemFileLocation = tempUncryptedPemFileLoc;
                callback(null, decryptedCredentials);
            });

        });

    }else {
        decryptedCredentials.password = cryptography.decryptText(credentials.password, cryptoConfig.decryptionEncoding, cryptoConfig.encryptionEncoding);
        callback(null, decryptedCredentials);
    }

};