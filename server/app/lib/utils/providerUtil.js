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
var Cryptography = require('../../lib/utils/cryptography');

// saveAwsPemFiles() capture all uploaded files from request and save.
var ProviderUtil = function(){
	this.saveAwsPemFiles = function(keyPair,inFiles,callback){
		logger.debug("Path: ",inFiles);
		var settings = appConfig;
        //encrypting default pem file
        var cryptoConfig = appConfig.cryptoSettings;
        var cryptography = new Cryptography(cryptoConfig.algorithm, cryptoConfig.password);
        var encryptedPemFileLocation = settings.instancePemFilesDir + keyPair._id;
		fs.readFile(inFiles.path, function (err, data) {
			if(err){
				logger.debug("File not found in specified path.");
				callback(err,null);
			}
			cryptography.encryptFile(inFiles.path, cryptoConfig.encryptionEncoding, encryptedPemFileLocation, cryptoConfig.decryptionEncoding, function(err) {
                 if (err) {
                   logger.log("encryptFile Failed >> ", err);
                   return;
                   }
                   logger.debug("Encryted Pemfile saved...");
			});
		});
		callback(null,true);
	}

	this.createAwsEc2ClientForProvider = function createAwsEc2ClientForProvider(providerId, callback) {

	}

	this.createAwsEc2ClientForProvider = function createAwsEc2ClientForProvider(provider, callback) {
		var ec2;

		if(provider.isDefault == true) {
			params.isDefault = true;
		} else if(provider.providerId) {
			AWSProvider.getAWSProviderById(provider.providerId, function(err, aProvider) {
				if (err) {
					logger.error(err);
					res.status(500).send(errorResponses.db.error);
					return;
				}
				if (aProvider) {
					var keys = [];
					keys.push(aProvider.accessKey);
					keys.push(aProvider.secretKey);
					cryptography.decryptMultipleText(keys, cryptoConfig.decryptionEncoding,
						cryptoConfig.encryptionEncoding, function(err, decryptedKeys) {
							if (err) {
								logger.error("Failed to decrypt accessKey or secretKey: ", err);
								res.status(500).send("Failed to decrypt accessKey or secretKey");
								return;
							}
							params.access_key = decryptedKeys[0];
							params.secret_key = decryptedKeys[1];
						});
				} else {
					res.status(404).send("Provider not found");
				}
			});
		} else {
			params.access_key = provider.accessKey;
			params.access_key = provider.secretKey;
		}
		params.region = provider.region;

		ec2 = new EC2(params);

		callback(null, ec2);
	}
}

module.exports = new ProviderUtil();