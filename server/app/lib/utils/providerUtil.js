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


// This file act as a Util class which contains provider related util methods.

var logger = require('_pr/logger')(module);
var currentDirectory = __dirname;
var fs = require('fs');
var path = require('path');
var appConfig = require('_pr/config');
var Cryptography = require('_pr/lib/utils/cryptography');

// saveAwsPemFiles() capture all uploaded files from request and save.
var ProviderUtil = function() {
    this.saveAwsPemFiles = function(keyPairId, inFiles, callback) {
        logger.debug("Path: ", inFiles);
        var settings = appConfig;
        //encrypting default pem file
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        var encryptedPemFileLocation = settings.instancePemFilesDir + keyPairId;
        fs.readFile(inFiles.path, function(err, data) {
            if (err) {
                logger.debug("File not found in specified path.");
                callback(err, null);
            }
            cryptography.encryptFile(inFiles.path, cryptoConfig.encryptionEncoding, encryptedPemFileLocation, cryptoConfig.decryptionEncoding, function(err) {
                if (err) {
                    logger.log("encryptFile Failed >> ", err);
                    callback(err, null);
                    return;
                }
                logger.debug("Encryted Pemfile saved...");
                callback(null, true);
            });
        });
    }
}

module.exports = new ProviderUtil();
